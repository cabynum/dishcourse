/**
 * SuggestionPage - The meal suggestion experience.
 *
 * This is the "magic moment" of AliCooks - where users get dinner ideas.
 * Generates random meal suggestions and lets users try different options.
 */

import { useNavigate } from 'react-router-dom';
import { useSuggestion } from '@/hooks';
import { SuggestionCard } from '@/components/meals';
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
 * Sparkles icon for the empty/unavailable state
 */
function SparklesIcon() {
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
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
      <path d="M19 14l.5 1.5L21 16l-1.5.5L19 18l-.5-1.5L17 16l1.5-.5L19 14z" />
    </svg>
  );
}

export function SuggestionPage() {
  const navigate = useNavigate();
  const { suggestion, generate, isAvailable, message, isLoading } =
    useSuggestion();

  const handleBack = () => {
    navigate('/');
  };

  const handleAddDish = () => {
    navigate('/add');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
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
                Meal Suggestion
              </h1>
              <p className="text-sm text-stone-500">
                What should I make for dinner?
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-amber-200 rounded-full mx-auto" />
              <div className="h-6 bg-stone-200 rounded-lg w-48 mx-auto" />
              <div className="h-4 bg-stone-100 rounded w-32 mx-auto" />
            </div>
            <p className="text-stone-500 mt-6">{message}</p>
          </div>
        )}

        {/* Not available - need more dishes */}
        {!isLoading && !isAvailable && (
          <div className="py-8">
            <EmptyState
              icon={<SparklesIcon />}
              title="Need More Dishes"
              message={message}
              action={{
                label: 'Add a Dish',
                onClick: handleAddDish,
              }}
            />

            {/* Additional encouragement */}
            <div className="mt-8 text-center">
              <p className="text-sm text-stone-500">
                Add at least one entree to start getting suggestions.
                <br />
                Side dishes make suggestions even better!
              </p>
            </div>
          </div>
        )}

        {/* Has suggestion */}
        {!isLoading && isAvailable && suggestion && (
          <div className="space-y-6">
            <SuggestionCard
              suggestion={suggestion}
              onTryAnother={generate}
            />

            {/* Helpful tip */}
            <p className="text-center text-sm text-stone-500">
              {message}
            </p>
          </div>
        )}

        {/* Available but no suggestion yet (edge case) */}
        {!isLoading && isAvailable && !suggestion && (
          <div className="text-center py-12">
            <Button variant="primary" onClick={generate}>
              Get a Suggestion
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

