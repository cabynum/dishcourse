/**
 * Dish Types
 *
 * A Dish is an individual food item in the user's personal collection.
 * Dishes combine to form meals (e.g., "Grilled Chicken" + "Roasted Vegetables").
 */

/**
 * Categories for organizing dishes.
 * - 'entree': Main course items (e.g., "Grilled Chicken", "Pasta")
 * - 'side': Accompaniments (e.g., "Roasted Vegetables", "Rice")
 * - 'other': Anything else (e.g., "Bread", "Salad")
 */
export type DishType = 'entree' | 'side' | 'other';

/**
 * A single food item in the user's collection.
 *
 * @example
 * ```ts
 * const dish: Dish = {
 *   id: 'a1b2c3d4',
 *   name: 'Grilled Chicken',
 *   type: 'entree',
 *   createdAt: '2024-12-15T10:30:00Z',
 *   updatedAt: '2024-12-15T10:30:00Z',
 * };
 * ```
 */
export interface Dish {
  /** Unique identifier (UUID), auto-generated on creation */
  id: string;

  /** User-provided name (1-100 characters, trimmed) */
  name: string;

  /** Category of dish - defaults to 'entree' if not specified */
  type: DishType;

  /** ISO 8601 timestamp when the dish was created */
  createdAt: string;

  /** ISO 8601 timestamp when the dish was last modified */
  updatedAt: string;
}

/**
 * Input for creating a new dish.
 * The `id`, `createdAt`, and `updatedAt` fields are auto-generated.
 */
export interface CreateDishInput {
  /** User-provided name (required, 1-100 characters) */
  name: string;

  /** Category of dish (optional, defaults to 'entree') */
  type?: DishType;
}

/**
 * Input for updating an existing dish.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateDishInput {
  /** New name for the dish */
  name?: string;

  /** New type for the dish */
  type?: DishType;
}

