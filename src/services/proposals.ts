/**
 * Proposals Service
 *
 * Handles all proposal and voting operations. Members can propose meals
 * for specific dates and vote to approve/reject them.
 *
 * **Voting Rules (Canonical Reference)**:
 * - Rule 1: Strict veto — one "no" vote immediately rejects the proposal
 * - Rule 2: All members must vote (or proposal expires in 24h)
 * - Rule 3: Vote results are visible to all members
 * - Rule 4: Members can dismiss/clear results from their view
 * - Rule 5: Results auto-clear 24 hours after closing
 * - Rule 6: Feature hidden for solo households
 *
 * @see specs/004-meal-proposals/spec.md for full specification
 *
 * @example
 * ```typescript
 * // Create a proposal
 * const proposal = await createProposal({
 *   householdId: 'abc123',
 *   targetDate: '2026-01-15',
 *   meal: { entreeId: 'dish1', sideIds: ['side1', 'side2'] }
 * });
 *
 * // Cast a vote
 * await castVote(proposal.id, 'approve');
 *
 * // Dismiss a closed proposal from view
 * await dismissProposal(proposal.id);
 * ```
 */

import { supabase } from '@/lib/supabase';
import type {
  Proposal,
  ProposalStatus,
  Vote,
  ProposalDismissal,
  CreateProposalInput,
  ProposalRow,
  VoteRow,
  DismissalRow,
} from '@/types';

// ============================================================================
// Constants
// ============================================================================

/** Hours before a pending proposal expires (Rule 2) */
const EXPIRATION_HOURS = 24;

/** Hours before a closed proposal auto-clears from view (Rule 5) */
const AUTO_CLEAR_HOURS = 24;

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transforms a database proposal row to the application format.
 * Votes and dismissals are fetched separately and passed in.
 */
