/**
 * JoinPage - Accept an invite and join a household.
 *
 * This page handles the invite link flow:
 * 1. Validates the invite code from the URL
 * 2. Shows the household being joined
 * 3. Redirects to auth if not logged in
 * 4. Adds the user to the household
 * 5. Offers to migrate local dishes
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle, Utensils } from 'lucide-react';
import { Button } from '@/components/ui';
import { useInvite, useHousehold } from '@/hooks';
import { useAuthContext } from '@/components/auth';
import { getLocalDishCount, migrateLocalDishes } from '@/services/sync';
import { getUserFriendlyError } from '@/utils';
import type { Household, InviteValidation } from '@/types';

export function JoinPage() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const { validateCode, joinWithCode, isLoading: inviteLoading } = useInvite();
  const { refresh: refreshHouseholds } = useHousehold();

  const [validation, setValidation] = useState<InviteValidation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinedHousehold, setJoinedHousehold] = useState<Household | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [migrateDishes, setMigrateDishes] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  
  // Check for local dishes
  const localDishCount = getLocalDishCount();
  const hasLocalDishes = localDishCount > 0;

  // Validate the invite code on mount
  useEffect(() => {
    if (!code) {
      setError('No invite code provided.');
      setIsValidating(false);
      return;
    }

    async function validate() {
      if (!code) return;
      try {
        const result = await validateCode(code);
        setValidation(result);
      } catch (err) {
        setError('Unable to validate invite. Please try again.');
      } finally {
        setIsValidating(false);
      }
    }

    validate();
  }, [code, validateCode]);

  /**
   * Handle join button click
   */
  async function handleJoin() {
    if (!code || !isAuthenticated || !user) return;

    setIsJoining(true);
    setError(null);

    try {
      const household = await joinWithCode(code);
      
      // Migrate local dishes if user opted in
      if (hasLocalDishes && migrateDishes) {
        setIsMigrating(true);
        const result = await migrateLocalDishes(household.id, user.id);
        if (!result.success) {
          console.error('Migration failed:', result.error);
          // Continue anyway - dishes are still in localStorage
        }
        setIsMigrating(false);
      }
      
      setJoinedHousehold(household);
      // Refresh household list in background
      refreshHouseholds();
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsJoining(false);
    }
  }

  /**
   * Handle sign in redirect
   */
  function handleSignIn() {
    // Redirect to auth with return URL
    const returnUrl = encodeURIComponent(`/join/${code}`);
    navigate(`/auth?redirectTo=${returnUrl}`);
  }

  /**
   * Navigate to home after successful join
   */
  function handleContinue() {
    navigate('/', { replace: true });
  }

  const isLoading = authLoading || isValidating || inviteLoading || isMigrating;

  // Loading state
  if (isLoading && !validation && !joinedHousehold) {
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
            <Users size={32} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Checking invite...
          </p>
        </div>
      </div>
    );
  }

  // Success state - just joined
  if (joinedHousehold) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-6 text-center shadow-sm"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            <CheckCircle size={32} className="text-white" />
          </div>

          <h1
            className="text-2xl font-semibold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            Welcome!
          </h1>

          <p
            className="mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            You've joined <strong>{joinedHousehold.name}</strong>. You can now
            see and add dishes, and collaborate on meal plans with your household.
          </p>

          <Button variant="primary" fullWidth onClick={handleContinue}>
            Continue to DishCourse
          </Button>
        </div>
      </div>
    );
  }

  // Invalid invite state
  if (validation && !validation.valid) {
    let title = 'Invalid Invite';
    let message = 'This invite link is not valid.';

    switch (validation.reason) {
      case 'expired':
        title = 'Invite Expired';
        message = 'This invite has expired. Please ask for a new one.';
        break;
      case 'used':
        title = 'Invite Already Used';
        message = 'This invite has already been used by someone else.';
        break;
      case 'not_found':
        title = 'Invite Not Found';
        message = 'We couldn\'t find this invite. Please check the link and try again.';
        break;
    }

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-6 text-center shadow-sm"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            <AlertCircle size={32} className="text-white" />
          </div>

          <h1
            className="text-2xl font-semibold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            {title}
          </h1>

          <p
            className="mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {message}
          </p>

          <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
            Go to DishCourse
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !validation) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-6 text-center shadow-sm"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            <AlertCircle size={32} className="text-white" />
          </div>

          <h1
            className="text-2xl font-semibold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
            }}
          >
            Something Went Wrong
          </h1>

          <p
            className="mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {error}
          </p>

          <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
            Go to DishCourse
          </Button>
        </div>
      </div>
    );
  }

  // Valid invite - show join confirmation
  const household = validation?.household;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-6 text-center shadow-sm"
        style={{ backgroundColor: 'var(--color-card)' }}
      >
        {/* Household icon */}
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <Users size={32} style={{ color: 'var(--color-primary)' }} />
        </div>

        <h1
          className="text-2xl font-semibold mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
          }}
        >
          Join {household?.name}
        </h1>

        <p
          className="mb-6"
          style={{ color: 'var(--color-text-muted)' }}
        >
          You've been invited to join this household on DishCourse.
          You'll be able to share dishes and collaborate on meal plans.
        </p>

        {/* Migration option - show if user has local dishes and is authenticated */}
        {isAuthenticated && hasLocalDishes && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3 text-left"
            style={{ backgroundColor: 'var(--color-bg-muted)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Utensils size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrateDishes}
                  onChange={(e) => setMigrateDishes(e.target.checked)}
                  disabled={isJoining}
                  className="w-5 h-5 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                />
                <span
                  className="font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Bring my {localDishCount} dish{localDishCount !== 1 ? 'es' : ''}
                </span>
              </label>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Add your existing dishes so everyone can see them.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        {isAuthenticated ? (
          <Button
            variant="primary"
            fullWidth
            onClick={handleJoin}
            loading={isJoining || isMigrating}
            disabled={isJoining || isMigrating}
          >
            {isMigrating ? 'Migrating dishes...' : 'Join Household'}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleSignIn}
            >
              Sign In to Join
            </Button>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              You need to sign in before you can join.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
