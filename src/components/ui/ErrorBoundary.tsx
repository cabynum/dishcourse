/**
 * ErrorBoundary - Catches JavaScript errors in child components.
 *
 * Displays a friendly error message when something goes wrong,
 * preventing the entire app from crashing.
 *
 * Following Constitution principle I: User-First Simplicity
 * - Uses plain language, not technical jargon
 * - Provides a clear path forward (retry or go home)
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from './Button';

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;

  /** Optional custom fallback UI */
  fallback?: ReactNode;

  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;

  /** The error that was caught */
  error: Error | null;
}

/**
 * Alert triangle icon for error state
 */
function AlertIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-amber-500"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Default error fallback UI.
 * Shows a friendly message and options to retry or go home.
 */
function DefaultFallback({
  onRetry,
  onGoHome,
}: {
  onRetry: () => void;
  onGoHome: () => void;
}) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertIcon />
        </div>

        <h1 className="text-xl font-bold text-stone-900 mb-2">
          Something went wrong
        </h1>

        <p className="text-stone-600 mb-6">
          We hit an unexpected snag. Your data is safe — try refreshing the
          page or head back home.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onGoHome}>
            Go Home
          </Button>
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        </div>

        <p className="text-xs text-stone-500 mt-6">
          If this keeps happening, try exporting your data from Settings.
        </p>
      </div>
    </div>
  );
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error is caught during rendering.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error information for debugging.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for debugging (v1 - no external logging)
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Reset error state to retry rendering children.
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  /**
   * Navigate to home page.
   */
  handleGoHome = (): void => {
    // Reset state and navigate to home
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise use default fallback
      return (
        <DefaultFallback
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

