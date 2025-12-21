/**
 * Button Component Tests
 *
 * Tests for the Button UI primitive component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(
        <Button variant="primary" onClick={() => {}}>
          Click me
        </Button>
      );

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders with default type="button"', () => {
      render(
        <Button variant="primary" onClick={() => {}}>
          Test
        </Button>
      );

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('allows type to be overridden to submit', () => {
      render(
        <Button variant="primary" type="submit" onClick={() => {}}>
          Submit
        </Button>
      );

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('variants', () => {
    it('renders primary variant with correct styles', () => {
      render(
        <Button variant="primary" onClick={() => {}}>
          Primary
        </Button>
      );

      const button = screen.getByRole('button');
      // Uses design system CSS variables via inline styles
      expect(button).toHaveClass('btn-primary');
      expect(button).toHaveStyle({ backgroundColor: 'var(--color-accent)' });
    });

    it('renders secondary variant with correct styles', () => {
      render(
        <Button variant="secondary" onClick={() => {}}>
          Secondary
        </Button>
      );

      const button = screen.getByRole('button');
      // Uses design system CSS variables via inline styles
      expect(button).toHaveClass('btn-secondary');
      expect(button).toHaveStyle({ backgroundColor: 'var(--color-bg-muted)' });
    });

    it('renders ghost variant with correct styles', () => {
      render(
        <Button variant="ghost" onClick={() => {}}>
          Ghost
        </Button>
      );

      const button = screen.getByRole('button');
      // Uses design system CSS variables via inline styles
      expect(button).toHaveClass('btn-ghost');
      // Ghost variant has transparent background
      expect(button.style.backgroundColor).toBe('transparent');
    });
  });

  describe('sizes', () => {
    it('renders medium size by default', () => {
      render(
        <Button variant="primary" onClick={() => {}}>
          Default Size
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-base');
    });

    it('renders small size correctly', () => {
      render(
        <Button variant="primary" size="sm" onClick={() => {}}>
          Small
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm');
    });

    it('renders large size correctly', () => {
      render(
        <Button variant="primary" size="lg" onClick={() => {}}>
          Large
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-lg');
    });

    it('all sizes have minimum 44px touch target', () => {
      const { rerender } = render(
        <Button variant="primary" size="sm" onClick={() => {}}>
          Small
        </Button>
      );
      expect(screen.getByRole('button')).toHaveClass('min-h-[44px]');

      rerender(
        <Button variant="primary" size="md" onClick={() => {}}>
          Medium
        </Button>
      );
      expect(screen.getByRole('button')).toHaveClass('min-h-[44px]');

      rerender(
        <Button variant="primary" size="lg" onClick={() => {}}>
          Large
        </Button>
      );
      expect(screen.getByRole('button')).toHaveClass('min-h-[52px]');
    });
  });

  describe('fullWidth', () => {
    it('does not have full width by default', () => {
      render(
        <Button variant="primary" onClick={() => {}}>
          Normal
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });

    it('applies full width when prop is true', () => {
      render(
        <Button variant="primary" fullWidth onClick={() => {}}>
          Full Width
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('disabled state', () => {
    it('is not disabled by default', () => {
      render(
        <Button variant="primary" onClick={() => {}}>
          Enabled
        </Button>
      );

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(
        <Button variant="primary" disabled onClick={() => {}}>
          Disabled
        </Button>
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button variant="primary" disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      render(
        <Button variant="primary" loading onClick={() => {}}>
          Loading
        </Button>
      );

      // Check for the spinner SVG
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('is disabled when loading', () => {
      render(
        <Button variant="primary" loading onClick={() => {}}>
          Loading
        </Button>
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has aria-busy when loading', () => {
      render(
        <Button variant="primary" loading onClick={() => {}}>
          Loading
        </Button>
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('does not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button variant="primary" loading onClick={handleClick}>
          Loading
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('still shows children text alongside spinner', () => {
      render(
        <Button variant="primary" loading onClick={() => {}}>
          Saving...
        </Button>
      );

      expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button variant="primary" onClick={handleClick}>
          Click me
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('works without onClick prop', () => {
      // Should not throw when rendered without onClick
      expect(() => {
        render(<Button variant="primary">No handler</Button>);
      }).not.toThrow();
    });
  });

  describe('custom className', () => {
    it('merges custom className with default styles', () => {
      render(
        <Button variant="primary" className="custom-class" onClick={() => {}}>
          Custom
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('btn-primary'); // Still has variant styles
    });
  });

  describe('accessibility', () => {
    it('can receive focus', async () => {
      const user = userEvent.setup();

      render(
        <Button variant="primary" onClick={() => {}}>
          Focusable
        </Button>
      );

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('can be activated with keyboard', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button variant="primary" onClick={handleClick}>
          Press Enter
        </Button>
      );

      await user.tab();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be activated with space key', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button variant="primary" onClick={handleClick}>
          Press Space
        </Button>
      );

      await user.tab();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

