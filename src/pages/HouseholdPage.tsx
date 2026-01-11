/**
 * HouseholdPage - Manage household settings and members.
 *
 * This page displays household details, member list, and provides
 * options to invite new members or leave the household.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, LogOut, Settings, Users, Calendar, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { MemberList, InviteModal } from '@/components/households';
import { useHousehold } from '@/hooks';
import { useAuthContext } from '@/components/auth';
import { getUserFriendlyError } from '@/utils';

export function HouseholdPage() {
  const navigate = useNavigate();
  useParams<{ householdId?: string }>(); // Future use: load specific household by ID
  const { user } = useAuthContext();
  const {
    currentHousehold,
    members,
    isLoading,
    isCreator,
    leaveCurrentHousehold,
    removeMember,
    error,
  } = useHousehold();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  /**
   * Handle back navigation
   */
  function handleBack() {
    navigate('/');
  }

  /**
   * Open invite modal
   */
  function handleInviteClick() {
    setShowInviteModal(true);
  }

  /**
   * Close invite modal
   */
  function handleCloseInvite() {
    setShowInviteModal(false);
  }

  /**
   * Show leave confirmation
   */
  function handleLeaveClick() {
    setShowLeaveConfirm(true);
    setLeaveError(null);
  }

  /**
   * Cancel leave
   */
  function handleCancelLeave() {
    setShowLeaveConfirm(false);
  }

  /**
   * Confirm and execute leave
   */
  async function handleConfirmLeave() {
    setIsLeaving(true);
    setLeaveError(null);

    try {
      await leaveCurrentHousehold();
      navigate('/', { replace: true });
    } catch (err) {
      setLeaveError(getUserFriendlyError(err));
    } finally {
      setIsLeaving(false);
    }
  }

  /**
   * Handle member removal
   */
  async function handleRemoveMember(memberId: string) {
    await removeMember(memberId);
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
            className="w-16 h-16 mx-auto rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - prompt to sign in
  if (!user) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
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
              ].join(' ')}
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-white ml-2">
              Share with Family
            </h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            <div className="flex justify-center mb-6">
              <img
                src="/mascot-duo.png"
                alt="Share with family"
                className="w-24 h-24 object-contain"
              />
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
              }}
            >
              Ready to Collaborate?
            </h2>
            <p
              className="mb-6"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Sign in to create a household and share your dishes and meal plans with family members.
            </p>
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/auth?redirectTo=/household')}
            >
              Sign In to Get Started
            </Button>
          </div>

          {/* Benefits */}
          <div
            className="mt-6 rounded-xl p-4"
            style={{ backgroundColor: 'var(--color-bg-muted)' }}
          >
            <h3
              className="font-medium mb-3"
              style={{ color: 'var(--color-text)' }}
            >
              What you can do with a household:
            </h3>
            <ul
              className="text-sm space-y-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <li className="flex items-center gap-3">
                <Users size={20} strokeWidth={1.5} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
                <span>Share your dish collection with family</span>
              </li>
              <li className="flex items-center gap-3">
                <Calendar size={20} strokeWidth={1.5} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
                <span>Collaborate on weekly meal plans</span>
              </li>
              <li className="flex items-center gap-3">
                <Smartphone size={20} strokeWidth={1.5} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
                <span>Sync across all your devices</span>
              </li>
              <li className="flex items-center gap-3">
                <Sparkles size={20} strokeWidth={1.5} style={{ color: 'var(--color-primary)' }} className="flex-shrink-0" />
                <span>Everyone can add and suggest dishes</span>
              </li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // No household state (authenticated user)
  if (!currentHousehold) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
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
              ].join(' ')}
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-white ml-2">
              Household
            </h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-8">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--color-card)' }}
          >
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--color-bg-muted)' }}
            >
              <Settings size={32} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
              }}
            >
              No Household Yet
            </h2>
            <p
              className="mb-6"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Create a household to share dishes and meal plans with your family.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/household/create')}
            >
              Create Household
            </Button>
          </div>

          {/* Already have an invite? */}
          <p
            className="text-center text-sm mt-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Have an invite link? Click it to join an existing household.
          </p>
        </main>
      </div>
    );
  }

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
            ].join(' ')}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-white ml-2">
            {currentHousehold.name}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        {/* Error display */}
        {error && (
          <div
            className="mb-4 p-4 rounded-lg bg-red-50 text-red-600 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Members section */}
        <section
          className="rounded-2xl p-4 shadow-sm"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
              }}
            >
              Members
            </h2>
            <span
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          <MemberList
            members={members}
            currentUserId={user?.id ?? ''}
            isCreator={isCreator}
            onRemoveMember={handleRemoveMember}
          />
        </section>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          {/* Invite button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleInviteClick}
          >
            <UserPlus size={20} />
            Invite Members
          </Button>

          {/* Leave button (not for creator) */}
          {!isCreator && (
            <>
              {showLeaveConfirm ? (
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: 'var(--color-bg-muted)' }}
                >
                  <p
                    className="text-sm mb-3"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Are you sure you want to leave {currentHousehold.name}?
                    You'll lose access to shared dishes and plans.
                  </p>
                  {leaveError && (
                    <p className="text-sm text-red-500 mb-3">{leaveError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={handleCancelLeave}
                      disabled={isLeaving}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmLeave}
                      loading={isLeaving}
                      disabled={isLeaving}
                      className="flex-1 !bg-red-500"
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleLeaveClick}
                >
                  <LogOut size={20} />
                  Leave Household
                </Button>
              )}
            </>
          )}
        </div>

        {/* Creator note */}
        {isCreator && (
          <p
            className="mt-6 text-center text-sm"
            style={{ color: 'var(--color-text-light)' }}
          >
            As the creator, you cannot leave this household.
          </p>
        )}
      </main>

      {/* Invite Modal */}
      <InviteModal
        householdId={currentHousehold.id}
        householdName={currentHousehold.name}
        isOpen={showInviteModal}
        onClose={handleCloseInvite}
      />
    </div>
  );
}
