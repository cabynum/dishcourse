# Architecture: Offline-First Sync

**Branch**: `002-family-collaboration` | **Date**: 2024-12-31

This document explains how Supabase (cloud database) and Dexie (local IndexedDB cache)
work together to provide a fast, offline-capable collaborative experience.

## Design Philosophy

**Offline-first** means the app works without internet and syncs when connected:

1. **Local cache is the source of truth for UI** — reads are instant
2. **Writes go to local cache first** — user sees immediate feedback
3. **Background sync handles server communication** — no blocking on network
4. **Real-time subscriptions push remote changes** — other users' edits appear automatically

This approach satisfies Constitution Principle I (User-First Simplicity) by making the
app feel fast and responsive, regardless of network conditions.

---

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                        │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐   │
│  │   React     │────►│   Hooks     │────►│      Dexie (IndexedDB)      │   │
│  │   Components│◄────│  useDishes  │◄────│                             │   │
│  │             │     │  usePlans   │     │  dishes    (CachedDish[])   │   │
│  │  HomePage   │     │  useSync    │     │  mealPlans (CachedMealPlan[])│   │
│  │  PlanPage   │     │             │     │  profiles  (CachedProfile[])│   │
│  │  etc.       │     └─────────────┘     │  syncMeta  (key-value)      │   │
│  └─────────────┘                         └──────────────┬──────────────┘   │
│                                                         │                   │
│                                          ┌──────────────┴──────────────┐   │
│                                          │        SyncService          │   │
│                                          │                             │   │
│                                          │  • pushChanges()            │   │
│                                          │  • subscribeToChanges()     │   │
│                                          │  • resolveConflicts()       │   │
│                                          └──────────────┬──────────────┘   │
│                                                         │                   │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                                                          │ Supabase Client
                                                          │ (HTTPS + WebSocket)
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE PLATFORM                                 │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │   PostgreSQL    │  │   Supabase      │  │      Supabase Realtime      │ │
│  │                 │  │   Auth          │  │                             │ │
│  │  households     │  │                 │  │  • Broadcast changes        │ │
│  │  members        │  │  • Magic links  │  │  • Filter by household_id   │ │
│  │  dishes         │  │  • JWT tokens   │  │  • Push to subscribers      │ │
│  │  meal_plans     │  │  • Session mgmt │  │                             │ │
│  │                 │  │                 │  │                             │ │
│  │  + RLS Policies │  └─────────────────┘  └─────────────────────────────┘ │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Write Path

When a user creates, updates, or deletes data, the change flows through the system:

### Scenario: User Adds a New Dish

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           WRITE PATH                                         │
│                                                                              │
│  Step 1: User Action                                                         │
│  ───────────────────                                                         │
│                                                                              │
│    User fills out DishForm and taps "Save"                                   │
│                     │                                                        │
│                     ▼                                                        │
│  Step 2: Hook Handles Write                                                  │
│  ──────────────────────────                                                  │
│                                                                              │
│    useDishes.addDish({                                                       │
│      name: "Grilled Chicken",                                                │
│      type: "entree"                                                          │
│    })                                                                        │
│                     │                                                        │
│                     ▼                                                        │
│  Step 3: Write to Local Cache (IMMEDIATE)                                    │
│  ─────────────────────────────────────────                                   │
│                                                                              │
│    Dexie:                                                                    │
│    db.dishes.add({                                                           │
│      id: "uuid-123",                                                         │
│      name: "Grilled Chicken",                                                │
│      type: "entree",                                                         │
│      householdId: "household-abc",                                           │
│      addedBy: "user-xyz",                                                    │
│      _syncStatus: "pending",    ◄── Marked for sync                          │
│      _localUpdatedAt: "2024-12-31T12:00:00Z"                                 │
│    })                                                                        │
│                     │                                                        │
│                     ▼                                                        │
│  Step 4: UI Updates Instantly                                                │
│  ────────────────────────────                                                │
│                                                                              │
│    React re-renders with new dish in list                                    │
│    User sees their dish immediately (no loading spinner)                     │
│                     │                                                        │
│                     ▼                                                        │
│  Step 5: Background Sync (ASYNC)                                             │
│  ───────────────────────────────                                             │
│                                                                              │
│    SyncService.pushChanges():                                                │
│      1. Query all items where _syncStatus = "pending"                        │
│      2. POST to Supabase: INSERT INTO dishes (...)                           │
│      3. RLS policy verifies user is household member                         │
│      4. On success: update _syncStatus = "synced"                            │
│      5. On failure: keep as "pending", retry later                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Points

- **User never waits for network** — the dish appears instantly
- **Pending items persist** — if app closes, sync resumes on next open
- **Retry on failure** — network errors don't lose data

---

## Data Flow: Read Path

When the app displays data, it reads from the local cache:

