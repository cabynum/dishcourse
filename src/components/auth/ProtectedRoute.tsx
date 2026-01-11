/**
 * ProtectedRoute Component
 *
 * A wrapper that protects routes requiring authentication.
 * Redirects unauthenticated users to the auth page.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * <Route
 *   path="/household"
 *   element={
 *     <ProtectedRoute>
 *       <HouseholdPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */

import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthContext';

export interface ProtectedRouteProps {
  /** The protected content to render when authenticated */
  children: ReactNode;
  /** Also require household membership (for future use) */
  requireHousehold?: boolean;
}

/**
 * ProtectedRoute - Ensures user is authenticated before rendering children.
 *
 * Features:
 * - Redirects to /auth if not authenticated
 * - Preserves intended destination for redirect after auth
 * - Shows loading state during auth check
 * - Optional household membership requirement (for future use)
 */
export function ProtectedRoute({
  children,
  requireHousehold: _requireHousehold = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center animate-pulse"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <img
              src="/mascot.png"
              alt="DishCourse mascot"
              className="w-12 h-12 object-contain"
            />
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    // Save the current location so we can redirect back after auth
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirectTo=${redirectTo}`} replace />;
  }

  // TODO: Add household check when household feature is implemented
  // if (requireHousehold && !currentHousehold) {
  //   return <Navigate to="/household/create" replace />;
  // }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
