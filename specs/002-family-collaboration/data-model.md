# Data Model: Family Collaboration

**Branch**: `002-family-collaboration` | **Date**: 2024-12-28

This document defines the database entities, their relationships, and storage format for
the family collaboration feature. The backend uses Supabase (PostgreSQL).

## Entity Overview

```text
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Profile    │◄────│ HouseholdMember  │────►│  Household   │
└──────────────┘     └──────────────────┘     └──────────────┘
       │                                             │
       │                                             │
       ▼                                             ▼
┌──────────────┐                             ┌──────────────┐
│    Invite    │                             │    Dish      │
└──────────────┘                             └──────────────┘
                                                     │
                                                     │
                                             ┌──────────────┐
                                             │   MealPlan   │
                                             └──────────────┘
```

---

## Entities

### Profile

A user's account information. Created automatically when they sign up.

```typescript
interface Profile {
  id: string;           // UUID, matches Supabase auth.users.id
  displayName: string;  // User-chosen name, shown to household members
  email: string;        // From auth, used for magic links
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}
```

**PostgreSQL Schema**:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Validation Rules**:

- `displayName` is required, 1-50 characters
- `email` must be a valid email address

---

### Household

A group of users who share dishes and meal plans.

```typescript
interface Household {
  id: string;           // UUID
  name: string;         // User-provided (e.g., "Smith Family")
  createdBy: string;    // Profile ID of creator
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
}
```

**PostgreSQL Schema**:

```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Validation Rules**:

- `name` is required, 1-100 characters
- `createdBy` must be a valid profile ID

---

### HouseholdMember

The join table linking users to households. A user can belong to multiple households.

```typescript
interface HouseholdMember {
  id: string;           // UUID
  householdId: string;  // Household ID
  userId: string;       // Profile ID
  role: 'creator' | 'member';
  joinedAt: string;     // ISO 8601 timestamp
}
```

**PostgreSQL Schema**:

```sql
CREATE TYPE member_role AS ENUM ('creator', 'member');

CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_household_members_household ON household_members(household_id);
```

**Validation Rules**:

- A user can only be a member of a household once
- `role` is `creator` for the person who created the household, `member` for others

---

### Invite

A mechanism for joining a household. Invites can be shared via link, code, or SMS.

```typescript
interface Invite {
  id: string;           // UUID
  householdId: string;  // Household being invited to
  code: string;         // 6-character alphanumeric code (e.g., "ABC123")
  createdBy: string;    // Profile ID of inviter
  expiresAt: string;    // ISO 8601 timestamp (7 days from creation)
  usedAt?: string;      // ISO 8601 timestamp when used
  usedBy?: string;      // Profile ID of person who used it
}
```

**PostgreSQL Schema**:

```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_household ON invites(household_id);
```

**Validation Rules**:

- `code` is auto-generated, 6 uppercase alphanumeric characters
- `expiresAt` is 7 days from creation
- An invite can only be used once
- Invite link format: `https://havedishcourse.vercel.app/join/{code}`

---

### Dish (Extended)

The existing Dish entity, extended with collaboration fields.

```typescript
interface Dish {
  id: string;           // UUID
  householdId: string;  // Household this dish belongs to
  name: string;         // User-provided (e.g., "Grilled Chicken")
  type: DishType;       // 'entree' | 'side' | 'other'
  cookTimeMinutes?: number;  // Optional cook time
  recipeUrl?: string;   // Optional URL to recipe
  addedBy: string;      // Profile ID of person who added it (FR-009)
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
  deletedAt?: string;   // Soft delete for sync purposes
}

type DishType = 'entree' | 'side' | 'other';
```

**PostgreSQL Schema**:

```sql
CREATE TYPE dish_type AS ENUM ('entree', 'side', 'other');

CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type dish_type NOT NULL DEFAULT 'entree',
  cook_time_minutes INTEGER,
  recipe_url TEXT,
  added_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

CREATE INDEX idx_dishes_household ON dishes(household_id);
CREATE INDEX idx_dishes_added_by ON dishes(added_by);
```

**Migration from Local Storage**:

When a user creates/joins a household, their local dishes are migrated:

1. Each local dish gets the user's `userId` as `addedBy`
2. Each dish gets the household's `id` as `householdId`
3. Local dishes are cleared after successful migration

---

### MealPlan (Extended)

The existing MealPlan entity, extended with collaboration and locking fields.

```typescript
interface MealPlan {
  id: string;           // UUID
  householdId: string;  // Household this plan belongs to
  name: string;         // Optional, user-provided (e.g., "This Week")
  startDate: string;    // ISO 8601 date (YYYY-MM-DD)
  days: DayAssignment[];  // Array of day assignments
  createdBy: string;    // Profile ID of creator
  lockedBy?: string;    // Profile ID of current editor (FR-024)
  lockedAt?: string;    // When the lock was acquired (FR-026)
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
  deletedAt?: string;   // Soft delete for sync purposes
}

interface DayAssignment {
  date: string;         // ISO 8601 date (YYYY-MM-DD)
  dishIds: string[];    // Array of Dish IDs for this day
  assignedBy?: string;  // Profile ID of person who made assignment (FR-010)
}
```

**PostgreSQL Schema**:

