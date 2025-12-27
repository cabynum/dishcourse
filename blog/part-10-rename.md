# Part 10: The Rename — AliCooks Becomes DishCourse

**Date**: 2024-12-26  
**Branch**: `master`  
**Phase**: Rename & Branding

## A New Name

Today we renamed the app from **AliCooks** to **DishCourse**. The change came from
Aliya's feedback: she wanted a more generic name that works for the whole family,
not just her.

**DishCourse** works on multiple levels:

- "Dish" + "Course" — meal planning vocabulary
- Sounds like "discourse" — conversation about what to eat
- Generic enough for family use
- Playful but not silly

## The Scope of a Rename

What sounds simple — "just change the name" — touched 30+ files across the codebase:

### Core App Changes

- `index.html` — Page title, PWA metadata
- `public/manifest.json` — PWA name and short_name
- `package.json` — Package name
- `src/pages/HomePage.tsx` — Header text
- `src/types/storage.ts` — localStorage keys (`dishcourse_*`)
- `src/hooks/useExport.ts` — Export filename

### Test Updates

Tests that assert on visible text needed updates:

```typescript
// Before
expect(screen.getByText('AliCooks')).toBeInTheDocument()

// After
expect(screen.getByText('DishCourse')).toBeInTheDocument()
```

### Documentation

Every blog post, spec file, and memory document referenced the old name. The
search-and-replace was methodical but extensive.

### Slash Commands

The Cursor commands got renamed too:

- `/alicooks.start` → `/dishcourse.start`
- `/alicooks.save` → `/dishcourse.save`
- `/alicooks.idea` → `/dishcourse.idea`
- `/alicooks.lint` → `/dishcourse.lint`

## Storage Keys: No Migration

We decided **not** to migrate localStorage data. The old keys (`alicooks_dishes`,
`alicooks_plans`) will simply be ignored, and users start fresh with the new keys
(`dishcourse_dishes`, `dishcourse_plans`).

Why no migration?

1. The app isn't in production yet with real user data
2. Simpler is better — migration code adds complexity
3. Clean slate for a clean start

## Logo Exploration

The existing logo exploration page (`logo-exploration.html`) now shows "DishCourse"
instead of "AliCooks". Some observations:

- "DishCourse" is longer (10 chars vs 8 chars)
- Script fonts may need tighter letter-spacing
- The stacked layout (Dish / Course) could work well

Next session: review the logo concepts and pick a direction.

## Future: Family Collaboration

Aliya also mentioned wanting the app to be collaborative for the family. This is
a significant feature that needs proper specification. We captured it in the
ideas backlog with open questions:

- Shared data model (one family account? linked accounts?)
- Sync mechanism (real-time? polling?)
- Authentication approach
- Conflict resolution
- Offline support

This will likely be a v2 milestone.

## What's Next

1. Review logo exploration for DishCourse
2. Pick a direction and refine
3. Generate final app icons
4. Consider repository rename (GitHub)

---

*The rename is done. Now DishCourse needs its visual identity.*

December 2025
