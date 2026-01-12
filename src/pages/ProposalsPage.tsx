/**
 * ProposalsPage - View and vote on meal proposals.
 *
 * The hub for household meal decisions. Shows pending proposals,
 * recent results, and lets users vote or create new proposals.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Vote } from 'lucide-react';
import { useProposals, useDishes, useHousehold } from '@/hooks';
import { ProposalList, CelebrationModal, ProposeModal } from '@/components/proposals';
import { Button, EmptyState } from '@/components/ui';
import type { ProposedMeal } from '@/types';

export function ProposalsPage() {
  const navigate = useNavigate();
  const { dishes } = useDishes();
  const { members, currentHousehold } = useHousehold();
  const {
    proposals,
    isLoading,
    error,
    vote,
    withdraw,
    dismiss,
    isAvailable,
    votingProposalId,
    celebratingProposal,
    clearCelebration,
    propose,
  } = useProposals();

  const [showProposeModal, setShowProposeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user ID from members
  const currentUserId = members[0]?.userId ?? '';

  const handleBack = () => {
    navigate('/');
  };

  const handleCreateProposal = () => {
    // Open the propose modal to build a meal
    setShowProposeModal(true);
  };

  const handlePropose = async (meal: ProposedMeal, targetDate: string) => {
    setIsSubmitting(true);
    try {
      await propose(meal, targetDate);
      setShowProposeModal(false);
    } catch (err) {
      console.error('Propose failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (proposalId: string, voteValue: 'approve' | 'reject') => {
    try {
      await vote(proposalId, voteValue);
    } catch (err) {
      // Error is handled by the hook and displayed via error state
      console.error('Vote failed:', err);
    }
  };

  const handleWithdraw = async (proposalId: string) => {
    try {
      await withdraw(proposalId);
    } catch (err) {
      console.error('Withdraw failed:', err);
    }
  };

  const handleDismiss = async (proposalId: string) => {
    try {
      await dismiss(proposalId);
    } catch (err) {
      console.error('Dismiss failed:', err);
    }
  };

  const handleAddToPlan = (proposalId: string) => {
    // Find the proposal to get its details
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    // Navigate to plan page with the meal data
    // The plan page will handle adding the meal to the target date
    navigate('/plan', {
      state: {
        addMeal: {
          targetDate: proposal.targetDate,
          entreeId: proposal.meal.entreeId,
          sideIds: proposal.meal.sideIds,
        },
      },
    });
  };

  const handleAddCelebratingToPlan = () => {
    if (celebratingProposal) {
      handleAddToPlan(celebratingProposal.id);
      clearCelebration();
    }
  };

  // Not available for solo households (Rule 6)
  if (!isAvailable && !isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
        <header
          className="sticky top-0 z-10 border-b backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 254, 247, 0.95)',
            borderColor: 'var(--color-bg-muted)',
          }}
        >
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="p-2 -ml-2 rounded-xl transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2"
                style={{ color: 'var(--color-text)' }}
                aria-label="Go back"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-text)',
                  }}
                >
                  Proposals
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Not available content */}
        <main className="max-w-lg mx-auto px-4 py-8">
          <EmptyState
            icon={<Vote size={48} className="text-amber-400" />}
            title="Proposals Need a Crew"
            message={
              currentHousehold
                ? 'Invite someone to your household to start proposing meals and voting together!'
                : 'Join or create a household to use the proposals feature.'
            }
            action={
              currentHousehold
                ? {
                    label: 'Invite Members',
                    onClick: () => navigate('/household'),
                  }
                : {
                    label: 'Set Up Household',
                    onClick: () => navigate('/household/create'),
                  }
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(255, 254, 247, 0.95)',
          borderColor: 'var(--color-bg-muted)',
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="p-2 -ml-2 rounded-xl transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2"
                style={{ color: 'var(--color-text)' }}
                aria-label="Go back"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-text)',
                  }}
                >
                  Proposals
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                  {currentHousehold?.name ?? 'Household'}
                </p>
              </div>
            </div>

            {/* Create proposal button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateProposal}
            >
              <Plus size={18} aria-hidden="true" />
              <span>Propose</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Proposal list */}
        <ProposalList
          proposals={proposals}
          dishes={dishes}
          members={members}
          currentUserId={currentUserId}
          onVote={handleVote}
          onWithdraw={handleWithdraw}
          onDismiss={handleDismiss}
          onAddToPlan={handleAddToPlan}
          isLoading={isLoading}
          votingProposalId={votingProposalId ?? undefined}
          onCreateProposal={handleCreateProposal}
        />
      </main>

      {/* Celebration modal */}
      {celebratingProposal && (
        <CelebrationModal
          proposal={celebratingProposal}
          dishes={dishes}
          onClose={clearCelebration}
          onAddToPlan={handleAddCelebratingToPlan}
        />
      )}

      {/* Propose modal - for building and submitting a new proposal */}
      {showProposeModal && (
        <ProposeModal
          dishes={dishes}
          memberCount={members.length}
          isSubmitting={isSubmitting}
          onPropose={handlePropose}
          onCancel={() => setShowProposeModal(false)}
        />
      )}
    </div>
  );
}
