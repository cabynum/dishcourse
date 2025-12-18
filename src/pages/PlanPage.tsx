/**
 * PlanPage - Create and view a weekly meal plan.
 *
 * Displays a week view with day slots for each day of the plan.
 * Users can tap a day to assign dishes to that day.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlans, useDishes } from '@/hooks';
import { DaySlot } from '@/components/meals';
import { Button, EmptyState } from '@/components/ui';

/**
 * Back arrow icon for navigation
 */
function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

/**
 * Calendar icon for empty state
 */
function CalendarIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-amber-400"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/**
 * Formats a date to display as "Mon, Dec 16"
 */
function formatDateHeader(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Day count options for creating a new plan
 */
const DAY_COUNT_OPTIONS = [3, 5, 7, 14];

export function PlanPage() {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId?: string }>();
  const { createPlan, getPlanById, isLoading: plansLoading } = usePlans();
  const { dishes, getDishById, isLoading: dishesLoading } = useDishes();

  // For new plan creation
  const [selectedDayCount, setSelectedDayCount] = useState(7);
  const [isCreatingPlan, setIsCreatingPlan] = useState(!planId);

  // Get the current plan if we have an ID
  const currentPlan = planId ? getPlanById(planId) : null;

  // Redirect to home if plan not found (after loading completes)
  useEffect(() => {
    if (planId && !plansLoading && !currentPlan) {
      navigate('/');
    }
  }, [planId, plansLoading, currentPlan, navigate]);

  // Today's date for highlighting
  const today = getTodayString();

  // Resolve dish IDs to actual dish objects for each day
  const daysWithDishes = useMemo(() => {
    if (!currentPlan) return [];

    return currentPlan.days.map((day) => ({
      date: day.date,
      dishes: day.dishIds
        .map((id) => getDishById(id))
        .filter((d): d is NonNullable<typeof d> => d !== undefined),
    }));
  }, [currentPlan, getDishById]);

  const handleBack = () => {
    navigate('/');
  };

  const handleCreatePlan = () => {
    const newPlan = createPlan(selectedDayCount, new Date());
    navigate(`/plan/${newPlan.id}`, { replace: true });
    setIsCreatingPlan(false);
  };

  const handleDayClick = (date: string) => {
    if (currentPlan) {
      navigate(`/plan/${currentPlan.id}/${date}`);
    }
  };

  const isLoading = plansLoading || dishesLoading;

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="h-7 bg-stone-200 rounded w-32 animate-pulse" />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-20 bg-stone-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show create plan UI if no planId or creating new plan
  if (isCreatingPlan || !currentPlan) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className={[
                  'p-2 -ml-2',
                  'rounded-lg',
                  'text-stone-600',
                  'hover:bg-stone-100',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                  'transition-colors',
                ].join(' ')}
                aria-label="Go back"
              >
                <BackIcon />
              </button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Plan a Menu</h1>
                <p className="text-sm text-stone-500">
                  Choose how many days to plan
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-lg mx-auto px-4 py-8">
          {dishes.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon />}
              title="Add Some Dishes First"
              message="You'll need dishes in your collection before you can plan meals."
              action={{
                label: 'Add a Dish',
                onClick: () => navigate('/add'),
              }}
            />
          ) : (
            <div className="space-y-8">
              {/* Day count selector */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  How many days?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DAY_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSelectedDayCount(count)}
                      className={[
                        'py-3 px-4',
                        'rounded-xl',
                        'text-center',
                        'font-medium',
                        'transition-all duration-150',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                        selectedDayCount === count
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300',
                      ].join(' ')}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-stone-500 mt-2">
                  Starting from today
                </p>
              </div>

              {/* Preview */}
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <h2 className="text-sm font-medium text-stone-700 mb-2">
                  Your plan will cover:
                </h2>
                <p className="text-stone-600">
                  {formatDateHeader(today)} – {formatDateHeader(
                    new Date(
                      new Date().getTime() + (selectedDayCount - 1) * 24 * 60 * 60 * 1000
                    )
                      .toISOString()
                      .split('T')[0]
                  )}
                </p>
              </div>

              {/* Create button */}
              <Button variant="primary" fullWidth onClick={handleCreatePlan}>
                <span className="flex items-center justify-center gap-2">
                  <span>📅</span>
                  <span>Create Plan</span>
                </span>
              </Button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Show existing plan
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className={[
                'p-2 -ml-2',
                'rounded-lg',
                'text-stone-600',
                'hover:bg-stone-100',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                'transition-colors',
              ].join(' ')}
              aria-label="Go back"
            >
              <BackIcon />
            </button>
            <div>
              <h1 className="text-xl font-bold text-stone-900">
                {currentPlan.name}
              </h1>
              <p className="text-sm text-stone-500">
                {formatDateHeader(currentPlan.startDate)} – {formatDateHeader(
                  currentPlan.days[currentPlan.days.length - 1]?.date || currentPlan.startDate
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-3">
          {daysWithDishes.map((day, index) => (
            <div
              key={day.date}
              className={`animate-day-slot-enter animation-delay-${Math.min(index + 1, 7)}`}
            >
              <DaySlot
                date={day.date}
                dishes={day.dishes}
                onClick={() => handleDayClick(day.date)}
                isToday={day.date === today}
              />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-stone-200">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Days planned</span>
            <span className="font-medium text-stone-700">
              {daysWithDishes.filter((d) => d.dishes.length > 0).length} of {daysWithDishes.length}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

