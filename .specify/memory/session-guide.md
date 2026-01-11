# DishCourse Session Guide

Quick reference for starting and ending AI pair programming sessions.

## Slash Commands

| Command | Purpose |
| ----------------- | ---------------------------------------------- |
| `/dishcourse.start` | Start a new session (loads context) |
| `/dishcourse.idea` | Capture a feature idea to the backlog |
| `/dishcourse.lint` | Check all markdown files for linting errors |
| `/dishcourse.save` | End a session (saves context, suggests commit) |

## Starting a New Session

Type `/dishcourse.start` in Cursor, or paste this prompt:

```text
Let's continue working on DishCourse.

Please read these files to get up to speed:
- `.specify/memory/constitution.md` (project principles)
- `.specify/memory/session-guide.md` (this file - for current status)

Current status: [see below]
```

## Ending a Session

Type `/dishcourse.save` in Cursor, or ask:

```text
Before we end, please:
1. Check for uncommitted changes (git status) and commit if needed
2. Update the "Current Status" section in `.specify/memory/session-guide.md`
3. Update the blog post(s) in `blog/` if significant progress was made
```

## Current Status

**Last Updated**: 2026-01-10  
**Current Branch**: `002-family-collaboration`  
**Repository**: <https://github.com/cabynum/dishcourse>  
**Live URL**: <https://havedishcourse.vercel.app>  
**Current Phase**: Phase 7 Complete — Ready for Merge!

### Completed This Session

- ✅ **Phase 7.1: Local Dish Migration** — Complete:
  - Added `migrateLocalDishes()` to sync service
  - HouseholdCreatePage offers "Bring my X dishes" checkbox
  - JoinPage offers migration when joining a household
  - Local dishes uploaded to Supabase, cleared from localStorage
- ✅ **Phase 7.4: Add Household to HomePage** — Complete:
  - Shows "[Household Name]'s Dishes" when in synced mode
  - Shows "Shared with your household" subtitle
  - SyncStatus indicator already in place
- ✅ **Phase 7.7: Error Handling** — Complete:
  - Added `getUserFriendlyError()` utility with pattern matching
  - Converts technical errors to helpful, actionable messages
  - Updated all hooks and pages to use the error utility
- ✅ **InviteModal bug fix** — Phone input now works correctly
  - Was using wrong `onChange` signature for the Input component
  - SMS section hidden (A2P 10DLC registration needed for delivery)

### Phase Summary

| Phase | Tasks | Status |
| ---------------------------- | ------- | ----------- |
| Phase 1 (Foundation) | 1.1–1.9 | ✅ Complete |
| Phase 2 (Add a Dish) | 2.1–2.5 | ✅ Complete |
| Phase 3 (View My Dishes) | 3.1–3.5 | ✅ Complete |
| Phase 4 (Meal Suggestions) | 4.1–4.6 | ✅ Complete |
| Phase 5 (Plan a Menu) | 5.1–5.7 | ✅ Complete |
| Phase 6 (Edit & Delete) | 6.1–6.2 | ✅ Complete |
| Phase 7 (Data Export) | 7.1–7.2 | ✅ Complete |
| Phase 8 (Final Polish) | 8.1–8.5 | ✅ Complete |

**All phases complete!** The 001-meal-planner feature is ready for production.

Core features:

- Add, view, edit, delete dishes
- Meal suggestions with random pairing
- Meal planning with day assignments
- Data export/import (Constitution principle IV: Data Ownership)
- Error boundaries with friendly recovery
- WCAG AA accessible

### Test Count

| Layer | Tests |
| ------------------ | ------- |
| Storage Service | 50 |
| Suggestion Service | 20 |
| Auth Service | 23 |
| useDishes Hook | 15 |
| useSuggestion Hook | 17 |
| usePlans Hook | 26 |
| useExport Hook | 17 |
| useAuth Hook | 17 |
| Button | 26 |
| Input | 22 |
| Card | 18 |
| CookTimePicker | 17 |
| UrlInput | 31 |
| EmptyState | 14 |
| ErrorBoundary | 14 |
| MagicLinkForm | 15 |
| DishTypeSelector | 18 |
| **DishCard** | 40 |
| DishList | 37 |
| SuggestionCard | 17 |
| DaySlot | 22 |
| DishForm | 44 |
| PlanCard | 25 |
| AddDishPage | 14 |
| **EditDishPage** | 30 |
| SettingsPage | 23 |
| SuggestionPage | 16 |
| PlanPage | 20 |
| DayAssignmentPage | 22 |
| HomePage | 26 |
| App | 2 |
| **Local DB (Dexie)** | 45 |
| Sync Components | 18 |
| Locks Service | 30 |
| usePlanLock Hook | 13 |
| LockIndicator | 15 |
| **MemberList** | 14 |
| **Total** | **833** |

