/**
 * DishList Component
 *
 * Displays a list of dishes as DishCards, or a friendly empty state
 * when no dishes exist. Optionally shows filter pills to filter by dish type.
 */

import { useState } from 'react';
import { type Dish, type DishType } from '@/types';
import { EmptyState } from '@/components/ui';
import { DishCard } from './DishCard';

/** Filter options for dish types */
type FilterOption = 'all' | DishType;

export interface DishListProps {
  /** Array of dishes to display */
  dishes: Dish[];
  /** Called when a dish is clicked */
  onDishClick?: (dish: Dish) => void;
  /** Called when the "Add Dish" action is clicked in empty state */
  onAddClick?: () => void;
  /** Show dish type badges (default: true) */
  showType?: boolean;
  /** Use compact card styling */
  compact?: boolean;
  /** Custom empty state title */
  emptyTitle?: string;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Show filter pills to filter by dish type (default: false) */
  showFilters?: boolean;
}

/** Path to the duo mascot for empty states */
const MASCOT_DUO_PATH = '/mascot-duo.png';

/**
 * Filter configuration for each dish type
 */
const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'entree', label: 'Entrees' },
  { value: 'side', label: 'Sides' },
  { value: 'other', label: 'Other' },
];

/**
 * List component for displaying dishes.
 *
 * Features:
 * - Renders DishCards in a vertical list
 * - Shows friendly empty state when no dishes
 * - Optional "Add Dish" action in empty state
 * - Customizable empty state messaging
 * - Optional filter pills to filter by dish type
 *
 * @example
 * // Basic usage with click handling
 * <DishList
 *   dishes={dishes}
 *   onDishClick={(dish) => navigate(`/edit/${dish.id}`)}
 *   onAddClick={() => navigate('/add')}
 * />
 *
 * @example
 * // With filter pills
 * <DishList dishes={dishes} showFilters />
 *
 * @example
 * // Compact list without click handling
 * <DishList dishes={dishes} compact showType={false} />
 */
export function DishList({
  dishes,
  onDishClick,
  onAddClick,
  showType = true,
  compact = false,
  emptyTitle = 'No dishes yet',
  emptyMessage = 'Add your first dish to start building your meal collection.',
  showFilters = false,
}: DishListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  // Filter dishes based on active filter
  const filteredDishes =
    activeFilter === 'all'
      ? dishes
      : dishes.filter((dish) => dish.type === activeFilter);

  // Count dishes by type for showing counts in filter pills
  const typeCounts = {
    all: dishes.length,
    entree: dishes.filter((d) => d.type === 'entree').length,
    side: dishes.filter((d) => d.type === 'side').length,
    other: dishes.filter((d) => d.type === 'other').length,
  };

  // Empty state - no dishes at all
  if (dishes.length === 0) {
    return (
      <EmptyState
        imageSrc={MASCOT_DUO_PATH}
        imageAlt="DishCourse mascots welcoming you"
        title={emptyTitle}
        message={emptyMessage}
        action={
          onAddClick
            ? {
                label: 'Add a Dish',
                onClick: onAddClick,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div>
      {/* Filter pills */}
      {showFilters && (
        <div
          className="flex gap-2 mb-4 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Filter dishes by type"
        >
          {FILTER_OPTIONS.map((option) => {
            const count = typeCounts[option.value];
            const isActive = activeFilter === option.value;
            // Only show filters that have dishes (except "all")
            if (option.value !== 'all' && count === 0) return null;

            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(option.value)}
                className={[
                  'px-3 py-1.5',
                  'text-sm font-medium',
                  'rounded-full',
                  'whitespace-nowrap',
                  'transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                ].join(' ')}
              >
                {option.label}
                <span
                  className={[
                    'ml-1.5',
                    'text-xs',
                    isActive ? 'text-amber-100' : 'text-stone-400',
                  ].join(' ')}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state for filtered results */}
      {filteredDishes.length === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 text-center">
          <p className="text-stone-500">
            No {activeFilter === 'entree' ? 'entrees' : `${activeFilter}s`} yet
          </p>
        </div>
      )}

      {/* Dish list */}
      {filteredDishes.length > 0 && (
        <ul className="space-y-2" role="list" aria-label="Dishes">
          {filteredDishes.map((dish) => (
            <li key={dish.id}>
              <DishCard
                dish={dish}
                onClick={onDishClick ? () => onDishClick(dish) : undefined}
                showType={showType}
                compact={compact}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

