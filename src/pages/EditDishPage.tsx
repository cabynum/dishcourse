/**
 * EditDishPage - Where users edit or delete existing dishes.
 *
 * Uses the DishForm component for input and the useDishes hook to update/delete.
 * Navigates back to home on successful save, delete, or cancel.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDishes } from '@/hooks';
import { DishForm, type DishFormValues } from '@/components/meals';
import { Button, Card, EmptyState } from '@/components/ui';

/**
 * Trash icon for the delete button
 */
function TrashIcon() {
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
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

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
      <div className="min-h-screen bg-stone-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 rounded w-1/3" />
            <div className="h-4 bg-stone-100 rounded w-2/3" />
            <div className="h-64 bg-stone-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state if dish not found
  if (!dish) {
    return (
      <div className="min-h-screen bg-stone-50 p-4">
        <div className="max-w-md mx-auto">
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
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Edit Dish</h1>
          <p className="text-stone-600 mt-1">
            Update or remove this dish from your collection
          </p>
        </header>

        {/* Form in a card */}
        <Card padding="lg">
          <DishForm
            initialValues={{ name: dish.name, type: dish.type }}
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
                <p className="text-stone-700 text-center">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold">"{dish.name}"</span>?
                </p>
                <p className="text-stone-500 text-sm text-center">
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
                    className="flex-1 bg-red-500 hover:bg-red-600"
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
              className={[
                'w-full',
                'flex items-center justify-center gap-2',
                'px-4 py-3',
                'text-red-600 hover:text-red-700',
                'hover:bg-red-50',
                'rounded-xl',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
              ].join(' ')}
              aria-label={`Delete ${dish.name}`}
            >
              <TrashIcon />
              <span>Delete this dish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