### Recommended Next Steps

1. **Merge to main** — Family collaboration feature is complete!
2. **Family testing** — Create household, invite family, test full sync flow
3. **Phase 7.5: Offline Mode Polish** — Clear indicator, graceful degradation (follow-up)
4. **A2P 10DLC registration** — Enable SMS invites (Toll-Free number ~$2/mo)

### Key Files

| Purpose | Path |
| ------------------- | --------------------------------------------------- |
| Constitution | `.specify/memory/constitution.md` |
| **Ideas Backlog** | `.specify/memory/ideas.md` |
| **Collab Spec** | `specs/002-family-collaboration/spec.md` |
| **Collab Plan** | `specs/002-family-collaboration/plan.md` |
| **Collab Data Model** | `specs/002-family-collaboration/data-model.md` |
| **Collab Components** | `specs/002-family-collaboration/contracts/components.md` |
| **Collab Tasks** | `specs/002-family-collaboration/tasks.md` |
| Collab Checklist | `specs/002-family-collaboration/checklists/requirements.md` |
| Meal Planner Spec | `specs/001-meal-planner/spec.md` |
| Meal Planner Plan | `specs/001-meal-planner/plan.md` |
| Blog Posts | `blog/` (Part 1–10) |
| **App Icon SVG** | `public/icons/icon-512.svg` |
| **Mascot (Single)** | `public/mascot.png` |
| **Mascot (Duo)** | `public/mascot-duo.png` |
| Markdown Rules | `.cursor/rules/markdown-linting.mdc` |
| This Guide | `.specify/memory/session-guide.md` |

### Open Decisions

- **Collaboration feature**: Phases 1–6 complete!
  - ✅ All Phase 6 tasks (6.1–6.3) verified working
  - ✅ SMS invites via Twilio Edge Function deployed and active
  - ✅ InviteModal has phone input with send button
  - ✅ Dish attribution, plan locking, leave/remove member all working
  - Ready for Phase 7: Polish & Migration
  - Two test users ready: `test@dishcourse.local`, `test2@dishcourse.local` in "Test Family"
- **User experience**: Zero-friction start implemented — auth only required for collaboration
- **Sync approach**: All household dishes and plans sync automatically (decided)
- **Testing limitation**: Browser automation can't properly interact with React controlled inputs
  - Manual browser testing required for full end-to-end verification

### Branding Assets (Finalized)

- **Mascots**: Friendly anthropomorphic plate characters
  - Single (`public/mascot.png`) — for small contexts (avatar, app icon)
  - Duo (`public/mascot-duo.png`) — for large contexts (splash, empty states, marketing)
- **Palette**: Black (#1A1A1A), Charcoal (#2C2C2C), White, Sunflower Yellow (#FFB800)
- **Typography**: "DishCourse" with yellow "Dish" + white "Course" (Outfit font)

### Production Readiness TODOs

- [ ] **SMS Invites (deferred)** — US carriers require A2P 10DLC registration for app-to-person SMS.
  - Current status: Edge Function works, but messages blocked (error 30034)
  - To enable: Get a Toll-Free number (~$2/mo) and complete verification
  - Code is ready in `InviteModal.tsx` (commented out) and `send-invite-sms` Edge Function
  - For now: Use link/code invite methods instead

- [ ] **User-friendly error messages** — InviteModal shows raw Edge Function errors. Before prod:
  - Map technical errors to friendly messages (e.g., "Unable to send SMS. Please try again.")
  - Log technical details to console/monitoring, show simple message to user
  - Applies to: `InviteModal.tsx` smsError display

### Notes

- Use two trailing spaces for line breaks (not tables) unless truly tabular
- All markdown files must pass linting before merge
- **Update `blog/` when significant progress is made** — capture decisions in real-time
- Entity naming: **Dish** (individual item) → **Meal** (combination) → **MealPlan** (schedule)
- **Shut down dev servers** when ending sessions (`pkill -f vite`, etc.)
