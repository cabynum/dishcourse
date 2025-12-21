/**
 * DishForm Component
 *
 * A form for creating or editing a dish.
 * Includes name input, type selector, and optional extended details
 * (cook time, recipe URLs) in a collapsible section.
 */

import { useState } from 'react';
import { type DishType } from '@/types';
import { Button, Input, CookTimePicker, UrlInput } from '@/components/ui';
import { DishTypeSelector } from './DishTypeSelector';

export interface DishFormValues {
  /** Dish name */
  name: string;
  /** Dish type */
  type: DishType;
  /** Recipe source URLs (optional) */
  recipeUrls?: string[];
  /** Cook time in minutes (optional) */
  cookTimeMinutes?: number;
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
 * Chevron icon for the expandable section toggle.
 */
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={[
        'w-5 h-5 transition-transform duration-200',
        isOpen ? 'rotate-180' : '',
      ].join(' ')}
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Form for creating or editing a dish.
 *
 * Features:
 * - Name input with validation (required, non-empty)
 * - Dish type selector (entree, side, other)
 * - Expandable "More details" section with:
 *   - Cook time picker (hours/minutes)
 *   - Recipe URL input (multiple URLs with domain icons)
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
 * // Edit existing dish with details
 * <DishForm
 *   initialValues={{ 
 *     name: 'Pasta', 
 *     type: 'entree',
 *     cookTimeMinutes: 30,
 *     recipeUrls: ['https://youtube.com/...']
 *   }}
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
  // Core form state
  const [name, setName] = useState(initialValues?.name ?? '');
  const [type, setType] = useState<DishType>(initialValues?.type ?? 'entree');
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);

  // Extended details state
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | undefined>(
    initialValues?.cookTimeMinutes
  );
  const [recipeUrls, setRecipeUrls] = useState<string[]>(
    initialValues?.recipeUrls ?? []
  );

  // Expandable section state - auto-expand if there are initial extended details
  const hasInitialDetails = Boolean(
    initialValues?.cookTimeMinutes || (initialValues?.recipeUrls && initialValues.recipeUrls.length > 0)
  );
  const [showDetails, setShowDetails] = useState(hasInitialDetails);

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

    // Submit the form with all values
    onSubmit({
      name: name.trim(),
      type,
      // Only include optional fields if they have values
      ...(recipeUrls.length > 0 && { recipeUrls }),
      ...(cookTimeMinutes !== undefined && { cookTimeMinutes }),
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

      {/* Expandable details section */}
      <div className="border border-stone-200 rounded-lg overflow-hidden">
        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className={[
            'w-full flex items-center justify-between',
            'px-4 py-3',
            'text-left text-sm font-medium text-stone-700',
            'bg-stone-50 hover:bg-stone-100',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500',
          ].join(' ')}
          aria-expanded={showDetails}
        >
          <span className="flex items-center gap-2">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-stone-500"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add more details
            {(cookTimeMinutes || recipeUrls.length > 0) && (
              <span className="text-xs text-amber-600 font-normal">
                ({[
                  cookTimeMinutes ? 'cook time' : '',
                  recipeUrls.length > 0 ? `${recipeUrls.length} link${recipeUrls.length > 1 ? 's' : ''}` : '',
                ].filter(Boolean).join(', ')})
              </span>
            )}
          </span>
          <ChevronIcon isOpen={showDetails} />
        </button>

        {/* Collapsible content */}
        {showDetails && (
          <div className="px-4 py-4 space-y-5 bg-white border-t border-stone-200">
            {/* Cook time picker */}
            <CookTimePicker
              label="Cook Time"
              value={cookTimeMinutes}
              onChange={setCookTimeMinutes}
              disabled={isSubmitting}
            />

            {/* Recipe URLs */}
            <UrlInput
              label="Recipe Links"
              value={recipeUrls}
              onChange={setRecipeUrls}
              placeholder="https://instagram.com/..."
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

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
