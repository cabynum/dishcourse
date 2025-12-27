/**
 * PlanPage - Create and view a weekly meal plan.
 *
 * Displays a week view with day slots for each day of the plan.
 * Users can tap a day to assign dishes to that day.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { usePlans, useDishes } from '@/hooks';
import { DaySlot } from '@/components/meals';
import { Button, EmptyState } from '@/components/ui';

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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <header
          className="sticky top-0 z-10 border-b backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 254, 247, 0.95)',
            borderColor: 'var(--color-bg-muted)',
          }}
        >
          <div className="max-w-lg mx-auto px-4 py-4">
            <div
              className="h-7 rounded w-32 animate-pulse"
              style={{ backgroundColor: 'var(--color-bg-muted)' }}
            />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl animate-pulse"
                style={{ backgroundColor: 'var(--color-bg-muted)' }}
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
        <header
          className="sticky top-0 z-10 border-b backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 254, 247, 0.95)',
            borderColor: 'var(--color-bg-muted)',
          }}
        >
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="p-2 -ml-2 rounded-xl transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2"
                style={{ color: 'var(--color-text)' }}
                aria-label="Go back"
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-text)',
                  }}
                >
                  Plan a Menu
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
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
              imageSrc="/mascot-duo.png"
              imageAlt="DishCourse mascots"
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
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: 'var(--color-text)' }}
                >
                  How many days?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DAY_COUNT_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSelectedDayCount(count)}
                      className="py-3 px-4 rounded-xl text-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        selectedDayCount === count
                          ? {
                              backgroundColor: 'var(--color-accent)',
                              color: 'var(--color-primary)',
                              boxShadow: 'var(--shadow-md)',
                            }
                          : {
                              backgroundColor: 'var(--color-card)',
                              color: 'var(--color-text)',
                              border: '1px solid var(--color-bg-muted)',
                            }
                      }
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Starting from today
                </p>
              </div>

              {/* Preview */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-bg-muted)',
                }}
              >
                <h2
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Your plan will cover:
                </h2>
                <p style={{ color: 'var(--color-text-muted)' }}>
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
                  <Calendar size={20} strokeWidth={2} />
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(255, 254, 247, 0.95)',
          borderColor: 'var(--color-bg-muted)',
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2"
              style={{ color: 'var(--color-text)' }}
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <div>
              <h1
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text)',
                }}
              >
                {currentPlan.name}
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
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
        <div
          className="mt-6 p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-bg-muted)',
          }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Days planned</span>
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>
              {daysWithDishes.filter((d) => d.dishes.length > 0).length} of {daysWithDishes.length}
            </span>
          </div>
        </div>

        {/* New Plan button */}
        <div className="mt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/plan')}
          >
            <span className="flex items-center justify-center gap-2">
              <span>➕</span>
              <span>Create New Plan</span>
            </span>
          </Button>
        </div>
      </main>
    </div>
  );
}
