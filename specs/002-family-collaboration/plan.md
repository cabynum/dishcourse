# Implementation Plan: Family Collaboration

**Branch**: `002-family-collaboration` | **Date**: 2024-12-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-family-collaboration/spec.md`

## Summary

Transform DishCourse from a single-user, local-only app into a collaborative platform where
family/household members can share dishes and meal plans. This requires adding backend
infrastructure for authentication, real-time sync, and household management while maintaining
the offline-first experience.

## Technical Context

**Language/Version**: TypeScript 5.3+  
**Frontend**: React 18, Vite 5, Tailwind CSS 3 (existing)  
**Backend Platform**: Supabase (PostgreSQL, Auth, Realtime)  
**Authentication**: Supabase Auth with Magic Links  
**Sync Strategy**: Optimistic UI with background sync  
**Testing**: Vitest + React Testing Library (existing)  
**Target Platform**: Progressive Web App (existing)

**Why Supabase?**

- Built-in magic link authentication (FR-014)
- Real-time subscriptions for sync (FR-007, FR-008)
- PostgreSQL for relational data (households, members)
- Row-Level Security for data access control (FR-016)
- Free tier sufficient for family-scale usage
- Hosted, no server management needed
- JavaScript client library with TypeScript support

**Alternative Considered**: Firebase — rejected due to NoSQL complexity for relational
household data and higher learning curve for RLS-equivalent security rules.

## Constitution Check

*GATE: Must pass before implementation. Re-check after each phase.*

| Principle | Requirement | Status |
| ----------- | ------------- | -------- |
| **I. User-First Simplicity** | UI self-explanatory, plain language errors | ✅ Magic links = no passwords, simple invite flow |
| **II. Delight Over Features** | Polish before new features | ✅ Building on complete 001-meal-planner foundation |
| **III. Smart Defaults** | Works without configuration | ✅ Single-user mode still works, collaboration opt-in |
| **IV. Data Ownership** | Export from day one | ✅ Export extended to include shared data (FR-017) |
| **V. Mobile-Ready** | Phone is primary target | ✅ All flows designed mobile-first |

**Gate Status**: ✅ PASSED — All principles satisfied by design

## Architecture Overview

### Current State (001-meal-planner)

```text
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  ┌───────────────┐    ┌───────────────────────────┐ │
│  │   React App   │───►│      localStorage         │ │
│  └───────────────┘    └───────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Target State (002-family-collaboration)

```text
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  ┌───────────────┐    ┌───────────────────────────┐ │
│  │   React App   │◄──►│  Local Cache (IndexedDB)  │ │
│  └───────┬───────┘    └───────────────────────────┘ │
│          │                                          │
└──────────┼──────────────────────────────────────────┘
           │ Supabase Client
           ▼
┌─────────────────────────────────────────────────────┐
│               Supabase Platform                     │
│  ┌───────────────┐  ┌─────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │  Auth   │  │   Realtime    │  │
│  │  (RLS)        │  │ (Magic) │  │ (Subscriptions│  │
│  └───────────────┘  └─────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Offline-First Sync Strategy

1. **All reads** come from local cache first (fast UI)
2. **All writes** go to local cache immediately (optimistic)
3. **Background sync** pushes changes to Supabase when online
4. **Realtime subscriptions** pull changes from other members
5. **Conflict resolution**: Last-write-wins with UI for conflicts

### Migration Path

Existing users with local-only data will see:

1. Prompt to create account (optional)
2. If they create account → local dishes become their personal collection
3. When they create/join household → personal dishes merge into shared collection
4. No data loss, no forced migration

## Project Structure

### New/Modified Documentation

```text
specs/002-family-collaboration/
├── plan.md              # This file
├── data-model.md        # Database schema and entity definitions
├── contracts/
│   └── components.md    # New/modified component contracts
└── tasks.md             # Implementation tasks
```

### New Source Code

```text
src/
├── lib/
│   └── supabase.ts      # Supabase client initialization
├── services/
│   ├── auth.ts          # Authentication service
│   ├── households.ts    # Household management service
│   ├── sync.ts          # Data synchronization service
│   └── storage.ts       # Extended with sync capabilities
├── hooks/
│   ├── useAuth.ts       # Authentication hook
│   ├── useHousehold.ts  # Household management hook
│   └── useSync.ts       # Sync status hook
├── components/
│   ├── auth/
│   │   ├── MagicLinkForm.tsx
│   │   ├── AuthProvider.tsx
│   │   └── ProtectedRoute.tsx
│   └── households/
│       ├── HouseholdSwitcher.tsx
│       ├── InviteModal.tsx
│       ├── MemberList.tsx
│       └── JoinHousehold.tsx
└── pages/
    ├── AuthPage.tsx
    ├── HouseholdPage.tsx
    └── JoinPage.tsx

