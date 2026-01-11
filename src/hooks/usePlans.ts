/**
 * usePlans Hook
 *
 * Provides React components with access to meal plans.
 * Handles loading from storage, state management, and CRUD operations.
 *
 * Works in two modes:
 * 1. LOCAL MODE (no household): Uses localStorage for single-user experience
 * 2. SYNCED MODE (with household): Uses IndexedDB + syncs to Supabase
 *
 * @example
 * ```tsx
 * function PlanList() {
 *   const { plans, createPlan, isLoading } = usePlans();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return plans.map(plan => <PlanCard key={plan.id} plan={plan} />);
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { MealPlan, DayAssignment } from '@/types';
import {
  getPlans as getLocalPlans,
  savePlan as saveLocalPlan,
  updatePlan as updateLocalPlan,
  deletePlan as deleteLocalPlan,
  getPlansFromCache,
  addPlanToCache,
  updatePlanInCache,
  deletePlanFromCache,
  onDataChange,
} from '@/services';
import { useHousehold } from './useHousehold';
import { useAuthContext } from '@/components/auth';

/**
 * Return type for the usePlans hook.
 */
export interface UsePlansReturn {
  /** All meal plans */
  plans: MealPlan[];

  /** True while initially loading from storage */
  isLoading: boolean;

  /**
   * Create a new meal plan.
   * @param days - Number of days to plan (default: 7)
   * @param startDate - Start date (default: today)
   * @param name - Optional plan name
   */
  createPlan: (days?: number, startDate?: Date, name?: string) => Promise<MealPlan>;

  /** Update an existing plan's name or days */
  updatePlan: (
    id: string,
    updates: { name?: string; days?: DayAssignment[] }
  ) => Promise<MealPlan | undefined>;

  /** Delete a meal plan */
  deletePlan: (id: string) => Promise<boolean>;

  /** Get a single plan by ID */
  getPlanById: (id: string) => MealPlan | undefined;

  /**
   * Assign a dish to a specific day in a plan.
   * Adds the dish ID to the day's dishIds array.
   */
  assignDishToDay: (planId: string, date: string, dishId: string) => Promise<boolean>;

  /**
   * Remove a dish from a specific day in a plan.
   * Removes the first occurrence of the dish ID from the day's dishIds array.
   */
  removeDishFromDay: (planId: string, date: string, dishId: string) => Promise<boolean>;

  /** Whether running in synced mode (household active) */
  isSyncedMode: boolean;
}

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Returns the current timestamp in ISO 8601 format.
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * Hook for managing meal plans.
 *
 * Automatically detects whether to use local or synced mode based on
 * authentication and household state.
 */
