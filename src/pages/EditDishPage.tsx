/**
 * EditDishPage - Where users edit or delete existing dishes.
 *
 * Uses the DishForm component for input and the useDishes hook to update/delete.
 * Navigates back to home on successful save, delete, or cancel.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useDishes } from '@/hooks';
import { DishForm, type DishFormValues } from '@/components/meals';
import { Button, Card, EmptyState } from '@/components/ui';

export function EditDishPage() {
  const navigate = useNavigate();
  const { dishId } = useParams<{ dishId: string }>();
  const { dishes, getDishById, updateDish, deleteDish, isLoading } = useDishes();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get the dish to edit
  const dish = dishId ? getDishById(dishId) : undefined;

  // Get existing dish names for duplicate detection, excluding the current dish
  const existingNames = dishes
    .filter((d) => d.id !== dishId)
    .map((d) => d.name);

  /**
   * Handle form submission - update the dish and navigate home
   */
  const handleSubmit = (values: DishFormValues) => {
    if (!dishId) return;
    updateDish(dishId, values);
    navigate('/');
  };

  /**
   * Handle cancel - navigate back
   */
  const handleCancel = () => {
    navigate('/');
  };

  /**
   * Handle delete button click - show confirmation
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * Handle delete confirmation - delete the dish and navigate home
   */
  const handleDeleteConfirm = () => {
    if (!dishId) return;
    deleteDish(dishId);
    navigate('/');
  };

  /**
   * Handle delete cancel - hide confirmation
   */
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Show loading state while dishes are loading
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
            <div className="animate-pulse space-y-2">
              <div
                className="h-6 rounded w-32"
                style={{ backgroundColor: 'var(--color-bg-muted)' }}
              />
              <div
                className="h-4 rounded w-48"
                style={{ backgroundColor: 'var(--color-bg-muted)' }}
              />
            </div>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <div
            className="h-64 rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--color-bg-muted)' }}
          />
        </main>
      </div>
    );
  }

  // Show error state if dish not found
  if (!dish) {
    return (
      <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="max-w-lg mx-auto">
          <EmptyState
            title="Dish not found"
            message="This dish doesn't exist or may have been deleted."
            action={{
              label: 'Go Home',
              onClick: () => navigate('/'),
            }}
          />
        </div>
      </div>
    );
  }

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
                Edit Dish
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
                Update or remove this dish
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Form in a card */}
        <Card padding="lg">
          <DishForm
            initialValues={{
              name: dish.name,
              type: dish.type,
              recipeUrls: dish.recipeUrls,
              cookTimeMinutes: dish.cookTimeMinutes,
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Save Changes"
            existingNames={existingNames}
          />
        </Card>

        {/* Delete section */}
        <div className="mt-6">
          {showDeleteConfirm ? (
            <Card padding="md">
              <div className="space-y-4">
                <p className="text-center" style={{ color: 'var(--color-text)' }}>
                  Are you sure you want to delete{' '}
                  <span className="font-semibold">"{dish.name}"</span>?
                </p>
                <p
                  className="text-sm text-center"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  This will also remove it from any meal plans.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleDeleteCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleDeleteConfirm}
                    className="flex-1"
                    style={{ backgroundColor: 'var(--color-error)' }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: 'var(--color-error)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={`Delete ${dish.name}`}
            >
              <Trash2 size={20} strokeWidth={2} />
              <span>Delete this dish</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
