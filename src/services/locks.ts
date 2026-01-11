/**
 * Locks Service
 *
 * Handles meal plan locking to prevent concurrent edits.
 * When a user is editing a meal plan, it becomes locked to prevent
 * other household members from making conflicting changes.
 *
 * Key behaviors:
 * - Locks are stored in Supabase and synced to local cache
 * - Locks auto-release after 5 minutes of inactivity
 * - Users can explicitly release locks when done editing
 * - Stale locks can be forcibly unlocked by any household member
 */

import { supabase } from '@/lib/supabase';
import { db, type CachedMealPlan } from '@/lib/db';
import { getIsOnline } from './sync';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Lock timeout in milliseconds (5 minutes).
 * Locks older than this are considered stale and can be auto-released.
 */
export const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a lock operation.
 */
export interface LockResult {
  success: boolean;
  error?: string;
  /** If locked by someone else, who has the lock */
  lockedBy?: string;
  /** When the lock was acquired */
  lockedAt?: string;
}

/**
 * Information about the current lock status of a plan.
 */
export interface LockStatus {
  /** Whether the plan is currently locked */
  isLocked: boolean;
  /** User ID who has the lock (if locked) */
  lockedBy?: string;
  /** When the lock was acquired (if locked) */
  lockedAt?: string;
  /** Whether the lock is stale (older than LOCK_TIMEOUT_MS) */
  isStale: boolean;
  /** Whether the current user holds the lock */
  isLockedByCurrentUser: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a lock timestamp is stale (older than LOCK_TIMEOUT_MS).
 */
export function isLockStale(lockedAt: string | undefined): boolean {
  if (!lockedAt) return false;

  const lockTime = new Date(lockedAt).getTime();
  const now = Date.now();

  return now - lockTime > LOCK_TIMEOUT_MS;
}

/**
 * Format lock time for display ("2 min ago", "just now", etc.)
 */
export function formatLockTime(lockedAt: string | undefined): string {
  if (!lockedAt) return '';

  const lockTime = new Date(lockedAt).getTime();
  const now = Date.now();
  const diffMs = now - lockTime;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
}

// ============================================================================
// LOCK OPERATIONS
// ============================================================================

/**
 * Attempt to acquire a lock on a meal plan.
 *
 * A lock can be acquired if:
 * - The plan is not currently locked
 * - The current user already has the lock (refresh)
 * - The existing lock is stale (auto-released)
 *
 * @param planId - The ID of the meal plan to lock
 * @param userId - The ID of the user acquiring the lock
 * @returns Result indicating success or failure with details
 */
export async function acquireLock(
  planId: string,
  userId: string
): Promise<LockResult> {
  const isOnline = getIsOnline();

  if (!isOnline) {
    // When offline, acquire lock locally only
    return acquireLockLocally(planId, userId);
  }

  try {
    // First, check current lock status on the server
    const { data: plan, error: fetchError } = await supabase
      .from('meal_plans')
      .select('id, locked_by, locked_at')
      .eq('id', planId)
      .single();

    if (fetchError) {
      // If plan not found, it might be a local-only plan
      if (fetchError.code === 'PGRST116') {
        return acquireLockLocally(planId, userId);
      }
      throw fetchError;
    }

    // Check if already locked by someone else
    if (plan.locked_by && plan.locked_by !== userId) {
      const lockStale = isLockStale(plan.locked_at);

      if (!lockStale) {
        // Locked by another user and not stale
        return {
          success: false,
          error: 'Plan is being edited by another user',
          lockedBy: plan.locked_by,
          lockedAt: plan.locked_at,
        };
      }
      // Lock is stale, we can take it over (auto-release)
    }

    // Acquire the lock
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('meal_plans')
      .update({
        locked_by: userId,
        locked_at: now,
        updated_at: now,
      })
      .eq('id', planId);

    if (updateError) throw updateError;

    // Update local cache
    await updateLockInCache(planId, userId, now);

    return { success: true, lockedBy: userId, lockedAt: now };
  } catch (error) {
    console.error('Failed to acquire lock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acquire lock',
    };
  }
}

/**
 * Acquire a lock locally (for offline mode or local-only plans).
 */
async function acquireLockLocally(
  planId: string,
  userId: string
): Promise<LockResult> {
  const plan = await db.mealPlans.get(planId);

  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }

  // Check if locked by someone else
  if (plan.lockedBy && plan.lockedBy !== userId) {
    const lockStale = isLockStale(plan.lockedAt);

    if (!lockStale) {
      return {
        success: false,
        error: 'Plan is being edited by another user',
        lockedBy: plan.lockedBy,
        lockedAt: plan.lockedAt,
      };
    }
  }

  // Acquire the lock
  const now = new Date().toISOString();
  await updateLockInCache(planId, userId, now);

  return { success: true, lockedBy: userId, lockedAt: now };
}

/**
 * Release a lock on a meal plan.
 *
 * @param planId - The ID of the meal plan to unlock
 * @param userId - Optional: Only release if this user holds the lock
 * @returns Result indicating success or failure
 */
