/**
 * ProposalList Component
 *
 * Displays a list of proposals for a household.
 * Filters: pending proposals first, then recent closed ones.
 * Includes empty state and loading skeleton.
 */

import { Vote } from 'lucide-react';
import type { Proposal, Dish, HouseholdMemberWithProfile } from '@/types';
import { EmptyState } from '../ui';
import { ProposalCard } from './ProposalCard';

export interface ProposalListProps {
  /** All proposals for the household */
  proposals: Proposal[];
  /** All household dishes (to resolve IDs) */
  dishes: Dish[];
  /** All household members */
  members: HouseholdMemberWithProfile[];
  /** Current user's profile ID */
  currentUserId: string;
  /** Called when user votes on a proposal */
  onVote: (proposalId: string, vote: 'approve' | 'reject') => void;
  /** Called when user withdraws a proposal */
  onWithdraw: (proposalId: string) => void;
  /** Called when user dismisses a proposal (Rule 4) */
  onDismiss: (proposalId: string) => void;
  /** Optional: Called when user wants to add approved meal to a plan */
  onAddToPlan?: (proposalId: string) => void;
  /** Filter to show only pending, or all */
  filter?: 'pending' | 'all';
  /** Whether data is loading */
  isLoading?: boolean;
  /** ID of proposal currently being voted on */
  votingProposalId?: string;
  /** Called when user wants to create a new proposal */
  onCreateProposal?: () => void;
}

/**
 * Loading skeleton for proposal cards
 */
function ProposalSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-stone-100">
        <div className="h-4 bg-stone-200 rounded w-48" />
        <div className="h-6 bg-stone-200 rounded-full w-20" />
      </div>
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-stone-200 rounded w-32" />
            <div className="h-3 bg-stone-200 rounded w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-stone-200 rounded-lg w-24" />
          <div className="h-8 bg-stone-200 rounded-lg w-24" />
        </div>
      </div>
      {/* Voting skeleton */}
      <div className="px-4 pb-4 flex gap-3">
        <div className="flex-1 h-[72px] bg-stone-200 rounded-xl" />
        <div className="flex-1 h-[72px] bg-stone-200 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * ProposalList shows all proposals with filtering and sorting.
 *
 * Features:
 * - Pending proposals shown first
 * - Closed proposals (approved/rejected/expired/withdrawn) shown after
 * - Empty state with CTA to create proposal
 * - Loading skeleton
 *
 * @example
 * ```tsx
 * <ProposalList
 *   proposals={proposals}
 *   dishes={dishes}
 *   members={members}
 *   currentUserId={userId}
 *   onVote={handleVote}
 *   onWithdraw={handleWithdraw}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function ProposalList({
  proposals,
  dishes,
  members,
  currentUserId,
  onVote,
  onWithdraw,
  onDismiss,
  onAddToPlan,
  filter = 'all',
  isLoading = false,
  votingProposalId,
  onCreateProposal,
}: ProposalListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <ProposalSkeleton />
        <ProposalSkeleton />
      </div>
    );
  }

  // Filter proposals
  const filteredProposals =
    filter === 'pending'
      ? proposals.filter((p) => p.status === 'pending')
      : proposals;

  // Sort: pending first, then by creation date (newest first)
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    // Pending proposals first
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    // Then by date (newest first)
    return new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime();
  });

  // Empty state
  if (sortedProposals.length === 0) {
    const emptyMessage =
      filter === 'pending'
        ? "No pending proposals right now. Everyone's on the same page!"
        : "No proposals yet. Be the first to suggest dinner!";

    return (
      <EmptyState
        icon={<Vote size={48} className="text-amber-400" />}
        title={filter === 'pending' ? 'All Caught Up' : 'No Proposals Yet'}
        description={emptyMessage}
        action={
          onCreateProposal
            ? {
                label: 'Propose a Meal',
                onClick: onCreateProposal,
              }
            : undefined
        }
      />
    );
  }

  // Group into pending and closed for visual separation
  const pendingProposals = sortedProposals.filter((p) => p.status === 'pending');
  const closedProposals = sortedProposals.filter((p) => p.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending proposals section */}
      {pendingProposals.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">
            Waiting for Votes
          </h3>
          <div className="space-y-4">
            {pendingProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                dishes={dishes}
                members={members}
                currentUserId={currentUserId}
                onVote={(vote) => onVote(proposal.id, vote)}
                onWithdraw={() => onWithdraw(proposal.id)}
                onDismiss={() => onDismiss(proposal.id)}
                onAddToPlan={onAddToPlan ? () => onAddToPlan(proposal.id) : undefined}
                isVoting={votingProposalId === proposal.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Closed proposals section */}
      {closedProposals.length > 0 && filter === 'all' && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">
            Recent
          </h3>
          <div className="space-y-4">
            {closedProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                dishes={dishes}
                members={members}
                currentUserId={currentUserId}
                onVote={(vote) => onVote(proposal.id, vote)}
                onWithdraw={() => onWithdraw(proposal.id)}
                onDismiss={() => onDismiss(proposal.id)}
                onAddToPlan={onAddToPlan ? () => onAddToPlan(proposal.id) : undefined}
                isVoting={votingProposalId === proposal.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
