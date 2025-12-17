/**
 * useDishes Hook Tests
 *
 * Tests the React hook for managing dishes collection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDishes } from '@/hooks/useDishes';
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

describe('useDishes', () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  describe('initial state', () => {
    it('sets isLoading false after loading completes', async () => {
      const { result } = renderHook(() => useDishes());

      // After the effect runs, isLoading should be false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('loads dishes from storage and sets isLoading false', async () => {
      const existingDishes = [
        {
          id: 'existing-1',
          name: 'Chicken',
          type: 'entree',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      localStorageMock.setItem(
        STORAGE_KEYS.dishes,
        JSON.stringify(existingDishes)
      );

      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dishes).toHaveLength(1);
      expect(result.current.dishes[0].name).toBe('Chicken');
    });

    it('returns empty array when no dishes exist', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dishes).toEqual([]);
    });
  });

  describe('addDish', () => {
    it('adds a dish and updates state', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let newDish;
      act(() => {
        newDish = result.current.addDish({ name: 'New Dish', type: 'side' });
      });

      expect(newDish).toBeDefined();
      expect(result.current.dishes).toHaveLength(1);
      expect(result.current.dishes[0].name).toBe('New Dish');
      expect(result.current.dishes[0].type).toBe('side');
    });

    it('persists to localStorage', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addDish({ name: 'Persisted Dish' });
      });

      const stored = JSON.parse(
        localStorageMock.getItem(STORAGE_KEYS.dishes) || '[]'
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Persisted Dish');
    });

    it('returns the created dish', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created;
      act(() => {
        created = result.current.addDish({ name: 'Test' });
      });

      expect(created).toMatchObject({
        name: 'Test',
        type: 'entree',
      });
      expect(created.id).toBeTruthy();
    });
  });

  describe('updateDish', () => {
    it('updates a dish and reflects in state', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let dish;
      act(() => {
        dish = result.current.addDish({ name: 'Original' });
      });

      act(() => {
        result.current.updateDish(dish.id, { name: 'Updated' });
      });

      expect(result.current.dishes[0].name).toBe('Updated');
    });

    it('returns undefined for non-existent dish', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updated;
      act(() => {
        updated = result.current.updateDish('nonexistent', { name: 'Test' });
      });

      expect(updated).toBeUndefined();
    });
  });

  describe('deleteDish', () => {
    it('removes dish from state', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let dish;
      act(() => {
        dish = result.current.addDish({ name: 'To Delete' });
      });

      expect(result.current.dishes).toHaveLength(1);

      act(() => {
        result.current.deleteDish(dish.id);
      });

      expect(result.current.dishes).toHaveLength(0);
    });

    it('returns true on successful delete', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let dish;
      act(() => {
        dish = result.current.addDish({ name: 'Test' });
      });

      let success;
      act(() => {
        success = result.current.deleteDish(dish.id);
      });

      expect(success).toBe(true);
    });

    it('returns false for non-existent dish', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success;
      act(() => {
        success = result.current.deleteDish('nonexistent');
      });

      expect(success).toBe(false);
    });
  });

  describe('getDishesByType', () => {
    it('filters dishes by type', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addDish({ name: 'Chicken', type: 'entree' });
        result.current.addDish({ name: 'Rice', type: 'side' });
        result.current.addDish({ name: 'Salad', type: 'side' });
      });

      const entrees = result.current.getDishesByType('entree');
      const sides = result.current.getDishesByType('side');

      expect(entrees).toHaveLength(1);
      expect(entrees[0].name).toBe('Chicken');

      expect(sides).toHaveLength(2);
      expect(sides.map((d) => d.name)).toContain('Rice');
      expect(sides.map((d) => d.name)).toContain('Salad');
    });

    it('returns empty array when no matches', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addDish({ name: 'Chicken', type: 'entree' });
      });

      const others = result.current.getDishesByType('other');
      expect(others).toEqual([]);
    });
  });

  describe('getDishById', () => {
    it('finds dish by ID', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let dish;
      act(() => {
        dish = result.current.addDish({ name: 'Find Me' });
      });

      const found = result.current.getDishById(dish.id);
      expect(found?.name).toBe('Find Me');
    });

    it('returns undefined for non-existent ID', async () => {
      const { result } = renderHook(() => useDishes());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.getDishById('nonexistent');
      expect(found).toBeUndefined();
    });
  });
});

