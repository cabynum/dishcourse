/**
 * Storage Service
 *
 * Handles all localStorage operations for dishes and meal plans.
 * Provides a clean API for CRUD operations with automatic ID generation
 * and timestamp management.
 */

import type {
  Dish,
  CreateDishInput,
  UpdateDishInput,
  MealPlan,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  DayAssignment,
  ExportData,
} from '@/types';
import { STORAGE_KEYS, SCHEMA_VERSION } from '@/types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a unique ID for new entities.
 * Uses crypto.randomUUID() for proper UUIDs.
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Returns the current timestamp in ISO 8601 format.
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * Converts a string to title case (first letter of each word capitalized).
 * Example: "chicken tacos" → "Chicken Tacos"
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Safely parses JSON from localStorage, returning a fallback on error.
 */
function parseFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // If parsing fails, return fallback (corrupted data scenario)
    return fallback;
  }
}

/**
 * Saves data to localStorage as JSON.
 */
function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================================================
// Dishes CRUD
// ============================================================================

/**
 * Retrieves all dishes from storage.
 */
export function getDishes(): Dish[] {
  return parseFromStorage<Dish[]>(STORAGE_KEYS.dishes, []);
}

/**
 * Finds a single dish by ID.
 * Returns undefined if not found.
 */
export function getDish(id: string): Dish | undefined {
  const dishes = getDishes();
  return dishes.find((dish) => dish.id === id);
}

/**
 * Creates a new dish and saves it to storage.
 * Auto-generates ID and timestamps.
 *
 * @param input - The dish data (name required, type optional)
 * @returns The created dish with all fields populated
 */
export function saveDish(input: CreateDishInput): Dish {
  const dishes = getDishes();

  const newDish: Dish = {
    id: generateId(),
    name: toTitleCase(input.name.trim()),
    type: input.type ?? 'entree',
    createdAt: now(),
    updatedAt: now(),
  };

  dishes.push(newDish);
  saveToStorage(STORAGE_KEYS.dishes, dishes);

  return newDish;
}

/**
 * Updates an existing dish.
 * Only the provided fields are updated; others remain unchanged.
 *
 * @param id - The dish ID to update
 * @param input - The fields to update
 * @returns The updated dish, or undefined if not found
 */
export function updateDish(
  id: string,
  input: UpdateDishInput
): Dish | undefined {
  const dishes = getDishes();
  const index = dishes.findIndex((dish) => dish.id === id);

  if (index === -1) return undefined;

  const existing = dishes[index];
  const updated: Dish = {
    ...existing,
    name: input.name !== undefined ? toTitleCase(input.name.trim()) : existing.name,
    type: input.type !== undefined ? input.type : existing.type,
    updatedAt: now(),
  };

  dishes[index] = updated;
  saveToStorage(STORAGE_KEYS.dishes, dishes);

  return updated;
}

/**
 * Deletes a dish from storage.
 * Also removes the dish from any meal plan assignments (cascading cleanup).
 *
 * @param id - The dish ID to delete
 * @returns true if deleted, false if not found
 */
export function deleteDish(id: string): boolean {
  const dishes = getDishes();
  const index = dishes.findIndex((dish) => dish.id === id);

  if (index === -1) return false;

  // Remove from dishes array
  dishes.splice(index, 1);
  saveToStorage(STORAGE_KEYS.dishes, dishes);

  // Cascade: remove from all meal plans
  removeDishFromAllPlans(id);

  return true;
}

// ============================================================================
// Plans CRUD
// ============================================================================

/**
 * Retrieves all meal plans from storage.
 */
export function getPlans(): MealPlan[] {
  return parseFromStorage<MealPlan[]>(STORAGE_KEYS.plans, []);
}

/**
 * Finds a single meal plan by ID.
 * Returns undefined if not found.
 */
export function getPlan(id: string): MealPlan | undefined {
  const plans = getPlans();
  return plans.find((plan) => plan.id === id);
}

