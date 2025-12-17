/**
 * Type Definitions
 *
 * Central export point for all TypeScript types used in AliCooks.
 *
 * Entity naming convention:
 * - Dish: Individual food item (e.g., "Grilled Chicken")
 * - Meal: Combination of dishes for one day (not a type - just conceptual)
 * - MealPlan: Schedule of meals across multiple days
 */

// Dish types
export type { Dish, DishType, CreateDishInput, UpdateDishInput } from './dish';

// Plan types
export type {
  MealPlan,
  DayAssignment,
  CreateMealPlanInput,
  UpdateMealPlanInput,
} from './plan';

// Storage types
export { STORAGE_KEYS, SCHEMA_VERSION } from './storage';
export type { ExportData } from './storage';
