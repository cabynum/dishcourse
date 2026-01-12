/**
 * useProposals Hook
 *
 * Provides React components with access to meal proposals and voting.
 * Handles loading, state management, and all proposal operations.
 *
 * Only works in synced mode (requires authentication + household).
 *
 * @example
 * ```tsx
 * function ProposalsList() {
 *   const { proposals, vote, isLoading } = useProposals();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return proposals.map(p => (
 *     <ProposalCard
 *       key={p.id}
 *       proposal={p}
 *       onVote={(v) => vote(p.id, v)}
 *     />
 *   ));
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { Proposal, ProposedMeal, Vote, ProposalDismissal } from '@/types';
import {
  createProposal as createProposalService,
  getProposals as getProposalsService,
  castVote as castVoteService,
  withdrawProposal as withdrawProposalService,
  dismissProposal as dismissProposalService,
  resolveProposal,
  updateProposalStatus,
  expirePendingProposals,
  isVisibleToUser,
} from '@/services/proposals';
import {
  getProposalsFromCache,
  getVotesFromCache,
  getDismissalsFromCache,
  onDataChange,
} from '@/services';
import { useHousehold } from './useHousehold';
import { useAuthContext } from '@/components/auth';

/**
 * Return type for the useProposals hook.
 */
export interface UseProposalsReturn {
  /** All proposals visible to the current user */
  proposals: Proposal[];

  /** True while initially loading */
  isLoading: boolean;

  /** Error message if something went wrong */
  error: string | null;

  /** Count of pending proposals (for badges) */
  pendingCount: number;

  /** Create a new proposal */
  createProposal: (meal: ProposedMeal, targetDate: string) => Promise<Proposal>;

  /** Cast a vote on a proposal */
  vote: (proposalId: string, vote: 'approve' | 'reject') => Promise<void>;

  /** Withdraw a proposal (proposer only) */
  withdraw: (proposalId: string) => Promise<void>;

  /** Dismiss a proposal from view (Rule 4) */
  dismiss: (proposalId: string) => Promise<void>;

  /** Whether the feature is available (multi-member household) */
  isAvailable: boolean;

  /** Refresh proposals from server */
  refresh: () => Promise<void>;

  /** ID of proposal currently being voted on */
  votingProposalId: string | null;

  /** Proposal that was just approved (for celebration) */
  celebratingProposal: Proposal | null;

  /** Clear the celebrating proposal */
  clearCelebration: () => void;
}

/**
 * Hook for managing proposals and voting.
 *
 * The proposals feature is only available for multi-member households (Rule 6).
 */
