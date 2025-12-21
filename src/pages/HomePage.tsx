/**
 * HomePage - The main landing page for AliCooks.
 *
 * Shows the user's dish collection with quick access to main actions:
 * - View all dishes
 * - Add a new dish
 * - Get meal suggestions
 * - Plan a menu
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Dices } from 'lucide-react';
import { DishList, PlanCard } from '@/components/meals';
import { useDishes, usePlans } from '@/hooks';

/**
 * Food photos from Unsplash (free, high-quality, open license)
 * These rotate on each page load for visual variety
 */
const HEADER_PHOTOS = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', // Colorful salad
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80', // Pasta
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80', // Vegetables
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // Breakfast
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', // Salmon
];

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Gets a random photo index for visual variety on each app open
 */
function getRandomPhotoIndex(): number {
  return Math.floor(Math.random() * HEADER_PHOTOS.length);
}

export function HomePage() {
  const navigate = useNavigate();
  const { dishes, isLoading: dishesLoading } = useDishes();
  const { plans, isLoading: plansLoading } = usePlans();
  const [photoIndex] = useState(getRandomPhotoIndex);

  // Preload the header image
  useEffect(() => {
    const img = new Image();
    img.src = HEADER_PHOTOS[photoIndex];
  }, [photoIndex]);

  const handleAddClick = () => {
    navigate('/add');
  };

  const handleDishClick = (dish: { id: string }) => {
    navigate(`/edit/${dish.id}`);
  };

  const handleSuggestClick = () => {
    navigate('/suggest');
  };

  const handlePlanClick = () => {
    // If there's a current/active plan, go to it; otherwise create new
    const activePlan = getActivePlan();
    if (activePlan) {
      navigate(`/plan/${activePlan.id}`);
    } else {
      navigate('/plan');
    }
  };

  const handlePlanCardClick = (planId: string) => {
    navigate(`/plan/${planId}`);
  };

  // Get the "active" plan - one that includes today or the most recent one
  const getActivePlan = () => {
    if (plans.length === 0) return null;

    const today = getTodayString();

    // First, look for a plan that includes today
    const planWithToday = plans.find((plan) =>
      plan.days.some((d) => d.date === today)
    );
    if (planWithToday) return planWithToday;

    // Otherwise, return the most recently created plan
    const sortedPlans = [...plans].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedPlans[0];
  };

  // Check if we have enough dishes to suggest (at least one entree)
  const hasEntrees = dishes.some((d) => d.type === 'entree');
  const hasDishes = dishes.length > 0;
  const isLoading = dishesLoading || plansLoading;

  // Get active plan for display
  const activePlan = getActivePlan();
  const today = getTodayString();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header with Food Photo */}
      <header className="relative overflow-hidden">
        {/* Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HEADER_PHOTOS[photoIndex]}')` }}
        >
          {/* Dark overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
            }}
          />
        </div>

        {/* Header Content */}
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-1">Good evening 👋🏾</p>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                AliCooks
              </h1>
            </div>
            {/* Avatar placeholder - could be user profile photo */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              🍳
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePlanClick}
              disabled={!hasDishes}
              className={[
                'flex-1 flex items-center justify-center gap-2',
                'py-3.5 px-4 rounded-xl',
                'bg-white/15 backdrop-blur-sm',
                'text-white font-semibold',
                'border border-white/20',
                'transition-all duration-150',
                hasDishes
                  ? 'hover:bg-white/25 active:scale-[0.98]'
                  : 'opacity-50 cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
              ].join(' ')}
              aria-label={hasDishes ? 'Plan a menu' : 'Plan menu - add dishes first'}
            >
              <Calendar size={20} strokeWidth={2} />
              <span>Plan</span>
            </button>
            <button
              type="button"
              onClick={handleSuggestClick}
              disabled={!hasEntrees}
              className={[
                'flex-1 flex items-center justify-center gap-2',
                'py-3.5 px-4 rounded-xl',
                'font-semibold',
                'transition-all duration-150',
                hasEntrees
                  ? 'hover:opacity-90 active:scale-[0.98]'
                  : 'opacity-50 cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              ].join(' ')}
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-primary)',
              }}
              aria-label={hasEntrees ? 'Get meal suggestion' : 'Suggest a meal - add entrees first'}
            >
              <Dices size={20} strokeWidth={2} />
              <span>Suggest</span>
            </button>
          </div>

          {!hasEntrees && (
            <p className="text-xs text-white/70 text-center mt-3">
              Add an entree to start getting suggestions!
            </p>
          )}
        </div>
      </header>

      {/* Main content - extra padding at bottom for nav bar */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        {/* My Plans Section - only show if there are plans */}
        {plans.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-xl font-semibold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text)',
                }}
              >
                This Week
              </h2>
              <button
                type="button"
                onClick={() => navigate('/plan')}
                className="text-sm font-medium"
                style={{ color: 'var(--color-secondary)' }}
              >
                + New
              </button>
            </div>

            <div className="space-y-2">
              {/* Show the active/current plan prominently */}
              {activePlan && (
                <PlanCard
                  plan={activePlan}
                  onClick={() => handlePlanCardClick(activePlan.id)}
                  isCurrent={activePlan.days.some((d) => d.date === today)}
                />
              )}

              {/* Show other plans (up to 2 more) */}
              {plans
                .filter((p) => p.id !== activePlan?.id)
                .slice(0, 2)
                .map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => handlePlanCardClick(plan.id)}
                  />
                ))}

              {/* Show "view all" if more than 3 plans */}
              {plans.length > 3 && (
                <p
                  className="text-center text-sm pt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {plans.length - 3} more {plans.length - 3 === 1 ? 'plan' : 'plans'}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Dishes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-semibold"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
              }}
            >
              My Dishes
            </h2>
            {dishes.length > 0 && (
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: 'var(--color-card)' }}
            >
              <div className="animate-pulse space-y-3">
                <div
                  className="h-12 rounded-xl"
                  style={{ backgroundColor: 'var(--color-bg-muted)' }}
                />
                <div
                  className="h-12 rounded-xl"
                  style={{ backgroundColor: 'var(--color-bg-muted)' }}
                />
                <div
                  className="h-12 rounded-xl"
                  style={{ backgroundColor: 'var(--color-bg-muted)' }}
                />
              </div>
              <p className="text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>
                Loading dishes...
              </p>
            </div>
          ) : (
            <DishList
              dishes={dishes}
              onDishClick={handleDishClick}
              onAddClick={handleAddClick}
              showFilters={dishes.length > 3}
            />
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      {dishes.length > 0 && (
        <button
          type="button"
          onClick={handleAddClick}
          className={[
            // Positioning
            'fixed bottom-6 right-6',
            // Size and shape
            'w-14 h-14 rounded-full',
            // Shadow
            'shadow-lg',
            // Hover/active states
            'hover:shadow-xl hover:scale-105',
            'active:scale-95',
            // Transitions
            'transition-all duration-150',
            // Focus
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            // Flex for centering icon
            'flex items-center justify-center',
          ].join(' ')}
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-primary)',
          }}
          aria-label="Add a dish"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
