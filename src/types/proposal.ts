/**
 * Proposal Types
 *
 * Type definitions for meal proposals and voting.
 * Maps to the public.proposals, public.proposal_votes,
 * and public.proposal_dismissals tables.
 *
 * See: specs/004-meal-proposals/spec.md for full specification.
 */

/**
 * The status of a proposal.
 *
 * - pending: Waiting for votes
 * - approved: All members voted approve (consensus!)
 * - rejected: At least one member voted reject (strict veto)
 * - withdrawn: Proposer cancelled the proposal
 * - expired: 24 hours passed without resolution (Rule 2)
 */
export type ProposalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

/**
 * A vote on a proposal.
 */
export interface Vote {
  /** Profile ID of the voter */
  voterId: string;
  /** The vote: approve or reject */
  vote: 'approve' | 'reject';
  /** When the vote was cast */
  votedAt: string;
}

/**
 * Tracks when a member dismissed a proposal from their view.
 * Per Rule 4: Members can clear results once viewed.
 */
export interface ProposalDismissal {
  /** Profile ID of member who dismissed */
  userId: string;
  /** When they dismissed it */
  dismissedAt: string;
}

/**
 * The meal being proposed — an entree plus optional sides.
 */
export interface ProposedMeal {
  /** Dish ID for the entree */
  entreeId: string;
  /** Dish IDs for the sides (can be empty) */
  sideIds: string[];
}

/**
 * A meal proposal for household voting.
 *
 * Maps to the public.proposals table with votes and dismissals joined.
 */
export interface Proposal {
  /** Unique identifier */
  id: string;
  /** Household this proposal belongs to */
  householdId: string;
  /** Profile ID of the member who proposed this meal */
  proposedBy: string;
  /** When the proposal was created */
  proposedAt: string;
  /** The date this meal is proposed for (ISO 8601 date: YYYY-MM-DD) */
  targetDate: string;

  /** The proposed meal (entree + sides) */
  meal: ProposedMeal;

  /** Current status of the proposal */
  status: ProposalStatus;
  /** When voting closed (starts 24h auto-clear timer per Rule 5) */
  closedAt?: string;

  /** All votes cast on this proposal */
  votes: Vote[];
  /** Members who have dismissed this from their view (Rule 4) */
  dismissals: ProposalDismissal[];

  /** When the proposal was created */
  createdAt: string;
  /** When the proposal was last updated */
  updatedAt: string;
}

/**
 * Input for creating a new proposal.
 */
export interface CreateProposalInput {
  /** Household to create the proposal in */
  householdId: string;
  /** The date this meal is for */
  targetDate: string;
  /** The proposed meal */
  meal: ProposedMeal;
}

/**
 * Database row format for proposals (snake_case).
 * Used when reading from Supabase before transformation.
 */
export interface ProposalRow {
  id: string;
  household_id: string;
  proposed_by: string;
  proposed_at: string;
  target_date: string;
  meal: ProposedMeal;
  status: ProposalStatus;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row format for votes (snake_case).
 */
export interface VoteRow {
  id: string;
  proposal_id: string;
  voter_id: string;
  vote: 'approve' | 'reject';
  voted_at: string;
}

/**
 * Database row format for dismissals (snake_case).
 */
export interface DismissalRow {
  id: string;
  proposal_id: string;
  user_id: string;
  dismissed_at: string;
}
