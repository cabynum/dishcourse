/**
 * CelebrationModal Component
 *
 * A delightful modal that appears when a proposal reaches consensus!
 * Everyone voted approve - time to celebrate!
 *
 * Features:
 * - CSS confetti animation (no external dependencies)
 * - Shows the approved meal prominently
 * - Auto-dismisses after 5 seconds
 * - Manual dismiss with button
 */

import { useEffect, useState } from 'react';
import { PartyPopper, Check, Utensils, Leaf, Calendar } from 'lucide-react';
import type { Proposal, Dish } from '@/types';
import { Button } from '../ui';

export interface CelebrationModalProps {
  /** The approved proposal to celebrate */
  proposal: Proposal;
  /** All household dishes (to resolve IDs) */
  dishes: Dish[];
  /** Called when user dismisses the celebration */
  onClose: () => void;
  /** Optional: Called when user wants to add meal to a plan */
  onAddToPlan?: () => void;
}

/**
 * Confetti piece component - a single animated piece
 */
function ConfettiPiece({ delay, left }: { delay: number; left: number }) {
  const colors = [
    'bg-amber-400',
    'bg-emerald-400',
    'bg-rose-400',
    'bg-blue-400',
    'bg-purple-400',
    'bg-orange-400',
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      className={`absolute w-2 h-2 ${color} rounded-sm`}
      style={{
        left: `${left}%`,
        top: '-8px',
        animation: `confetti-fall 3s ease-out ${delay}s forwards`,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Confetti animation container
 */
function Confetti() {
  // Generate confetti pieces on mount
  const [pieces] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.5,
      left: Math.random() * 100,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} delay={piece.delay} left={piece.left} />
      ))}
    </div>
  );
}

/**
 * CelebrationModal displays a celebratory message when consensus is reached.
 *
 * @example
 * ```tsx
 * {showCelebration && (
 *   <CelebrationModal
 *     proposal={approvedProposal}
 *     dishes={dishes}
 *     onClose={() => setShowCelebration(false)}
 *   />
 * )}
 * ```
 */
export function CelebrationModal({
  proposal,
  dishes,
  onClose,
  onAddToPlan,
}: CelebrationModalProps) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Resolve dish names
  const entree = dishes.find((d) => d.id === proposal.meal.entreeId);
  const sides = proposal.meal.sideIds
    .map((id) => dishes.find((d) => d.id === id))
    .filter(Boolean) as Dish[];

  // Format the target date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "tonight's";
    if (diffDays === 1) return "tomorrow's";
    
    return date.toLocaleDateString('en-US', { weekday: 'long' }) + "'s";
  };

  return (
    <>
      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes celebration-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
      >
        {/* Confetti animation */}
        <Confetti />

        {/* Modal content */}
        <div
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: 'celebration-bounce 0.6s ease-out' }}
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 p-6 text-center">
            {/* Decorative circles */}
            <div className="absolute top-2 left-2 w-4 h-4 bg-white/20 rounded-full" />
            <div className="absolute top-4 right-6 w-2 h-2 bg-white/30 rounded-full" />
            <div className="absolute bottom-3 left-8 w-3 h-3 bg-white/20 rounded-full" />

            {/* Party icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-3 bg-white/20 rounded-full backdrop-blur-sm">
              <PartyPopper size={32} className="text-white" aria-hidden="true" />
            </div>

            <h2
              id="celebration-title"
              className="text-2xl font-bold text-white mb-1"
            >
              It's Decided!
            </h2>
            <p className="text-white/90 text-sm">
              Everyone approved {formatDate(proposal.targetDate)} dinner
            </p>
          </div>

          {/* Meal display */}
          <div className="p-6">
            {/* Entree */}
            {entree && (
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
                  <Utensils size={24} className="text-amber-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xl font-bold text-stone-800">{entree.name}</p>
                  <p className="text-sm text-stone-500">Main Course</p>
                </div>
              </div>
            )}

            {/* Sides */}
            {sides.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {sides.map((side) => (
                  <div
                    key={side.id}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl"
                  >
                    <Leaf size={16} className="text-emerald-600" aria-hidden="true" />
                    <span className="text-sm font-medium text-emerald-800">
                      {side.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Approval indicator */}
            <div className="flex items-center justify-center gap-2 mb-6 text-emerald-600">
              <Check size={20} aria-hidden="true" />
              <span className="text-sm font-medium">Everyone approved!</span>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Dismiss button - primary action */}
              <Button
                variant="primary"
                fullWidth
                onClick={onClose}
              >
                Awesome!
              </Button>

              {/* Optional: Add to plan */}
              {onAddToPlan && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={onAddToPlan}
                >
                  <Calendar size={18} aria-hidden="true" />
                  <span>Add to Plan</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
