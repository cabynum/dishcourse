/**
 * EditDishPage Tests
 *
 * Tests the full edit dish flow including form submission,
 * deletion with confirmation, storage interaction, and navigation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EditDishPage } from '@/pages/EditDishPage';
import { getDishes, saveDish, getPlans, savePlan, updatePlan } from '@/services';
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
 * Helper to render EditDishPage with router context
 */
function renderEditDishPage(dishId: string) {
  navigatedTo = null;

  function HomePage() {
    navigatedTo = '/';
    return <div>Home Page</div>;
  }

  return render(
    <MemoryRouter initialEntries={[`/edit/${dishId}`]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/edit/:dishId" element={<EditDishPage />} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * Helper to create a test dish
 */
function createTestDish(overrides: Partial<Omit<Dish, 'id' | 'createdAt' | 'updatedAt'>> = {}): Dish {
  return saveDish({
    name: overrides.name ?? 'Test Dish',
    type: overrides.type ?? 'entree',
  });
}

describe('EditDishPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    navigatedTo = null;
  });

  describe('rendering', () => {
    it('renders page title', () => {
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      expect(
        screen.getByRole('heading', { name: 'Edit Dish' })
      ).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      expect(
        screen.getByText('Update or remove this dish')
      ).toBeInTheDocument();
    });

    it('renders the dish form with existing values', () => {
      const dish = createTestDish({ name: 'Spaghetti', type: 'entree' });
      renderEditDishPage(dish.id);

      const nameInput = screen.getByLabelText('Dish Name');
      expect(nameInput).toHaveValue('Spaghetti');
      expect(screen.getByRole('radio', { name: 'Entree' })).toBeChecked();
    });

    it('renders submit button with "Save Changes" label', () => {
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
    });

    it('renders delete button', () => {
      const dish = createTestDish({ name: 'My Dish' });
      renderEditDishPage(dish.id);

      expect(
        screen.getByRole('button', { name: 'Delete My Dish' })
      ).toBeInTheDocument();
    });

    it('pre-selects the correct dish type', () => {
      const dish = createTestDish({ name: 'Rice', type: 'side' });
      renderEditDishPage(dish.id);

      expect(screen.getByRole('radio', { name: 'Side Dish' })).toBeChecked();
    });
  });

  describe('dish not found', () => {
    it('shows error state when dish ID does not exist', () => {
      renderEditDishPage('non-existent-id');

      expect(screen.getByText('Dish not found')).toBeInTheDocument();
      expect(
        screen.getByText("This dish doesn't exist or may have been deleted.")
      ).toBeInTheDocument();
    });

    it('shows go home button when dish not found', () => {
      renderEditDishPage('non-existent-id');

      expect(
        screen.getByRole('button', { name: 'Go Home' })
      ).toBeInTheDocument();
    });

    it('navigates home when go home button clicked', async () => {
      const user = userEvent.setup();
      renderEditDishPage('non-existent-id');

      await user.click(screen.getByRole('button', { name: 'Go Home' }));

      expect(navigatedTo).toBe('/');
    });
  });

  describe('form submission', () => {
    it('updates dish in storage when form is submitted', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Old Name', type: 'entree' });
      renderEditDishPage(dish.id);

      // Clear and type new name
      const nameInput = screen.getByLabelText('Dish Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      // Submit the form
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Check that dish was updated
      const dishes = getDishes();
      expect(dishes).toHaveLength(1);
      expect(dishes[0].name).toBe('New Name');
    });

    it('updates dish type when changed', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Pasta', type: 'entree' });
      renderEditDishPage(dish.id);

      // Change type to side
      await user.click(screen.getByRole('radio', { name: 'Side Dish' }));

      // Submit
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Check updated type
      const dishes = getDishes();
      expect(dishes[0].type).toBe('side');
    });

    it('navigates to home after successful submission', async () => {
      const user = userEvent.setup();
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(navigatedTo).toBe('/');
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('does not update when name is empty', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Original Name' });
      renderEditDishPage(dish.id);

      // Clear the name
      const nameInput = screen.getByLabelText('Dish Name');
      await user.clear(nameInput);

      // Try to submit
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Should show error and stay on page
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(navigatedTo).toBeNull();

      // Original name should be preserved
      const dishes = getDishes();
      expect(dishes[0].name).toBe('Original Name');
    });

    it('trims whitespace from dish name', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Old Name' });
      renderEditDishPage(dish.id);

      const nameInput = screen.getByLabelText('Dish Name');
      await user.clear(nameInput);
      await user.type(nameInput, '  Trimmed Name  ');
      await user.click(screen.getByRole('button', { name: 'Save Changes' }));

      const dishes = getDishes();
      expect(dishes[0].name).toBe('Trimmed Name');
    });
  });

  describe('cancel', () => {
    it('navigates to home when cancel is clicked', async () => {
      const user = userEvent.setup();
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(navigatedTo).toBe('/');
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('does not save changes when cancel is clicked', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Original' });
      renderEditDishPage(dish.id);

      // Type something but then cancel
      const nameInput = screen.getByLabelText('Dish Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      // Original should be preserved
      const dishes = getDishes();
      expect(dishes[0].name).toBe('Original');
    });
  });

  describe('delete', () => {
    it('shows confirmation dialog when delete clicked', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Chicken Parmesan' });
      renderEditDishPage(dish.id);

      await user.click(screen.getByRole('button', { name: 'Delete Chicken Parmesan' }));

      expect(
        screen.getByText(/Are you sure you want to delete/)
      ).toBeInTheDocument();
      expect(screen.getByText('"Chicken Parmesan"')).toBeInTheDocument();
    });

    it('shows warning about meal plan removal', async () => {
      const user = userEvent.setup();
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      await user.click(screen.getByRole('button', { name: /Delete/ }));

      expect(
        screen.getByText('This will also remove it from any meal plans.')
      ).toBeInTheDocument();
    });

    it('deletes dish when confirmed', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'To Delete' });
      expect(getDishes()).toHaveLength(1);

      renderEditDishPage(dish.id);

      // Click delete and confirm
      await user.click(screen.getByRole('button', { name: 'Delete To Delete' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      // Dish should be gone
      expect(getDishes()).toHaveLength(0);
    });

    it('navigates home after deletion', async () => {
      const user = userEvent.setup();
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      await user.click(screen.getByRole('button', { name: /Delete/ }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(navigatedTo).toBe('/');
    });

    it('hides confirmation when cancel clicked', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Keep Me' });
      renderEditDishPage(dish.id);

      // Click delete then cancel
      await user.click(screen.getByRole('button', { name: 'Delete Keep Me' }));
      expect(screen.getByText(/Are you sure/)).toBeInTheDocument();

      // There are two Cancel buttons - the form one and the confirmation one
      // Get the one in the confirmation dialog (it's the last one)
      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
      await user.click(cancelButtons[cancelButtons.length - 1]);

      // Confirmation should be hidden
      expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();

      // Dish should still exist
      expect(getDishes()).toHaveLength(1);
    });

    it('does not delete when cancel clicked', async () => {
      const user = userEvent.setup();
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      await user.click(screen.getByRole('button', { name: /Delete/ }));
      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
      await user.click(cancelButtons[cancelButtons.length - 1]);

      expect(getDishes()).toHaveLength(1);
    });
  });

  describe('cascade delete', () => {
    it('removes dish from meal plans when deleted', async () => {
      const user = userEvent.setup();

      // Create a dish and add it to a plan
      const dish = createTestDish({ name: 'Planned Dish' });
      const today = new Date().toISOString().split('T')[0];
      const plan = savePlan({
        startDate: today,
        numberOfDays: 7,
        name: 'Test Plan',
      });

      // Add the dish to the plan using proper storage function
      const updatedDays = [...plan.days];
      updatedDays[0] = { ...updatedDays[0], dishIds: [dish.id] };
      updatePlan(plan.id, { days: updatedDays });

      // Verify dish is in plan
      let plans = getPlans();
      expect(plans[0].days[0].dishIds).toContain(dish.id);

      // Now delete the dish
      renderEditDishPage(dish.id);
      await user.click(screen.getByRole('button', { name: /Delete/ }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      // Dish should be removed from plan
      plans = getPlans();
      expect(plans[0].days[0].dishIds).not.toContain(dish.id);
    });
  });

  describe('accessibility', () => {
    it('focuses the name input on page load', () => {
      const dish = createTestDish();
      renderEditDishPage(dish.id);

      expect(screen.getByLabelText('Dish Name')).toHaveFocus();
    });

    it('form can be submitted with Enter key', async () => {
      const user = userEvent.setup();
      const dish = createTestDish({ name: 'Original' });
      renderEditDishPage(dish.id);

      const nameInput = screen.getByLabelText('Dish Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Keyboard Update{Enter}');

      // Should have submitted and navigated
      expect(getDishes()[0].name).toBe('Keyboard Update');
      expect(navigatedTo).toBe('/');
    });
  });
});