### Scenario: User Opens Home Page

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            READ PATH                                         │
│                                                                              │
│  Step 1: Component Mounts                                                    │
│  ────────────────────────                                                    │
│                                                                              │
│    HomePage renders, calls useDishes()                                       │
│                     │                                                        │
│                     ▼                                                        │
│  Step 2: Hook Reads from Local Cache                                         │
│  ───────────────────────────────────                                         │
│                                                                              │
│    const dishes = await db.dishes                                            │
│      .where('householdId')                                                   │
│      .equals(currentHouseholdId)                                             │
│      .filter(d => !d.deletedAt)  // Exclude soft-deleted                     │
│      .toArray();                                                             │
│                     │                                                        │
│                     ▼                                                        │
│  Step 3: UI Renders Immediately                                              │
│  ──────────────────────────────                                              │
│                                                                              │
│    DishList displays all cached dishes                                       │
│    No network request needed!                                                │
│                                                                              │
│  Step 4: Background Refresh (OPTIONAL)                                       │
│  ─────────────────────────────────────                                       │
│                                                                              │
│    If online, SyncService may:                                               │
│      1. Check for newer data on server                                       │
│      2. Update local cache with any changes                                  │
│      3. React automatically re-renders                                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Subscription Path

When another household member makes changes, they appear in real-time:

