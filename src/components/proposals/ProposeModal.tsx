/**
 * ProposeModal Component
 *
 * Modal for creating a new meal proposal.
 * Can be pre-filled with a meal suggestion or built from scratch.
 *
 * Features:
 * - Date picker (default: today)
 * - Meal preview
 * - Household notification message
 * - Cancel/Propose actions
 */

import { useState } from 'react';
import { Calendar, Utensils, Leaf, Users, X } from 'lucide-react';
import type { Dish, ProposedMeal } from '@/types';
import { Button } from '../ui';

export interface ProposeModalProps {
  /** Pre-filled meal (from suggestion), or undefined to build from scratch */
  meal?: ProposedMeal;
  /** All household dishes (to resolve IDs and for selection) */
  dishes: Dish[];
  /** Number of household members (for notification message) */
  memberCount: number;
  /** Whether a proposal is being created */
  isSubmitting?: boolean;
  /** Called when user confirms the proposal */
  onPropose: (meal: ProposedMeal, targetDate: string) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date options for the next 7 days
 */
function getDateOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const value = date.toISOString().split('T')[0];

    let label: string;
    if (i === 0) {
      label = 'Tonight';
    } else if (i === 1) {
      label = 'Tomorrow';
    } else {
      label = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    options.push({ value, label });
  }

  return options;
}

/**
 * ProposeModal for creating a new proposal.
 *
 * @example
 * ```tsx
 * // From a suggestion
 * <ProposeModal
 *   meal={{ entreeId: suggestion.entree.id, sideIds: suggestion.sides.map(s => s.id) }}
 *   dishes={dishes}
 *   memberCount={members.length}
 *   onPropose={handlePropose}
 *   onCancel={() => setShowModal(false)}
 * />
 * ```
 */
export function ProposeModal({
  meal,
  dishes,
  memberCount,
  isSubmitting = false,
  onPropose,
  onCancel,
}: ProposeModalProps) {
  const [targetDate, setTargetDate] = useState(getTodayDate());
  const dateOptions = getDateOptions();

  // Resolve dish names from the meal
  const entree = meal ? dishes.find((d) => d.id === meal.entreeId) : null;
  const sides = meal
    ? meal.sideIds.map((id) => dishes.find((d) => d.id === id)).filter(Boolean) as Dish[]
    : [];

  const hasMeal = meal && entree;

  const handleSubmit = () => {
    if (!meal) return;
    onPropose(meal, targetDate);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="propose-modal-title"
      >
        {/* Modal content */}
        <div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-100">
            <h2 id="propose-modal-title" className="text-lg font-semibold text-stone-800">
              Propose This Meal?
            </h2>
            <button
              type="button"
              className="p-2 text-stone-400 hover:text-stone-600 rounded-lg transition-colors"
              onClick={onCancel}
              aria-label="Close"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Meal preview */}
            {hasMeal && (
              <div className="p-4 bg-stone-50 rounded-xl">
                {/* Entree */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                    <Utensils size={20} className="text-amber-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800">{entree.name}</p>
                    <p className="text-xs text-stone-500">Main Course</p>
                  </div>
                </div>

                {/* Sides */}
                {sides.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-13">
                    {sides.map((side) => (
                      <div
                        key={side.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-100 rounded-lg"
                      >
                        <Leaf size={14} className="text-emerald-600" aria-hidden="true" />
                        <span className="text-sm text-emerald-800">{side.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No meal message */}
            {!hasMeal && (
              <div className="p-6 text-center bg-stone-50 rounded-xl">
                <p className="text-stone-500">
                  No meal selected. Go to Suggestions to pick a meal first!
                </p>
              </div>
            )}

            {/* Date picker */}
            <div>
              <label
                htmlFor="target-date"
                className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2"
              >
                <Calendar size={16} aria-hidden="true" />
                For when?
              </label>
              <select
                id="target-date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                {dateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification message */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <Users size={20} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-amber-800">
                {memberCount > 1 ? (
                  <>
                    Your household ({memberCount} members) will be notified to vote on this
                    proposal.
                  </>
                ) : (
                  <>
                    You're the only member. Proposals work best with multiple people!
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-stone-100">
            <Button
              variant="secondary"
              fullWidth
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={!hasMeal || isSubmitting}
              loading={isSubmitting}
            >
              Propose
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
