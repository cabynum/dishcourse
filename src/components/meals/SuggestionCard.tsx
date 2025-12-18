/**
 * SuggestionCard Component
 *
 * Displays a suggested meal combination (entree + sides).
 * This is the "magic moment" - the core value prop of AliCooks.
 * Designed to be visually delightful and feel special.
 */

import { useState, useEffect, useRef } from 'react';
import type { MealSuggestion } from '@/types';
import { Button } from '../ui';

export interface SuggestionCardProps {
  /** The meal suggestion to display */
  suggestion: MealSuggestion;
  /** Called when user wants to try a different suggestion */
  onTryAnother?: () => void;
  /** Called when user accepts this suggestion */
  onAccept?: () => void;
}

/**
 * Card displaying a suggested meal with entree and sides.
 *
 * Features:
 * - Prominent entree display with decorative icon
 * - Side dishes listed with visual hierarchy
 * - "Try Another" and optional "Accept" actions
 * - Warm, inviting color scheme
 * - Subtle gradient background for visual interest
 *
 * @example
 * ```tsx
 * <SuggestionCard
 *   suggestion={suggestion}
 *   onTryAnother={() => generate()}
 * />
 * ```
 */
export function SuggestionCard({
  suggestion,
  onTryAnother,
  onAccept,
}: SuggestionCardProps) {
  const { entree, sides } = suggestion;
  const hasSides = sides.length > 0;

  // Track suggestion changes for animation
  const [animationKey, setAnimationKey] = useState(0);
  const prevEntreeId = useRef(entree.id);

  useEffect(() => {
    // Trigger animation when suggestion changes
    if (prevEntreeId.current !== entree.id) {
      setAnimationKey((k) => k + 1);
      prevEntreeId.current = entree.id;
    }
  }, [entree.id]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main card with gradient background and entrance animation */}
      <div
        key={animationKey}
        className={[
          'relative overflow-hidden',
          'bg-gradient-to-br from-amber-50 via-white to-orange-50',
          'rounded-2xl',
          'shadow-lg shadow-amber-900/10',
          'border border-amber-200/60',
          'animate-suggestion-enter',
        ].join(' ')}
      >
        {/* Decorative background element */}
        <div
          className={[
            'absolute -top-24 -right-24',
            'w-48 h-48',
            'bg-gradient-to-br from-amber-200/30 to-orange-200/20',
            'rounded-full blur-2xl',
          ].join(' ')}
          aria-hidden="true"
        />

        {/* Content container */}
        <div className="relative p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-amber-600 tracking-wide uppercase mb-1">
              Tonight's Suggestion
            </p>
            <div
              className="w-8 h-0.5 bg-gradient-to-r from-amber-300 to-orange-300 mx-auto rounded-full"
              aria-hidden="true"
            />
          </div>

          {/* Entree - the star of the show */}
          <div className="text-center mb-6">
            {/* Decorative plate icon with gentle pulse */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-400/30 animate-gentle-pulse">
              <span className="text-3xl" role="img" aria-hidden="true">
                🍽️
              </span>
            </div>

            {/* Entree name */}
            <h2 className="text-2xl font-bold text-stone-800 leading-tight">
              {entree.name}
            </h2>

            {/* Type badge */}
            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
              Main Course
            </span>
          </div>

          {/* Sides section */}
          {hasSides && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  paired with
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {sides.map((side) => (
                  <div
                    key={side.id}
                    className={[
                      'inline-flex items-center gap-2',
                      'px-4 py-2',
                      'bg-white/80 backdrop-blur-sm',
                      'border border-emerald-200',
                      'rounded-xl',
                      'shadow-sm',
                    ].join(' ')}
                  >
                    <span className="text-lg" role="img" aria-hidden="true">
                      🥗
                    </span>
                    <span className="font-medium text-stone-700">
                      {side.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty sides message */}
          {!hasSides && (
            <div className="mb-6 text-center">
              <p className="text-sm text-stone-500 italic">
                Add some side dishes for complete meal suggestions!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {onTryAnother && (
              <Button
                variant="secondary"
                fullWidth
                onClick={onTryAnother}
              >
                <span className="flex items-center justify-center gap-2">
                  <span role="img" aria-hidden="true">🔄</span>
                  Try Another
                </span>
              </Button>
            )}

            {onAccept && (
              <Button
                variant="primary"
                fullWidth
                onClick={onAccept}
              >
                <span className="flex items-center justify-center gap-2">
                  <span role="img" aria-hidden="true">✓</span>
                  Sounds Good!
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

