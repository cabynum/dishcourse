/**
 * MealBuilder Component
 *
 * Allows users to compose a custom meal by selecting an entree and sides
 * from their household's dish inventory.
 */

import { useState } from 'react';
import { Utensils, Leaf, Check } from 'lucide-react';
import type { Dish, ProposedMeal } from '@/types';

export interface MealBuilderProps {
  /** All available dishes */
  dishes: Dish[];
  /** Current meal selection (for editing) */
  initialMeal?: ProposedMeal;
  /** Called when meal changes */
  onChange: (meal: ProposedMeal | undefined) => void;
}

/**
 * MealBuilder lets users pick an entree and optional sides.
 */
export function MealBuilder({
  dishes,
  initialMeal,
  onChange,
}: MealBuilderProps) {
  const [selectedEntreeId, setSelectedEntreeId] = useState<string | undefined>(
    initialMeal?.entreeId
  );
  const [selectedSideIds, setSelectedSideIds] = useState<string[]>(
    initialMeal?.sideIds ?? []
  );

  // Filter dishes by type
  const entrees = dishes.filter((d) => d.type === 'entree');
  const sides = dishes.filter((d) => d.type === 'side');

  const handleEntreeSelect = (entreeId: string) => {
    const newEntreeId = selectedEntreeId === entreeId ? undefined : entreeId;
    setSelectedEntreeId(newEntreeId);
    
    // Notify parent
    if (newEntreeId) {
      onChange({ entreeId: newEntreeId, sideIds: selectedSideIds });
    } else {
      onChange(undefined);
    }
  };

  const handleSideToggle = (sideId: string) => {
    const newSideIds = selectedSideIds.includes(sideId)
      ? selectedSideIds.filter((id) => id !== sideId)
      : [...selectedSideIds, sideId];
    
    setSelectedSideIds(newSideIds);
    
    // Notify parent
    if (selectedEntreeId) {
      onChange({ entreeId: selectedEntreeId, sideIds: newSideIds });
    }
  };

  return (
    <div className="space-y-4">
      {/* Entree selection */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Utensils size={16} className="text-amber-600" aria-hidden="true" />
          <span className="text-sm font-medium text-stone-700">
            Pick a Main Course
          </span>
          {!selectedEntreeId && (
            <span className="text-xs text-rose-500">(required)</span>
          )}
        </div>
        
        {entrees.length === 0 ? (
          <p className="text-sm text-stone-500 italic py-2">
            No entrees in your dish collection yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entrees.map((dish) => {
              const isSelected = selectedEntreeId === dish.id;
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => handleEntreeSelect(dish.id)}
                  className={[
                    'inline-flex items-center gap-2 px-3 py-2 rounded-xl',
                    'text-sm font-medium transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
                  ].join(' ')}
                >
                  {isSelected && <Check size={14} aria-hidden="true" />}
                  {dish.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Side selection */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Leaf size={16} className="text-emerald-600" aria-hidden="true" />
          <span className="text-sm font-medium text-stone-700">
            Add Sides
          </span>
          <span className="text-xs text-stone-400">(optional)</span>
        </div>
        
        {sides.length === 0 ? (
          <p className="text-sm text-stone-500 italic py-2">
            No sides in your dish collection yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sides.map((dish) => {
              const isSelected = selectedSideIds.includes(dish.id);
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => handleSideToggle(dish.id)}
                  disabled={!selectedEntreeId}
                  className={[
                    'inline-flex items-center gap-2 px-3 py-2 rounded-xl',
                    'text-sm font-medium transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    !selectedEntreeId && 'opacity-50 cursor-not-allowed',
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
                  ].join(' ')}
                >
                  {isSelected && <Check size={14} aria-hidden="true" />}
                  {dish.name}
                </button>
              );
            })}
          </div>
        )}
        
        {!selectedEntreeId && sides.length > 0 && (
          <p className="text-xs text-stone-400 mt-1">
            Select an entree first to add sides.
          </p>
        )}
      </div>
    </div>
  );
}
