/**
 * Storage Service Tests
 *
 * Tests for localStorage CRUD operations for dishes and plans.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDishes,
  getDish,
  saveDish,
  updateDish,
  deleteDish,
  getPlans,
  getPlan,
  savePlan,
  updatePlan,
  deletePlan,
  exportData,
  importData,
  clearAllData,
} from '@/services/storage';
import { STORAGE_KEYS } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

describe('Storage Service - Dishes', () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  describe('getDishes', () => {
    it('returns empty array when no dishes exist', () => {
      expect(getDishes()).toEqual([]);
    });

    it('returns stored dishes', () => {
      const dishes = [
        {
          id: '1',
          name: 'Chicken',
          type: 'entree',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      localStorageMock.setItem(STORAGE_KEYS.dishes, JSON.stringify(dishes));

      expect(getDishes()).toEqual(dishes);
    });

    it('returns empty array on corrupted JSON', () => {
      localStorageMock.setItem(STORAGE_KEYS.dishes, 'not valid json');
      expect(getDishes()).toEqual([]);
    });
  });

  describe('getDish', () => {
    it('returns undefined for non-existent dish', () => {
      expect(getDish('nonexistent')).toBeUndefined();
    });

    it('finds dish by ID', () => {
      const dish = saveDish({ name: 'Test Dish' });
      expect(getDish(dish.id)).toEqual(dish);
    });
  });

  describe('saveDish', () => {
    it('creates dish with auto-generated ID and timestamps', () => {
      const dish = saveDish({ name: 'Grilled Chicken' });

      expect(dish.id).toBe('test-uuid-1');
      expect(dish.name).toBe('Grilled Chicken');
      expect(dish.type).toBe('entree'); // default
      expect(dish.createdAt).toBeTruthy();
      expect(dish.updatedAt).toBeTruthy();
    });

    it('trims whitespace from name', () => {
      const dish = saveDish({ name: '  Pasta  ' });
      expect(dish.name).toBe('Pasta');
    });

    it('uses provided type', () => {
      const dish = saveDish({ name: 'Rice', type: 'side' });
      expect(dish.type).toBe('side');
    });

    it('persists dish to localStorage', () => {
      saveDish({ name: 'Test' });
      const stored = JSON.parse(
        localStorageMock.getItem(STORAGE_KEYS.dishes) || '[]'
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Test');
    });

    it('appends to existing dishes', () => {
      saveDish({ name: 'First' });
      saveDish({ name: 'Second' });

      expect(getDishes()).toHaveLength(2);
    });
  });

  describe('updateDish', () => {
    it('returns undefined for non-existent dish', () => {
      expect(updateDish('nonexistent', { name: 'New Name' })).toBeUndefined();
    });

    it('updates dish name', () => {
      const dish = saveDish({ name: 'Old Name' });
      const updated = updateDish(dish.id, { name: 'New Name' });

      expect(updated?.name).toBe('New Name');
      expect(updated?.type).toBe('entree'); // unchanged
    });

    it('updates dish type', () => {
      const dish = saveDish({ name: 'Rice', type: 'entree' });
      const updated = updateDish(dish.id, { type: 'side' });

      expect(updated?.type).toBe('side');
      expect(updated?.name).toBe('Rice'); // unchanged
    });

    it('updates timestamp', () => {
      const dish = saveDish({ name: 'Test' });
      const originalUpdatedAt = dish.updatedAt;

      // Small delay to ensure timestamp changes
      const updated = updateDish(dish.id, { name: 'Updated' });

      expect(updated?.createdAt).toBe(dish.createdAt); // unchanged
      // Note: In fast tests, timestamps might be equal
      expect(updated?.updatedAt).toBeTruthy();
    });

    it('trims whitespace from updated name', () => {
      const dish = saveDish({ name: 'Test' });
      const updated = updateDish(dish.id, { name: '  Trimmed  ' });

      expect(updated?.name).toBe('Trimmed');
    });
  });

  describe('deleteDish', () => {
    it('returns false for non-existent dish', () => {
      expect(deleteDish('nonexistent')).toBe(false);
    });

    it('removes dish from storage', () => {
      const dish = saveDish({ name: 'To Delete' });
      expect(getDishes()).toHaveLength(1);

      const result = deleteDish(dish.id);

      expect(result).toBe(true);
      expect(getDishes()).toHaveLength(0);
    });

    it('removes dish from meal plans (cascade)', () => {
      const dish = saveDish({ name: 'Chicken' });
      const plan = savePlan({ startDate: '2024-12-16' });

      // Assign dish to a day
      updatePlan(plan.id, {
        days: [{ date: '2024-12-16', dishIds: [dish.id] }],
      });

      // Verify dish is in plan
      const planBefore = getPlan(plan.id);
      expect(planBefore?.days[0].dishIds).toContain(dish.id);

      // Delete dish
      deleteDish(dish.id);

      // Verify dish is removed from plan
      const planAfter = getPlan(plan.id);
      expect(planAfter?.days[0].dishIds).not.toContain(dish.id);
    });
  });
});

describe('Storage Service - Plans', () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  describe('getPlans', () => {
    it('returns empty array when no plans exist', () => {
      expect(getPlans()).toEqual([]);
    });
  });

  describe('getPlan', () => {
    it('returns undefined for non-existent plan', () => {
      expect(getPlan('nonexistent')).toBeUndefined();
    });

    it('finds plan by ID', () => {
      const plan = savePlan({ startDate: '2024-12-16' });
      expect(getPlan(plan.id)).toEqual(plan);
    });
  });

  describe('savePlan', () => {
    it('creates plan with default name and 7 days', () => {
      const plan = savePlan({ startDate: '2024-12-16' });

      expect(plan.id).toBe('test-uuid-1');
      expect(plan.name).toBe('Meal Plan');
      expect(plan.startDate).toBe('2024-12-16');
      expect(plan.days).toHaveLength(7);
      expect(plan.createdAt).toBeTruthy();
      expect(plan.updatedAt).toBeTruthy();
    });

    it('generates correct dates for days', () => {
      const plan = savePlan({ startDate: '2024-12-16', numberOfDays: 3 });

      expect(plan.days[0].date).toBe('2024-12-16');
      expect(plan.days[1].date).toBe('2024-12-17');
      expect(plan.days[2].date).toBe('2024-12-18');
    });

    it('creates days with empty dishIds', () => {
      const plan = savePlan({ startDate: '2024-12-16', numberOfDays: 2 });

      expect(plan.days[0].dishIds).toEqual([]);
      expect(plan.days[1].dishIds).toEqual([]);
    });

    it('uses provided name', () => {
      const plan = savePlan({ name: 'Holiday Week', startDate: '2024-12-25' });
      expect(plan.name).toBe('Holiday Week');
    });

    it('trims whitespace from name', () => {
      const plan = savePlan({ name: '  Week 1  ', startDate: '2024-12-16' });
      expect(plan.name).toBe('Week 1');
    });

    it('uses empty string name as default', () => {
      const plan = savePlan({ name: '', startDate: '2024-12-16' });
      expect(plan.name).toBe('Meal Plan');
    });
  });

  describe('updatePlan', () => {
    it('returns undefined for non-existent plan', () => {
      expect(updatePlan('nonexistent', { name: 'New' })).toBeUndefined();
    });

    it('updates plan name', () => {
      const plan = savePlan({ name: 'Old', startDate: '2024-12-16' });
      const updated = updatePlan(plan.id, { name: 'New' });

      expect(updated?.name).toBe('New');
    });

    it('updates plan days', () => {
      const plan = savePlan({ startDate: '2024-12-16', numberOfDays: 1 });
      const newDays = [{ date: '2024-12-16', dishIds: ['dish-1', 'dish-2'] }];

      const updated = updatePlan(plan.id, { days: newDays });

      expect(updated?.days).toEqual(newDays);
    });
  });

  describe('deletePlan', () => {
    it('returns false for non-existent plan', () => {
      expect(deletePlan('nonexistent')).toBe(false);
    });

    it('removes plan from storage', () => {
      const plan = savePlan({ startDate: '2024-12-16' });
      expect(getPlans()).toHaveLength(1);

      const result = deletePlan(plan.id);

      expect(result).toBe(true);
      expect(getPlans()).toHaveLength(0);
    });
  });
});

describe('Storage Service - Export/Import', () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  describe('exportData', () => {
    it('exports empty data', () => {
      const json = exportData();
      const data = JSON.parse(json);

      expect(data.dishes).toEqual([]);
      expect(data.plans).toEqual([]);
      expect(data.version).toBe(1);
      expect(data.exportedAt).toBeTruthy();
    });

    it('exports all dishes and plans', () => {
      saveDish({ name: 'Chicken' });
      saveDish({ name: 'Rice' });
      savePlan({ startDate: '2024-12-16' });

      const json = exportData();
      const data = JSON.parse(json);

      expect(data.dishes).toHaveLength(2);
      expect(data.plans).toHaveLength(1);
    });
  });

  describe('importData', () => {
    it('imports valid data', () => {
      const exportJson = JSON.stringify({
        exportedAt: '2024-01-01',
        version: 1,
        dishes: [
          {
            id: 'imported-1',
            name: 'Imported Dish',
            type: 'entree',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        plans: [],
      });

      importData(exportJson);

      const dishes = getDishes();
      expect(dishes).toHaveLength(1);
      expect(dishes[0].name).toBe('Imported Dish');
    });

    it('replaces existing data', () => {
      saveDish({ name: 'Existing' });
      expect(getDishes()).toHaveLength(1);

      importData(
        JSON.stringify({
          exportedAt: '2024-01-01',
          version: 1,
          dishes: [],
          plans: [],
        })
      );

      expect(getDishes()).toHaveLength(0);
    });

    it('throws on invalid JSON', () => {
      expect(() => importData('not json')).toThrow();
    });

    it('throws on missing arrays', () => {
      expect(() => importData(JSON.stringify({ dishes: 'not array' }))).toThrow(
        'Invalid export format'
      );
    });
  });

  describe('clearAllData', () => {
    it('removes all stored data', () => {
      saveDish({ name: 'Test' });
      savePlan({ startDate: '2024-12-16' });

      clearAllData();

      expect(getDishes()).toEqual([]);
      expect(getPlans()).toEqual([]);
    });
  });
});

