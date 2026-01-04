/**
 * Tests for ConflictResolver component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConflictResolver } from '../../../src/components/sync/ConflictResolver';
import type { ConflictRecord, Dish, MealPlan } from '../../../src/lib/db';

// Helper to create test conflicts
const createDishConflict = (
  id: string,
  localName: string,
  serverName: string
): ConflictRecord => ({
  id,
  entityType: 'dish',
  entityId: id,
  localVersion: {
    id,
    householdId: 'household-1',
    name: localName,
    type: 'entree',
    addedBy: 'user-1',
    createdAt: '2024-12-28T00:00:00Z',
    updatedAt: '2024-12-28T01:00:00Z',
  } as Dish,
  serverVersion: {
    id,
    householdId: 'household-1',
    name: serverName,
    type: 'entree',
    addedBy: 'user-2',
    createdAt: '2024-12-28T00:00:00Z',
    updatedAt: '2024-12-28T02:00:00Z',
  } as Dish,
  detectedAt: '2024-12-28T03:00:00Z',
});

const createPlanConflict = (
  id: string,
  localName: string,
  serverName: string
): ConflictRecord => ({
  id,
  entityType: 'mealPlan',
  entityId: id,
  localVersion: {
    id,
    householdId: 'household-1',
    name: localName,
    startDate: '2024-12-28',
    days: [{ date: '2024-12-28', dishIds: ['dish-1'] }],
    createdBy: 'user-1',
    createdAt: '2024-12-28T00:00:00Z',
    updatedAt: '2024-12-28T01:00:00Z',
  } as MealPlan,
  serverVersion: {
    id,
    householdId: 'household-1',
    name: serverName,
    startDate: '2024-12-28',
    days: [{ date: '2024-12-28', dishIds: ['dish-2', 'dish-3'] }],
    createdBy: 'user-2',
    createdAt: '2024-12-28T00:00:00Z',
    updatedAt: '2024-12-28T02:00:00Z',
  } as MealPlan,
  detectedAt: '2024-12-28T03:00:00Z',
});

describe('ConflictResolver', () => {
  const mockOnResolve = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when there are no conflicts', () => {
      const { container } = render(
        <ConflictResolver
          conflicts={[]}
          onResolve={mockOnResolve}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders the dialog when there are conflicts', () => {
      const conflicts = [createDishConflict('dish-1', 'Local Dish', 'Server Dish')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Resolve Conflicts')).toBeInTheDocument();
    });

    it('shows correct count in header', () => {
      const conflicts = [
        createDishConflict('dish-1', 'Local 1', 'Server 1'),
        createDishConflict('dish-2', 'Local 2', 'Server 2'),
      ];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      expect(screen.getByText(/2 items? need/)).toBeInTheDocument();
    });

    it('shows singular "item" for one conflict', () => {
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      expect(screen.getByText(/1 item needs/)).toBeInTheDocument();
    });
  });

  describe('dish conflicts', () => {
    it('displays dish conflict with side-by-side comparison', () => {
      const conflicts = [createDishConflict('dish-1', 'My Chicken', 'Their Chicken')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      // The card title shows the local name (My Chicken)
      expect(screen.getByRole('heading', { name: 'My Chicken' })).toBeInTheDocument();
      // Both versions appear in the comparison (local and server)
      expect(screen.getAllByText('My Chicken').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Their Chicken').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Your Changes')).toBeInTheDocument();
      expect(screen.getByText('Other Changes')).toBeInTheDocument();
    });

    it('shows "Dish was edited in two places" for dishes', () => {
      const conflicts = [createDishConflict('dish-1', 'My Dish', 'Their Dish')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      expect(screen.getByText('Dish was edited in two places')).toBeInTheDocument();
    });
  });

  describe('meal plan conflicts', () => {
    it('displays meal plan conflict with comparison', () => {
      const conflicts = [createPlanConflict('plan-1', 'My Week', 'Their Week')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      // The card title shows the local name
      expect(screen.getByRole('heading', { name: 'My Week' })).toBeInTheDocument();
      // Both versions appear in the comparison
      expect(screen.getAllByText('My Week').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Their Week').length).toBeGreaterThanOrEqual(1);
    });

    it('shows days count in comparison', () => {
      const conflicts = [createPlanConflict('plan-1', 'Week Plan', 'Week Plan Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      // Both local and server have 1 day, so we should find it in the comparison
      expect(screen.getAllByText('1 day').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('resolution actions', () => {
    it('calls onResolve with "local" when "Keep Mine" is clicked', async () => {
      mockOnResolve.mockResolvedValue(undefined);
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      const keepMineButton = screen.getByRole('button', { name: /keep mine/i });
      fireEvent.click(keepMineButton);

      await waitFor(() => {
        expect(mockOnResolve).toHaveBeenCalledWith('dish-1', 'local');
      });
    });

    it('calls onResolve with "server" when "Keep Theirs" is clicked', async () => {
      mockOnResolve.mockResolvedValue(undefined);
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      const keepTheirsButton = screen.getByRole('button', { name: /keep theirs/i });
      fireEvent.click(keepTheirsButton);

      await waitFor(() => {
        expect(mockOnResolve).toHaveBeenCalledWith('dish-1', 'server');
      });
    });

    it('disables buttons while resolving', async () => {
      // Make onResolve take time
      mockOnResolve.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      const keepMineButton = screen.getByRole('button', { name: /keep mine/i });
      fireEvent.click(keepMineButton);

      // Buttons should be disabled during resolution
      await waitFor(() => {
        expect(keepMineButton).toBeDisabled();
      });
    });
  });

  describe('close button', () => {
    it('renders close button when onClose is provided', () => {
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('does not render close button when onClose is not provided', () => {
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('multiple conflicts', () => {
    it('renders all conflicts in a list', () => {
      const conflicts = [
        createDishConflict('dish-1', 'Unique Dish Alpha', 'Server Alpha'),
        createDishConflict('dish-2', 'Unique Dish Beta', 'Server Beta'),
        createPlanConflict('plan-1', 'Unique Plan Gamma', 'Server Gamma'),
      ];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      // Each dish name appears in the card header (h3)
      expect(screen.getByRole('heading', { name: 'Unique Dish Alpha' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Unique Dish Beta' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Unique Plan Gamma' })).toBeInTheDocument();
    });

    it('each conflict has its own resolution buttons', () => {
      const conflicts = [
        createDishConflict('dish-1', 'Dish 1', 'Dish 1 Server'),
        createDishConflict('dish-2', 'Dish 2', 'Dish 2 Server'),
      ];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      // Should have 2 "Keep Mine" buttons (one per conflict)
      const keepMineButtons = screen.getAllByRole('button', { name: /keep mine/i });
      expect(keepMineButtons).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('has proper dialog role and aria attributes', () => {
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'conflict-title');
    });

    it('has accessible heading', () => {
      const conflicts = [createDishConflict('dish-1', 'Local', 'Server')];

      render(
        <ConflictResolver
          conflicts={conflicts}
          onResolve={mockOnResolve}
        />
      );

      const heading = screen.getByRole('heading', { name: 'Resolve Conflicts' });
      expect(heading).toHaveAttribute('id', 'conflict-title');
    });
  });
});
