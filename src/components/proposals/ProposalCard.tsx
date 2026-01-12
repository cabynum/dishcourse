/**
 * ProposalCard Component
 *
 * Displays a single meal proposal with voting UI, status, and results.
 * This is the primary interaction point for the proposals feature.
 *
 * Shows:
 * - Who proposed and for what date
 * - The proposed meal (entree + sides)
 * - Voting buttons (if pending and user hasn't voted or can change vote)
 * - Vote tally and who's voted
 * - Status badge
 * - Dismiss button for closed proposals (Rule 4)
 * - Withdraw button for proposer (if pending)
 */

import { useState } from 'react';
import { 
  Utensils, 
  Leaf, 
  Clock, 
  Check, 
  X, 
  UserX, 
  Timer,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import type { Proposal, Dish, HouseholdMemberWithProfile } from '@/types';
import { Card, Button } from '../ui';
import { VotingButtons } from './VotingButtons';

export interface ProposalCardProps {
  /** The proposal to display */
  proposal: Proposal;
  /** All household dishes (to resolve IDs to names) */
  dishes: Dish[];
  /** All household members (to show who voted) */
  members: HouseholdMemberWithProfile[];
  /** Current user's profile ID */
  currentUserId: string;
  /** Called when user casts a vote */
  onVote: (vote: 'approve' | 'reject') => void;
  /** Called when proposer withdraws the proposal */
  onWithdraw?: () => void;
  /** Called when user dismisses a closed proposal (Rule 4) */
  onDismiss?: () => void;
  /** Whether a vote is being submitted */
  isVoting?: boolean;
}

/**
 * Format a date for display (e.g., "Tonight", "Tomorrow", "Monday Jan 15")
 */
function formatTargetDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00'); // Noon to avoid timezone issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Tonight';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  
  // Format as "Monday Jan 15"
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get display name for a member
 */
function getMemberName(
  userId: string,
  members: HouseholdMemberWithProfile[],
  currentUserId: string
): string {
  if (userId === currentUserId) return 'You';
  const member = members.find((m) => m.userId === userId);
  return member?.profile.displayName || 'Unknown';
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: Proposal['status'] }) {
  const config = {
    pending: {
      icon: Clock,
      text: 'Pending',
      styles: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    approved: {
      icon: Check,
      text: 'Approved',
      styles: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    rejected: {
      icon: X,
      text: 'Rejected',
      styles: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    withdrawn: {
      icon: UserX,
      text: 'Withdrawn',
      styles: 'bg-stone-100 text-stone-600 border-stone-200',
    },
    expired: {
      icon: Timer,
      text: 'Expired',
      styles: 'bg-stone-100 text-stone-500 border-stone-200',
    },
  };

  const { icon: Icon, text, styles } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles}`}
    >
      <Icon size={14} aria-hidden="true" />
      {text}
    </span>
  );
}

/**
 * ProposalCard displays a proposal with full voting functionality.
 */
export function ProposalCard({
  proposal,
  dishes,
  members,
  currentUserId,
  onVote,
  onWithdraw,
  onDismiss,
  isVoting = false,
}: ProposalCardProps) {
  const [showVoteDetails, setShowVoteDetails] = useState(false);

  // Resolve dish names from IDs
  const entree = dishes.find((d) => d.id === proposal.meal.entreeId);
  const sides = proposal.meal.sideIds
    .map((id) => dishes.find((d) => d.id === id))
    .filter(Boolean) as Dish[];

  // Get proposer info
  const proposerName = getMemberName(proposal.proposedBy, members, currentUserId);
  const isProposer = proposal.proposedBy === currentUserId;

  // Get current user's vote
  const myVote = proposal.votes.find((v) => v.voterId === currentUserId);

  // Count votes
  const approveCount = proposal.votes.filter((v) => v.vote === 'approve').length;
  const rejectCount = proposal.votes.filter((v) => v.vote === 'reject').length;
  const totalVotes = proposal.votes.length;
  const memberCount = members.length;

  // Determine if user can vote
  const isPending = proposal.status === 'pending';
  const canVote = isPending;
  const canWithdraw = isPending && isProposer && onWithdraw;
  const canDismiss = !isPending && onDismiss;

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header with proposer and status */}
      <div className="flex items-center justify-between p-4 border-b border-stone-100">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-600">
            <span className="font-medium text-stone-800">{proposerName}</span>
            {' proposed for '}
            <span className="font-medium text-stone-800">
              {formatTargetDate(proposal.targetDate)}
            </span>
          </p>
        </div>
        <StatusBadge status={proposal.status} />
      </div>

      {/* Meal display */}
      <div className="p-4">
        {/* Entree */}
        {entree ? (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <Utensils size={20} className="text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-stone-800">{entree.name}</p>
              <p className="text-xs text-stone-500">Main Course</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-stone-500 italic mb-3">
            Dish not found
          </p>
        )}

        {/* Sides */}
        {sides.length > 0 && (
          <div className="flex flex-wrap gap-2 ml-13">
            {sides.map((side) => (
              <div
                key={side.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg"
              >
                <Leaf size={14} className="text-emerald-600" aria-hidden="true" />
                <span className="text-sm text-emerald-800">{side.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voting section (only for pending proposals) */}
      {canVote && (
        <div className="px-4 pb-4">
          <VotingButtons
            currentVote={myVote?.vote}
            disabled={isVoting}
            loading={isVoting}
            onVote={onVote}
          />
        </div>
      )}

      {/* Vote tally */}
      <div className="px-4 pb-3">
        <button
          type="button"
          className="flex items-center justify-between w-full py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          onClick={() => setShowVoteDetails(!showVoteDetails)}
          aria-expanded={showVoteDetails}
        >
          <span>
            {isPending ? (
              <>
                <span className="font-medium">{totalVotes}</span>
                {' of '}
                <span className="font-medium">{memberCount}</span>
                {' voted'}
              </>
            ) : (
              <>
                <span className="text-emerald-600 font-medium">{approveCount} approved</span>
                {rejectCount > 0 && (
                  <>
                    {', '}
                    <span className="text-rose-600 font-medium">{rejectCount} rejected</span>
                  </>
                )}
              </>
            )}
          </span>
          {showVoteDetails ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </button>

        {/* Expanded vote details (Rule 3: transparency) */}
        {showVoteDetails && (
          <div className="pt-2 pb-1 space-y-1.5 text-sm border-t border-stone-100">
            {proposal.votes.map((vote) => {
              const voterName = getMemberName(vote.voterId, members, currentUserId);
              return (
                <div key={vote.voterId} className="flex items-center gap-2">
                  {vote.vote === 'approve' ? (
                    <Check size={14} className="text-emerald-500" aria-hidden="true" />
                  ) : (
                    <X size={14} className="text-rose-500" aria-hidden="true" />
                  )}
                  <span className="text-stone-700">{voterName}</span>
                  <span className="text-stone-400">
                    {vote.vote === 'approve' ? 'approved' : 'rejected'}
                  </span>
                </div>
              );
            })}
            {/* Show who hasn't voted yet (pending only) */}
            {isPending &&
              members
                .filter((m) => !proposal.votes.some((v) => v.voterId === m.userId))
                .map((member) => (
                  <div key={member.userId} className="flex items-center gap-2 text-stone-400">
                    <Clock size={14} aria-hidden="true" />
                    <span>
                      {member.userId === currentUserId
                        ? 'You'
                        : member.profile.displayName}
                    </span>
                    <span>waiting</span>
                  </div>
                ))}
          </div>
        )}
      </div>

      {/* Actions footer */}
      {(canWithdraw || canDismiss) && (
        <div className="flex gap-2 px-4 pb-4 border-t border-stone-100 pt-3">
          {canWithdraw && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onWithdraw}
              className="text-stone-500 hover:text-rose-600"
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>Withdraw</span>
            </Button>
          )}
          {canDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-stone-500 hover:text-stone-700 ml-auto"
            >
              <X size={16} aria-hidden="true" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
