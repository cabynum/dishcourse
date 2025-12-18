# AliCooks Session Guide

Quick reference for starting and ending AI pair programming sessions.

## Slash Commands

| Command           | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `/alicooks.start` | Start a new session (loads context)            |
| `/alicooks.idea`  | Capture a feature idea to the backlog          |
| `/alicooks.lint`  | Check all markdown files for linting errors    |
| `/alicooks.save`  | End a session (saves context, suggests commit) |

## Starting a New Session

Type `/alicooks.start` in Cursor, or paste this prompt:

```text
Let's continue working on AliCooks.

Please read these files to get up to speed:
- `.specify/memory/constitution.md` (project principles)
- `.specify/memory/session-guide.md` (this file - for current status)

Current status: [see below]
```

## Ending a Session

Type `/alicooks.save` in Cursor, or ask:

```text
Before we end, please:
1. Check for uncommitted changes (git status) and commit if needed
2. Update the "Current Status" section in `.specify/memory/session-guide.md`
3. Update the blog post(s) in `blog/` if significant progress was made
```

## Current Status

**Last Updated**: 2024-12-18  
**Current Branch**: `001-meal-planner`  
**Current Phase**: Phase 5 complete ✅ — Ready for Phase 6

### Completed This Session

- ✅ **Phase 5 complete**: Plan a Menu feature working
  - `usePlans` hook for plan state management
  - `DaySlot` component with staggered fade-in animations
  - `PlanPage` for creating plans (3/5/7/14 days) and viewing week
  - `DayAssignmentPage` for adding/removing dishes per day
  - Routes: `/plan`, `/plan/:planId`, `/plan/:planId/:date`
  - Enabled "Plan" button on HomePage (only when dishes exist)
  - Suggestion integration on day assignment page
- ✅ 428 tests passing (91 new tests for Phase 5)

### Phase Summary

| Phase                        | Tasks   | Status      |
| ---------------------------- | ------- | ----------- |
| Phase 1 (Foundation)         | 1.1–1.9 | ✅ Complete |
| Phase 2 (Add a Dish)         | 2.1–2.5 | ✅ Complete |
| Phase 3 (View My Dishes)     | 3.1–3.5 | ✅ Complete |
| Phase 4 (Meal Suggestions)   | 4.1–4.6 | ✅ Complete |
| Phase 5 (Plan a Menu)        | 5.1–5.7 | ✅ Complete |

Full plan flow ready:

- "Plan" button disabled when no dishes exist
- "Plan" button enabled when dishes exist
- Create plan with selectable day count (3, 5, 7, or 14 days)
- Week view shows all days with assigned dishes
- Day assignment page shows current meal + available dishes
- Add/remove dishes with single tap
- Suggestion integration for quick meal ideas
- Staggered animations on day slots

### Test Count

| Layer              | Tests   |
| ------------------ | ------- |
| Storage Service    | 39      |
| Suggestion Service | 20      |
| useDishes Hook     | 15      |
| useSuggestion Hook | 17      |
| usePlans Hook      | 25      |
| Button             | 26      |
| Input              | 22      |
| Card               | 18      |
| EmptyState         | 14      |
| DishTypeSelector   | 18      |
| DishCard           | 26      |
| DishList           | 21      |
| SuggestionCard     | 17      |
| DaySlot            | 22      |
| DishForm           | 28      |
| AddDishPage        | 14      |
| SuggestionPage     | 16      |
| PlanPage           | 20      |
| DayAssignmentPage  | 22      |
| HomePage           | 24      |
| App                | 2       |
| **Total**          | **428** |

### Recommended Next Steps

1. **Begin Phase 6 — Edit & Delete Dishes**
   - 6.1 EditDishPage for modifying existing dishes
   - 6.2 Delete confirmation modal
   - 6.3 Cascade delete from plans
2. Optional: Add dish type filtering (Task 3.4, deferred)

### Key Files

| Purpose             | Path                                                |
| ------------------- | --------------------------------------------------- |
| Constitution        | `.specify/memory/constitution.md`                   |
| **Ideas Backlog**   | `.specify/memory/ideas.md`                          |
| Feature Spec        | `specs/001-meal-planner/spec.md`                    |
| Implementation Plan | `specs/001-meal-planner/plan.md`                    |
| **Task Breakdown**  | `specs/001-meal-planner/tasks.md`                   |
| Data Model          | `specs/001-meal-planner/data-model.md`              |
| Component Contracts | `specs/001-meal-planner/contracts/components.md`    |
| Quality Checklist   | `specs/001-meal-planner/checklists/requirements.md` |
| Blog Posts          | `blog/` (Part 1 & Part 2)                           |
| Markdown Rules      | `.cursor/rules/markdown-linting.mdc`                |
| This Guide          | `.specify/memory/session-guide.md`                  |

### Open Decisions

- None currently — markdown lint issue resolved (relaxed to 120 chars)

### Notes

- Use two trailing spaces for line breaks (not tables) unless truly tabular
- All markdown files must pass linting before merge
- **Update `blog/` when significant progress is made** — capture decisions in real-time
- Entity naming: **Dish** (individual item) → **Meal** (combination) → **MealPlan** (schedule)
