/**
 * AuthPage - Authentication page for sign in and sign up.
 *
 * Features:
 * - Magic link authentication (passwordless)
 * - Handles verification callback from email link
 * - Redirects to home or intended page after successful auth
 * - Display name input for new users (signup mode)
 *
 * Routes:
 * - /auth - Sign in or sign up
 * - /auth/verify - Magic link callback (auto-redirects after verification)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MagicLinkForm } from '@/components/auth';
import { useAuthContext } from '@/components/auth';
import { Button, Input } from '@/components/ui';

/**
 * Gets the greeting based on time of day
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { profile, isLoading, isAuthenticated, signIn, updateProfile } = useAuthContext();

  // Track if we're on the verification callback route
  const isVerifyRoute = location.pathname === '/auth/verify';

  // Track if magic link was successfully sent (used by MagicLinkForm)
  const [, setMagicLinkSent] = useState(false);

  // Display name for new users
  const [displayName, setDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [isSettingName, setIsSettingName] = useState(false);

  // Check if this is a new user who needs to set their display name
  const needsDisplayName = isAuthenticated && profile && !profile.displayName;

  // Get redirect destination (from query param or default to home)
  const redirectTo = searchParams.get('redirectTo') || '/';

  // Redirect if already authenticated (and doesn't need display name)
  useEffect(() => {
    if (isAuthenticated && profile && profile.displayName && !isVerifyRoute) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, profile, navigate, redirectTo, isVerifyRoute]);

  // Handle verification route — Supabase handles the token extraction automatically
  // The auth state change listener will update the user state
  useEffect(() => {
    if (isVerifyRoute && isAuthenticated && profile) {
      // Successfully verified, redirect
      if (profile.displayName) {
        navigate(redirectTo, { replace: true });
      }
      // If no display name, they'll see the set name form
    }
  }, [isVerifyRoute, isAuthenticated, profile, navigate, redirectTo]);

  /**
   * Handle setting display name for new users
   */
  async function handleSetDisplayName() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setDisplayNameError('Please enter your name.');
      return;
    }
    if (trimmedName.length > 50) {
      setDisplayNameError('Name must be 50 characters or less.');
      return;
    }

    setDisplayNameError(null);
    setIsSettingName(true);

    try {
      await updateProfile({ displayName: trimmedName });
      navigate(redirectTo, { replace: true });
    } catch {
      setDisplayNameError('Unable to save your name. Please try again.');
    } finally {
      setIsSettingName(false);
    }
  }

  /**
   * Handle magic link form success
   */
  function handleMagicLinkSuccess() {
    setMagicLinkSent(true);
  }

  /**
   * Handle back navigation
   */
  function handleBack() {
    navigate(-1);
  }

  // Loading state
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
          <p style={{ color: 'var(--color-text-muted)' }}>
            {isVerifyRoute ? 'Verifying your sign-in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Display name setup for new users
  if (needsDisplayName || (isAuthenticated && !profile?.displayName)) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-10 px-4 py-3"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <div className="max-w-lg mx-auto">
            <h1 className="text-lg font-semibold text-white text-center">
              Welcome to DishCourse
            </h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            {/* Mascot */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                <img
                  src="/mascot.png"
                  alt="DishCourse mascot"
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>

            <h2
              className="text-xl font-semibold text-center mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
              }}
            >
              What should we call you?
            </h2>

            <p
              className="text-center mb-6"
              style={{ color: 'var(--color-text-muted)' }}
            >
              This name will be visible to your household members.
            </p>

            <div className="space-y-4">
              <Input
                label="Your name"
                value={displayName}
                onChange={setDisplayName}
                placeholder="e.g., Alex"
                autoFocus
                error={displayNameError ?? undefined}
              />

              <Button
                variant="primary"
                fullWidth
                onClick={handleSetDisplayName}
                loading={isSettingName}
                disabled={isSettingName}
              >
                Continue
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main auth form
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="max-w-lg mx-auto flex items-center">
          <button
            type="button"
            onClick={handleBack}
            className={[
              'p-2 -ml-2 rounded-lg',
              'text-white/80 hover:text-white hover:bg-white/10',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
            ].join(' ')}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-white ml-2">
            Sign In
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          {/* Mascot and greeting */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <img
                src="/mascot.png"
                alt="DishCourse mascot"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          <h2
            className="text-xl font-semibold text-center mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            {getGreeting()}! 👋
          </h2>

          <p
            className="text-center mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Sign in to sync your dishes across devices and share with your household.
          </p>

          {/* Magic Link Form */}
          <MagicLinkForm
            mode="signin"
            sendMagicLink={signIn}
            onSuccess={handleMagicLinkSuccess}
          />
        </div>

        {/* Privacy note */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: 'var(--color-text-light)' }}
        >
          We respect your privacy. Your email is only used for signing in.
        </p>
      </main>
    </div>
  );
}
