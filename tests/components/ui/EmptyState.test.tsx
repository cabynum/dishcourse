/**
 * EmptyState Component Tests
 *
 * Tests for the EmptyState UI primitive component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(
        <EmptyState title="No dishes yet" message="Add your first dish." />
      );

      expect(
        screen.getByRole('heading', { name: 'No dishes yet' })
      ).toBeInTheDocument();
    });

    it('renders message', () => {
      render(
        <EmptyState title="No dishes yet" message="Add your first dish." />
      );

      expect(screen.getByText('Add your first dish.')).toBeInTheDocument();
    });

    it('renders title as h3', () => {
      render(
        <EmptyState title="No dishes yet" message="Add your first dish." />
      );

      const heading = screen.getByRole('heading', { name: 'No dishes yet' });
      expect(heading.tagName).toBe('H3');
    });
  });

  describe('icon', () => {
    it('does not render icon area when no icon provided', () => {
      render(
        <EmptyState title="No dishes" message="Add a dish." />
      );

      // No element with aria-hidden for icon
      expect(document.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <EmptyState
          icon={<span data-testid="test-icon">🍽️</span>}
          title="No dishes"
          message="Add a dish."
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('icon container has aria-hidden for accessibility', () => {
      render(
        <EmptyState
          icon={<span>🍽️</span>}
          title="No dishes"
          message="Add a dish."
        />
      );

      const iconContainer = document.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('action button', () => {
    it('does not render button when no action provided', () => {
      render(
        <EmptyState title="No dishes" message="Add a dish." />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders action button when action is provided', () => {
      render(
        <EmptyState
          title="No dishes"
          message="Add a dish."
          action={{ label: 'Add Dish', onClick: () => {} }}
        />
      );

      expect(screen.getByRole('button', { name: 'Add Dish' })).toBeInTheDocument();
    });

    it('calls action onClick when button is clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          title="No dishes"
          message="Add a dish."
          action={{ label: 'Add Dish', onClick: handleClick }}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Dish' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders button with primary variant', () => {
      render(
        <EmptyState
          title="No dishes"
          message="Add a dish."
          action={{ label: 'Add Dish', onClick: () => {} }}
        />
      );

      // Primary buttons use btn-primary class with design system styles
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });
  });

  describe('styling', () => {
    it('centers content', () => {
      render(
        <EmptyState title="No dishes" message="Add a dish." />
      );

      const container = screen.getByRole('heading').parentElement;
      expect(container).toHaveClass('text-center');
      expect(container).toHaveClass('items-center');
    });

    it('has vertical padding for visual breathing room', () => {
      render(
        <EmptyState title="No dishes" message="Add a dish." />
      );

      const container = screen.getByRole('heading').parentElement;
      expect(container).toHaveClass('py-12');
    });
  });

  describe('accessibility', () => {
    it('action button can receive focus', async () => {
      const user = userEvent.setup();

      render(
        <EmptyState
          title="No dishes"
          message="Add a dish."
          action={{ label: 'Add Dish', onClick: () => {} }}
        />
      );

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('action button can be activated with keyboard', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          title="No dishes"
          message="Add a dish."
          action={{ label: 'Add Dish', onClick: handleClick }}
        />
      );

      await user.tab();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