export function useProposals(): UseProposalsReturn {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingProposalId, setVotingProposalId] = useState<string | null>(null);
  const [celebratingProposal, setCelebratingProposal] = useState<Proposal | null>(null);

  const { user, isAuthenticated } = useAuthContext();
  const { currentHousehold, members } = useHousehold();

  // Feature is only available for multi-member households (Rule 6)
  const isAvailable = isAuthenticated && currentHousehold !== null && members.length > 1;

  // Calculate pending count
  const pendingCount = proposals.filter((p) => p.status === 'pending').length;

  /**
   * Load proposals with votes and dismissals.
   */
  const loadProposals = useCallback(async () => {
    if (!currentHousehold || !user) {
      setProposals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, expire any stale proposals (Rule 2)
      await expirePendingProposals(currentHousehold.id);

      // Fetch proposals from service (which includes votes and dismissals)
      const allProposals = await getProposalsService(currentHousehold.id);

      // Filter to only visible proposals (Rule 4 & 5)
      const visibleProposals = allProposals.filter((p) =>
        isVisibleToUser(p, user.id)
      );

      setProposals(visibleProposals);
    } catch (err) {
      console.error('Failed to load proposals:', err);
      setError('Unable to load proposals. Please try again.');
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentHousehold, user]);

  // Load proposals on mount and when household changes
  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  // Subscribe to data changes (real-time updates)
  useEffect(() => {
    if (!currentHousehold) return;

    const cleanup = onDataChange(() => {
      loadProposals();
    });

    return cleanup;
  }, [currentHousehold, loadProposals]);

  /**
   * Create a new proposal.
   */
  const createProposal = useCallback(
    async (meal: ProposedMeal, targetDate: string): Promise<Proposal> => {
      if (!currentHousehold || !user) {
        throw new Error('You must be in a household to create proposals.');
      }

      setError(null);

      try {
        const proposal = await createProposalService(
          {
            householdId: currentHousehold.id,
            targetDate,
            meal,
          },
          user.id
        );

        // Add to local state immediately (optimistic update)
        const fullProposal: Proposal = {
          ...proposal,
          votes: [],
          dismissals: [],
        };
        setProposals((prev) => [fullProposal, ...prev]);

        return fullProposal;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to create proposal.';
        setError(message);
        throw err;
      }
    },
    [currentHousehold, user]
  );

  /**
   * Cast a vote on a proposal.
   */
  const vote = useCallback(
    async (proposalId: string, voteValue: 'approve' | 'reject'): Promise<void> => {
      if (!user) {
        throw new Error('You must be logged in to vote.');
      }

      setError(null);
      setVotingProposalId(proposalId);

      try {
        await castVoteService(proposalId, voteValue, user.id);

        // Update local state with the new vote
        setProposals((prev) =>
          prev.map((p) => {
            if (p.id !== proposalId) return p;

            // Remove existing vote if any, add new one
            const otherVotes = p.votes.filter((v) => v.voterId !== user.id);
            const newVote: Vote = {
              voterId: user.id,
              vote: voteValue,
              votedAt: new Date().toISOString(),
            };
            const updatedVotes = [...otherVotes, newVote];

            // Check if proposal should be resolved
            const updatedProposal: Proposal = {
              ...p,
              votes: updatedVotes,
            };

            const newStatus = resolveProposal(updatedProposal, members.length);

            if (newStatus !== 'pending') {
              // Update status on server
              updateProposalStatus(proposalId, newStatus);

              // If approved, trigger celebration!
              if (newStatus === 'approved') {
                setCelebratingProposal({
                  ...updatedProposal,
                  status: 'approved',
                  closedAt: new Date().toISOString(),
                });
              }

              return {
                ...updatedProposal,
                status: newStatus,
                closedAt: new Date().toISOString(),
              };
            }

            return updatedProposal;
          })
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to submit your vote.';
        setError(message);
        throw err;
      } finally {
        setVotingProposalId(null);
      }
    },
    [user, members.length]
  );

  /**
   * Withdraw a proposal (proposer only).
   */
  const withdraw = useCallback(
    async (proposalId: string): Promise<void> => {
      if (!user) {
        throw new Error('You must be logged in to withdraw a proposal.');
      }

      setError(null);

      try {
        await withdrawProposalService(proposalId, user.id);

        // Update local state
        setProposals((prev) =>
          prev.map((p) =>
            p.id === proposalId
              ? { ...p, status: 'withdrawn' as const, closedAt: new Date().toISOString() }
              : p
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to withdraw proposal.';
        setError(message);
        throw err;
      }
    },
    [user]
  );

  /**
   * Dismiss a proposal from view (Rule 4).
   */
  const dismiss = useCallback(
    async (proposalId: string): Promise<void> => {
      if (!user) {
        throw new Error('You must be logged in to dismiss a proposal.');
      }

      setError(null);

      try {
        await dismissProposalService(proposalId, user.id);

        // Remove from local state (it's now dismissed for this user)
        setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to dismiss proposal.';
        setError(message);
        throw err;
      }
    },
    [user]
  );

  /**
   * Clear the celebrating proposal.
   */
  const clearCelebration = useCallback(() => {
    setCelebratingProposal(null);
  }, []);

  /**
   * Refresh proposals from server.
   */
  const refresh = useCallback(async () => {
    await loadProposals();
  }, [loadProposals]);

  return {
    proposals,
    isLoading,
    error,
    pendingCount,
    createProposal,
    vote,
    withdraw,
    dismiss,
    isAvailable,
    refresh,
    votingProposalId,
    celebratingProposal,
    clearCelebration,
  };
}
