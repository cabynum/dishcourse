/**
 * DishForm Component
 *
 * A form for creating or editing a dish.
 * Includes name input and type selector with validation.
 */

import { useState } from 'react';
import { type DishType } from '@/types';
import { Button, Input } from '@/components/ui';
import { DishTypeSelector } from './DishTypeSelector';

export interface DishFormValues {
  /** Dish name */
  name: string;
  /** Dish type */
  type: DishType;
}

export interface DishFormProps {
  /** Initial values for editing (optional) */
  initialValues?: Partial<DishFormValues>;
  /** Called when form is submitted with valid data */
  onSubmit: (values: DishFormValues) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Submit button label (default: "Save") */
  submitLabel?: string;
  /** Show loading state on submit button */
  isSubmitting?: boolean;
  /** 
   * Existing dish names for duplicate detection (case-insensitive).
   * When editing, exclude the current dish's name from this list.
   */
  existingNames?: string[];
}

/**
 * Form for creating or editing a dish.
 *
 * Features:
 * - Name input with validation (required, non-empty)
 * - Dish type selector (entree, side, other)
 * - Inline error display
 * - Submit and cancel actions
 *
 * @example
 * // Create new dish
 * <DishForm
 *   onSubmit={(values) => addDish(values)}
 *   onCancel={() => navigate(-1)}
 * />
 *
 * @example
 * // Edit existing dish
 * <DishForm
 *   initialValues={{ name: 'Pasta', type: 'entree' }}
 *   onSubmit={(values) => updateDish(id, values)}
 *   onCancel={() => navigate(-1)}
 *   submitLabel="Update"
 * />
 */
export function DishForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isSubmitting = false,
  existingNames = [],
}: DishFormProps) {
  // Form state
  const [name, setName] = useState(initialValues?.name ?? '');
  const [type, setType] = useState<DishType>(initialValues?.type ?? 'entree');
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);

  /**
   * Validate the form and return error message if invalid.
   * Checks for: empty name, max length, and duplicates.
   */
  const validate = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Name is required';
    }
    if (trimmed.length > 100) {
      return 'Name must be 100 characters or less';
    }
    // Check for duplicates (case-insensitive)
    const normalizedInput = trimmed.toLowerCase();
    const isDuplicate = existingNames.some(
      (existingName) => existingName.toLowerCase() === normalizedInput
    );
    if (isDuplicate) {
      return `You already have a dish called "${trimmed}"`;
    }
    return undefined;
  };

  /**
   * Handle name input change
   */
  const handleNameChange = (value: string) => {
    setName(value);
    // Only show validation errors after first touch
    if (touched) {
      setError(validate(value));
    }
  };

  /**
   * Handle input blur to trigger validation
   */
  const handleNameBlur = () => {
    setTouched(true);
    setError(validate(name));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submit
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }

    // Submit the form
    onSubmit({
      name: name.trim(),
      type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name input */}
      <Input
        label="Dish Name"
        value={name}
        onChange={handleNameChange}
        onBlur={handleNameBlur}
        placeholder="e.g., Spaghetti Bolognese"
        error={error}
        autoFocus
      />

      {/* Type selector */}
      <DishTypeSelector
        value={type}
        onChange={setType}
        disabled={isSubmitting}
      />

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="secondary"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={isSubmitting}
          className="flex-1"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

