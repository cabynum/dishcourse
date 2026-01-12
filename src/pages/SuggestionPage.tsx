/**
 * SuggestionPage - The meal suggestion experience.
 *
 * This is the "magic moment" of DishCourse - where users get dinner ideas.
 * Generates random meal suggestions and lets users try different options.
 * Now includes "Propose This" for household voting.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hand } from 'lucide-react';
import { useSuggestion, useDishes, useHousehold, useProposals } from '@/hooks';
import { SuggestionCard } from '@/components/meals';
import { ProposeModal } from '@/components/proposals';
import { Button, EmptyState } from '@/components/ui';
import type { ProposedMeal } from '@/types';

export function SuggestionPage() {
  const navigate = useNavigate();
  const { suggestion, generate, isAvailable, message, isLoading } =
    useSuggestion();
  const { dishes } = useDishes();
  const { members } = useHousehold();
  const { createProposal, isAvailable: proposalsAvailable } = useProposals();

  const [showProposeModal, setShowProposeModal] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const handleBack = () => {
    navigate('/');
  };

  const handleAddDish = () => {
    navigate('/add');
  };

  const handleProposeClick = () => {
    setShowProposeModal(true);
  };

  const handlePropose = async (meal: ProposedMeal, targetDate: string) => {
    setIsSubmittingProposal(true);
    try {
      await createProposal(meal, targetDate);
      setShowProposeModal(false);
      // Navigate to proposals page to see the new proposal
      navigate('/proposals');
    } catch (err) {
      console.error('Failed to create proposal:', err);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Build the meal from the current suggestion
  const currentMeal: ProposedMeal | undefined = suggestion
    ? {
        entreeId: suggestion.entree.id,
        sideIds: suggestion.sides.map((s) => s.id),
      }
    : undefined;

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
              imageSrc="/mascot-duo.png"
              imageAlt="DishCourse mascots"
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

            {/* Propose This button (only for multi-member households) */}
            {proposalsAvailable && (
              <Button
                variant="secondary"
                fullWidth
                onClick={handleProposeClick}
              >
                <Hand size={18} aria-hidden="true" />
                <span>Propose This</span>
              </Button>
            )}

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

      {/* Propose Modal */}
      {showProposeModal && currentMeal && (
        <ProposeModal
          meal={currentMeal}
          dishes={dishes}
          memberCount={members.length}
          isSubmitting={isSubmittingProposal}
          onPropose={handlePropose}
          onCancel={() => setShowProposeModal(false)}
        />
      )}
    </div>
  );
}
