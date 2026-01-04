/**
 * useConflicts Hook
 *
 * Provides React components with access to sync conflicts and resolution methods.
 * Automatically subscribes to conflict changes and updates when conflicts are
 * detected or resolved.
 *
 * @example
 * ```tsx
 * function ConflictBanner() {
 *   const { conflicts, hasConflicts, resolveConflict, isResolving } = useConflicts();
 *
 *   if (!hasConflicts) return null;
 *
 *   return (
 *     <Banner>
 *       {conflicts.length} item(s) need your attention
 *       <Button onClick={() => setShowResolver(true)}>Resolve</Button>
 *     </Banner>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onConflict,
  getConflicts,
  getConflictCount,
  resolveConflict as resolveConflictService,
  type ConflictResolution,
} from '@/services';
import type { ConflictRecord } from '@/lib/db';

/**
 * Return type for the useConflicts hook.
 */
export interface UseConflictsReturn {
  /** List of all unresolved conflicts */
  conflicts: ConflictRecord[];

  /** Number of unresolved conflicts */
  conflictCount: number;

  /** Whether there are any unresolved conflicts */
  hasConflicts: boolean;

  /** Whether a conflict is currently being resolved */
  isResolving: boolean;

  /**
   * Resolve a conflict by choosing which version to keep.
   * @param entityId - The ID of the entity in conflict
   * @param resolution - Which version to keep: 'local' or 'server'
   */
  resolveConflict: (
    entityId: string,
    resolution: ConflictResolution
  ) => Promise<boolean>;

  /** Refresh the conflicts list from the database */
  refreshConflicts: () => Promise<void>;
}

/**
 * Hook for managing sync conflicts.
 *
 * Automatically:
 * - Loads conflicts on mount
 * - Subscribes to conflict change notifications
 * - Updates when conflicts are resolved
 */
export function useConflicts(): UseConflictsReturn {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [isResolving, setIsResolving] = useState(false);

  /**
   * Load conflicts from the database.
   */
  const refreshConflicts = useCallback(async () => {
    const [conflictsList, count] = await Promise.all([
      getConflicts(),
      getConflictCount(),
    ]);
    setConflicts(conflictsList);
    setConflictCount(count);
  }, []);

  // Load conflicts on mount
  useEffect(() => {
    refreshConflicts();
  }, [refreshConflicts]);

  // Subscribe to conflict change notifications
  useEffect(() => {
    const cleanup = onConflict((count) => {
      setConflictCount(count);
      // Refresh the full list when count changes
      refreshConflicts();
    });

    return cleanup;
  }, [refreshConflicts]);

  /**
   * Resolve a conflict by choosing which version to keep.
   */
  const resolveConflict = useCallback(
    async (
      entityId: string,
      resolution: ConflictResolution
    ): Promise<boolean> => {
      setIsResolving(true);
      try {
        const success = await resolveConflictService(entityId, resolution);
        if (success) {
          // Refresh conflicts after successful resolution
          await refreshConflicts();
        }
        return success;
      } finally {
        setIsResolving(false);
      }
    },
    [refreshConflicts]
  );

  return {
    conflicts,
    conflictCount,
    hasConflicts: conflictCount > 0,
    isResolving,
    resolveConflict,
    refreshConflicts,
  };
}
