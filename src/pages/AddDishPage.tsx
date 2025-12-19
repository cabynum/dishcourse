/**
 * AddDishPage - Where users add new dishes to their collection.
 *
 * Uses the DishForm component for input and the useDishes hook to save.
 * Navigates back to home on successful save or cancel.
 */

import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Add a Dish</h1>
          <p className="text-stone-600 mt-1">
            Add a new dish to your collection
          </p>
        </header>

        {/* Form in a card */}
        <Card padding="lg">
          <DishForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Add Dish"
            existingNames={existingNames}
          />
        </Card>
      </div>
    </div>
  );
}
