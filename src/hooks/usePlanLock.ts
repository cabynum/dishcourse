/**
 * usePlanLock Hook
 *
 * Provides React components with plan locking functionality.
 * Handles lock acquisition, release, and status tracking for meal plans.
 *
 * Key features:
 * - Automatic lock refresh to prevent stale locks while editing
 * - Detects when another user holds the lock
 * - Provides force unlock for stale locks
 * - Cleans up locks on unmount
 *
 * @example
 * ```tsx
 * function PlanEditor({ planId }) {
 *   const { lockStatus, acquireLock, releaseLock, isAcquiring } = usePlanLock(planId);
 *
 *   if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
 *     return <LockIndicator lockedBy={lockStatus.lockedBy} />;
 *   }
 *
 *   const handleEdit = async () => {
 *     const result = await acquireLock();
 *     if (result.success) {
 *       // Start editing
 *     }
 *   };
 *
 *   return <EditForm onSave={releaseLock} />;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  acquireLock as acquireLockService,
  releaseLock as releaseLockService,
  forceUnlock as forceUnlockService,
  checkLock as checkLockService,
  refreshLock as refreshLockService,
  type LockResult,
  type LockStatus,
} from '@/services';
import { useAuthContext } from '@/components/auth';
import { getUserFriendlyError } from '@/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * How often to refresh the lock while editing (2 minutes).
 * This keeps the lock active and prevents it from going stale.
 */
const LOCK_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

/**
 * How often to poll for lock status changes (10 seconds).
 * This detects when another user acquires/releases a lock.
 */
const LOCK_POLL_INTERVAL_MS = 10 * 1000;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for the usePlanLock hook.
 */
export interface UsePlanLockReturn {
  /** Current lock status */
  lockStatus: LockStatus;

  /** Whether a lock operation is in progress */
  isAcquiring: boolean;

  /** Whether a release operation is in progress */
  isReleasing: boolean;

  /** Error message from the last operation */
  error: string | null;

  /**
   * Attempt to acquire the lock on this plan.
   * @returns Result indicating success or failure
   */
  acquireLock: () => Promise<LockResult>;

  /**
   * Release the lock on this plan.
   * @returns Result indicating success or failure
   */
  releaseLock: () => Promise<LockResult>;

  /**
   * Force unlock a stale lock (any household member can do this).
   * Only works if the lock is stale (older than 5 minutes).
   * @returns Result indicating success or failure
   */
  forceUnlock: () => Promise<LockResult>;

  /**
   * Refresh the lock status from the server.
   */
  refreshStatus: () => Promise<void>;
}

/**
 * Default lock status when not loaded yet.
 */
const DEFAULT_LOCK_STATUS: LockStatus = {
  isLocked: false,
  isStale: false,
  isLockedByCurrentUser: false,
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing meal plan locks.
 *
 * @param planId - The ID of the plan to manage locks for
 * @returns Lock management functions and status
 */
export function usePlanLock(planId: string | null): UsePlanLockReturn {
  const { user } = useAuthContext();
  const userId = user?.id;

  // State
  const [lockStatus, setLockStatus] = useState<LockStatus>(DEFAULT_LOCK_STATUS);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for intervals
  const refreshIntervalRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  /**
   * Load the current lock status.
   */
  const loadStatus = useCallback(async () => {
    if (!planId) {
      setLockStatus(DEFAULT_LOCK_STATUS);
      return;
    }

    try {
      const status = await checkLockService(planId, userId);
      setLockStatus(status);
    } catch (err) {
      console.error('Failed to check lock status:', err);
    }
  }, [planId, userId]);

  /**
   * Acquire the lock.
   */
  const acquireLock = useCallback(async (): Promise<LockResult> => {
    if (!planId || !userId) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsAcquiring(true);
    setError(null);

    try {
      const result = await acquireLockService(planId, userId);

      if (result.success) {
        setLockStatus({
          isLocked: true,
          lockedBy: userId,
          lockedAt: result.lockedAt,
          isStale: false,
          isLockedByCurrentUser: true,
        });

        // Start lock refresh interval to keep it active
        startLockRefresh();
      } else {
        setError(result.error ?? 'Failed to acquire lock');
        // Refresh status to get current lock holder
        await loadStatus();
      }

      return result;
    } catch (err) {
      const errorMsg = getUserFriendlyError(err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsAcquiring(false);
    }
  }, [planId, userId, loadStatus]);

  /**
   * Release the lock.
   */
  const releaseLock = useCallback(async (): Promise<LockResult> => {
    if (!planId) {
      return { success: false, error: 'No plan ID' };
    }

    setIsReleasing(true);
    setError(null);

    try {
      // Stop the refresh interval
      stopLockRefresh();

      const result = await releaseLockService(planId, userId);

      if (result.success) {
        setLockStatus({
          isLocked: false,
          isStale: false,
          isLockedByCurrentUser: false,
        });
      } else {
        setError(result.error ?? 'Failed to release lock');
      }

      return result;
    } catch (err) {
      const errorMsg = getUserFriendlyError(err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsReleasing(false);
    }
  }, [planId, userId]);

  /**
   * Force unlock a stale lock.
   */
  const forceUnlock = useCallback(async (): Promise<LockResult> => {
    if (!planId) {
      return { success: false, error: 'No plan ID' };
    }

    setIsReleasing(true);
    setError(null);

    try {
      const result = await forceUnlockService(planId);

      if (result.success) {
        setLockStatus({
          isLocked: false,
          isStale: false,
          isLockedByCurrentUser: false,
        });
      } else {
        setError(result.error ?? 'Cannot force unlock');
      }

      return result;
    } catch (err) {
      const errorMsg = getUserFriendlyError(err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsReleasing(false);
    }
  }, [planId]);

  /**
   * Start the lock refresh interval.
   * This keeps the lock active while the user is editing.
   */
  const startLockRefresh = useCallback(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval
    refreshIntervalRef.current = window.setInterval(async () => {
      if (planId && userId) {
        await refreshLockService(planId, userId);
      }
    }, LOCK_REFRESH_INTERVAL_MS);
  }, [planId, userId]);

  /**
   * Stop the lock refresh interval.
   */
  const stopLockRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  /**
   * Refresh status (public method for manual refresh).
   */
  const refreshStatus = useCallback(async () => {
    await loadStatus();
  }, [loadStatus]);

  // Load initial status and set up polling
  useEffect(() => {
    loadStatus();

    // Poll for status changes (to detect when another user acquires/releases)
    pollIntervalRef.current = window.setInterval(() => {
      loadStatus();
    }, LOCK_POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loadStatus]);

  // Cleanup on unmount: release lock if we hold it
  useEffect(() => {
    return () => {
      stopLockRefresh();

      // If we hold the lock, release it on unmount
      if (planId && userId && lockStatus.isLockedByCurrentUser) {
        // Fire and forget - can't await in cleanup
        releaseLockService(planId, userId).catch(console.error);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, userId]);

  return {
    lockStatus,
    isAcquiring,
    isReleasing,
    error,
    acquireLock,
    releaseLock,
    forceUnlock,
    refreshStatus,
  };
}
