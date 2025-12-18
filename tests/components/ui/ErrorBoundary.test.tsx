/**
 * Tests for ErrorBoundary component.
 *
 * Verifies the component:
 * - Renders children when there's no error
 * - Catches errors and displays fallback UI
 * - Shows user-friendly error messages
 * - Provides retry and go home options
 * - Calls onError callback when provided
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui';

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Component that renders successfully
function GoodComponent() {
  return <div>Good component</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error during tests since we expect errors
  const originalError = console.error;
  
  beforeEach(() => {
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalError;
  });

  describe('rendering children', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <GoodComponent />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Good component')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('catching errors', () => {
    it('catches errors and shows fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Should show error message, not the throwing component
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });

    it('shows user-friendly error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/unexpected snag/i)).toBeInTheDocument();
      expect(screen.getByText(/your data is safe/i)).toBeInTheDocument();
    });

    it('logs error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error)
      );
    });
  });

  describe('recovery actions', () => {
    it('shows Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('shows Go Home button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });

    it('resets error state when Try Again is clicked', () => {
      // Use a component that can toggle throwing
      let shouldThrow = true;
      function ToggleThrow() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered</div>;
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleThrow />
        </ErrorBoundary>
      );
      
      // Should show error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Stop throwing and click retry
      shouldThrow = false;
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      
      // Force rerender to pick up new component behavior
      rerender(
        <ErrorBoundary>
          <ToggleThrow />
        </ErrorBoundary>
      );
      
      // Should show recovered content
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('onError callback', () => {
    it('calls onError when an error is caught', () => {
      const onError = vi.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('does not call onError when there is no error', () => {
      const onError = vi.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <GoodComponent />
        </ErrorBoundary>
      );
      
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('helpful hints', () => {
    it('mentions exporting data as a recovery option', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/export.*data.*settings/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has a heading for the error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    });

    it('has focusable recovery buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      
      expect(tryAgainButton).not.toHaveAttribute('tabindex', '-1');
      expect(goHomeButton).not.toHaveAttribute('tabindex', '-1');
    });
  });
});

