/**
 * DishCard Component Tests
 *
 * Tests for the card that displays a single dish with type badge.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DishCard } from '@/components/meals/DishCard';
import { type Dish } from '@/types';

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

describe('DishCard', () => {
  describe('rendering', () => {
    it('renders the dish name', () => {
      const dish = createTestDish({ name: 'Pasta Primavera' });
      render(<DishCard dish={dish} />);

      expect(screen.getByText('Pasta Primavera')).toBeInTheDocument();
    });

    it('renders the type badge by default', () => {
      const dish = createTestDish({ type: 'entree' });
      render(<DishCard dish={dish} />);

      expect(screen.getByText('Entree')).toBeInTheDocument();
    });

    it('renders Side badge for side dishes', () => {
      const dish = createTestDish({ type: 'side' });
      render(<DishCard dish={dish} />);

      expect(screen.getByText('Side')).toBeInTheDocument();
    });

    it('renders Other badge for other type', () => {
      const dish = createTestDish({ type: 'other' });
      render(<DishCard dish={dish} />);

      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('does not render badge when showType is false', () => {
      const dish = createTestDish({ type: 'entree' });
      render(<DishCard dish={dish} showType={false} />);

      expect(screen.queryByText('Entree')).not.toBeInTheDocument();
    });
  });

  describe('badge styling', () => {
    it('uses warm colors for entree badge', () => {
      const dish = createTestDish({ type: 'entree' });
      render(<DishCard dish={dish} />);

      const badge = screen.getByText('Entree');
      // Uses design system CSS variables via inline styles
      expect(badge.style.backgroundColor).toBe('var(--color-entree-bg)');
      expect(badge.style.color).toBe('rgb(146, 64, 14)'); // #92400E
    });

    it('uses green colors for side badge', () => {
      const dish = createTestDish({ type: 'side' });
      render(<DishCard dish={dish} />);

      const badge = screen.getByText('Side');
      // Uses design system CSS variables via inline styles
      expect(badge.style.backgroundColor).toBe('var(--color-side-bg)');
      expect(badge.style.color).toBe('rgb(22, 101, 52)'); // #166534
    });

    it('uses muted colors for other badge', () => {
      const dish = createTestDish({ type: 'other' });
      render(<DishCard dish={dish} />);

      const badge = screen.getByText('Other');
      // Uses design system CSS variables via inline styles
      expect(badge.style.backgroundColor).toBe('var(--color-bg-muted)');
      expect(badge.style.color).toBe('var(--color-text-muted)');
    });
  });

  describe('interaction', () => {
    it('renders as a button when onClick is provided', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} onClick={() => {}} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders as a div when onClick is not provided', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      const dish = createTestDish();

      render(<DishCard dish={dish} onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has aria-label with dish name and type', () => {
      const dish = createTestDish({ name: 'Roasted Vegetables', type: 'side' });
      render(<DishCard dish={dish} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Roasted Vegetables, Side'
      );
    });
  });

  describe('selected state', () => {
    it('shows selected styling when selected is true', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} selected />);

      const card = screen.getByText(dish.name).closest('div');
      // Uses design system accent color for selected state border
      expect(card?.style.borderColor).toBe('var(--color-accent)');
    });

    it('shows default styling when selected is false', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} selected={false} />);

      const card = screen.getByText(dish.name).closest('div');
      // Unselected cards have transparent border
      expect(card?.style.borderColor).toBe('transparent');
    });
  });

  describe('compact mode', () => {
    it('uses smaller padding in compact mode', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} compact />);

      const card = screen.getByText(dish.name).closest('div');
      expect(card).toHaveClass('px-3', 'py-2');
    });

    it('uses larger padding in normal mode', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} compact={false} />);

      const card = screen.getByText(dish.name).closest('div');
      expect(card).toHaveClass('px-4', 'py-3');
    });

    it('uses smaller text in compact mode', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} compact />);

      expect(screen.getByText(dish.name)).toHaveClass('text-sm');
    });

    it('uses base text in normal mode', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} compact={false} />);

      expect(screen.getByText(dish.name)).toHaveClass('text-base');
    });
  });

  describe('long name handling', () => {
    it('has truncate class for text overflow', () => {
      const dish = createTestDish({
        name: 'This is a very long dish name that should be truncated with ellipsis',
      });
      render(<DishCard dish={dish} />);

      expect(screen.getByText(dish.name)).toHaveClass('truncate');
    });
  });

  describe('touch targets', () => {
    it('has minimum 44px height for touch accessibility', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveClass('min-h-[44px]');
    });

    it('has minimum 44px height even in non-interactive mode', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} />);

      const card = screen.getByText(dish.name).closest('div');
      expect(card).toHaveClass('min-h-[44px]');
    });
  });

  describe('accessibility', () => {
    it('button has type="button" to prevent form submission', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('is keyboard accessible when interactive', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      const dish = createTestDish();

      render(<DishCard dish={dish} onClick={handleClick} />);

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be activated with Space key', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      const dish = createTestDish();

      render(<DishCard dish={dish} onClick={handleClick} />);

      await user.tab();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('interactive styling', () => {
    it('has cursor-pointer when interactive', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveClass('cursor-pointer');
    });

    it('has active scale for tap feedback', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} onClick={() => {}} />);

      expect(screen.getByRole('button')).toHaveClass('active:scale-[0.98]');
    });
  });

  describe('recipe URL icons', () => {
    it('does not render icons when dish has no recipe URLs', () => {
      const dish = createTestDish();
      render(<DishCard dish={dish} />);

      expect(screen.queryByRole('button', { name: /Open recipe/i })).not.toBeInTheDocument();
    });

    it('renders icon for each recipe URL', () => {
      const dish = createTestDish({
        recipeUrls: ['https://instagram.com/post/123', 'https://youtube.com/watch?v=abc'],
      });
      render(<DishCard dish={dish} />);

      expect(screen.getByRole('button', { name: 'Open recipe on instagram.com' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Open recipe on youtube.com' })).toBeInTheDocument();
    });

    it('opens URL in new tab when icon is clicked', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      const dish = createTestDish({
        recipeUrls: ['https://instagram.com/post/123'],
      });
      render(<DishCard dish={dish} onClick={() => {}} />);

      await user.click(screen.getByRole('button', { name: 'Open recipe on instagram.com' }));

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://instagram.com/post/123',
        '_blank',
        'noopener,noreferrer'
      );
      
      windowOpenSpy.mockRestore();
    });

    it('does not trigger card onClick when icon is clicked', async () => {
      const user = userEvent.setup();
      const handleCardClick = vi.fn();
      vi.spyOn(window, 'open').mockImplementation(() => null);
      
      const dish = createTestDish({
        recipeUrls: ['https://instagram.com/post/123'],
      });
      render(<DishCard dish={dish} onClick={handleCardClick} />);

      await user.click(screen.getByRole('button', { name: 'Open recipe on instagram.com' }));

      expect(handleCardClick).not.toHaveBeenCalled();
    });

    it('hides icons when showRecipeIcons is false', () => {
      const dish = createTestDish({
        recipeUrls: ['https://instagram.com/post/123'],
      });
      render(<DishCard dish={dish} showRecipeIcons={false} />);

      expect(screen.queryByRole('button', { name: /Open recipe/i })).not.toBeInTheDocument();
    });

    it('shows icons by default when showRecipeIcons is not specified', () => {
      const dish = createTestDish({
        recipeUrls: ['https://instagram.com/post/123'],
      });
      render(<DishCard dish={dish} />);

      expect(screen.getByRole('button', { name: 'Open recipe on instagram.com' })).toBeInTheDocument();
    });
  });
});