export async function releaseLock(
  planId: string,
  userId?: string
): Promise<LockResult> {
  const isOnline = getIsOnline();

  if (!isOnline) {
    return releaseLockLocally(planId, userId);
  }

  try {
    // Build the update query
    let query = supabase
      .from('meal_plans')
      .update({
        locked_by: null,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    // If userId provided, only release if this user holds the lock
    if (userId) {
      query = query.eq('locked_by', userId);
    }

    const { error } = await query;

    if (error) throw error;

    // Clear lock in local cache
    await updateLockInCache(planId, undefined, undefined);

    return { success: true };
  } catch (error) {
    console.error('Failed to release lock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release lock',
    };
  }
}

/**
 * Release a lock locally.
 */
async function releaseLockLocally(
  planId: string,
  userId?: string
): Promise<LockResult> {
  const plan = await db.mealPlans.get(planId);

  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }

  // If userId provided, only release if this user holds the lock
  if (userId && plan.lockedBy !== userId) {
    return { success: false, error: 'Not locked by this user' };
  }

  await updateLockInCache(planId, undefined, undefined);
  return { success: true };
}

/**
 * Force unlock a stale plan (can be done by any household member).
 * Only works if the lock is stale (older than LOCK_TIMEOUT_MS).
 *
 * @param planId - The ID of the meal plan to force unlock
 * @returns Result indicating success or failure
 */
export async function forceUnlock(planId: string): Promise<LockResult> {
  // First check if the lock is actually stale
  const status = await checkLock(planId);

  if (!status.isLocked) {
    return { success: true }; // Already unlocked
  }

  if (!status.isStale) {
    return {
      success: false,
      error: 'Cannot force unlock - lock is not stale',
      lockedBy: status.lockedBy,
      lockedAt: status.lockedAt,
    };
  }

  // Lock is stale, force release it
  return releaseLock(planId);
}

/**
 * Check the lock status of a meal plan.
 * If the lock is stale, it is automatically released.
 *
 * @param planId - The ID of the meal plan to check
 * @param currentUserId - Optional: The current user's ID (to check if they hold the lock)
 * @returns The current lock status
 */
export async function checkLock(
  planId: string,
  currentUserId?: string
): Promise<LockStatus> {
  const isOnline = getIsOnline();

  // Try to get from local cache first
  const cachedPlan = await db.mealPlans.get(planId);

  if (!cachedPlan) {
    return {
      isLocked: false,
      isStale: false,
      isLockedByCurrentUser: false,
    };
  }

  // If online, also check server for the latest status
  if (isOnline && cachedPlan.householdId) {
    try {
      const { data: serverPlan, error } = await supabase
        .from('meal_plans')
        .select('locked_by, locked_at')
        .eq('id', planId)
        .single();

      if (!error && serverPlan) {
        // Update local cache if different
        if (
          serverPlan.locked_by !== cachedPlan.lockedBy ||
          serverPlan.locked_at !== cachedPlan.lockedAt
        ) {
          await updateLockInCache(
            planId,
            serverPlan.locked_by ?? undefined,
            serverPlan.locked_at ?? undefined
          );
        }

        return buildLockStatus(
          serverPlan.locked_by,
          serverPlan.locked_at,
          currentUserId
        );
      }
    } catch (error) {
      console.error('Failed to check server lock status:', error);
      // Fall back to cached status
    }
  }

  return buildLockStatus(
    cachedPlan.lockedBy,
    cachedPlan.lockedAt,
    currentUserId
  );
}

/**
 * Build a LockStatus object from lock data.
 */
function buildLockStatus(
  lockedBy: string | null | undefined,
  lockedAt: string | null | undefined,
  currentUserId?: string
): LockStatus {
  const isLocked = !!lockedBy;
  const lockIsStale = isLockStale(lockedAt ?? undefined);
  const isLockedByCurrentUser = isLocked && lockedBy === currentUserId;

  return {
    isLocked,
    lockedBy: lockedBy ?? undefined,
    lockedAt: lockedAt ?? undefined,
    isStale: isLocked && lockIsStale,
    isLockedByCurrentUser,
  };
}

/**
 * Update the lock fields in the local cache.
 */
async function updateLockInCache(
  planId: string,
  lockedBy: string | undefined,
  lockedAt: string | undefined
): Promise<void> {
  const plan = await db.mealPlans.get(planId);

  if (plan) {
    const updated: CachedMealPlan = {
      ...plan,
      lockedBy,
      lockedAt,
      updatedAt: new Date().toISOString(),
    };
    await db.mealPlans.put(updated);
  }
}

/**
 * Refresh a lock to prevent it from going stale.
 * Call this periodically while the user is actively editing.
 *
 * @param planId - The ID of the meal plan
 * @param userId - The ID of the user who holds the lock
 * @returns Result indicating success or failure
 */
export async function refreshLock(
  planId: string,
  userId: string
): Promise<LockResult> {
  // Refreshing a lock is the same as acquiring it again
  // This updates the locked_at timestamp
  const status = await checkLock(planId, userId);

  if (!status.isLockedByCurrentUser) {
    return {
      success: false,
      error: 'You do not hold this lock',
    };
  }

  return acquireLock(planId, userId);
}
