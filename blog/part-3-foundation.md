# Part 3: Building the Foundation Layer

> Types, storage, hooks, and UI primitives — the invisible infrastructure that makes features possible

**Previous:** [Part 2 — Specification & Planning](./part-2-specification.md)

---

## From Plan to Code

With the specification complete, it was time to build. But where do you start when you have a blank canvas and a
list of user stories?

The answer: **foundation first**. Before we can build "Add a Dish," we need:

- TypeScript types that define our data
- A storage service to persist data
- React hooks to manage state
- UI primitives to compose interfaces

This is the unsexy work. No visible features, no screenshots to show off. But it pays dividends when you start
building actual pages.

---

## Phase 1: The Foundation Layer

### Types First

We started with TypeScript types — the contract that everything else builds on.

```typescript
// types/dish.ts
export type DishType = 'entree' | 'side' | 'other';

export interface Dish {
  id: string;
  name: string;
  type: DishType;
  createdAt: string;
  updatedAt: string;
}
```

Simple, but deliberate. Every dish has an ID (UUID), timestamps for tracking, and a type that drives the
suggestion logic later.

The naming decision from Part 2 shows up here: it's `Dish`, not `Meal`. A meal is *composed* of dishes.

### Storage Service

Next, a service to handle localStorage operations:

```typescript
// services/storage.ts
export const storageService = {
  getDishes(): Dish[];
  getDish(id: string): Dish | undefined;
  saveDish(dish: Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>): Dish;
  updateDish(id: string, updates: Partial<Dish>): Dish | undefined;
  deleteDish(id: string): boolean;
  
  // Plus plans CRUD and export/import
  exportData(): string;
  importData(json: string): void;
};
```

All data lives in localStorage under `alicooks_` prefixed keys. Human-readable JSON, portable, no server required.

We wrote unit tests for every operation — 34 tests covering dishes, plans, and export/import. The export includes
a version number for future migration support:

```json
{
  "version": "1.0.0",
  "dishes": [...],
  "plans": [...]
}
```

### The useDishes Hook

Raw storage is useful, but React components need reactive state. Enter `useDishes`:

```typescript
function useDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load from storage on mount
  // Provide addDish, updateDish, deleteDish
  // Provide getDishesByType helper
  
  return { dishes, isLoading, addDish, updateDish, deleteDish, getDishesByType };
}
```

This hook is the bridge between storage and UI. Components call `addDish()` and the state updates automatically.
No manual localStorage calls scattered through the codebase.

We added 20 more tests for the hook, verifying loading states, CRUD operations, and the type filtering helper.

---

## UI Primitives: The Design System

With data infrastructure complete, we turned to UI. But we didn't jump straight to building the "Add Dish" page.
First, we built **primitives** — the reusable building blocks.

### Button

Three variants, three sizes, loading state:

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: () => void;
}
```

All buttons meet the 44px minimum touch target requirement. Mobile-first.

The color palette uses warm amber for primary actions and stone grays for secondary. It's a cooking app — warmth
fits the brand.

### Input

Text input with integrated label and error display:

```typescript
interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}
```

Accessibility built in: labels linked via `htmlFor`, errors announced with `role="alert"`, `aria-invalid` set automatically.

### Card

A container with configurable padding and elevation:

```typescript
interface CardProps {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  onClick?: () => void;  // Makes it a button internally
}
```

When `onClick` is provided, the Card renders as a `<button>` with proper keyboard support. Touch targets, focus
rings, hover states — all automatic.

### EmptyState

Friendly messaging when there's no content:

```typescript
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}
```

This will be used throughout the app: no dishes yet, no plans yet, no search results. Consistent, encouraging,
with optional call-to-action.

---

## The Test Count

At the end of Phase 1:

| Layer | Tests |
| ------- | ------- |
| Storage Service | 34 |
| useDishes Hook | 20 |
| Button | 26 |
| Input | 22 |
| Card | 18 |
| EmptyState | 14 |
| **Total** | **134** |

Every component, every edge case, tested. This might seem excessive for a small app, but:

1. **Confidence** — We can refactor without fear
2. **Documentation** — Tests show how components are meant to be used
3. **Constitution compliance** — "All code MUST be tested before merge"

---

## What We Learned

### 1. Foundation Work Compounds

Building primitives before features felt slow. But now every page we build can compose from tested, consistent
pieces. The Add Dish page? It's just Input + Button + Card arranged on a page.

### 2. TypeScript Catches Mistakes Early

We caught several data model issues during type definition — before writing any implementation. The `DishType`
enum prevents typos. Required fields can't be forgotten.

### 3. Mobile-First Changes Everything

Designing for 44px touch targets from the start means we never have to "fix mobile later." Every component works
on a phone by default.

### 4. Storage Abstraction Pays Off

All localStorage access goes through `storageService`. When we eventually add sync or migration, there's one
place to change. Components don't know or care where data lives.

---

## What's Next

Phase 1 is complete. In Part 4, we'll build the first visible feature: **Add a Dish**. Using the primitives we just created:

- `DishTypeSelector` — choosing entree, side, or other
- `DishForm` — the complete form with validation
- `AddDishPage` — the full screen experience

The foundation is laid. Now we build on top of it.

---

*This is Part 3 of a series documenting the build of "AliCooks" — a family meal planning application.*

**Previous:** [Part 2 — Specification & Planning](./part-2-specification.md)  
**Next:** Part 4 — Add a Dish (coming soon)

December 2025
