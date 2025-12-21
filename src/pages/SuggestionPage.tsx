/**
 * SuggestionPage - The meal suggestion experience.
 *
 * This is the "magic moment" of AliCooks - where users get dinner ideas.
 * Generates random meal suggestions and lets users try different options.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useSuggestion } from '@/hooks';
import { SuggestionCard } from '@/components/meals';
import { Button, EmptyState } from '@/components/ui';

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
                Meal Suggestion
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
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
              <div
                className="w-16 h-16 rounded-full mx-auto"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
              <div
                className="h-6 rounded-lg w-48 mx-auto"
                style={{ backgroundColor: 'var(--color-bg-muted)' }}
              />
              <div
                className="h-4 rounded w-32 mx-auto"
                style={{ backgroundColor: 'var(--color-bg-muted)' }}
              />
            </div>
            <p className="mt-6" style={{ color: 'var(--color-text-muted)' }}>
              {message}
            </p>
          </div>
        )}

        {/* Not available - need more dishes */}
        {!isLoading && !isAvailable && (
          <div className="py-8">
            <EmptyState
              icon={
                <Sparkles
                  size={48}
                  strokeWidth={1.5}
                  style={{ color: 'var(--color-accent)' }}
                />
              }
              title="Need More Dishes"
              message={message}
              action={{
                label: 'Add a Dish',
                onClick: handleAddDish,
              }}
            />

            {/* Additional encouragement */}
            <div className="mt-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
            <p
              className="text-center text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
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
