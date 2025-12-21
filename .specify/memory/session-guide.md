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

**Last Updated**: 2024-12-21  
**Current Branch**: `master`  
**Repository**: <https://github.com/cabynum/alicooks>  
**Live URL**: <https://alicooks.vercel.app>  
**Current Phase**: UI Redesign complete

### Completed This Session

- 🎨 **Sunflower & Charcoal design system**: Applied new color palette
  - Primary: Charcoal `#2C2C2C`
  - Secondary: Goldenrod `#DAA520`
  - Accent: Sunflower `#FFB800`
  - Background: Warm white `#FFFEF7`
- 📝 **Typography**: Added Fraunces (serif headers) + DM Sans (body) via Google Fonts
- 🖼️ **Food photo header**: Rotating Unsplash photos, randomized on each app open
- 📱 **Bottom navigation**: Added Home, Suggest, Plans, Settings tabs with glassmorphism
- 🎯 **Lucide icons**: Replaced inline SVGs with consistent stroke-width 2 icons
- 👋🏾 **Personalization**: Brown skin tone wave emoji
- 📄 **Design mockup**: Created `design-mockup.html` for interactive design exploration
- ✅ **Pushed to origin**: All changes deployed to Vercel

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
| useDishes Hook | 15 |
| useSuggestion Hook | 17 |
| usePlans Hook | 25 |
| useExport Hook | 14 |
| Button | 26 |
| Input | 22 |
| Card | 18 |
| CookTimePicker | 17 |
| UrlInput | 31 |
| EmptyState | 14 |
| ErrorBoundary | 14 |
| DishTypeSelector | 18 |
| DishCard | 32 |
| DishList | 37 |
| SuggestionCard | 17 |
| DaySlot | 22 |
| DishForm | 44 |
| PlanCard | 25 |
| AddDishPage | 14 |
| EditDishPage | 26 |
| SettingsPage | 23 |
| SuggestionPage | 16 |
| PlanPage | 20 |
| DayAssignmentPage | 22 |
| HomePage | 26 |
| App | 2 |
| **Total** | **627** |

### Recommended Next Steps

1. **Update remaining pages** — Apply design system to SuggestionPage, PlanPage, etc.
2. **Logo redesign** — Create a memorable brand mark
   - Reference: Crumbl, Starbucks, Chick-fil-A style logos
   - Palette: Black, white, and sunflower yellow
   - Goal: Distinctive, ownable, works at any size
3. **Share with Aliya** — Get feedback from the primary user on new design

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
| Blog Posts | `blog/` (Part 1–8) |
| **App Icon SVG** | `public/icons/icon-512.svg` |
| Icon Generation | `scripts/generate-icons.mjs` |
| **Design Mockup** | `design-mockup.html` |
| Markdown Rules | `.cursor/rules/markdown-linting.mdc` |
| This Guide | `.specify/memory/session-guide.md` |

### Open Decisions

- **Logo direction**: Need a memorable, brand-worthy mark (not generic icons)
  - Palette: Black, white, sunflower yellow (`#FFB800`)
  - Inspiration: Major brand logos (Crumbl, Starbucks, Chick-fil-A)
  - Previous attempts were too generic or not memorable enough
- **Remaining pages**: SuggestionPage, PlanPage, AddDishPage, EditDishPage need design updates

### Notes

- Use two trailing spaces for line breaks (not tables) unless truly tabular
- All markdown files must pass linting before merge
- **Update `blog/` when significant progress is made** — capture decisions in real-time
- Entity naming: **Dish** (individual item) → **Meal** (combination) → **MealPlan** (schedule)
- **Shut down dev servers** when ending sessions (`pkill -f vite`, etc.)
