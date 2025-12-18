/**
 * DayAssignmentPage - Assign dishes to a specific day in a meal plan.
 *
 * Shows the current day's assignments and allows adding/removing dishes.
 * Users can also get a suggestion for this day.
 */

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlans, useDishes, useSuggestion } from '@/hooks';
import { DishCard } from '@/components/meals';
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
 * Check icon for assigned dishes
 */
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Plus icon for adding dishes
 */
function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Formats a date string for display (e.g., "Monday, December 16")
 */
function formatDateLong(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DayAssignmentPage() {
  const navigate = useNavigate();
  const { planId, date } = useParams<{ planId: string; date: string }>();
  const { getPlanById, assignDishToDay, removeDishFromDay, isLoading: plansLoading } = usePlans();
  const { dishes, getDishById, isLoading: dishesLoading } = useDishes();
  const { suggestion, generate, isAvailable: canSuggest } = useSuggestion();

  // Get the current plan and day
  const plan = planId ? getPlanById(planId) : null;
  const dayAssignment = plan?.days.find((d) => d.date === date);

  // Resolve assigned dish IDs to actual dish objects
  const assignedDishes = useMemo(() => {
    if (!dayAssignment) return [];
    return dayAssignment.dishIds
      .map((id) => getDishById(id))
      .filter((d): d is NonNullable<typeof d> => d !== undefined);
  }, [dayAssignment, getDishById]);

  // Get dishes available to add (not already assigned to this day)
  const availableDishes = useMemo(() => {
    if (!dayAssignment) return dishes;
    const assignedSet = new Set(dayAssignment.dishIds);
    return dishes.filter((d) => !assignedSet.has(d.id));
  }, [dishes, dayAssignment]);

  const isLoading = plansLoading || dishesLoading;

  const handleBack = () => {
    if (planId) {
      navigate(`/plan/${planId}`);
    } else {
      navigate('/');
    }
  };

  const handleAddDish = (dishId: string) => {
    if (planId && date) {
      assignDishToDay(planId, date, dishId);
    }
  };

  const handleRemoveDish = (dishId: string) => {
    if (planId && date) {
      removeDishFromDay(planId, date, dishId);
    }
  };

  const handleSuggest = () => {
    generate();
  };

  const handleAddSuggestion = () => {
    if (!suggestion || !planId || !date) return;

    // Add the entree
    assignDishToDay(planId, date, suggestion.entree.id);

    // Add all sides
    suggestion.sides.forEach((side) => {
      assignDishToDay(planId, date, side.id);
    });
  };

  // Redirect if plan or date not found
  if (!isLoading && (!plan || !dayAssignment || !date)) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="h-7 bg-stone-200 rounded w-48 animate-pulse" />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-stone-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

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
                {date ? formatDateLong(date) : 'Plan Day'}
              </h1>
              <p className="text-sm text-stone-500">
                {assignedDishes.length === 0
                  ? 'No dishes assigned yet'
                  : `${assignedDishes.length} ${assignedDishes.length === 1 ? 'dish' : 'dishes'} assigned`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Currently assigned dishes */}
        {assignedDishes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
              Today's Meal
            </h2>
            <div className="space-y-2">
              {assignedDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1">
                    <DishCard dish={dish} compact />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDish(dish.id)}
                    className={[
                      'p-2',
                      'rounded-lg',
                      'text-stone-500',
                      'hover:text-red-500 hover:bg-red-50',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                      'transition-colors',
                    ].join(' ')}
                    aria-label={`Remove ${dish.name}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Suggestion section */}
        {canSuggest && (
          <section className="mb-8">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
              <h3 className="text-sm font-semibold text-amber-700 mb-2">
                Need inspiration?
              </h3>
              {suggestion ? (
                <div className="space-y-3">
                  <div className="text-sm text-stone-700">
                    <span className="font-medium">{suggestion.entree.name}</span>
                    {suggestion.sides.length > 0 && (
                      <span className="text-stone-500">
                        {' '}with {suggestion.sides.map((s) => s.name).join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddSuggestion}
                    >
                      <span className="flex items-center gap-1">
                        <CheckIcon />
                        Add This
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSuggest}
                    >
                      Try Another
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSuggest}
                >
                  <span className="flex items-center gap-1">
                    <span>🎲</span>
                    Get a Suggestion
                  </span>
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Available dishes to add */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Add Dishes
          </h2>

          {availableDishes.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-stone-200">
              {dishes.length === 0 ? (
                <EmptyState
                  title="No Dishes Yet"
                  message="Add some dishes to your collection first."
                  action={{
                    label: 'Add a Dish',
                    onClick: () => navigate('/add'),
                  }}
                />
              ) : (
                <p className="text-stone-500 text-sm">
                  All dishes are already assigned to this day!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {availableDishes.map((dish) => (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => handleAddDish(dish.id)}
                  className={[
                    'w-full',
                    'flex items-center gap-3',
                    'bg-white rounded-xl',
                    'border border-stone-200',
                    'px-4 py-3',
                    'text-left',
                    'cursor-pointer',
                    'transition-all duration-150',
                    'hover:border-amber-300 hover:bg-amber-50/50',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                    'active:scale-[0.99]',
                  ].join(' ')}
                >
                  <span className="flex-1 flex items-center gap-3">
                    <span className="font-medium text-stone-800 truncate">
                      {dish.name}
                    </span>
                    <span
                      className={[
                        'shrink-0',
                        'px-2 py-0.5',
                        'text-xs font-medium',
                        'rounded-full',
                        dish.type === 'entree'
                          ? 'bg-amber-100 text-amber-700'
                          : dish.type === 'side'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-600',
                      ].join(' ')}
                    >
                      {dish.type === 'entree' ? 'Entree' : dish.type === 'side' ? 'Side' : 'Other'}
                    </span>
                  </span>
                  <span className="text-amber-500">
                    <PlusIcon />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

