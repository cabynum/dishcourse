/**
 * useDishes Hook
 *
 * Provides React components with access to the dishes collection.
 * Handles loading from storage, state management, and CRUD operations.
 *
 * @example
 * ```tsx
 * function DishList() {
 *   const { dishes, addDish, isLoading } = useDishes();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return dishes.map(dish => <DishCard key={dish.id} dish={dish} />);
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { Dish, DishType, CreateDishInput, UpdateDishInput } from '@/types';
import {
  getDishes,
  saveDish,
  updateDish as updateDishInStorage,
  deleteDish as deleteDishFromStorage,
} from '@/services';

/**
 * Return type for the useDishes hook.
 */
export interface UseDishesReturn {
  /** All dishes in the collection */
  dishes: Dish[];

  /** True while initially loading from storage */
  isLoading: boolean;

  /** Add a new dish to the collection */
  addDish: (input: CreateDishInput) => Dish;

  /** Update an existing dish */
  updateDish: (id: string, input: UpdateDishInput) => Dish | undefined;

  /** Delete a dish from the collection */
  deleteDish: (id: string) => boolean;

  /** Get dishes filtered by type */
  getDishesByType: (type: DishType) => Dish[];

  /** Get a single dish by ID */
  getDishById: (id: string) => Dish | undefined;
}

/**
 * Hook for managing the dishes collection.
 *
 * Loads dishes from localStorage on mount and keeps React state in sync
 * with storage operations.
 */
export function useDishes(): UseDishesReturn {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dishes from storage on mount
  useEffect(() => {
    const storedDishes = getDishes();
    setDishes(storedDishes);
    setIsLoading(false);
  }, []);

  /**
   * Add a new dish to the collection.
   * Saves to storage and updates React state.
   */
  const addDish = useCallback((input: CreateDishInput): Dish => {
    const newDish = saveDish(input);
    setDishes((prev) => [...prev, newDish]);
    return newDish;
  }, []);

  /**
   * Update an existing dish.
   * Saves to storage and updates React state.
   */
  const updateDish = useCallback(
    (id: string, input: UpdateDishInput): Dish | undefined => {
      const updated = updateDishInStorage(id, input);
      if (updated) {
        setDishes((prev) =>
          prev.map((dish) => (dish.id === id ? updated : dish))
        );
      }
      return updated;
    },
    []
  );

  /**
   * Delete a dish from the collection.
   * Removes from storage and updates React state.
   */
  const deleteDish = useCallback((id: string): boolean => {
    const success = deleteDishFromStorage(id);
    if (success) {
      setDishes((prev) => prev.filter((dish) => dish.id !== id));
    }
    return success;
  }, []);

  /**
   * Get dishes filtered by type.
   * Useful for showing only entrees, sides, etc.
   */
  const getDishesByType = useCallback(
    (type: DishType): Dish[] => {
      return dishes.filter((dish) => dish.type === type);
    },
    [dishes]
  );

  /**
   * Get a single dish by ID.
   */
  const getDishById = useCallback(
    (id: string): Dish | undefined => {
      return dishes.find((dish) => dish.id === id);
    },
    [dishes]
  );

  return {
    dishes,
    isLoading,
    addDish,
    updateDish,
    deleteDish,
    getDishesByType,
    getDishById,
  };
}

