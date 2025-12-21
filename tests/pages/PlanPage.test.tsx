/**
 * PlanPage Tests
 *
 * Tests for the meal plan page.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PlanPage } from '@/pages/PlanPage';
import type { Dish, MealPlan } from '@/types';
import { STORAGE_KEYS } from '@/types';

// ============================================================================
// Test Setup
// ============================================================================

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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Creates a test dish with the given properties.
 */
function createDish(
  id: string,
  name: string,
  type: 'entree' | 'side' | 'other'
): Dish {
  return {
    id,
    name,
    type,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

/**
 * Creates a test meal plan.
 */
function createPlan(
  id: string,
  name: string,
  startDate: string,
  days: { date: string; dishIds: string[] }[]
): MealPlan {
  return {
    id,
    name,
    startDate,
    days,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

/**
 * Sets up dishes in localStorage for testing.
 */
function setupDishes(dishes: Dish[]) {
  localStorageMock.setItem(STORAGE_KEYS.dishes, JSON.stringify(dishes));
}

/**
 * Sets up plans in localStorage for testing.
 */
function setupPlans(plans: MealPlan[]) {
  localStorageMock.setItem(STORAGE_KEYS.plans, JSON.stringify(plans));
}

/**
 * Render helper for new plan creation (no planId)
 */
function renderNewPlanPage() {
  return render(
    <MemoryRouter initialEntries={['/plan']}>
      <Routes>
        <Route path="/plan" element={<PlanPage />} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * Render helper for existing plan (with planId)
 */
function renderExistingPlanPage(planId: string) {
  return render(
    <MemoryRouter initialEntries={[`/plan/${planId}`]}>
      <Routes>
        <Route path="/plan/:planId" element={<PlanPage />} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('PlanPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockNavigate.mockClear();
    uuidCounter = 0;
  });

  describe('new plan creation', () => {
    describe('when no dishes exist', () => {
      it('shows empty state', async () => {
        renderNewPlanPage();

        await waitFor(() => {
          expect(screen.getByText('Add Some Dishes First')).toBeInTheDocument();
        });
      });

      it('has Add Dish button', async () => {
        renderNewPlanPage();

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /add a dish/i })
          ).toBeInTheDocument();
        });
      });

      it('navigates to add page when Add Dish clicked', async () => {
        const user = userEvent.setup();
        renderNewPlanPage();

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /add a dish/i })
          ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /add a dish/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/add');
      });
    });

    describe('when dishes exist', () => {
      beforeEach(() => {
        setupDishes([
          createDish('e1', 'Chicken', 'entree'),
          createDish('s1', 'Rice', 'side'),
        ]);
      });

      it('shows day count options', async () => {
        renderNewPlanPage();

        await waitFor(() => {
          expect(screen.getByText('3')).toBeInTheDocument();
          expect(screen.getByText('5')).toBeInTheDocument();
          expect(screen.getByText('7')).toBeInTheDocument();
          expect(screen.getByText('14')).toBeInTheDocument();
        });
      });

      it('defaults to 7 days selected', async () => {
        renderNewPlanPage();

        await waitFor(() => {
          const sevenButton = screen.getByRole('button', { name: '7' });
          // Selected day count uses accent color via inline style
          expect(sevenButton.style.backgroundColor).toBe('var(--color-accent)');
        });
      });

      it('allows selecting different day counts', async () => {
        const user = userEvent.setup();
        renderNewPlanPage();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: '3' }));

        // Selected uses accent color, unselected uses card background
        expect(screen.getByRole('button', { name: '3' }).style.backgroundColor).toBe('var(--color-accent)');
        expect(screen.getByRole('button', { name: '7' }).style.backgroundColor).toBe('var(--color-card)');
      });

      it('has Create Plan button', async () => {
        renderNewPlanPage();

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /create plan/i })
          ).toBeInTheDocument();
        });
      });

      it('creates plan and navigates when Create Plan clicked', async () => {
        const user = userEvent.setup();
        renderNewPlanPage();

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /create plan/i })
          ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /create plan/i }));

        // Should navigate to the new plan's page
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringMatching(/\/plan\/test-uuid-\d+/),
          { replace: true }
        );
      });

      it('shows page title', async () => {
        renderNewPlanPage();

        await waitFor(() => {
          expect(screen.getByText('Plan a Menu')).toBeInTheDocument();
        });
      });

      it('has back button', async () => {
        renderNewPlanPage();

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /go back/i })
          ).toBeInTheDocument();
        });
      });

      it('navigates home when back button clicked', async () => {
        const user = userEvent.setup();
        renderNewPlanPage();

        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /go back/i })
          ).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /go back/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('existing plan view', () => {
    const testPlan = createPlan('plan-1', 'Test Week', '2024-12-16', [
      { date: '2024-12-16', dishIds: ['e1'] },
      { date: '2024-12-17', dishIds: [] },
      { date: '2024-12-18', dishIds: ['e1', 's1'] },
    ]);

    beforeEach(() => {
      setupDishes([
        createDish('e1', 'Chicken', 'entree'),
        createDish('s1', 'Rice', 'side'),
      ]);
      setupPlans([testPlan]);
    });

    it('shows plan name in header', async () => {
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        expect(screen.getByText('Test Week')).toBeInTheDocument();
      });
    });

    it('shows day slots for each day', async () => {
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        // Should show Mon, Tue, Wed for Dec 16-18
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
        expect(screen.getByText('Wed')).toBeInTheDocument();
      });
    });

    it('shows assigned dishes', async () => {
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        // Chicken should appear for days that have it
        const chickenElements = screen.getAllByText('Chicken');
        expect(chickenElements.length).toBeGreaterThan(0);
      });
    });

    it('shows empty state for unassigned days', async () => {
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        expect(screen.getByText('Tap to add dishes')).toBeInTheDocument();
      });
    });

    it('navigates to day assignment when day clicked', async () => {
      const user = userEvent.setup();
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        expect(screen.getByText('Mon')).toBeInTheDocument();
      });

      // Click on a day slot
      const daySlots = screen.getAllByRole('button');
      const mondaySlot = daySlots.find((btn) =>
        btn.getAttribute('aria-label')?.includes('Mon')
      );
      if (mondaySlot) {
        await user.click(mondaySlot);
        expect(mockNavigate).toHaveBeenCalledWith('/plan/plan-1/2024-12-16');
      }
    });

    it('shows stats at bottom', async () => {
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        expect(screen.getByText('Days planned')).toBeInTheDocument();
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
      });
    });

    it('has back button', async () => {
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /go back/i })
        ).toBeInTheDocument();
      });
    });

    it('navigates home when back button clicked', async () => {
      const user = userEvent.setup();
      renderExistingPlanPage('plan-1');

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /go back/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /go back/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('non-existent plan', () => {
    beforeEach(() => {
      setupDishes([createDish('e1', 'Chicken', 'entree')]);
      setupPlans([]);
    });

    it('redirects to home if plan not found', async () => {
      renderExistingPlanPage('nonexistent-plan');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });
});