/**
 * Creates a new meal plan and saves it to storage.
 * Auto-generates ID, timestamps, and day assignments.
 *
 * @param input - The plan data (startDate required, name and numberOfDays optional)
 * @returns The created plan with all fields populated
 */
export function savePlan(input: CreateMealPlanInput): MealPlan {
  const plans = getPlans();
  const numberOfDays = input.numberOfDays ?? 7;

  // Generate day assignments for each day in the plan
  const days: DayAssignment[] = [];
  const startDate = new Date(input.startDate);

  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      dishIds: [],
    });
  }

  const newPlan: MealPlan = {
    id: generateId(),
    name: input.name?.trim() || 'Meal Plan',
    startDate: input.startDate,
    days,
    createdAt: now(),
    updatedAt: now(),
  };

  plans.push(newPlan);
  saveToStorage(STORAGE_KEYS.plans, plans);

  return newPlan;
}

/**
 * Updates an existing meal plan.
 * Only the provided fields are updated; others remain unchanged.
 *
 * @param id - The plan ID to update
 * @param input - The fields to update
 * @returns The updated plan, or undefined if not found
 */
export function updatePlan(
  id: string,
  input: UpdateMealPlanInput
): MealPlan | undefined {
  const plans = getPlans();
  const index = plans.findIndex((plan) => plan.id === id);

  if (index === -1) return undefined;

  const existing = plans[index];
  const updated: MealPlan = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    days: input.days !== undefined ? input.days : existing.days,
    updatedAt: now(),
  };

  plans[index] = updated;
  saveToStorage(STORAGE_KEYS.plans, plans);

  return updated;
}

/**
 * Deletes a meal plan from storage.
 *
 * @param id - The plan ID to delete
 * @returns true if deleted, false if not found
 */
export function deletePlan(id: string): boolean {
  const plans = getPlans();
  const index = plans.findIndex((plan) => plan.id === id);

  if (index === -1) return false;

  plans.splice(index, 1);
  saveToStorage(STORAGE_KEYS.plans, plans);

  return true;
}

// ============================================================================
// Plan Helpers
// ============================================================================

/**
 * Removes a dish ID from all meal plans (cascade on dish deletion).
 * This is called automatically when a dish is deleted.
 */
function removeDishFromAllPlans(dishId: string): void {
  const plans = getPlans();
  let modified = false;

  for (const plan of plans) {
    for (const day of plan.days) {
      const beforeLength = day.dishIds.length;
      day.dishIds = day.dishIds.filter((id) => id !== dishId);
      if (day.dishIds.length !== beforeLength) {
        modified = true;
      }
    }
  }

  if (modified) {
    saveToStorage(STORAGE_KEYS.plans, plans);
  }
}

// ============================================================================
// Export / Import
// ============================================================================

/**
 * Exports all data as a JSON string for portability.
 * Follows Constitution principle IV: Data Ownership.
 */
export function exportData(): string {
  const data: ExportData = {
    exportedAt: now(),
    version: SCHEMA_VERSION,
    dishes: getDishes(),
    plans: getPlans(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Imports data from a JSON string, replacing existing data.
 *
 * @param json - The JSON string to import
 * @throws Error if the JSON is invalid or has wrong format
 */
export function importData(json: string): void {
  const data = JSON.parse(json) as ExportData;

  // Basic validation
  if (!Array.isArray(data.dishes) || !Array.isArray(data.plans)) {
    throw new Error('Invalid export format: missing dishes or plans array');
  }

  // Save the imported data
  saveToStorage(STORAGE_KEYS.dishes, data.dishes);
  saveToStorage(STORAGE_KEYS.plans, data.plans);
  saveToStorage(STORAGE_KEYS.version, data.version ?? SCHEMA_VERSION);
}

/**
 * Clears all stored data.
 * Use with caution - this is destructive!
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.dishes);
  localStorage.removeItem(STORAGE_KEYS.plans);
  localStorage.removeItem(STORAGE_KEYS.version);
}

