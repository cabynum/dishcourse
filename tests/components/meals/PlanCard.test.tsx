/**
 * PlanCard Component Tests
 *
 * Tests for the card that displays a meal plan summary.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanCard } from '@/components/meals/PlanCard';
import { type MealPlan, type Dish } from '@/types';

/**
 * Factory for creating test meal plans
 */
function createTestPlan(overrides: Partial<MealPlan> = {}): MealPlan {
  return {
    id: 'test-plan-1',
    name: 'Meal Plan',
    startDate: '2024-12-16',
    days: [
      { date: '2024-12-16', dishIds: ['dish-1', 'dish-2'] },
      { date: '2024-12-17', dishIds: [] },
      { date: '2024-12-18', dishIds: ['dish-3'] },
      { date: '2024-12-19', dishIds: [] },
      { date: '2024-12-20', dishIds: [] },
      { date: '2024-12-21', dishIds: [] },
      { date: '2024-12-22', dishIds: [] },
    ],
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-15T10:30:00Z',
    ...overrides,
  };
}

/**
 * Factory for creating test dishes
 */
function createTestDish(overrides: Partial<Dish> = {}): Dish {
  return {
    id: 'test-dish-1',
    name: 'Grilled Chicken',
    type: 'entree',
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-15T10:30:00Z',
    ...overrides,
  };
}

const testDishes: Dish[] = [
  createTestDish({ id: 'dish-1', name: 'Chicken' }),
  createTestDish({ id: 'dish-2', name: 'Rice', type: 'side' }),
  createTestDish({ id: 'dish-3', name: 'Pasta' }),
];

