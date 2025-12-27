# Part 7: Completing the Core Flow

*From planning meals to editing dishes — the app becomes truly usable.*

---

## The Goal

Phases 5 and 6 complete the core user journey. After these phases, users can:

1. **Add** dishes to their collection
2. **View** all their dishes
3. **Get suggestions** for what to make
4. **Plan** meals across multiple days
5. **Edit or delete** any dish

This is a complete, usable meal planning app.

## Phase 5: Plan a Menu

The meal planning feature lets users schedule dishes across multiple days.

### Architecture

```text
PlanPage → usePlans hook → StorageService
    ↓
DayAssignmentPage → usePlans + useDishes
    ↓
DaySlot component
```

### Data Model

A `MealPlan` contains an array of `DayAssignment` objects:

```typescript
interface MealPlan {
  id: string;
  name: string;
  startDate: string;  // YYYY-MM-DD
  days: DayAssignment[];
  createdAt: string;
  updatedAt: string;
}

interface DayAssignment {
  date: string;       // YYYY-MM-DD
  dishIds: string[];  // References to Dish.id
}
```

### The Planning Flow

1. **Create Plan**: User selects duration (3, 5, 7, or 14 days)
2. **View Week**: PlanPage shows all days with assigned dishes
3. **Assign Dishes**: Tap a day → DayAssignmentPage shows available dishes
4. **Quick Suggest**: Integration with suggestion feature for ideas

### DaySlot Component

Each day in the plan is rendered as a `DaySlot`:

- Shows day name (Mon, Tue, etc.) and date
- Highlights today's date with amber accent
- Lists assigned dish names or shows "No meals planned"
- Staggered fade-in animation for visual delight

```tsx
<DaySlot
  date="2024-12-18"
  dishes={[{ name: 'Grilled Chicken', ... }]}
  isToday={true}
  onClick={() => navigate(`/plan/${planId}/${date}`)}
/>
```

### Conditional Button States

The HomePage buttons now respond intelligently:

| Button | Condition | State |
| ------- | ---------------------- | -------- |
| Suggest | No entrees exist | Disabled |
| Suggest | At least one entree | Enabled |
| Plan | No dishes exist | Disabled |
| Plan | At least one dish | Enabled |

## Phase 6: Edit & Delete Dishes

Without edit and delete, users are stuck with mistakes. This phase completes CRUD.

### EditDishPage

The edit page mirrors AddDishPage but pre-populates values:

```tsx
<DishForm
  initialValues={{ name: dish.name, type: dish.type }}
  onSubmit={(values) => updateDish(dishId, values)}
  onCancel={() => navigate('/')}
  submitLabel="Save Changes"
/>
```

### Delete Flow

Delete requires explicit confirmation because it's destructive:

1. User taps "Delete this dish" button
2. Confirmation modal appears with dish name
3. Warning: "This will also remove it from any meal plans"
4. User confirms or cancels

### Cascade Delete

When a dish is deleted, it must be removed from any meal plans that reference it.
This is handled at the storage layer:

```typescript
export function deleteDish(id: string): boolean {
  // Remove from dishes array
  dishes.splice(index, 1);
  saveToStorage(STORAGE_KEYS.dishes, dishes);

  // Cascade: remove from all meal plans
  removeDishFromAllPlans(id);

  return true;
}
```

The cascade happens automatically — users don't need to manually clean up plans.

### Navigation from HomePage

Dishes are now tappable on the home page:

```tsx
const handleDishClick = (dish: { id: string }) => {
  navigate(`/edit/${dish.id}`);
};

<DishCard
  dish={dish}
  onClick={() => handleDishClick(dish)}
/>
```

## Test Coverage

These phases added significant test coverage:

| Component | Tests Added |
| ----------------- | ----------- |
| usePlans Hook | 25 |
| DaySlot | 22 |
| PlanPage | 20 |
| DayAssignmentPage | 22 |
| EditDishPage | 26 |
| **Total Added** | **115** |

Final count: **454 tests passing**

## Key Design Decisions

### Why Allow Same Dish Multiple Times Per Day?

A day's `dishIds` array can contain the same ID multiple times. This handles:

- Leftover meals
- Family favorites eaten repeatedly
- Meal prep scenarios

### Why Show Confirmation for Delete?

Delete is irreversible and has side effects (cascade to plans). The friction of
confirmation prevents accidents while still being fast (two taps total).

### Why Not a Separate Confirmation Component?

The confirmation UI is inline in EditDishPage rather than a reusable modal. This
follows the constitution's "no premature abstraction" principle — we only have one
place that needs delete confirmation right now.

## What's Next

The core app is now feature-complete for MVP. Remaining phases:

- **Phase 7**: Data Export (portability per Constitution principle IV)
- **Phase 8**: Final Polish (loading states, accessibility, mobile testing)

---

**Session highlights:**

- Completed full CRUD for dishes
- Built multi-day meal planning with day selection
- Added cascade delete for data integrity
- 454 tests now passing

December 2025
