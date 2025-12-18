# Part 5: View My Dishes

*Completing the dish collection view with cards, lists, and a polished home page.*

---

## The Goal

With Phase 2 complete (adding dishes), Phase 3 focuses on the other half of the equation:
**viewing** the dishes you've added. This session we built:

- DishCard component with type badges
- DishList component with empty state
- A polished HomePage that ties it all together

## DishCard: The Building Block

The DishCard displays a single dish with its type badge. Key design decisions:

### Color-Coded Type Badges

Each dish type gets its own color for quick visual scanning:

| Type | Color | Tailwind Classes |
| ------ | ------- | --------------------------------- |
| Entree | Amber | `bg-amber-100 text-amber-700` |
| Side | Emerald | `bg-emerald-100 text-emerald-700` |
| Other | Stone | `bg-stone-100 text-stone-600` |

### Props for Flexibility

The component supports multiple use cases:

```typescript
interface DishCardProps {
  dish: Dish;
  onClick?: () => void;    // Makes it interactive
  showType?: boolean;      // Hide badge when space is tight
  selected?: boolean;      // Highlight for selection UI
  compact?: boolean;       // Smaller padding for dense lists
}
```

### Touch-First Design

Following the constitution's mobile-first principle:

- 44px minimum height for touch targets
- Active scale animation for tap feedback
- Truncation with ellipsis for long names

## DishList: Handling Empty State

The DishList renders DishCards with one critical feature: a **friendly empty state**.

When users first open the app, they see:

- A plate icon with steam (custom SVG)
- "No dishes yet" heading
- Encouraging message about building their collection
- A prominent "Add a Dish" button

This follows the constitution's principle of **User-First Simplicity** — the app should be
usable by someone who has never seen it before. An empty list with no guidance would be
confusing; the empty state tells users exactly what to do next.

## HomePage: Bringing It Together

The HomePage got a complete rebuild:

### Sticky Header

A blur-backed header that stays visible while scrolling:

```tsx
<header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm">
```

### Quick Actions (Coming Soon)

Placeholder buttons for Suggest and Plan features, disabled with a "coming soon" note.
This gives users a preview of what's coming without confusing them about current
functionality.

### Floating Action Button

When dishes exist, a FAB appears in the bottom-right corner for quick access to "Add a
Dish". We only show it when dishes exist because the empty state already has an add button
— showing both would be redundant.

### Dish Count

A subtle count ("2 dishes") appears next to the section header, giving users a sense of
their collection size.

## Ideas Backlog: Capturing Inspiration

Mid-session, we created a system for capturing feature ideas without derailing current
work:

1. Created `.specify/memory/ideas.md` — a backlog organized by category
2. Added `/alicooks.idea` command for frictionless idea capture

Initial ideas captured:

- Extended dish details (cook time, difficulty, notes)
- Recipe links (Instagram, YouTube, etc.)
- Household meal voting

These are explicitly out of scope for v1, but having them documented means we won't
forget them.

## Test Coverage

Phase 3 added 68 new tests:

| Component | Tests |
| --------- | ----- |
| DishCard | 26 |
| DishList | 21 |
| HomePage | 21 |

Total test count: **264 passing**

## What's Next

Phase 4 is the "magic moment" — **Get Meal Suggestions**. The app will randomly pair an
entree with sides to suggest complete meals. This is where AliCooks starts to feel
genuinely useful.

---

**Commits this session:**

- `9756c88` — Complete Phase 3: View My Dishes
- `84d940f` — Update tasks and session guide for Phase 3 completion
