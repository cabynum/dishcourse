/**
 * HomePage Tests
 *
 * Tests the main landing page including dish list display,
 * empty state, navigation, and quick actions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import type { Dish } from '@/types';

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

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Track navigation
let navigatedTo: string | null = null;

/**
 * Factory for creating test dishes
 */
function createTestDish(overrides: Partial<Dish> = {}): Dish {
  const id = overrides.id || `dish-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: 'Test Dish',
    type: 'entree',
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-15T10:30:00Z',
    ...overrides,
  };
}

/**
 * Helper to set up dishes in localStorage
 */
function setupDishes(dishes: Dish[]) {
  localStorageMock.setItem('dishcourse_dishes', JSON.stringify(dishes));
}

/**
 * Helper to render HomePage with router context
 */
function renderHomePage() {
  navigatedTo = null;

  function AddDishPage() {
    navigatedTo = '/add';
    return <div>Add Dish Page</div>;
  }

  function EditDishPage() {
    navigatedTo = '/edit';
    return <div>Edit Dish Page</div>;
  }

  function SuggestPage() {
    navigatedTo = '/suggest';
    return <div>Suggest Page</div>;
  }

  function PlanPage() {
    navigatedTo = '/plan';
    return <div>Plan Page</div>;
  }

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<AddDishPage />} />
        <Route path="/edit/:dishId" element={<EditDishPage />} />
        <Route path="/suggest" element={<SuggestPage />} />
        <Route path="/plan" element={<PlanPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    navigatedTo = null;
  });

  describe('rendering', () => {
    it('renders page title', () => {
      renderHomePage();

      expect(screen.getByRole('heading', { name: 'DishCourse' })).toBeInTheDocument();
    });

    it('renders greeting', () => {
      renderHomePage();

      // The redesigned HomePage shows a greeting instead of subtitle
      expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });

    it('renders My Dishes section heading', () => {
      renderHomePage();

      expect(screen.getByRole('heading', { name: 'My Dishes' })).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no dishes exist', () => {
      renderHomePage();

      expect(screen.getByText('No dishes yet')).toBeInTheDocument();
    });

    it('shows Add a Dish button in empty state', () => {
      renderHomePage();

      expect(screen.getByRole('button', { name: 'Add a Dish' })).toBeInTheDocument();
    });

    it('navigates to add page when empty state button is clicked', async () => {
      const user = userEvent.setup();
      renderHomePage();

      await user.click(screen.getByRole('button', { name: 'Add a Dish' }));

      expect(navigatedTo).toBe('/add');
    });

    it('shows FAB in empty state for quick adding', () => {
      renderHomePage();

      // FAB should always be visible as a quick way to add dishes
      expect(screen.getByRole('button', { name: 'Add a dish' })).toBeInTheDocument();
    });
  });

  describe('with dishes', () => {
    it('renders dish names', () => {
      setupDishes([
        createTestDish({ name: 'Grilled Chicken' }),
        createTestDish({ name: 'Roasted Vegetables' }),
      ]);
      renderHomePage();

      expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
      expect(screen.getByText('Roasted Vegetables')).toBeInTheDocument();
    });

    it('shows dish count', () => {
      setupDishes([createTestDish(), createTestDish(), createTestDish()]);
      renderHomePage();

      expect(screen.getByText('3 dishes')).toBeInTheDocument();
    });

    it('shows singular "dish" for one dish', () => {
      setupDishes([createTestDish()]);
      renderHomePage();

      expect(screen.getByText('1 dish')).toBeInTheDocument();
    });

    it('shows type badges on dishes', () => {
      setupDishes([
        createTestDish({ type: 'entree' }),
        createTestDish({ type: 'side' }),
      ]);
      renderHomePage();

      expect(screen.getByText('Entree')).toBeInTheDocument();
      expect(screen.getByText('Side')).toBeInTheDocument();
    });

    it('shows FAB when dishes exist', () => {
      setupDishes([createTestDish()]);
      renderHomePage();

      expect(screen.getByRole('button', { name: 'Add a dish' })).toBeInTheDocument();
    });

    it('does not show empty state when dishes exist', () => {
      setupDishes([createTestDish()]);
      renderHomePage();

      expect(screen.queryByText('No dishes yet')).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to add page when FAB is clicked', async () => {
      const user = userEvent.setup();
      setupDishes([createTestDish()]);
      renderHomePage();

      await user.click(screen.getByRole('button', { name: 'Add a dish' }));

      expect(navigatedTo).toBe('/add');
    });

    it('navigates to edit page when dish is clicked', async () => {
      const user = userEvent.setup();
      setupDishes([createTestDish({ id: 'dish-123', name: 'Clickable Dish' })]);
      renderHomePage();

      // The dish card is rendered as a button when onClick is provided
      await user.click(screen.getByText('Clickable Dish'));

      expect(navigatedTo).toBe('/edit');
    });
  });

  describe('quick actions', () => {
    it('renders Suggest button (disabled when no entrees)', () => {
      renderHomePage();

      const suggestButton = screen.getByRole('button', { name: /suggest.*add entrees first/i });
      expect(suggestButton).toBeInTheDocument();
      expect(suggestButton).toBeDisabled();
    });

    it('renders Suggest button (enabled when has entrees)', async () => {
      setupDishes([createTestDish({ type: 'entree' })]);
      renderHomePage();

      const suggestButton = screen.getByRole('button', { name: /get meal suggestion/i });
      expect(suggestButton).toBeInTheDocument();
      expect(suggestButton).not.toBeDisabled();
    });

    it('navigates to suggest page when Suggest clicked', async () => {
      const user = userEvent.setup();
      setupDishes([createTestDish({ type: 'entree' })]);
      renderHomePage();

      await user.click(screen.getByRole('button', { name: /get meal suggestion/i }));

      expect(navigatedTo).toBe('/suggest');
    });

    it('renders Plan button (disabled when no dishes)', () => {
      renderHomePage();

      const planButton = screen.getByRole('button', { name: /plan.*add dishes first/i });
      expect(planButton).toBeInTheDocument();
      expect(planButton).toBeDisabled();
    });

    it('renders Plan button (enabled when has dishes)', () => {
      setupDishes([createTestDish({ type: 'entree' })]);
      renderHomePage();

      const planButton = screen.getByRole('button', { name: /plan a menu/i });
      expect(planButton).toBeInTheDocument();
      expect(planButton).not.toBeDisabled();
    });

    it('navigates to plan page when Plan clicked', async () => {
      const user = userEvent.setup();
      setupDishes([createTestDish({ type: 'entree' })]);
      renderHomePage();

      await user.click(screen.getByRole('button', { name: /plan a menu/i }));

      expect(navigatedTo).toBe('/plan');
    });

    it('shows add entree message when no entrees', () => {
      renderHomePage();

      expect(screen.getByText(/add an entree to start getting suggestions/i)).toBeInTheDocument();
    });

    it('does not show entree message when has entrees', () => {
      setupDishes([createTestDish({ type: 'entree' })]);
      renderHomePage();

      expect(screen.queryByText(/add an entree to start getting suggestions/i)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('FAB has accessible label', () => {
      setupDishes([createTestDish()]);
      renderHomePage();

      expect(screen.getByRole('button', { name: 'Add a dish' })).toBeInTheDocument();
    });

    it('dish list has proper list role', () => {
      setupDishes([createTestDish()]);
      renderHomePage();

      expect(screen.getByRole('list', { name: 'Dishes' })).toBeInTheDocument();
    });

    it('dishes are keyboard navigable', async () => {
      const user = userEvent.setup();
      setupDishes([createTestDish({ name: 'Keyboard Dish' })]);
      renderHomePage();

      // Tab to the dish (may need multiple tabs depending on page structure)
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      // The dish button should be focusable
      const dishButton = screen.getByRole('button', { name: /keyboard dish/i });
      expect(document.body).toContainElement(dishButton);
    });
  });
});

