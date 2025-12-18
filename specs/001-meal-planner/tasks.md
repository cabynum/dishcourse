# Tasks: Meal Planner

**Branch**: `001-meal-planner` | **Created**: 2024-12-15  
**Source**: [plan.md](./plan.md), [contracts/components.md](./contracts/components.md)

This document breaks the implementation into small, testable tasks organized by priority.

---

## Phase 0: Project Setup

Foundation infrastructure. Must complete before any feature work.

### 0.1 Initialize Vite Project ✅

- [x] Create new Vite project with React + TypeScript template
- [x] Configure `tsconfig.json` for strict mode
- [x] Add path aliases (`@/` for `src/`)
- [x] Verify dev server runs without errors

**Verify**: `npm run dev` shows React starter page

---

### 0.2 Add Tailwind CSS ✅

- [x] Install Tailwind CSS, PostCSS, and autoprefixer
- [x] ~~Create `tailwind.config.js` with custom theme (if needed)~~ (not needed for Tailwind v4)
- [x] Add Tailwind directives to `src/index.css`
- [x] Test that utility classes work in a component

**Verify**: A `<div className="bg-blue-500">` renders as blue

---

### 0.3 Create Folder Structure ✅

- [x] Create directories: `components/`, `components/ui/`, `components/meals/`
- [x] Create directories: `pages/`, `hooks/`, `services/`, `types/`, `utils/`
- [x] Create `tests/` directories mirroring `src/`
- [x] Add placeholder `index.ts` files where appropriate

**Verify**: Structure matches `plan.md` project structure

---

### 0.4 Setup Testing ✅

- [x] Install Vitest and React Testing Library
- [x] Configure `vitest.config.ts`
- [x] Create a sample test that passes
- [x] Add test scripts to `package.json`

**Verify**: `npm test` runs and passes

---

### 0.5 Setup Routing ✅

- [x] Install React Router DOM
- [x] Create basic `App.tsx` with router setup
- [x] Add placeholder pages: `HomePage`, `AddDishPage`
- [x] Verify navigation between routes works

**Verify**: Can navigate between `/` and `/add` routes

---

### 0.6 PWA Foundation ✅

- [x] Create `public/manifest.json` with app metadata
- [x] Add placeholder icons (can be simple colored squares for now)
- [x] Configure Vite for PWA (vite-plugin-pwa or manual)
- [x] Verify manifest is served correctly

**Verify**: DevTools → Application → Manifest shows app info

---

## Phase 1: Foundation Layer

Core types, services, and UI primitives. Needed before feature components.

### 1.1 Define TypeScript Types ✅

- [x] Create `types/dish.ts` with `Dish` and `DishType` types
- [x] Create `types/plan.ts` with `MealPlan` and `DayAssignment` types
- [x] Create `types/index.ts` that re-exports all types
- [x] Add JSDoc comments explaining each type

**Verify**: Types can be imported from `@/types`

---

### 1.2 Implement StorageService (Dishes) ✅

- [x] Create `services/storage.ts`
- [x] Implement `getDishes()` - read from localStorage
- [x] Implement `getDish(id)` - find single dish
- [x] Implement `saveDish()` - create new dish with auto ID/timestamps
- [x] Implement `updateDish()` - update existing dish
- [x] Implement `deleteDish()` - remove dish
- [x] Write unit tests for all dish operations

**Verify**: All dish CRUD tests pass

---

### 1.3 Implement StorageService (Plans) ✅

- [x] Implement `getPlans()` - read from localStorage
- [x] Implement `getPlan(id)` - find single plan
- [x] Implement `savePlan()` - create new plan
- [x] Implement `updatePlan()` - update existing plan
- [x] Implement `deletePlan()` - remove plan
- [x] Write unit tests for all plan operations

**Verify**: All plan CRUD tests pass

---

### 1.4 Implement StorageService (Export/Import) ✅

- [x] Implement `exportData()` - return JSON string with all data
- [x] Implement `importData(json)` - parse and replace data
- [x] Add version number to export format
- [x] Write unit tests for export/import

**Verify**: Can export, clear storage, import, and data is restored

---

### 1.5 Create useDishes Hook ✅

