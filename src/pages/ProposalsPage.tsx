/**
 * ProposalsPage - View and vote on meal proposals.
 *
 * The hub for household meal decisions. Shows pending proposals,
 * recent results, and lets users vote or create new proposals.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Vote } from 'lucide-react';
import { useProposals, useDishes, useHousehold } from '@/hooks';
import { ProposalList, CelebrationModal } from '@/components/proposals';
import { Button, EmptyState } from '@/components/ui';

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
  } = useProposals();

  // Get current user ID from members (the one matching auth context)
  const currentUserId = members.find((m) => true)?.userId ?? '';

  const handleBack = () => {
    navigate('/');
  };

  const handleCreateProposal = () => {
    // Navigate to suggestion page to pick a meal
    navigate('/suggest');
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
            description={
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
        />
      )}
    </div>
  );
}