### Scenario: Family Member Adds a Dish

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION PATH                                    │
│                                                                              │
│  Alice's Device                           Bob's Device                       │
│  ──────────────                           ────────────                       │
│                                                                              │
│  [Alice adds "Pasta"]                                                        │
│         │                                                                    │
│         ▼                                                                    │
│  [Write to Dexie]                                                            │
│  [Sync to Supabase] ─────────────────────────────────────┐                   │
│                                                          │                   │
│                                                          ▼                   │
│                                              ┌───────────────────────┐       │
│                                              │   Supabase Realtime   │       │
│                                              │                       │       │
│                                              │  INSERT detected on   │       │
│                                              │  dishes table where   │       │
│                                              │  household_id = "abc" │       │
│                                              └───────────┬───────────┘       │
│                                                          │                   │
│                     ┌────────────────────────────────────┘                   │
│                     │                                                        │
│                     ▼                                                        │
│              [Bob's SyncService receives event]                              │
│                     │                                                        │
│                     ▼                                                        │
│              [Insert into Bob's Dexie cache]                                 │
│              {                                                               │
│                id: "uuid-456",                                               │
│                name: "Pasta",                                                │
│                addedBy: "alice-id",                                          │
│                _syncStatus: "synced"  ◄── Already synced (came from server) │
│              }                                                               │
│                     │                                                        │
│                     ▼                                                        │
│              [React re-renders]                                              │
│              [Bob sees "Pasta" appear in his list]                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Subscription Setup

```typescript
// In SyncService (pseudocode)
supabase
  .channel('household-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'dishes',
      filter: `household_id=eq.${householdId}`,
    },
    (payload) => {
      // Update local Dexie cache
      if (payload.eventType === 'INSERT') {
        db.dishes.add(withSyncMetadata(payload.new, 'synced'));
      } else if (payload.eventType === 'UPDATE') {
        db.dishes.update(payload.new.id, payload.new);
      } else if (payload.eventType === 'DELETE') {
        db.dishes.delete(payload.old.id);
      }
    }
  )
  .subscribe();
```

---

## Offline Behavior

When the device has no internet connection:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          OFFLINE MODE                                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         What Still Works                                │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  ✅ View all cached dishes and meal plans                               │ │
│  │  ✅ Add new dishes (saved locally, synced later)                        │ │
│  │  ✅ Edit existing dishes (saved locally, synced later)                  │ │
│  │  ✅ Create and modify meal plans                                        │ │
│  │  ✅ Get meal suggestions (uses local dish data)                         │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       What Requires Online                              │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  ❌ Sign in / Sign up (magic links need email delivery)                 │ │
│  │  ❌ Create or join a household                                          │ │
│  │  ❌ See changes from other family members                               │ │
│  │  ❌ Send invites                                                        │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Sync Queue                                       │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  While offline, changes accumulate in Dexie with _syncStatus: "pending" │ │
│  │                                                                         │ │
│  │  dishes: [                                                              │ │
│  │    { id: "1", name: "Tacos", _syncStatus: "synced" },                   │ │
│  │    { id: "2", name: "Salad", _syncStatus: "pending" },  ◄── New         │ │
│  │    { id: "3", name: "Pizza", _syncStatus: "pending" },  ◄── New         │ │
│  │  ]                                                                      │ │
│  │                                                                         │ │
│  │  When connection restored:                                              │ │
│  │    1. SyncService detects online status                                 │ │
│  │    2. Queries all "pending" items                                       │ │
│  │    3. Pushes each to Supabase                                           │ │
│  │    4. Updates to "synced" on success                                    │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Conflict Resolution

Conflicts occur when two users edit the same item while one is offline:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CONFLICT SCENARIO                                     │
│                                                                              │
│  Timeline:                                                                   │
│  ─────────                                                                   │
│                                                                              │
│  T1: Alice and Bob both have dish "Chicken" (updatedAt: 10:00)               │
│                                                                              │
│  T2: Alice goes offline                                                      │
│                                                                              │
│  T3: Bob renames dish to "Grilled Chicken" (updatedAt: 10:05)                │
│      → Syncs to Supabase                                                     │
│                                                                              │
│  T4: Alice (still offline) renames dish to "Roast Chicken" (local only)      │
│      → Saved in Dexie with _syncStatus: "pending"                            │
│                                                                              │
│  T5: Alice comes back online                                                 │
│      → SyncService tries to push her change                                  │
│      → Server has newer updatedAt (10:05 > 10:00)                            │
│      → CONFLICT DETECTED                                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Resolution Strategy: Last-Write-Wins (with UI option)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                      CONFLICT RESOLUTION                                     │
│                                                                              │
│  Default: Last-Write-Wins                                                    │
│  ────────────────────────                                                    │
│                                                                              │
│  For most cases, the most recent change wins. This is simple and works       │
│  well for family use where conflicts are rare.                               │
│                                                                              │
│  Alice's change (T4) would overwrite Bob's (T3) because it happened later.   │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Optional: User Resolution UI                                                │
│  ───────────────────────────                                                 │
│                                                                              │
│  For important conflicts, show a modal:                                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │   ⚠️  Sync Conflict                                                    │  │
│  │                                                                        │  │
│  │   This dish was edited by someone else while you were offline.         │  │
│  │                                                                        │  │
│  │   ┌─────────────────────┐    ┌─────────────────────┐                   │  │
│  │   │   Your Version      │    │   Their Version     │                   │  │
│  │   │                     │    │                     │                   │  │
│  │   │   "Roast Chicken"   │    │   "Grilled Chicken" │                   │  │
│  │   │   by Alice          │    │   by Bob            │                   │  │
│  │   └─────────────────────┘    └─────────────────────┘                   │  │
│  │                                                                        │  │
│  │   [ Keep Mine ]    [ Keep Theirs ]    [ Keep Both ]                    │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Sync Status Indicator

The UI shows sync state to keep users informed:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SYNC STATUS UI                                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Status          │  Icon   │  Meaning                                   │ │
│  ├───────────────────┼─────────┼────────────────────────────────────────────┤ │
│  │  synced          │  ☁️ ✓   │  All changes saved to cloud                │ │
│  │  syncing         │  ☁️ ↻   │  Uploading changes...                      │ │
│  │  pending         │  ☁️ •   │  Changes waiting to sync                   │ │
│  │  offline         │  ☁️ ✗   │  No internet connection                    │ │
│  │  error           │  ☁️ ⚠   │  Sync failed (tap to retry)                │ │
│  └───────────────────┴─────────┴────────────────────────────────────────────┘ │
│                                                                              │
│  Placement: Small indicator in header or bottom nav                          │
│  Behavior: Tap to see details ("Last synced 2 minutes ago")                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Dexie (Local Cache)

| Responsibility | Details |
| -------------- | ------- |
| Store all household data locally | dishes, plans, profiles, members |
| Track sync status per item | `_syncStatus`: synced, pending, conflict |
| Enable offline queries | Fast reads without network |
| Persist across sessions | Data survives app close/reopen |
| Index for efficient queries | By householdId, syncStatus |

### Supabase (Cloud)

| Responsibility | Details |
| -------------- | ------- |
| Source of truth for shared data | All household members see same data |
| Authentication | Magic links, session management |
| Authorization (RLS) | Ensure users only access their households |
| Real-time broadcasting | Push changes to all subscribers |
| Conflict detection | Compare timestamps on writes |

### SyncService (Orchestrator)

| Responsibility | Details |
| -------------- | ------- |
| Push local changes | Query pending items, POST to Supabase |
| Subscribe to remote changes | Listen for INSERT/UPDATE/DELETE |
| Detect conflicts | Compare local vs server timestamps |
| Manage connection state | Track online/offline status |
| Retry failed syncs | Exponential backoff on errors |

---

## Summary

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   User Action ──► Dexie (instant) ──► UI Updates ──► Background Sync       │
│                                                                             │
│   Remote Change ──► Supabase Realtime ──► SyncService ──► Dexie ──► UI     │
│                                                                             │
│   Offline? ──► Dexie still works ──► Queue changes ──► Sync when online    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

This architecture ensures:

- **Fast UI** — no waiting for network
- **Offline capable** — works without internet
- **Collaborative** — changes sync across family members
- **Resilient** — data doesn't get lost