- [x] Create `hooks/useDishes.ts`
- [x] Implement state management for dishes array
- [x] Implement `addDish`, `updateDish`, `deleteDish` functions
- [x] Implement `getDishesByType` helper
- [x] Handle loading state

**Verify**: Hook can be used in a component to display and modify dishes

---

### 1.6 Build Button Component ✅

- [x] Create `components/ui/Button.tsx`
- [x] Implement `primary`, `secondary`, `ghost` variants
- [x] Implement `sm`, `md`, `lg` sizes
- [x] Add loading spinner state
- [x] Ensure minimum 44px touch target
- [x] Write component tests

**Verify**: All button variants render correctly and are touchable

---

### 1.7 Build Input Component ✅

- [x] Create `components/ui/Input.tsx`
- [x] Implement label, placeholder, and error display
- [x] Style for mobile (larger touch targets)
- [x] Auto-focus support
- [x] Write component tests

**Verify**: Input renders with label, shows error when provided

---

### 1.8 Build Card Component ✅

- [x] Create `components/ui/Card.tsx`
- [x] Implement padding options (`none`, `sm`, `md`, `lg`)
- [x] Implement `elevated` shadow variant
- [x] Add click handler support for interactive cards
- [x] Write component tests

**Verify**: Card renders children with proper styling

---

### 1.9 Build EmptyState Component ✅

- [x] Create `components/ui/EmptyState.tsx`
- [x] Implement icon, title, message props
- [x] Implement optional action button
- [x] Style for friendly, encouraging appearance
- [x] Write component tests

**Verify**: EmptyState renders with icon, message, and action button

---

## Phase 2: P1 - Add a Dish

First user story: users can add dishes to their collection.

### 2.1 Build DishTypeSelector Component ✅

- [x] Create `components/meals/DishTypeSelector.tsx`
- [x] Render three options: Entree, Side Dish, Other
- [x] Show clear selected state
- [x] Ensure 44px touch targets
- [x] Write component tests

**Verify**: Tapping options changes selection visually

---

### 2.2 Build DishForm Component ✅

- [x] Create `components/meals/DishForm.tsx`
- [x] Include name Input field
- [x] Include DishTypeSelector
- [x] Implement validation (name required)
- [x] Show inline error for empty name
- [x] Implement `onSubmit` and `onCancel` callbacks
- [x] Write component tests

**Verify**: Form validates, shows error if empty, calls onSubmit with data

---

### 2.3 Build AddDishPage ✅

- [x] Create `pages/AddDishPage.tsx`
- [x] Render DishForm
- [x] Connect to useDishes hook to save dish
- [x] Navigate back to home on success
- [x] Write page tests

**Verify**: Can add a dish from the page, navigates back after save

---

### 2.4 Connect AddDishPage to Router ✅

- [x] Add `/add` route in App.tsx
- [x] Add navigation from HomePage to AddDishPage
- [x] Verify full flow works end-to-end

**Verify**: User can navigate to /add, add a dish, and return home

---

### 2.5 Polish Add Dish Flow ✅

- [x] Add micro-interaction on save (subtle animation/feedback)
- [x] Ensure form is keyboard-friendly
- [x] Test on mobile viewport
- [x] Verify meets SC-001 (<15s to add a meal)

**Verify**: Flow feels polished and quick on mobile

---

## Phase 3: P2 - View My Dishes

Second user story: users can see all dishes they've added.

### 3.1 Build DishCard Component ✅

- [x] Create `components/meals/DishCard.tsx`
- [x] Display dish name and type badge
- [x] Implement `showType`, `selected`, `compact` props
- [x] Truncate long names with ellipsis
- [x] Ensure 44px minimum height
- [x] Add tap feedback
- [x] Write component tests

**Verify**: DishCard renders dish info, handles long names, shows type

---

### 3.2 Build DishList Component ✅

- [x] Create `components/meals/DishList.tsx`
- [x] Render list of DishCards
- [x] Handle empty state (no dishes)
- [x] Add "Add Dish" prompt in empty state
- [x] Write component tests

**Verify**: Shows list or empty state appropriately

---

### 3.3 Build HomePage ✅