export function usePlans(): UsePlansReturn {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, isAuthenticated } = useAuthContext();
  const { currentHousehold } = useHousehold();

  // Determine mode based on auth and household state
  const isSyncedMode = isAuthenticated && currentHousehold !== null;

  /**
   * Load plans from the appropriate storage.
   */
  const loadPlans = useCallback(async () => {
    setIsLoading(true);

    try {
      if (isSyncedMode && currentHousehold) {
        // SYNCED MODE: Load from IndexedDB cache
        const cachedPlans = await getPlansFromCache(currentHousehold.id);
        setPlans(cachedPlans);
      } else {
        // LOCAL MODE: Load from localStorage
        const localPlans = getLocalPlans();
        setPlans(localPlans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSyncedMode, currentHousehold]);

  // Load plans on mount and when mode changes
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Subscribe to data changes (for synced mode)
  useEffect(() => {
    if (!isSyncedMode) return;

    const cleanup = onDataChange(() => {
      loadPlans();
    });

    return cleanup;
  }, [isSyncedMode, loadPlans]);

  /**
   * Create a new meal plan.
   * Saves to storage and updates React state.
   */
  const createPlan = useCallback(
    async (numberOfDays: number = 7, startDate: Date = new Date(), name?: string): Promise<MealPlan> => {
      // Generate day assignments for each day in the plan
      const days: DayAssignment[] = [];
      for (let i = 0; i < numberOfDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        days.push({
          date: formatDateToISO(date),
          dishIds: [],
        });
      }

      const newPlan: MealPlan = {
        id: crypto.randomUUID(),
        name: name?.trim() || 'Meal Plan',
        startDate: formatDateToISO(startDate),
        days,
        createdAt: now(),
        updatedAt: now(),
        // Synced mode fields
        ...(isSyncedMode &&
          currentHousehold && {
            householdId: currentHousehold.id,
            createdBy: user?.id ?? '',
          }),
      };

      if (isSyncedMode && currentHousehold) {
        // SYNCED MODE: Add to IndexedDB cache + trigger sync
        await addPlanToCache(newPlan as MealPlan & { householdId: string; createdBy: string });
        setPlans((prev) => [...prev, newPlan]);
      } else {
        // LOCAL MODE: Save to localStorage
        const saved = saveLocalPlan({
          name,
          startDate: formatDateToISO(startDate),
          numberOfDays,
        });
        setPlans((prev) => [...prev, saved]);
        return saved;
      }

      return newPlan;
    },
    [isSyncedMode, currentHousehold, user]
  );

  /**
   * Update an existing plan.
   * Saves to storage and updates React state.
   */
  const updatePlan = useCallback(
    async (
      id: string,
      updates: { name?: string; days?: DayAssignment[] }
    ): Promise<MealPlan | undefined> => {
      const existing = plans.find((p) => p.id === id);
      if (!existing) return undefined;

      const updated: MealPlan = {
        ...existing,
        name: updates.name !== undefined ? updates.name.trim() : existing.name,
        days: updates.days !== undefined ? updates.days : existing.days,
        updatedAt: now(),
      };

      if (isSyncedMode && currentHousehold) {
        // SYNCED MODE: Update in IndexedDB cache + trigger sync
        await updatePlanInCache(updated as MealPlan & { householdId: string; createdBy: string });
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      } else {
        // LOCAL MODE: Update in localStorage
        const result = updateLocalPlan(id, updates);
        if (result) {
          setPlans((prev) => prev.map((p) => (p.id === id ? result : p)));
        }
        return result;
      }

      return updated;
    },
    [plans, isSyncedMode, currentHousehold]
  );

  /**
   * Delete a meal plan.
   * Removes from storage and updates React state.
   */
  const deletePlan = useCallback(
    async (id: string): Promise<boolean> => {
      if (isSyncedMode && currentHousehold) {
        // SYNCED MODE: Soft-delete in IndexedDB cache + trigger sync
        await deletePlanFromCache(id);
        setPlans((prev) => prev.filter((p) => p.id !== id));
        return true;
      } else {
        // LOCAL MODE: Delete from localStorage
        const success = deleteLocalPlan(id);
        if (success) {
          setPlans((prev) => prev.filter((p) => p.id !== id));
        }
        return success;
      }
    },
    [isSyncedMode, currentHousehold]
  );

  /**
   * Get a single plan by ID from current state.
   */
  const getPlanById = useCallback(
    (id: string): MealPlan | undefined => {
      return plans.find((plan) => plan.id === id);
    },
    [plans]
  );

  /**
   * Assign a dish to a specific day in a plan.
   * Adds the dish ID to the end of the day's dishIds array.
   * In synced mode, records who made the assignment.
   */
  const assignDishToDay = useCallback(
    async (planId: string, date: string, dishId: string): Promise<boolean> => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return false;

      const dayIndex = plan.days.findIndex((d) => d.date === date);
      if (dayIndex === -1) return false;

      // Create new days array with the dish added
      const newDays = plan.days.map((day, index) => {
        if (index === dayIndex) {
          return {
            ...day,
            dishIds: [...day.dishIds, dishId],
            // Record who made this assignment in synced mode
            ...(isSyncedMode && user && { assignedBy: user.id }),
          };
        }
        return day;
      });

      const result = await updatePlan(planId, { days: newDays });
      return result !== undefined;
    },
    [plans, updatePlan, isSyncedMode, user]
  );

  /**
   * Remove a dish from a specific day in a plan.
   * Removes the first occurrence of the dish ID.
   */
  const removeDishFromDay = useCallback(
    async (planId: string, date: string, dishId: string): Promise<boolean> => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return false;

      const dayIndex = plan.days.findIndex((d) => d.date === date);
      if (dayIndex === -1) return false;

      const day = plan.days[dayIndex];
      const dishIndex = day.dishIds.indexOf(dishId);
      if (dishIndex === -1) return false;

      // Create new days array with the dish removed
      const newDays = plan.days.map((d, index) => {
        if (index === dayIndex) {
          const newDishIds = [...d.dishIds];
          newDishIds.splice(dishIndex, 1);
          return {
            ...d,
            dishIds: newDishIds,
          };
        }
        return d;
      });

      const result = await updatePlan(planId, { days: newDays });
      return result !== undefined;
    },
    [plans, updatePlan]
  );

  return {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
    assignDishToDay,
    removeDishFromDay,
    isSyncedMode,
  };
}
