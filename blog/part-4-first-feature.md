# Part 4: The First Feature (and a Debugging Detour)

> Phase 2 complete — users can add dishes. But not before a stale cache taught us a lesson.

**Previous:** [Part 3 — Building the Foundation Layer](./part-3-foundation.md)

---

## Phase 2: Add a Dish

With the foundation in place (types, storage, hooks, UI primitives), it was time to build the first real feature:
**adding a dish to the collection**.

This is Priority 1 in our spec — the core action that everything else depends on.

### The Components

Phase 2 required building:

1. **DishTypeSelector** — radio-style picker for Entree / Side Dish / Other
2. **DishForm** — combines Input + DishTypeSelector with validation
3. **AddDishPage** — the full page that wires everything together

Each component was built test-first, following the contracts we defined in Part 2.

### DishTypeSelector

The type selector needed to be touch-friendly (44px targets) and show clear selection state:

```tsx
<DishTypeSelector
  value="entree"
  onChange={(type) => setType(type)}
/>
```

We used an amber color scheme that would become part of our visual identity — warm, inviting, food-adjacent.

### DishForm

The form handles validation (name is required) and shows inline errors:

```tsx
<DishForm
  onSubmit={(values) => saveDish(values)}
  onCancel={() => navigate('/')}
  submitLabel="Add Dish"
/>
```

Simple API, all the complexity hidden inside. The form manages its own state and only calls `onSubmit` with valid data.

### Wiring It Up

The AddDishPage connects everything:

```tsx
export function AddDishPage() {
  const navigate = useNavigate();
  const { addDish } = useDishes();

  const handleSubmit = (values: DishFormValues) => {
    addDish(values);
    navigate('/');
  };

  return (
    <Card padding="lg">
      <DishForm onSubmit={handleSubmit} onCancel={() => navigate('/')} />
    </Card>
  );
}
```

Clean and readable. The hook handles storage, the form handles UI, the page just orchestrates.

---

## The Bug That Wasn't

With all 196 tests passing and the code looking correct, we hit a wall:

**Dishes weren't appearing after being added.**

We added console.log statements everywhere — storage, hooks, pages. Nothing appeared in the browser console.

### The Debugging Process

1. **Checked localStorage** — dishes were being saved correctly ✅
2. **Checked console logs** — none of our debug statements appeared ❌
3. **Noticed the UI text** — the empty state said "Your dishes will appear here" but our code said
   "No dishes yet. Add your first dish to get started!"

That mismatch was the clue. The browser was running **old code**.

### The Culprit: Vite's Cache

Vite caches pre-bundled dependencies in `node_modules/.vite`. Usually this speeds up development.
But sometimes the cache gets stale and serves old code even when source files have changed.

**The fix:**

```bash
rm -rf node_modules/.vite && npm run dev
```

After clearing the cache, everything worked. Dishes appeared. Console logs appeared.
The feature was working all along — we just couldn't see it.

### Lesson Learned

When debugging React/Vite apps:

1. **Check if your debug logs appear** — if they don't, the code might be stale
2. **Compare UI text to source code** — mismatches indicate caching issues
3. **Clear the Vite cache** when things seem inexplicably broken

We added a npm script to make this easier:

```json
{
  "scripts": {
    "dev:fresh": "rm -rf node_modules/.vite && vite"
  }
}
```

Now `npm run dev:fresh` guarantees you're running the latest code.

---

## Phase 2 Complete

With the cache cleared, the full flow works:

1. Navigate to `/add`
2. Enter dish name, select type
3. Submit → dish saved to localStorage
4. Navigate back to `/` → dish appears in list

| Task | Description | Status |
| ---- | -------------------------- | ----------- |
| 2.1 | DishTypeSelector component | ✅ Complete |
| 2.2 | DishForm component | ✅ Complete |
| 2.3 | AddDishPage | ✅ Complete |
| 2.4 | Connect routing | ✅ Complete |
| 2.5 | Polish | ✅ Complete |

All 196 tests passing. The first user story is complete.

---

## What's Next

**Phase 3: View My Dishes** — building out the dish viewing experience:

- DishCard component with type badges
- DishList component with empty state
- HomePage polish

We're building a meal planner, one small piece at a time.

---

**Next:** [Part 5 — View My Dishes](./part-5-view-dishes.md)

December 2025