function transformProposal(
  row: ProposalRow,
  votes: Vote[],
  dismissals: ProposalDismissal[]
): Proposal {
  return {
    id: row.id,
    householdId: row.household_id,
    proposedBy: row.proposed_by,
    proposedAt: row.proposed_at,
    targetDate: row.target_date,
    meal: row.meal,
    status: row.status,
    closedAt: row.closed_at ?? undefined,
    votes,
    dismissals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transforms a database vote row to the application format.
 */
function transformVote(row: VoteRow): Vote {
  return {
    voterId: row.voter_id,
    vote: row.vote,
    votedAt: row.voted_at,
  };
}

/**
 * Transforms a database dismissal row to the application format.
 */
function transformDismissal(row: DismissalRow): ProposalDismissal {
  return {
    userId: row.user_id,
    dismissedAt: row.dismissed_at,
  };
}

// ============================================================================
// Proposal Resolution Logic
// ============================================================================

/**
 * Determines the resolved status of a proposal based on votes.
 *
 * Implements the canonical voting rules:
 * - Rule 1: Any rejection immediately rejects the proposal
 * - Rule 2: All members must vote 'approve' for approval
 *
 * @param proposal - The proposal to evaluate
 * @param memberCount - Total household members who can vote
 * @returns The resolved status
 */
export function resolveProposal(
  proposal: Proposal,
  memberCount: number
): ProposalStatus {
  // Already resolved (withdrawn, approved, rejected, expired)
  if (proposal.status !== 'pending') {
    return proposal.status;
  }

  // Rule 6: Solo households shouldn't have proposals, but if they do, stay pending
  if (memberCount < 2) {
    return 'pending';
  }

  const rejections = proposal.votes.filter((v) => v.vote === 'reject').length;

  // Rule 1: Any rejection = rejected (strict veto)
  if (rejections > 0) {
    return 'rejected';
  }

  const approvals = proposal.votes.filter((v) => v.vote === 'approve').length;

  // Rule 2: All members must vote 'approve'
  if (approvals === memberCount) {
    return 'approved'; // Consensus!
  }

  return 'pending'; // Still waiting for votes
}

/**
 * Checks if a proposal should expire due to timeout.
 *
 * Per Rule 2: Proposals expire after 24 hours without resolution.
 *
 * @param proposal - The proposal to check
 * @returns True if the proposal should be marked as expired
 */
export function shouldExpireProposal(proposal: Proposal): boolean {
  if (proposal.status !== 'pending') {
    return false;
  }

  const createdAt = new Date(proposal.proposedAt);
  const now = new Date();
  const hoursSinceCreation =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceCreation >= EXPIRATION_HOURS;
}

/**
 * Checks if a closed proposal's results should auto-clear.
 *
 * Per Rule 5: Results auto-clear 24 hours after the proposal closes.
 *
 * @param proposal - The proposal to check
 * @returns True if the proposal should be hidden from active views
 */
export function shouldAutoClearResult(proposal: Proposal): boolean {
  if (proposal.status === 'pending') {
    return false;
  }

  if (!proposal.closedAt) {
    return false;
  }

  const closedAt = new Date(proposal.closedAt);
  const now = new Date();
  const hoursSinceClosed =
    (now.getTime() - closedAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceClosed >= AUTO_CLEAR_HOURS;
}

/**
 * Checks if a proposal should be visible to a specific user.
 *
 * A proposal is NOT visible if:
 * 1. The user has dismissed it (Rule 4)
 * 2. It has auto-cleared (Rule 5)
 *
 * @param proposal - The proposal to check
 * @param userId - The user's profile ID
 * @returns True if the proposal should appear in the user's active list
 */
export function isVisibleToUser(proposal: Proposal, userId: string): boolean {
  // Rule 5: Auto-cleared proposals are hidden
  if (shouldAutoClearResult(proposal)) {
    return false;
  }

  // Rule 4: Check if user has dismissed this proposal
  const dismissed = proposal.dismissals.some((d) => d.userId === userId);
  if (dismissed) {
    return false;
  }

  return true;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Creates a new proposal in a household.
 *
 * @param input - The proposal details
 * @param userId - The user creating the proposal (must be authenticated)
 * @returns The created proposal
 * @throws Error if creation fails
 */
export async function createProposal(
  input: CreateProposalInput,
  userId: string
): Promise<Proposal> {
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      household_id: input.householdId,
      proposed_by: userId,
      target_date: input.targetDate,
      meal: input.meal,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Failed to create proposal:', error);
    throw new Error('Unable to create proposal. Please try again.');
  }

  return transformProposal(data as ProposalRow, [], []);
}

/**
 * Fetches all proposals for a household.
 *
 * Includes votes and dismissals for each proposal.
 * Orders by: pending first, then by creation date (newest first).
 *
 * @param householdId - The household ID
 * @returns Array of proposals with votes and dismissals
 */
export async function getProposals(householdId: string): Promise<Proposal[]> {
  // Fetch proposals
  const { data: proposalRows, error: proposalError } = await supabase
    .from('proposals')
    .select('*')
    .eq('household_id', householdId)
    .order('status', { ascending: true }) // pending comes before approved/rejected/etc
    .order('created_at', { ascending: false });

  if (proposalError || !proposalRows) {
    console.error('Failed to fetch proposals:', proposalError);
    return [];
  }

  if (proposalRows.length === 0) {
    return [];
  }

  const proposalIds = proposalRows.map((p) => p.id);

  // Fetch all votes for these proposals
  const { data: voteRows, error: voteError } = await supabase
    .from('proposal_votes')
    .select('*')
    .in('proposal_id', proposalIds);

  if (voteError) {
    console.error('Failed to fetch votes:', voteError);
  }

  // Fetch all dismissals for these proposals
  const { data: dismissalRows, error: dismissalError } = await supabase
    .from('proposal_dismissals')
    .select('*')
    .in('proposal_id', proposalIds);

  if (dismissalError) {
    console.error('Failed to fetch dismissals:', dismissalError);
  }

  // Group votes and dismissals by proposal ID
  const votesByProposal = new Map<string, Vote[]>();
  const dismissalsByProposal = new Map<string, ProposalDismissal[]>();

  for (const row of (voteRows || []) as VoteRow[]) {
    const proposalId = row.proposal_id;
    if (!votesByProposal.has(proposalId)) {
      votesByProposal.set(proposalId, []);
    }
    votesByProposal.get(proposalId)!.push(transformVote(row));
  }

  for (const row of (dismissalRows || []) as DismissalRow[]) {
    const proposalId = row.proposal_id;
    if (!dismissalsByProposal.has(proposalId)) {
      dismissalsByProposal.set(proposalId, []);
    }
    dismissalsByProposal.get(proposalId)!.push(transformDismissal(row));
  }

  // Transform and return
  return proposalRows.map((row) =>
    transformProposal(
      row as ProposalRow,
      votesByProposal.get(row.id) || [],
      dismissalsByProposal.get(row.id) || []
    )
  );
}

/**
 * Fetches a single proposal by ID.
 *
 * @param id - The proposal ID
 * @returns The proposal, or null if not found
 */
export async function getProposal(id: string): Promise<Proposal | null> {
  // Fetch proposal
  const { data: row, error: proposalError } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single();

  if (proposalError || !row) {
    return null;
  }

  // Fetch votes
  const { data: voteRows } = await supabase
    .from('proposal_votes')
    .select('*')
    .eq('proposal_id', id);

  // Fetch dismissals
  const { data: dismissalRows } = await supabase
    .from('proposal_dismissals')
    .select('*')
    .eq('proposal_id', id);

  const votes = ((voteRows || []) as VoteRow[]).map(transformVote);
  const dismissals = ((dismissalRows || []) as DismissalRow[]).map(
    transformDismissal
  );

  return transformProposal(row as ProposalRow, votes, dismissals);
}

/**
 * Casts or updates a vote on a proposal.
 *
 * If the user has already voted, their vote is updated.
 * After voting, checks if the proposal should be resolved.
 *
 * @param proposalId - The proposal to vote on
 * @param vote - The vote ('approve' or 'reject')
 * @param userId - The voting user's profile ID
 * @throws Error if voting fails
 */
export async function castVote(
  proposalId: string,
  vote: 'approve' | 'reject',
  userId: string
): Promise<void> {
  // Upsert the vote (insert or update on conflict)
  const { error } = await supabase.from('proposal_votes').upsert(
    {
      proposal_id: proposalId,
      voter_id: userId,
      vote,
      voted_at: new Date().toISOString(),
    },
    {
      onConflict: 'proposal_id,voter_id',
    }
  );

  if (error) {
    console.error('Failed to cast vote:', error);
    throw new Error('Unable to submit your vote. Please try again.');
  }
}

/**
 * Withdraws a proposal (only the proposer can do this).
 *
 * @param id - The proposal ID
 * @param userId - The user requesting withdrawal (must be proposer)
 * @throws Error if withdrawal fails or user is not the proposer
 */
export async function withdrawProposal(
  id: string,
  userId: string
): Promise<void> {
  // Verify ownership and update in one query
  const { error, count } = await supabase
    .from('proposals')
    .update({
      status: 'withdrawn',
      closed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('proposed_by', userId)
    .eq('status', 'pending'); // Can only withdraw pending proposals

  if (error) {
    console.error('Failed to withdraw proposal:', error);
    throw new Error('Unable to withdraw proposal. Please try again.');
  }

  if (count === 0) {
    throw new Error('You can only withdraw your own pending proposals.');
  }
}

/**
 * Dismisses a proposal from the user's active view (Rule 4).
 *
 * The proposal is still visible to other members until they dismiss it.
 *
 * @param proposalId - The proposal to dismiss
 * @param userId - The user dismissing the proposal
 * @throws Error if dismissal fails
 */
export async function dismissProposal(
  proposalId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('proposal_dismissals').upsert(
    {
      proposal_id: proposalId,
      user_id: userId,
      dismissed_at: new Date().toISOString(),
    },
    {
      onConflict: 'proposal_id,user_id',
    }
  );

  if (error) {
    console.error('Failed to dismiss proposal:', error);
    throw new Error('Unable to dismiss proposal. Please try again.');
  }
}

/**
 * Updates a proposal's status and sets closed_at timestamp.
 *
 * Used internally when resolving proposals after votes.
 *
 * @param id - The proposal ID
 * @param status - The new status
 * @throws Error if update fails
 */
export async function updateProposalStatus(
  id: string,
  status: ProposalStatus
): Promise<void> {
  const updates: Record<string, unknown> = { status };

  // Set closed_at for terminal states
  if (status !== 'pending') {
    updates.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Failed to update proposal status:', error);
    throw new Error('Unable to update proposal. Please try again.');
  }
}

/**
 * Expires all pending proposals that have passed the 24-hour threshold (Rule 2).
 *
 * This should be called on app load and periodically.
 *
 * @param householdId - The household to check
 * @returns Number of proposals expired
 */
export async function expirePendingProposals(
  householdId: string
): Promise<number> {
  const expirationThreshold = new Date();
  expirationThreshold.setHours(
    expirationThreshold.getHours() - EXPIRATION_HOURS
  );

  const { data, error } = await supabase
    .from('proposals')
    .update({
      status: 'expired',
      closed_at: new Date().toISOString(),
    })
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .lt('proposed_at', expirationThreshold.toISOString())
    .select('id');

  if (error) {
    console.error('Failed to expire proposals:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Gets the count of pending proposals for a household.
 *
 * Useful for showing notification badges.
 *
 * @param householdId - The household ID
 * @returns Number of pending proposals
 */
export async function getPendingProposalCount(
  householdId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to count pending proposals:', error);
    return 0;
  }

  return count || 0;
}
