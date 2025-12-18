/**
 * HomePage - The main landing page for AliCooks.
 *
 * Shows the user's dish collection with quick access to main actions:
 * - View all dishes
 * - Add a new dish
 * - Get meal suggestions (coming soon)
 * - Plan a menu (coming soon)
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { DishList } from '@/components/meals';
import { useDishes } from '@/hooks';

/**
 * Plus icon for the floating action button
 */
function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Settings icon for the header
 */
function SettingsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { dishes, isLoading } = useDishes();

  const handleAddClick = () => {
    navigate('/add');
  };

  const handleDishClick = (dish: { id: string }) => {
    // Future: navigate to edit page
    // For now, this is a placeholder
    navigate(`/edit/${dish.id}`);
  };

  const handleSuggestClick = () => {
    navigate('/suggest');
  };

  const handlePlanClick = () => {
    navigate('/plan');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // Check if we have enough dishes to suggest (at least one entree)
  const hasEntrees = dishes.some((d) => d.type === 'entree');
  const hasDishes = dishes.length > 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">AliCooks</h1>
              <p className="text-sm text-stone-500">Your meal planning companion</p>
            </div>
            <button
              type="button"
              onClick={handleSettingsClick}
              className={[
                'p-2 -mr-2 mt-0.5',
                'text-stone-500 hover:text-stone-700',
                'hover:bg-stone-100',
                'rounded-lg',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              ].join(' ')}
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Quick Actions */}
        <section className="mb-6">
          <div className="flex gap-3">
            <Button
              variant={hasEntrees ? 'primary' : 'secondary'}
              disabled={!hasEntrees}
              className={`flex-1 ${!hasEntrees ? 'opacity-50' : ''}`}
              onClick={handleSuggestClick}
              aria-label={hasEntrees ? 'Get meal suggestion' : 'Suggest a meal - add entrees first'}
            >
              <span className="flex items-center gap-2">
                <span>🎲</span>
                <span>Suggest</span>
              </span>
            </Button>
            <Button
              variant={hasDishes ? 'secondary' : 'secondary'}
              disabled={!hasDishes}
              className={`flex-1 ${!hasDishes ? 'opacity-50' : ''}`}
              onClick={handlePlanClick}
              aria-label={hasDishes ? 'Plan a menu' : 'Plan menu - add dishes first'}
            >
              <span className="flex items-center gap-2">
                <span>📅</span>
                <span>Plan</span>
              </span>
            </Button>
          </div>
          {!hasEntrees && (
            <p className="text-xs text-stone-400 text-center mt-2">
              Add an entree to start getting suggestions!
            </p>
          )}
        </section>

        {/* Dishes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-800">My Dishes</h2>
            {dishes.length > 0 && (
              <span className="text-sm text-stone-500">
                {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="animate-pulse space-y-3">
                <div className="h-12 bg-stone-100 rounded-lg" />
                <div className="h-12 bg-stone-100 rounded-lg" />
                <div className="h-12 bg-stone-100 rounded-lg" />
              </div>
              <p className="text-stone-400 text-sm mt-4">Loading dishes...</p>
            </div>
          ) : (
            <DishList
              dishes={dishes}
              onDishClick={handleDishClick}
              onAddClick={handleAddClick}
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
            // Colors
            'bg-amber-500 text-white',
            // Shadow
            'shadow-lg shadow-amber-500/30',
            // Hover/active states
            'hover:bg-amber-600 hover:shadow-xl hover:scale-105',
            'active:scale-95',
            // Transitions
            'transition-all duration-150',
            // Focus
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
            // Flex for centering icon
            'flex items-center justify-center',
          ].join(' ')}
          aria-label="Add a dish"
        >
          <PlusIcon />
        </button>
      )}
    </div>
  );
}