- [x] Create `pages/HomePage.tsx`
- [x] Display dish list from useDishes
- [x] Add "Add Dish" button/FAB
- [x] Add placeholders for "Suggest Meal" and "Plan Menu" (disabled for now)
- [x] Write page tests

**Verify**: HomePage shows dishes and add button

---

### 3.4 Add Dish Type Filtering (Optional)

- [ ] Add filter tabs or pills for dish types
- [ ] Implement `getDishesByType` filtering
- [ ] Remember filter preference (optional)

**Verify**: Can filter to see only entrees, sides, or all

---

### 3.5 Polish Home Page ✅

- [x] Ensure empty state is friendly and encouraging
- [x] Verify layout works on mobile
- [x] Add subtle loading state
- [x] Meets SC-005 (no horizontal scrolling)

**Verify**: Home page feels complete and polished on mobile

---

## Phase 4: P3 - Get Meal Suggestions ✅

Third user story: app suggests meal combinations.

### 4.1 Implement SuggestionService ✅

- [x] Create `services/suggestion.ts`
- [x] Implement `suggest(dishes)` - returns random entree + sides
- [x] Handle edge case: no entrees available
- [x] Handle edge case: no sides available
- [x] Implement `suggestMany(dishes, count)` for variety
- [x] Write unit tests

**Verify**: Service returns sensible combinations or null when not possible

---

### 4.2 Create useSuggestion Hook ✅

- [x] Create `hooks/useSuggestion.ts`
- [x] Implement `suggestion` state
- [x] Implement `generate()` function
- [x] Implement `isAvailable` check (enough dishes?)
- [x] Provide helpful `message` when unavailable

**Verify**: Hook generates suggestions and handles edge cases

---

### 4.3 Build SuggestionCard Component ✅

- [x] Create `components/meals/SuggestionCard.tsx`
- [x] Display entree prominently
- [x] List side dishes below
- [x] Add "Accept" and "Try Another" buttons
- [x] Make it visually delightful (this is the magic moment!)
- [x] Write component tests

**Verify**: Card looks great and buttons work

---

### 4.4 Build SuggestionPage ✅

- [x] Create `pages/SuggestionPage.tsx`
- [x] Generate suggestion on load
- [x] Display SuggestionCard or helpful message
- [x] Implement "Try Another" functionality
- [x] Add back navigation
- [x] Write page tests

**Verify**: Page shows suggestion, "Try Another" works

---

### 4.5 Connect Suggestion Flow ✅

- [x] Add `/suggest` route
- [x] Enable "Suggest Meal" button on HomePage
- [x] Verify full flow works end-to-end
- [x] Verify meets SC-002 (<3s for suggestion)

**Verify**: User can navigate to suggestions and get combinations

---

### 4.6 Polish Suggestion Experience ✅

- [x] Add animation when new suggestion appears
- [x] Ensure delightful visual design
- [x] Handle not-enough-dishes gracefully with encouragement
- [x] Test on mobile

**Verify**: Suggestion feature feels magical and polished

---

## Phase 5: P4 - Plan a Menu

Fourth user story: users can plan meals for multiple days.

### 5.1 Create usePlans Hook

- [ ] Create `hooks/usePlans.ts`
- [ ] Implement state management for plans
- [ ] Implement `createPlan`, `updatePlan`, `deletePlan`
- [ ] Implement `assignDishToDay`, `removeDishFromDay`
- [ ] Handle loading state

**Verify**: Hook can create and modify plans

---

### 5.2 Build DaySlot Component

- [ ] Create `components/meals/DaySlot.tsx`
- [ ] Display day name and date
- [ ] Show assigned dishes or empty state
- [ ] Highlight today's date
- [ ] Ensure clear tap target
- [ ] Write component tests

**Verify**: DaySlot shows date and dishes, handles empty

---

### 5.3 Build PlanPage

- [ ] Create `pages/PlanPage.tsx`
- [ ] Add day count selector (default 7)
- [ ] Generate days array from start date
- [ ] Display DaySlots for each day
- [ ] Navigate to DayAssignment on slot tap
- [ ] Write page tests

**Verify**: Can create a plan and see day slots

---

### 5.4 Build DayAssignmentPage

