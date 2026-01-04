/**
 * ConflictResolver Component
 *
 * Displays sync conflicts and lets users choose which version to keep.
 * Shows a side-by-side comparison of local and server versions with
 * clear, non-technical language.
 */

import { useState } from 'react';
import { AlertTriangle, Check, X, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ConflictRecord, Dish, MealPlan } from '@/lib/db';
import type { ConflictResolution } from '@/services/sync';

export interface ConflictResolverProps {
  /** List of conflicts to resolve */
  conflicts: ConflictRecord[];
  /** Callback when a conflict is resolved */
  onResolve: (entityId: string, resolution: ConflictResolution) => Promise<void>;
  /** Callback when all conflicts are resolved or dismissed */
  onClose?: () => void;
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Display a single field comparison
 */
function FieldComparison({
  label,
  localValue,
  serverValue,
}: {
  label: string;
  localValue: string | undefined;
  serverValue: string | undefined;
}) {
  const isDifferent = localValue !== serverValue;

  return (
    <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-sm ${isDifferent ? 'bg-blue-50 rounded px-2 py-1' : ''}`}
      >
        {localValue || <span className="text-gray-400 italic">Not set</span>}
      </div>
      <div
        className={`text-sm ${isDifferent ? 'bg-amber-50 rounded px-2 py-1' : ''}`}
      >
        {serverValue || <span className="text-gray-400 italic">Not set</span>}
      </div>
    </div>
  );
}

/**
 * Display the conflict details for a dish
 */
function DishConflictDetails({
  localVersion,
  serverVersion,
}: {
  localVersion: Dish;
  serverVersion: Dish;
}) {
  return (
    <div className="space-y-1">
      <FieldComparison
        label="Name"
        localValue={localVersion.name}
        serverValue={serverVersion.name}
      />
      <FieldComparison
        label="Type"
        localValue={localVersion.type}
        serverValue={serverVersion.type}
      />
      <FieldComparison
        label="Cook Time"
        localValue={
          localVersion.cookTimeMinutes
            ? `${localVersion.cookTimeMinutes} min`
            : undefined
        }
        serverValue={
          serverVersion.cookTimeMinutes
            ? `${serverVersion.cookTimeMinutes} min`
            : undefined
        }
      />
      <FieldComparison
        label="Recipe URL"
        localValue={localVersion.recipeUrl}
        serverValue={serverVersion.recipeUrl}
      />
    </div>
  );
}

/**
 * Display the conflict details for a meal plan
 */
function MealPlanConflictDetails({
  localVersion,
  serverVersion,
}: {
  localVersion: MealPlan;
  serverVersion: MealPlan;
}) {
  const localDaysCount = localVersion.days?.length ?? 0;
  const serverDaysCount = serverVersion.days?.length ?? 0;

  return (
    <div className="space-y-1">
      <FieldComparison
        label="Name"
        localValue={localVersion.name || 'Untitled Plan'}
        serverValue={serverVersion.name || 'Untitled Plan'}
      />
      <FieldComparison
        label="Start Date"
        localValue={localVersion.startDate}
        serverValue={serverVersion.startDate}
      />
      <FieldComparison
        label="Days Planned"
        localValue={`${localDaysCount} day${localDaysCount !== 1 ? 's' : ''}`}
        serverValue={`${serverDaysCount} day${serverDaysCount !== 1 ? 's' : ''}`}
      />
    </div>
  );
}

/**
 * A single conflict card with resolution options
 */
function ConflictCard({
  conflict,
  onResolve,
  isResolving,
}: {
  conflict: ConflictRecord;
  onResolve: (resolution: ConflictResolution) => void;
  isResolving: boolean;
}) {
  const isDish = conflict.entityType === 'dish';
  const entityName = isDish
    ? (conflict.localVersion as Dish).name
    : (conflict.localVersion as MealPlan).name || 'Meal Plan';

  return (
    <Card padding="md" className="border-l-4 border-l-amber-500">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{entityName}</h3>
          <p className="text-sm text-gray-500">
            {isDish ? 'Dish' : 'Meal Plan'} was edited in two places
          </p>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 gap-2 mb-2 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
          <User size={14} />
          Your Changes
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
          <User size={14} />
          Other Changes
        </div>
      </div>

      {/* Comparison */}
      {isDish ? (
        <DishConflictDetails
          localVersion={conflict.localVersion as Dish}
          serverVersion={conflict.serverVersion as Dish}
        />
      ) : (
        <MealPlanConflictDetails
          localVersion={conflict.localVersion as MealPlan}
          serverVersion={conflict.serverVersion as MealPlan}
        />
      )}

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          {formatDate((conflict.localVersion as Dish | MealPlan).updatedAt)}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          {formatDate((conflict.serverVersion as Dish | MealPlan).updatedAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          disabled={isResolving}
          onClick={() => onResolve('local')}
        >
          <Check size={16} />
          Keep Mine
        </Button>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          disabled={isResolving}
          onClick={() => onResolve('server')}
        >
          <Check size={16} />
          Keep Theirs
        </Button>
      </div>
    </Card>
  );
}

/**
 * ConflictResolver displays all pending conflicts and lets users resolve them.
 *
 * Features:
 * - Side-by-side comparison of local and server versions
 * - Clear "Your Changes" vs "Other Changes" labeling
 * - Highlights fields that differ
 * - Simple "Keep Mine" / "Keep Theirs" resolution
 */
export function ConflictResolver({
  conflicts,
  onResolve,
  onClose,
}: ConflictResolverProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (
    entityId: string,
    resolution: ConflictResolution
  ) => {
    setResolvingId(entityId);
    try {
      await onResolve(entityId, resolution);
    } finally {
      setResolvingId(null);
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 id="conflict-title" className="font-semibold text-lg">
              Resolve Conflicts
            </h2>
          <p className="text-sm text-gray-500">
            {conflicts.length} item{conflicts.length !== 1 ? 's' : ''}{' '}
            {conflicts.length === 1 ? 'needs' : 'need'} your attention
          </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Conflict List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conflicts.map((conflict) => (
            <ConflictCard
              key={conflict.entityId}
              conflict={conflict}
              onResolve={(resolution) =>
                handleResolve(conflict.entityId, resolution)
              }
              isResolving={resolvingId === conflict.entityId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
