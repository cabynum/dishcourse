# Part 6: Meal Suggestions

*The "magic moment" — random meal pairing brings DishCourse to life.*

---

## The Goal

Phase 4 delivers the core value proposition of DishCourse: **answering "What should I make for
dinner?"** with a single tap. This is where the app stops being just a dish list and starts
being genuinely useful.

## Architecture Overview

The suggestion feature follows the same layered pattern as previous features:

```text
SuggestionPage → useSuggestion hook → SuggestionService → StorageService
```

### The Data Model

A `MealSuggestion` is simply an entree paired with sides:

```typescript
interface MealSuggestion {
  entree: Dish;
  sides: Dish[];
}
```

Simple, but powerful. This structure lets us display a complete meal recommendation.

## SuggestionService: The Random Pairing Logic

The service exposes two functions:

- `suggest(dishes)` — Returns a single random meal suggestion
- `suggestMany(dishes, count)` — Returns multiple unique suggestions

### The Algorithm

```typescript
function suggest(dishes: Dish[]): MealSuggestion | null {
  const entrees = dishes.filter(d => d.type === 'entree');
  const sides = dishes.filter(d => d.type === 'side');

  if (entrees.length === 0) return null;

  const entree = pickRandom(entrees);
  const sideCount = randomBetween(1, 2);
  const selectedSides = pickRandomMultiple(sides, sideCount);

  return { entree, sides: selectedSides };
}
```

Key edge cases handled:

| Scenario | Behavior |
| ----------- | ---------------------------------- |
| No entrees | Returns `null` |
| No sides | Returns entree alone (still valid) |
| One side | Always pairs that side |
| Many sides | Picks 1-2 randomly |

### Why Random for Now?

The current implementation is purely random. We discussed smarter pairing approaches:

1. **User-defined pairings** — Let users connect dishes they like together
2. **AI-inferred pairings** — Use LLMs to suggest complementary dishes
3. **AI-suggested new dishes** — Recommend dishes to add to their collection

These are captured in the ideas backlog for future consideration. Random pairing is a
**working baseline** — it answers the question even if not optimally. Smart pairing can
layer on top of this foundation.

## useSuggestion Hook

The hook manages suggestion state and provides helpful availability messaging:

```typescript
interface UseSuggestionReturn {
  suggestion: MealSuggestion | null;
  generate: () => void;
  isLoading: boolean;
  isAvailable: boolean;
  message: string;
}
```

### Helpful Messages

The hook provides context-aware messages:

| State | Message |
| ------------------ | ---------------------------------------------- |
| Loading | "Loading your dishes..." |
| No dishes | "Add some dishes to get meal suggestions!" |
| No entrees | "Add an entree to get meal suggestions!" |
| One entree | "Add more entrees for variety..." |
| Ready | "Ready to suggest meals!" |

This follows the constitution's principle of user-first simplicity — the app tells you
exactly what's missing and what to do about it.

## SuggestionCard: The Visual Delight

This is the "magic moment" component, so visual polish matters. Design decisions:

### Warm Color Scheme

The card uses an amber-to-orange gradient that feels inviting and food-appropriate:

```tsx
className="bg-gradient-to-br from-amber-50 via-white to-orange-50"
```

### Visual Hierarchy

1. **Entree**: Large, centered, with decorative plate icon
2. **"PAIRED WITH" divider**: Creates clear separation
3. **Sides**: Listed below with salad emoji
4. **Action button**: "Try Another" to get new suggestions

### Animations

Three custom animations add life:

1. **suggestion-enter**: Fade + slide up when card appears
2. **gentle-pulse**: Subtle pulse on the plate icon
3. **suggestion-refresh**: Quick scale animation on "Try Another"

```css
@keyframes suggestion-enter {
  0% { opacity: 0; transform: translateY(20px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

The animations trigger on suggestion changes by tracking an `animationKey` that increments
each time the entree changes.

## HomePage Integration

The "Suggest" button on the home page is now functional:

- **Disabled** when no entrees exist
- **Enabled** when at least one entree available
- Navigates to `/suggest` route

This is a subtle but important UX detail — the button shouldn't be clickable if it won't
work.

## Test Coverage

Phase 4 added 73 new tests:

| Layer | Tests |
| ------------------ | ----- |
| SuggestionService | 20 |
| useSuggestion Hook | 17 |
| SuggestionCard | 17 |
| SuggestionPage | 16 |
| HomePage (updated) | 3 |

Total test count: **337 passing**

## Browser Verification

Full flow tested manually:

1. ✅ "Suggest" button disabled with no entrees
2. ✅ Add an entree → button becomes enabled
3. ✅ Navigate to suggestion page
4. ✅ See entree + side pairing
5. ✅ Click "Try Another" → new suggestion
6. ✅ Back navigation works
7. ✅ Animations look smooth

## Reflection: The Power of Simple Foundations

The suggestion feature was built in a single session because the foundations were solid:

- **Types**: `MealSuggestion` slotted right into the existing type system
- **Service pattern**: `SuggestionService` followed the same pattern as `StorageService`
- **Hook pattern**: `useSuggestion` mirrored `useDishes` structure
- **Component pattern**: `SuggestionCard` reused UI primitives like `Button`

Good architecture pays dividends in velocity.

## What's Next

Phase 5 is **Plan a Menu** — letting users assign meals to specific days of the week. This
builds on the suggestion feature by letting users "accept" a suggestion into their plan.

---

**Session highlights:**

- Built complete meal suggestion feature in one session
- Added smart availability messaging
- Created polished animated card component
- Captured smart pairing ideas for future enhancement

December 2025
