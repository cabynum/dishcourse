/**
 * Meal Plan Types
 *
 * A MealPlan is a collection of day assignments for meal planning.
 * Each day's assigned dishes form a complete meal.
 */

/**
 * Links a specific day in a plan to the dishes for that day's meal.
 *
 * @example
 * ```ts
 * const monday: DayAssignment = {
 *   date: '2024-12-16',
 *   dishIds: ['a1b2c3d4', 'e5f6g7h8'], // Chicken + vegetables
 * };
 * ```
 */
export interface DayAssignment {
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string;

  /**
   * Array of Dish IDs assigned to this day.
   * - Can be empty (unplanned day)
   * - Can contain duplicates (same dish twice)
   */
  dishIds: string[];
}

/**
 * A meal plan spanning one or more days.
 *
 * @example
 * ```ts
 * const weekPlan: MealPlan = {
 *   id: 'p1q2r3s4',
 *   name: 'This Week',
 *   startDate: '2024-12-16',
 *   days: [
 *     { date: '2024-12-16', dishIds: ['a1b2c3d4', 'e5f6g7h8'] },
 *     { date: '2024-12-17', dishIds: [] }, // No plan yet
 *   ],
 *   createdAt: '2024-12-15T11:00:00Z',
 *   updatedAt: '2024-12-15T11:00:00Z',
 * };
 * ```
 */
export interface MealPlan {
  /** Unique identifier (UUID), auto-generated on creation */
  id: string;

  /** User-provided name (optional, defaults to "Meal Plan") */
  name: string;

  /** ISO 8601 date (YYYY-MM-DD) when the plan starts */
  startDate: string;

  /** Array of day assignments - length determines plan duration */
  days: DayAssignment[];

  /** ISO 8601 timestamp when the plan was created */
  createdAt: string;

  /** ISO 8601 timestamp when the plan was last modified */
  updatedAt: string;
}

/**
 * Input for creating a new meal plan.
 * The `id`, `createdAt`, and `updatedAt` fields are auto-generated.
 */
export interface CreateMealPlanInput {
  /** Plan name (optional, defaults to "Meal Plan") */
  name?: string;

  /** Start date for the plan (required) */
  startDate: string;

  /** Number of days to plan (default: 7) */
  numberOfDays?: number;
}

/**
 * Input for updating an existing meal plan.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateMealPlanInput {
  /** New name for the plan */
  name?: string;

  /** Updated day assignments */
  days?: DayAssignment[];
}