- [ ] Create `pages/DayAssignmentPage.tsx`
- [ ] Show current dish assignments for day
- [ ] Display available dishes to add
- [ ] Implement add/remove dish functionality
- [ ] Add "Get Suggestion" option
- [ ] Save changes to plan
- [ ] Write page tests

**Verify**: Can assign and remove dishes from a day

---

### 5.5 Connect Plan Flow

- [ ] Add `/plan` and `/plan/:planId` routes
- [ ] Add `/plan/:planId/:date` route for day assignment
- [ ] Enable "Plan Menu" button on HomePage
- [ ] Verify full flow works end-to-end

**Verify**: User can create plan, assign dishes, return to view plan

---

### 5.6 Handle Dish Deletion in Plans

- [ ] When dish deleted, remove from all plan assignments
- [ ] Show notification if dish was in active plan
- [ ] Write tests for cascade deletion

**Verify**: Deleted dishes don't break plans

---

### 5.7 Polish Plan Experience

- [ ] Add smooth transitions between views
- [ ] Ensure plan persists after app restart (SC-003)
- [ ] Verify 7-day plan can be created in <5 minutes (SC-003)
- [ ] Test on mobile

**Verify**: Planning feels smooth and complete

---

## Phase 6: Edit & Delete Dishes

Completing FR-003: Edit or delete dishes from collection.

### 6.1 Build EditDishPage

- [ ] Create `pages/EditDishPage.tsx`
- [ ] Load existing dish data by ID
- [ ] Render DishForm with initial values
- [ ] Update dish on save
- [ ] Add delete action with confirmation
- [ ] Navigate back on success
- [ ] Write page tests

**Verify**: Can edit dish name/type and delete dishes

---

### 6.2 Connect Edit Flow

- [ ] Add `/edit/:dishId` route
- [ ] Add edit action to DishCard or dish detail
- [ ] Verify full edit flow works

**Verify**: User can tap a dish, edit it, and save changes

---

## Phase 7: Data Export

Completing FR-009: Export data for portability.

### 7.1 Create useExport Hook

- [ ] Create `hooks/useExport.ts`
- [ ] Implement `exportToFile()` - triggers JSON download
- [ ] Implement `importFromFile(file)` - reads and imports
- [ ] Handle import errors gracefully

**Verify**: Can export and import data files

---

### 7.2 Add Export UI

- [ ] Add settings/menu with export option
- [ ] Implement export button that downloads file
- [ ] Implement import with file picker
- [ ] Show success/error feedback
- [ ] Verify meets SC-006 (single action export)

**Verify**: User can export all data with one tap

---

## Phase 8: Final Polish

Refinements for production readiness.

### 8.1 Loading States

- [ ] Add loading skeletons where appropriate
- [ ] Ensure no flashing between states
- [ ] Handle slow localStorage reads gracefully

---

### 8.2 Error Handling

- [ ] Add error boundaries
- [ ] Show user-friendly error messages
- [ ] Log errors for debugging (console only for v1)

---

### 8.3 Accessibility

- [ ] Verify proper heading hierarchy
- [ ] Add ARIA labels where needed
- [ ] Test with keyboard navigation
- [ ] Verify color contrast meets WCAG AA

---

### 8.4 Performance

- [ ] Verify app size <5MB
- [ ] Check for unnecessary re-renders
- [ ] Lazy load routes if needed

---

### 8.5 Final Mobile Testing

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify all touch targets are 44px+
- [ ] Verify no horizontal scrolling (SC-005)
- [ ] Install as PWA and test

---

## Summary

| Phase | Tasks | Focus |
| --------- | ------ | -------------------------------------------------- |
| 0 | 6 | Project setup (Vite, Tailwind, testing, routing) |
| 1 | 9 | Foundation (types, storage, hooks, UI primitives) |
| 2 | 5 | P1 - Add a Dish |
| 3 | 5 | P2 - View My Dishes |
| 4 | 6 | P3 - Get Meal Suggestions |
| 5 | 7 | P4 - Plan a Menu |
| 6 | 2 | Edit & Delete Dishes |
| 7 | 2 | Data Export |
| 8 | 5 | Final Polish |
| **Total** | **47** | |

**Recommended approach**: Complete phases sequentially. Each phase delivers testable, working
functionality before moving to the next. This aligns with the constitution's "work incrementally"
principle.
