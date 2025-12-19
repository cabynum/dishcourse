# AliCooks Session Guide

Quick reference for starting and ending AI pair programming sessions.

## Slash Commands

| Command | Purpose |
| ----------------- | ---------------------------------------------- |
| `/alicooks.start` | Start a new session (loads context) |
| `/alicooks.idea` | Capture a feature idea to the backlog |
| `/alicooks.lint` | Check all markdown files for linting errors |
| `/alicooks.save` | End a session (saves context, suggests commit) |

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

**Last Updated**: 2024-12-19  
**Current Branch**: `001-meal-planner`  
**Current Phase**: Phase 8 complete ✅ — Post-testing polish

### Completed This Session

- ✅ **Duplicate dish detection**: Prevent users from adding the same dish twice
  - Case-insensitive matching ("Tacos" = "tacos")
  - Friendly inline error: "You already have a dish called 'Tacos'"
  - Works on both Add and Edit pages
  - 6 new tests for DishForm validation
- ✅ **Title case normalization**: Dish names automatically capitalized
  - "chicken tacos" → "Chicken Tacos"
  - Applied on save and update
  - 3 new tests for storage service
- ✅ **Backlog idea captured**: Household favorites tagging
- ✅ 513 tests passing (8 new tests this session)

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
| Storage Service | 42 |
| Suggestion Service | 20 |
| useDishes Hook | 15 |
| useSuggestion Hook | 17 |
| usePlans Hook | 25 |
| useExport Hook | 14 |
| Button | 26 |
| Input | 22 |
| Card | 18 |
| EmptyState | 14 |
| ErrorBoundary | 14 |
| DishTypeSelector | 18 |
| DishCard | 26 |
| DishList | 21 |
| SuggestionCard | 17 |
| DaySlot | 22 |
| DishForm | 33 |
| AddDishPage | 14 |
| EditDishPage | 26 |
| SettingsPage | 23 |
| SuggestionPage | 16 |
| PlanPage | 20 |
| DayAssignmentPage | 22 |
| HomePage | 26 |
| App | 2 |
| **Total** | **513** |

### Recommended Next Steps

1. **Merge to main** — Feature branch is complete and polished
2. Optional: Add dish type filtering (Task 3.4, deferred)
3. Optional: Deploy to production (Vercel, Netlify, etc.)

### Key Files

| Purpose | Path |
| ------------------- | --------------------------------------------------- |
| Constitution | `.specify/memory/constitution.md` |
| **Ideas Backlog** | `.specify/memory/ideas.md` |
| Feature Spec | `specs/001-meal-planner/spec.md` |
| Implementation Plan | `specs/001-meal-planner/plan.md` |
| **Task Breakdown** | `specs/001-meal-planner/tasks.md` |
| Data Model | `specs/001-meal-planner/data-model.md` |
| Component Contracts | `specs/001-meal-planner/contracts/components.md` |
| Quality Checklist | `specs/001-meal-planner/checklists/requirements.md` |
| Blog Posts | `blog/` (Part 1 & Part 2) |
| Markdown Rules | `.cursor/rules/markdown-linting.mdc` |
| This Guide | `.specify/memory/session-guide.md` |

### Open Decisions

- None — ready to merge!

### Notes

- Use two trailing spaces for line breaks (not tables) unless truly tabular
- All markdown files must pass linting before merge
- **Update `blog/` when significant progress is made** — capture decisions in real-time
- Entity naming: **Dish** (individual item) → **Meal** (combination) → **MealPlan** (schedule)