```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT,
  start_date DATE NOT NULL,
  days JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES profiles(id),
  locked_by UUID REFERENCES profiles(id),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

CREATE INDEX idx_meal_plans_household ON meal_plans(household_id);
CREATE INDEX idx_meal_plans_locked ON meal_plans(locked_by) WHERE locked_by IS NOT NULL;
```

**Locking Behavior** (FR-024 through FR-027):

1. When a user opens a meal plan for editing, set `lockedBy` and `lockedAt`
2. Other users see "Being edited by [name]" and cannot edit
3. Lock auto-releases after 5 minutes of no updates (checked on access)
4. User can explicitly release lock when done

---

## Row-Level Security (RLS)

All tables use Supabase RLS to ensure users only access their household data.

### Profile RLS

```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can read profiles of household members
CREATE POLICY "Users can read household member profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT hm.user_id FROM household_members hm
      WHERE hm.household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );
```

### Household RLS

```sql
-- Users can read households they belong to
CREATE POLICY "Members can read household"
  ON households FOR SELECT
  USING (
    id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Any authenticated user can create a household
CREATE POLICY "Authenticated users can create household"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only creator can update household
CREATE POLICY "Creator can update household"
  ON households FOR UPDATE
  USING (created_by = auth.uid());
```

### Dish RLS

```sql
-- Members can read dishes in their households
CREATE POLICY "Members can read household dishes"
  ON dishes FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Members can add dishes to their households
CREATE POLICY "Members can add dishes"
  ON dishes FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    AND added_by = auth.uid()
  );

-- Members can update dishes in their households
CREATE POLICY "Members can update dishes"
  ON dishes FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Members can delete (soft) dishes in their households
CREATE POLICY "Members can delete dishes"
  ON dishes FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );
```

### MealPlan RLS

```sql
-- Members can read plans in their households
CREATE POLICY "Members can read household plans"
  ON meal_plans FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Members can create plans in their households
CREATE POLICY "Members can create plans"
  ON meal_plans FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

-- Members can update unlocked plans (or plans they locked)
CREATE POLICY "Members can update unlocked plans"
  ON meal_plans FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    AND (
      locked_by IS NULL
      OR locked_by = auth.uid()
      OR locked_at < NOW() - INTERVAL '5 minutes'  -- Auto-release
    )
  );
```

---

## Local Cache (IndexedDB)

For offline support, data is cached locally using Dexie.js (IndexedDB wrapper).

### Cache Schema

```typescript
// src/lib/db.ts
import Dexie, { Table } from 'dexie';

interface CachedDish extends Dish {
  _syncStatus: 'synced' | 'pending' | 'conflict';
  _localUpdatedAt: string;
}

interface CachedMealPlan extends MealPlan {
  _syncStatus: 'synced' | 'pending' | 'conflict';
  _localUpdatedAt: string;
}

class DishCourseDB extends Dexie {
  dishes!: Table<CachedDish>;
  mealPlans!: Table<CachedMealPlan>;
  profiles!: Table<Profile>;
  households!: Table<Household>;
  members!: Table<HouseholdMember>;
  syncMeta!: Table<{ key: string; value: unknown }>;

  constructor() {
    super('dishcourse');
    this.version(1).stores({
      dishes: 'id, householdId, _syncStatus',
      mealPlans: 'id, householdId, _syncStatus',
      profiles: 'id',
      households: 'id',
      members: 'id, householdId, userId',
      syncMeta: 'key'
    });
  }
}

export const db = new DishCourseDB();
```

### Sync Status

Each cached item has a `_syncStatus`:

- `synced`: Matches server state
- `pending`: Local changes not yet uploaded
- `conflict`: Local and server changes conflict (rare, needs resolution)

---

## Export Format (Extended)

For data portability (Constitution IV), the export format includes household context:

```json
{
  "exportedAt": "2024-12-28T12:00:00Z",
  "version": 2,
  "household": {
    "id": "uuid",
    "name": "Smith Family"
  },
  "members": [
    { "id": "uuid", "displayName": "Alice" },
    { "id": "uuid", "displayName": "Bob" }
  ],
  "dishes": [
    {
      "id": "uuid",
      "name": "Grilled Chicken",
      "type": "entree",
      "addedBy": { "id": "uuid", "displayName": "Alice" },
      "createdAt": "2024-12-15T10:30:00Z"
    }
  ],
  "mealPlans": [
    {
      "id": "uuid",
      "name": "This Week",
      "startDate": "2024-12-16",
      "days": [...]
    }
  ]
}
```

This format is human-readable and can be imported into a new household.

---

## State Transitions

### Invite Lifecycle

```text
[Created] ──► [Active] ──► [Used] ──► [Expired/Invalid]
                 │
                 └──► [Expired] (after 7 days without use)
```

### MealPlan Lock Lifecycle

```text
[Unlocked] ◄────────────────────────────────┐
     │                                      │
     ▼                                      │
[Locked by User A] ──► [Auto-released] ─────┘
     │                 (5 min inactivity)
     │
     ▼
[Explicitly Released] ──────────────────────┘
```

### Data Sync Lifecycle

```text
┌───────────────┐
│  Local Write  │
└───────┬───────┘
        │
        ▼
┌───────────────┐    Online?     ┌───────────────┐
│   Pending     │───────────────►│  Uploading    │
│   (cached)    │       No       │  (to server)  │
└───────────────┘◄───────────────└───────┬───────┘
                                         │
                                         ▼
                                 ┌───────────────┐
                                 │    Synced     │
                                 └───────────────┘
```
