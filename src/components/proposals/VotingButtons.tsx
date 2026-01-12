/**
 * VotingButtons Component
 *
 * Two large buttons for voting on a proposal: approve (thumbs up) or reject (thumbs down).
 * Designed for quick, satisfying interactions on mobile.
 *
 * Per Constitution: No Unicode emojis - using Lucide icons instead.
 */

import { ThumbsUp, ThumbsDown } from 'lucide-react';

export interface VotingButtonsProps {
  /** The user's current vote, if any */
  currentVote?: 'approve' | 'reject';
  /** Whether voting is disabled (e.g., proposal closed) */
  disabled?: boolean;
  /** Whether a vote is currently being submitted */
  loading?: boolean;
  /** Called when user votes */
  onVote: (vote: 'approve' | 'reject') => void;
}

/**
 * Voting buttons for approving or rejecting a proposal.
 *
 * Features:
 * - Large touch targets (meets 44px minimum)
 * - Visual feedback for selected state
 * - Loading state during vote submission
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <VotingButtons
 *   currentVote={myVote}
 *   onVote={(vote) => castVote(proposalId, vote)}
 * />
 * ```
 */
export function VotingButtons({
  currentVote,
  disabled = false,
  loading = false,
  onVote,
}: VotingButtonsProps) {
  const isDisabled = disabled || loading;

  const baseButtonStyles = [
    // Layout
    'flex flex-col items-center justify-center gap-2',
    // Size - large touch targets
    'min-h-[72px] flex-1',
    // Rounded
    'rounded-xl',
    // Transitions
    'transition-all duration-150 ease-out',
    // Focus ring
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    // Disabled state
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Active press effect
    'active:scale-[0.97]',
  ].join(' ');

  const approveStyles =
    currentVote === 'approve'
      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200';

  const rejectStyles =
    currentVote === 'reject'
      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200';

  return (
    <div
      className="flex gap-3"
      role="group"
      aria-label="Vote on this proposal"
    >
      {/* Approve button */}
      <button
        type="button"
        className={`${baseButtonStyles} ${approveStyles}`}
        disabled={isDisabled}
        onClick={() => onVote('approve')}
        aria-label="Approve this proposal"
        aria-pressed={currentVote === 'approve'}
      >
        <ThumbsUp
          size={28}
          className={loading && currentVote === 'approve' ? 'animate-pulse' : ''}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">
          {currentVote === 'approve' ? 'Approved' : 'Sounds good'}
        </span>
      </button>

      {/* Reject button */}
      <button
        type="button"
        className={`${baseButtonStyles} ${rejectStyles}`}
        disabled={isDisabled}
        onClick={() => onVote('reject')}
        aria-label="Reject this proposal"
        aria-pressed={currentVote === 'reject'}
      >
        <ThumbsDown
          size={28}
          className={loading && currentVote === 'reject' ? 'animate-pulse' : ''}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">
          {currentVote === 'reject' ? 'Rejected' : 'Not tonight'}
        </span>
      </button>
    </div>
  );
}
