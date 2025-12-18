/**
 * DaySlot Component
 *
 * Displays a single day in a meal plan view with its assigned dishes.
 * Designed for mobile with clear tap targets and visual hierarchy.
 */

import type { Dish } from '@/types';

export interface DaySlotProps {
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string;
  /** Dishes assigned to this day */
  dishes: Dish[];
  /** Click handler for selecting/editing the day */
  onClick: () => void;
  /** Highlight if this is today's date */
  isToday?: boolean;
}

/**
 * Formats a date string into day name (e.g., "Mon", "Tue")
 */
function getDayName(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00'); // Force local timezone
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Formats a date string into day number (e.g., "16", "17")
 */
function getDayNumber(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.getDate().toString();
}

/**
 * DaySlot component for meal plan week view.
 *
 * Features:
 * - Shows day name and date number
 * - Displays assigned dishes (up to 3, then "+N more")
 * - Empty state encourages adding dishes
 * - Highlights today's date with accent color
 * - Tap feedback with subtle scale animation
 * - 44px minimum touch target
 *
 * @example
 * ```tsx
 * <DaySlot
 *   date="2024-12-16"
 *   dishes={[chicken, rice]}
 *   onClick={() => navigate(`/plan/${planId}/2024-12-16`)}
 *   isToday={true}
 * />
 * ```
 */
export function DaySlot({
  date,
  dishes,
  onClick,
  isToday = false,
}: DaySlotProps) {
  const dayName = getDayName(date);
  const dayNumber = getDayNumber(date);
  const hasDishes = dishes.length > 0;

  // Show first 3 dishes, then indicate more
  const visibleDishes = dishes.slice(0, 3);
  const extraCount = dishes.length - 3;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        // Base styles
        'w-full',
        'min-h-[80px]',
        'p-3',
        'rounded-xl',
        'border',
        'text-left',
        // Conditional border/background
        isToday
          ? 'border-amber-400 bg-amber-50/50'
          : 'border-stone-200 bg-white',
        // Interactive styles
        'cursor-pointer',
        'transition-all duration-150',
        'hover:border-stone-300 hover:shadow-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
        'active:scale-[0.98]',
      ].join(' ')}
      aria-label={`${dayName} ${dayNumber}, ${hasDishes ? `${dishes.length} dishes assigned` : 'no dishes assigned'}`}
    >
      {/* Header: Day name and number */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={[
            'text-xs font-semibold uppercase tracking-wide',
            isToday ? 'text-amber-600' : 'text-stone-500',
          ].join(' ')}
        >
          {dayName}
        </span>
        <span
          className={[
            'flex items-center justify-center',
            'w-7 h-7',
            'text-sm font-bold',
            'rounded-full',
            isToday
              ? 'bg-amber-500 text-white'
              : 'bg-stone-100 text-stone-700',
          ].join(' ')}
        >
          {dayNumber}
        </span>
        {isToday && (
          <span className="text-xs font-medium text-amber-600 ml-auto">
            Today
          </span>
        )}
      </div>

      {/* Dishes list or empty state */}
      {hasDishes ? (
        <div className="space-y-1">
          {visibleDishes.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className={[
                  'w-2 h-2 rounded-full',
                  dish.type === 'entree' ? 'bg-amber-400' : 'bg-emerald-400',
                ].join(' ')}
                aria-hidden="true"
              />
              <span className="text-stone-700 truncate">{dish.name}</span>
            </div>
          ))}
          {extraCount > 0 && (
            <span className="text-xs text-stone-500 pl-4">
              +{extraCount} more
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-2xl opacity-30" role="img" aria-hidden="true">
            🍽️
          </span>
          <span className="text-sm text-stone-500 italic">
            Tap to add dishes
          </span>
        </div>
      )}
    </button>
  );
}

