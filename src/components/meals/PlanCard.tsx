/**
 * PlanCard Component
 *
 * Displays a meal plan summary with date range and progress.
 * Designed for mobile with 44px minimum touch targets.
 */

import type { MealPlan, Dish } from '@/types';

export interface PlanCardProps {
  /** The meal plan to display */
  plan: MealPlan;
  /** Dishes to resolve IDs to names (for showing planned count) */
  dishes: Dish[];
  /** Click handler - makes card tappable */
  onClick?: () => void;
  /** Highlight as the current/active plan */
  isCurrent?: boolean;
}

/**
 * Formats a date string into readable format (e.g., "Dec 16")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Card component for displaying a meal plan summary.
 *
 * Features:
 * - Date range display
 * - Progress indicator (X of Y days planned)
 * - Current plan highlight
 * - 44px minimum height for touch targets
 * - Tap feedback with scale animation
 *
 * @example
 * <PlanCard
 *   plan={weekPlan}
 *   dishes={allDishes}
 *   onClick={() => navigate(`/plan/${weekPlan.id}`)}
 *   isCurrent={true}
 * />
 */
export function PlanCard({
  plan,
  dishes,
  onClick,
  isCurrent = false,
}: PlanCardProps) {
  const isInteractive = Boolean(onClick);
  const today = getTodayString();

  // Calculate stats
  const totalDays = plan.days.length;
  const plannedDays = plan.days.filter((d) => d.dishIds.length > 0).length;

  // Check if plan includes today
  const includestoday = plan.days.some((d) => d.date === today);

  // Get date range
  const startDate = plan.startDate;
  const endDate = plan.days[plan.days.length - 1]?.date || startDate;

  // Count total dishes assigned
  const totalDishesAssigned = plan.days.reduce(
    (sum, day) => sum + day.dishIds.length,
    0
  );

  const containerClasses = [
    // Base styles
    'w-full',
    'bg-white rounded-xl',
    'border',
    isCurrent ? 'border-amber-400 bg-amber-50/30' : 'border-stone-200',
    // Padding
    'px-4 py-3',
    // Minimum touch target
    'min-h-[72px]',
    // Interactive styles
    isInteractive && [
      'cursor-pointer',
      'transition-all duration-150',
      'hover:border-stone-300 hover:shadow-sm',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
      'active:scale-[0.98]',
    ],
  ]
    .flat()
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {/* Plan name with current badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" role="img" aria-hidden="true">
            📅
          </span>
          <span className="font-medium text-stone-800 truncate">
            {plan.name}
          </span>
          {isCurrent && includestoday && (
            <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              Active
            </span>
          )}
        </div>

        {/* Date range and stats */}
        <div className="flex items-center gap-3 text-sm text-stone-500 ml-8">
          <span>
            {formatDate(startDate)} – {formatDate(endDate)}
          </span>
          <span className="text-stone-300">•</span>
          <span>
            {plannedDays}/{totalDays} days
          </span>
          {totalDishesAssigned > 0 && (
            <>
              <span className="text-stone-300">•</span>
              <span>
                {totalDishesAssigned} {totalDishesAssigned === 1 ? 'dish' : 'dishes'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      {isInteractive && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-stone-400 shrink-0"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </div>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        className={containerClasses}
        onClick={onClick}
        aria-label={`${plan.name}, ${formatDate(startDate)} to ${formatDate(endDate)}, ${plannedDays} of ${totalDays} days planned`}
      >
        {content}
      </button>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}