describe('PlanCard', () => {
  // Mock Date to a fixed value for consistent testing
  const realDate = Date;

  beforeEach(() => {
    // Mock to Dec 17, 2024
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the plan name', () => {
      const plan = createTestPlan({ name: 'This Week' });
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.getByText('This Week')).toBeInTheDocument();
    });

    it('renders the calendar emoji', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.getByText('📅')).toBeInTheDocument();
    });

    it('renders the date range', () => {
      const plan = createTestPlan({
        startDate: '2024-12-16',
        days: [
          { date: '2024-12-16', dishIds: [] },
          { date: '2024-12-17', dishIds: [] },
          { date: '2024-12-18', dishIds: [] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.getByText('Dec 16 – Dec 18')).toBeInTheDocument();
    });

    it('renders the progress (days planned)', () => {
      const plan = createTestPlan({
        days: [
          { date: '2024-12-16', dishIds: ['dish-1'] },
          { date: '2024-12-17', dishIds: [] },
          { date: '2024-12-18', dishIds: ['dish-2'] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.getByText('2/3 days')).toBeInTheDocument();
    });

    it('renders dish count when dishes are assigned', () => {
      const plan = createTestPlan({
        days: [
          { date: '2024-12-16', dishIds: ['dish-1', 'dish-2'] },
          { date: '2024-12-17', dishIds: ['dish-3'] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.getByText('3 dishes')).toBeInTheDocument();
    });

    it('uses singular "dish" when only one dish assigned', () => {
      const plan = createTestPlan({
        days: [{ date: '2024-12-16', dishIds: ['dish-1'] }],
      });
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.getByText('1 dish')).toBeInTheDocument();
    });

    it('does not show dish count when no dishes assigned', () => {
      const plan = createTestPlan({
        days: [
          { date: '2024-12-16', dishIds: [] },
          { date: '2024-12-17', dishIds: [] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.queryByText(/dish/)).not.toBeInTheDocument();
    });
  });

  describe('current plan highlighting', () => {
    it('shows Active badge when isCurrent and includes today', () => {
      const plan = createTestPlan({
        startDate: '2024-12-16',
        days: [
          { date: '2024-12-16', dishIds: [] },
          { date: '2024-12-17', dishIds: [] }, // Today (mocked)
          { date: '2024-12-18', dishIds: [] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} isCurrent />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('does not show Active badge when isCurrent but plan does not include today', () => {
      const plan = createTestPlan({
        startDate: '2024-12-20', // After mocked "today" (Dec 17)
        days: [
          { date: '2024-12-20', dishIds: [] },
          { date: '2024-12-21', dishIds: [] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} isCurrent />);

      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('does not show Active badge when not isCurrent', () => {
      const plan = createTestPlan({
        startDate: '2024-12-16',
        days: [
          { date: '2024-12-16', dishIds: [] },
          { date: '2024-12-17', dishIds: [] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} isCurrent={false} />);

      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('uses amber styling when isCurrent', () => {
      const plan = createTestPlan();
      const { container } = render(<PlanCard plan={plan} dishes={testDishes} isCurrent />);

      // The outermost element is the card container
      expect(container.firstChild).toHaveClass('border-amber-400');
    });

    it('uses default styling when not isCurrent', () => {
      const plan = createTestPlan();
      const { container } = render(<PlanCard plan={plan} dishes={testDishes} isCurrent={false} />);

      expect(container.firstChild).toHaveClass('border-stone-200');
    });
  });

  describe('interaction', () => {
    it('renders as a button when onClick is provided', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} onClick={() => {}} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders as a div when onClick is not provided', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      // Use real timers for this interaction test
      vi.useRealTimers();

      const handleClick = vi.fn();
      const user = userEvent.setup();
      const plan = createTestPlan();

      render(<PlanCard plan={plan} dishes={testDishes} onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Restore fake timers for subsequent tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-12-17T12:00:00Z'));
    });

    it('shows arrow icon when interactive', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} onClick={() => {}} />);

      // Arrow is an SVG with path "M9 18l6-6-6-6"
      const arrows = screen.getByRole('button').querySelectorAll('svg');
      expect(arrows.length).toBeGreaterThan(0);
    });

    it('does not show arrow when not interactive', () => {
      const plan = createTestPlan();
      const { container } = render(<PlanCard plan={plan} dishes={testDishes} />);

      // Should only have the calendar emoji, no navigation arrow
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('has descriptive aria-label when interactive', () => {
      const plan = createTestPlan({
        name: 'This Week',
        startDate: '2024-12-16',
        days: [
          { date: '2024-12-16', dishIds: ['dish-1'] },
          { date: '2024-12-17', dishIds: [] },
          { date: '2024-12-18', dishIds: [] },
        ],
      });
      render(<PlanCard plan={plan} dishes={testDishes} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('This Week');
      expect(button.getAttribute('aria-label')).toContain('Dec 16');
      expect(button.getAttribute('aria-label')).toContain('1 of 3 days planned');
    });

    it('button has type="button" to prevent form submission', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('is keyboard accessible when interactive', async () => {
      // Use real timers for interaction tests
      vi.useRealTimers();

      const handleClick = vi.fn();
      const user = userEvent.setup();
      const plan = createTestPlan();

      render(<PlanCard plan={plan} dishes={testDishes} onClick={handleClick} />);

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Restore fake timers
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-12-17T12:00:00Z'));
    });

    it('can be activated with Space key', async () => {
      // Use real timers for interaction tests
      vi.useRealTimers();

      const handleClick = vi.fn();
      const user = userEvent.setup();
      const plan = createTestPlan();

      render(<PlanCard plan={plan} dishes={testDishes} onClick={handleClick} />);

      await user.tab();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Restore fake timers
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-12-17T12:00:00Z'));
    });
  });

  describe('touch targets', () => {
    it('has minimum 72px height for touch accessibility', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveClass('min-h-[72px]');
    });

    it('has minimum height even in non-interactive mode', () => {
      const plan = createTestPlan();
      const { container } = render(<PlanCard plan={plan} dishes={testDishes} />);

      const card = container.firstChild;
      expect(card).toHaveClass('min-h-[72px]');
    });
  });

  describe('interactive styling', () => {
    it('has cursor-pointer when interactive', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveClass('cursor-pointer');
    });

    it('has active scale for tap feedback', () => {
      const plan = createTestPlan();
      render(<PlanCard plan={plan} dishes={testDishes} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveClass('active:scale-[0.98]');
    });
  });
});

