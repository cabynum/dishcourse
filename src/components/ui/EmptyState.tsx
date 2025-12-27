/**
 * EmptyState Component
 *
 * A friendly message displayed when no content exists.
 * Encourages users to take action. Can display the DishCourse mascot
 * for a warm, inviting feel.
 */

import { type ReactNode } from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  /** Optional icon displayed above the title (use imageSrc for mascot) */
  icon?: ReactNode;
  /** Optional image source for mascot display (takes precedence over icon) */
  imageSrc?: string;
  /** Alt text for image (required when imageSrc is provided) */
  imageAlt?: string;
  /** Main heading text */
  title: string;
  /** Descriptive message below the title */
  message: string;
  /** Optional call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState component for empty lists and initial states.
 *
 * Features:
 * - Optional mascot image for friendly appearance
 * - Optional icon for visual interest
 * - Title and message for context
 * - Optional action button to guide users
 * - Friendly, encouraging appearance
 *
 * @example
 * // With mascot image
 * <EmptyState
 *   imageSrc="/mascot-duo.png"
 *   imageAlt="DishCourse mascots"
 *   title="No dishes yet"
 *   message="Add your first dish to get started!"
 *   action={{
 *     label: "Add a Dish",
 *     onClick: () => navigate('/add')
 *   }}
 * />
 *
 * @example
 * // With icon
 * <EmptyState
 *   icon={<SearchIcon />}
 *   title="No results"
 *   message="Try adjusting your search or filters."
 * />
 */
export function EmptyState({
  icon,
  imageSrc,
  imageAlt = 'DishCourse mascots',
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Mascot image (takes precedence over icon) */}
      {imageSrc && (
        <div className="mb-4" aria-hidden="true">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-36 h-auto mx-auto"
            style={{ maxWidth: '144px' }}
          />
        </div>
      )}

      {/* Icon (only shown if no imageSrc) */}
      {!imageSrc && icon && (
        <div className="mb-4 text-stone-400" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        className="text-lg font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text)',
        }}
      >
        {title}
      </h3>

      {/* Message */}
      <p className="max-w-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
        {message}
      </p>

      {/* Action button */}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

