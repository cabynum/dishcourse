/**
 * AddDishPage - Where users add new dishes to their collection.
 *
 * Uses the DishForm component for input and the useDishes hook to save.
 * Navigates back to home on successful save or cancel.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDishes } from '@/hooks';
import { DishForm, type DishFormValues } from '@/components/meals';
import { Card } from '@/components/ui';

export function AddDishPage() {
  const navigate = useNavigate();
  const { dishes, addDish } = useDishes();

  // Get existing dish names for duplicate detection
  const existingNames = dishes.map((dish) => dish.name);

  /**
   * Handle form submission - save the dish and navigate home
   */
  const handleSubmit = (values: DishFormValues) => {
    addDish(values);
    navigate('/');
  };

  /**
   * Handle cancel - navigate back
   */
  const handleCancel = () => {
    navigate('/');
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
              onClick={handleCancel}
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
                Add a Dish
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                Add a new dish to your collection
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <Card padding="lg">
          <DishForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Add Dish"
            existingNames={existingNames}
          />
        </Card>
      </main>
    </div>
  );
}