supabase/
├── migrations/          # Database migrations
│   └── 001_initial_schema.sql
└── seed.sql             # Development seed data (optional)
```

### Database Tables (Supabase/PostgreSQL)

```text
┌─────────────────────┐
│      profiles       │
├─────────────────────┤
│ id (PK, FK→auth)    │
│ display_name        │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│     households      │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ created_by (FK)     │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│ household_members   │
├─────────────────────┤
│ id (PK)             │
│ household_id (FK)   │
│ user_id (FK)        │
│ role                │
│ joined_at           │
└─────────────────────┘

┌─────────────────────┐
│      invites        │
├─────────────────────┤
│ id (PK)             │
│ household_id (FK)   │
│ code                │
│ created_by (FK)     │
│ expires_at          │
│ used_at             │
│ used_by (FK)        │
└─────────────────────┘

┌─────────────────────┐        ┌─────────────────────┐
│       dishes        │        │     meal_plans      │
├─────────────────────┤        ├─────────────────────┤
│ id (PK)             │        │ id (PK)             │
│ household_id (FK)   │        │ household_id (FK)   │
│ name                │        │ name                │
│ type                │        │ start_date          │
│ added_by (FK)       │        │ days (JSONB)        │
│ created_at          │        │ created_by (FK)     │
│ updated_at          │        │ locked_by (FK)      │
│ deleted_at          │        │ locked_at           │
└─────────────────────┘        │ created_at          │
                               │ updated_at          │
                               │ deleted_at          │
                               └─────────────────────┘
```

## Key Technical Decisions

### Decision 1: Supabase as Backend Platform ✅

**Rationale**: Provides auth, database, and real-time out of the box. Magic links are
built-in. Row-Level Security makes data access control declarative. Free tier is
generous for family-scale usage.

### Decision 2: IndexedDB for Local Cache ✅

**Rationale**: localStorage has size limits (~5MB) and is synchronous. IndexedDB
supports larger datasets and async operations. Using Dexie.js wrapper for simpler API.

### Decision 3: Optimistic UI with Background Sync ✅

**Rationale**: User actions should feel instant (Constitution I: User-First Simplicity).
Write to local cache first, sync in background. Show subtle sync status indicator.

### Decision 4: Twilio for SMS Invites ✅

**Rationale**: FR-028 requires SMS/iMessage invites. Twilio provides reliable SMS
delivery. iMessage falls back to SMS automatically for non-Apple recipients. Supabase
Edge Functions will handle the Twilio API call.

### Decision 5: Edit Locking via Database ✅

**Rationale**: FR-024-027 require meal plan locking. Database-level locks with
timestamps and auto-release after 5 minutes of inactivity. Simple, reliable,
no WebSocket complexity.

## Complexity Tracking

> No violations. Design aligns with all constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| ----------- | ------------ | ------------------------------------- |
| *Backend added* | Collaboration requires server-side auth and sync | Local-only can't sync between users |
| *Twilio for SMS* | FR-028 requires text message invites | Web Share API doesn't guarantee SMS delivery |

## Phase Overview

| Phase | Focus | Stories Covered |
| ------- | ---------------------------------------- | --------------- |
| 0 | Backend setup (Supabase, schema, RLS) | — |
| 1 | Authentication (magic links, profiles) | — |
| 2 | Household creation and invites | US-1, US-2 |
| 3 | Data sync and offline support | US-3, US-4 |
| 4 | Collaborative planning (locks) | US-5 |
| 5 | Attribution and management | US-6, US-7 |
| 6 | Polish and migration | — |

**Estimated effort**: 4-6 weeks for a single developer

## Success Criteria Mapping

| Criteria | Implementation Approach |
| -------- | ----------------------- |
| SC-001: Household + invite < 2 min | Streamlined create flow, one-tap invite generation |
| SC-002: Sync within 30 seconds | Supabase Realtime subscriptions |
| SC-003: 95% join success rate | Clear error messages, multiple invite methods |
| SC-004: Offline viewing works | IndexedDB cache, sync status indicator |
| SC-005: Export includes shared data | Extended export to include household context |

## Risk Assessment

| Risk | Mitigation |
| ---- | ---------- |
| Supabase free tier limits | Monitor usage, upgrade path documented |
| Complex offline sync bugs | Extensive testing, simple conflict resolution |
| Magic link emails in spam | Clear "check spam" messaging, resend option |
| SMS costs at scale | Twilio pay-per-message, rate limiting |

## Next Steps

1. Create `data-model.md` with full database schema
2. Create `contracts/components.md` with new component interfaces
3. Create `tasks.md` with detailed implementation tasks
4. Run `/speckit.tasks` to generate task breakdown
