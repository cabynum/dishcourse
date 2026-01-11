/**
 * Sync Service
 *
 * Handles synchronization between local IndexedDB cache and Supabase.
 * Implements an offline-first approach where all reads come from local
 * cache and writes are pushed to the server in the background.
 *
 * Key responsibilities:
 * - Full sync: Download all household data on login/household switch
 * - Push changes: Upload pending local changes to Supabase
 * - Real-time subscriptions: Listen for changes from other household members
 * - Offline support: Queue changes when offline, sync when back online
 */

import { supabase } from '@/lib/supabase';
import {
  db,
  withSyncMetadata,
  getPendingItems,
  markAsSynced,
  setSyncMeta,
  getSyncMeta,
  enqueueOperation,
  getQueuedOperations,
  getQueuedOperationCount,
  dequeueOperation,
  markQueueAttempt,
  MAX_QUEUE_RETRIES,
  addConflict,
  getConflicts,
  getConflictCount,
  removeConflict,
  markAsConflict,
  type CachedDish,
  type CachedMealPlan,
  type Dish,
  type MealPlan,
  type QueuedOperation,
  type ConflictRecord,
} from '@/lib/db';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sync status for the UI to display.
 */
export type SyncState = 'idle' | 'syncing' | 'offline' | 'error';

/**
 * Callback for sync state changes.
 */
export type SyncStateCallback = (state: SyncState, pendingCount: number) => void;

/**
 * Callback for when new data arrives from the server.
 */
export type DataChangeCallback = () => void;

/**
 * Callback for when a conflict is detected.
 */
export type ConflictCallback = (conflictCount: number) => void;

/**
 * Result of a sync operation.
 */
interface SyncResult {
  success: boolean;
  error?: string;
  syncedCount?: number;
}

// ============================================================================
// STATE
// ============================================================================

let currentChannel: RealtimeChannel | null = null;
let syncStateCallback: SyncStateCallback | null = null;
/** Set of data change callbacks - supports multiple subscribers */
const dataChangeCallbacks = new Set<DataChangeCallback>();
/** Set of conflict callbacks - supports multiple subscribers */
const conflictCallbacks = new Set<ConflictCallback>();
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
// Track current household for real-time subscriptions
let currentHouseholdId: string | null = null;
void currentHouseholdId; // Suppress unused warning - variable is set for tracking

// ============================================================================
// SYNC STATE MANAGEMENT
// ============================================================================

/**
 * Register a callback to receive sync state updates.
 */
export function onSyncStateChange(callback: SyncStateCallback): () => void {
  syncStateCallback = callback;
  return () => {
    syncStateCallback = null;
  };
}

/**
 * Register a callback to receive data change notifications.
 * Supports multiple subscribers - each callback is stored in a Set.
 */
export function onDataChange(callback: DataChangeCallback): () => void {
  dataChangeCallbacks.add(callback);
  return () => {
    dataChangeCallbacks.delete(callback);
  };
}

/**
 * Register a callback to receive conflict notifications.
 * Called when a new conflict is detected during sync.
 */
export function onConflict(callback: ConflictCallback): () => void {
  conflictCallbacks.add(callback);
  return () => {
    conflictCallbacks.delete(callback);
  };
}

/**
 * Notify listeners of conflict changes.
 */
async function notifyConflicts(): Promise<void> {
  const count = await getConflictCount();
  conflictCallbacks.forEach((callback) => callback(count));
}

/**
 * Notify listeners of sync state changes.
 */
async function notifySyncState(state: SyncState): Promise<void> {
  if (!syncStateCallback) return;

  const pendingCount = await getPendingChangesCount();
  syncStateCallback(state, pendingCount);
}

/**
 * Get count of pending (unsynced) changes.
 * Includes both items with pending sync status and queued operations.
 */
export async function getPendingChangesCount(): Promise<number> {
  const pendingDishes = await getPendingItems(db.dishes);
  const pendingPlans = await getPendingItems(db.mealPlans);
  const queuedOperations = await getQueuedOperationCount();
  return pendingDishes.length + pendingPlans.length + queuedOperations;
}

// ============================================================================
// ONLINE/OFFLINE DETECTION
// ============================================================================

/**
 * Initialize online/offline listeners.
 */
export function initializeNetworkListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = async () => {
    isOnline = true;
    // Attempt to push pending changes when back online
    await pushChanges();
  };

  const handleOffline = async () => {
    isOnline = false;
    await notifySyncState('offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Set initial state
  isOnline = navigator.onLine;
  if (!isOnline) {
    notifySyncState('offline');
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Check if we're currently online.
 */
export function getIsOnline(): boolean {
  return isOnline;
}

// ============================================================================
// FULL SYNC
// ============================================================================

/**
 * Perform a full sync for a household.
 * Downloads all dishes and meal plans from Supabase and stores them locally.
 *
 * @param householdId - The household to sync
 * @returns Result of the sync operation
 */
export async function fullSync(householdId: string): Promise<SyncResult> {
  if (!isOnline) {
    return { success: false, error: 'No internet connection' };
  }

  try {
    await notifySyncState('syncing');
    currentHouseholdId = householdId;

    // Fetch dishes from Supabase
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('household_id', householdId)
      .is('deleted_at', null);

    if (dishesError) throw dishesError;

    // Fetch meal plans from Supabase
    const { data: plans, error: plansError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('household_id', householdId)
      .is('deleted_at', null);

    if (plansError) throw plansError;

    // Transform and store dishes locally
    const cachedDishes: CachedDish[] = (dishes || []).map((d) =>
      withSyncMetadata(transformDishFromServer(d), 'synced')
    );

    // Clear existing dishes for this household and add new ones
    await db.dishes.where('householdId').equals(householdId).delete();
    if (cachedDishes.length > 0) {
      await db.dishes.bulkAdd(cachedDishes);
    }

    // Transform and store meal plans locally
    const cachedPlans: CachedMealPlan[] = (plans || []).map((p) =>
      withSyncMetadata(transformPlanFromServer(p), 'synced')
    );

    await db.mealPlans.where('householdId').equals(householdId).delete();
    if (cachedPlans.length > 0) {
      await db.mealPlans.bulkAdd(cachedPlans);
    }

    // Record last sync time
    await setSyncMeta(`lastSync:${householdId}`, new Date().toISOString());

    await notifySyncState('idle');
    // Notify all listeners that data has changed
    dataChangeCallbacks.forEach((callback) => callback());

    return {
      success: true,
      syncedCount: cachedDishes.length + cachedPlans.length,
    };
  } catch (error) {
    console.error('Full sync failed:', error);
    await notifySyncState('error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
}

/**
 * Get the last sync time for a household.
 */
export async function getLastSyncTime(householdId: string): Promise<string | null> {
  const time = await getSyncMeta<string>(`lastSync:${householdId}`);
  return time ?? null;
}

// ============================================================================
// PUSH CHANGES
// ============================================================================

/**
 * Push all pending local changes to Supabase.
 * Called automatically when coming back online, or can be called manually.
 *
 * This now processes both:
 * 1. Items with pending sync status (legacy approach, still used for immediate syncs)
 * 2. Queued operations (for offline changes)
 */
export async function pushChanges(): Promise<SyncResult> {
  if (!isOnline) {
    return { success: false, error: 'No internet connection' };
  }

  try {
    await notifySyncState('syncing');

    let syncedCount = 0;

    // First, process the offline queue
    const queueResult = await processOfflineQueue();
    syncedCount += queueResult.syncedCount ?? 0;

    // Then, push any items with pending status (for immediate syncs that didn't use the queue)
    const pendingDishes = await getPendingItems(db.dishes);
    for (const dish of pendingDishes) {
      const success = await pushDish(dish);
      if (success) {
        await markAsSynced(db.dishes, dish.id);
        syncedCount++;
      }
    }

    // Push pending meal plans
    const pendingPlans = await getPendingItems(db.mealPlans);
    for (const plan of pendingPlans) {
      const success = await pushPlan(plan);
      if (success) {
        await markAsSynced(db.mealPlans, plan.id);
        syncedCount++;
      }
    }

    await notifySyncState('idle');

    return { success: true, syncedCount };
  } catch (error) {
    console.error('Push changes failed:', error);
    await notifySyncState('error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Push failed',
    };
  }
}

/**
 * Process all operations in the offline queue.
 * Operations are processed in FIFO order with retry logic.
 */
export async function processOfflineQueue(): Promise<SyncResult> {
  if (!isOnline) {
    return { success: false, error: 'No internet connection' };
  }

  const operations = await getQueuedOperations();

  if (operations.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const operation of operations) {
    // Skip operations that have exceeded max retries
    if (operation.retryCount >= MAX_QUEUE_RETRIES) {
      console.warn(
        `Skipping operation ${operation.id} - exceeded max retries (${MAX_QUEUE_RETRIES})`
      );
      continue;
    }

    const result = await processQueuedOperation(operation);

    if (result.success) {
      // Remove from queue on success
      await dequeueOperation(operation.id);
      syncedCount++;
    } else {
      // Record the attempt and error
      await markQueueAttempt(operation.id, result.error);
      if (result.error) {
        errors.push(`${operation.entityType}:${operation.entityId} - ${result.error}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Some queue operations failed:', errors);
  }

  return {
    success: errors.length === 0,
    syncedCount,
    error: errors.length > 0 ? `${errors.length} operations failed` : undefined,
  };
}

/**
 * Process a single queued operation.
 */
async function processQueuedOperation(
  operation: QueuedOperation
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (operation.entityType) {
      case 'dish': {
        const dish = await db.dishes.get(operation.entityId);
        if (!dish) {
          // Entity was deleted locally - nothing to sync
          return { success: true };
        }
        const success = await pushDish(dish);
        if (success) {
          await markAsSynced(db.dishes, dish.id);
        }
        return { success };
      }

      case 'mealPlan': {
        const plan = await db.mealPlans.get(operation.entityId);
        if (!plan) {
          // Entity was deleted locally - nothing to sync
          return { success: true };
        }
        const success = await pushPlan(plan);
        if (success) {
          await markAsSynced(db.mealPlans, plan.id);
        }
        return { success };
      }

      default:
        return { success: false, error: `Unknown entity type: ${operation.entityType}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Push a single dish to Supabase.
 */
async function pushDish(dish: CachedDish): Promise<boolean> {
  try {
    const serverDish = transformDishToServer(dish);

    if (dish.deletedAt) {
      // Soft delete on server
      const { error } = await supabase
        .from('dishes')
        .update({ deleted_at: dish.deletedAt })
        .eq('id', dish.id);

      if (error) throw error;
    } else {
      // Upsert the dish
      const { error } = await supabase.from('dishes').upsert(serverDish, {
        onConflict: 'id',
      });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to push dish:', dish.id, error);
    return false;
  }
}

/**
 * Push a single meal plan to Supabase.
 */
async function pushPlan(plan: CachedMealPlan): Promise<boolean> {
  try {
    const serverPlan = transformPlanToServer(plan);

    if (plan.deletedAt) {
      // Soft delete on server
      const { error } = await supabase
        .from('meal_plans')
        .update({ deleted_at: plan.deletedAt })
        .eq('id', plan.id);

      if (error) throw error;
    } else {
      // Upsert the plan
      const { error } = await supabase.from('meal_plans').upsert(serverPlan, {
        onConflict: 'id',
      });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to push plan:', plan.id, error);
    return false;
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to real-time changes for a household.
 * Call this after fullSync to receive updates from other household members.
 *
 * @param householdId - The household to subscribe to
 */
export function subscribeToHousehold(householdId: string): void {
  // Unsubscribe from previous channel if any
  unsubscribeFromHousehold();

  currentHouseholdId = householdId;

  // Create a new channel for this household
  currentChannel = supabase
    .channel(`household:${householdId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dishes',
        filter: `household_id=eq.${householdId}`,
      },
      handleDishChange
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meal_plans',
        filter: `household_id=eq.${householdId}`,
      },
      handlePlanChange
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to household changes:', householdId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to household changes');
      }
    });
}

/**
 * Unsubscribe from the current household's real-time channel.
 */
export function unsubscribeFromHousehold(): void {
  if (currentChannel) {
    supabase.removeChannel(currentChannel);
    currentChannel = null;
  }
}

/**
 * Handle incoming dish changes from real-time subscription.
 * Detects conflicts when local pending changes exist for the same entity.
 */
async function handleDishChange(payload: {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}): Promise<void> {
  const { eventType, new: newRecord, old: oldRecord } = payload;

  try {
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE': {
        const entityId = newRecord.id as string;

        // Check if this is a soft delete
        if (newRecord.deleted_at) {
          await db.dishes.delete(entityId);
        } else {
          const serverDish = transformDishFromServer(newRecord);

          // Check for conflict: do we have pending local changes?
          const localDish = await db.dishes.get(entityId);
          if (localDish && localDish._syncStatus === 'pending') {
            // Conflict detected: local pending changes + incoming server changes
            const conflict: ConflictRecord = {
              id: entityId,
              entityType: 'dish',
              entityId,
              localVersion: stripCacheMetadataFromDish(localDish),
              serverVersion: serverDish,
              detectedAt: new Date().toISOString(),
              localChangedBy: localDish.addedBy,
              serverChangedBy: serverDish.addedBy,
            };
            await addConflict(conflict);
            await markAsConflict(db.dishes, entityId);
            await notifyConflicts();
          } else {
            // No conflict - just update local cache
            const cached = withSyncMetadata(serverDish, 'synced');
            await db.dishes.put(cached);
          }
        }
        break;
      }
      case 'DELETE': {
        await db.dishes.delete(oldRecord.id as string);
        break;
      }
    }

    // Notify all listeners that data has changed
    dataChangeCallbacks.forEach((callback) => callback());
  } catch (error) {
    console.error('Failed to handle dish change:', error);
  }
}

/**
 * Handle incoming meal plan changes from real-time subscription.
 * Detects conflicts when local pending changes exist for the same entity.
 */
async function handlePlanChange(payload: {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}): Promise<void> {
  const { eventType, new: newRecord, old: oldRecord } = payload;

  try {
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE': {
        const entityId = newRecord.id as string;

        if (newRecord.deleted_at) {
          await db.mealPlans.delete(entityId);
        } else {
          const serverPlan = transformPlanFromServer(newRecord);

          // Check for conflict: do we have pending local changes?
          const localPlan = await db.mealPlans.get(entityId);
          if (localPlan && localPlan._syncStatus === 'pending') {
            // Conflict detected: local pending changes + incoming server changes
            const conflict: ConflictRecord = {
              id: entityId,
              entityType: 'mealPlan',
              entityId,
              localVersion: stripCacheMetadataFromPlan(localPlan),
              serverVersion: serverPlan,
              detectedAt: new Date().toISOString(),
              localChangedBy: localPlan.createdBy,
              serverChangedBy: serverPlan.createdBy,
            };
            await addConflict(conflict);
            await markAsConflict(db.mealPlans, entityId);
            await notifyConflicts();
          } else {
            // No conflict - just update local cache
            const cached = withSyncMetadata(serverPlan, 'synced');
            await db.mealPlans.put(cached);
          }
        }
        break;
      }
      case 'DELETE': {
        await db.mealPlans.delete(oldRecord.id as string);
        break;
      }
    }

    // Notify all listeners that data has changed
    dataChangeCallbacks.forEach((callback) => callback());
  } catch (error) {
    console.error('Failed to handle plan change:', error);
  }
}

// ============================================================================
// LOCAL CACHE OPERATIONS
// ============================================================================

/**
 * Add a dish to local cache with pending status.
 * Will be synced to server in background, or queued for later if offline.
 */
export async function addDishToCache(dish: Dish): Promise<void> {
  const cached = withSyncMetadata(dish, 'pending');
  await db.dishes.put(cached);

  if (isOnline) {
    // Attempt to sync immediately
    pushChanges();
  } else {
    // Queue for later when back online
    await enqueueOperation('add', 'dish', dish.id);
    await notifySyncState('offline');
  }
}

/**
 * Update a dish in local cache.
 * Will be synced to server in background, or queued for later if offline.
 */
export async function updateDishInCache(dish: Dish): Promise<void> {
  const cached = withSyncMetadata(dish, 'pending');
  await db.dishes.put(cached);

  if (isOnline) {
    pushChanges();
  } else {
    await enqueueOperation('update', 'dish', dish.id);
    await notifySyncState('offline');
  }
}

/**
 * Soft-delete a dish in local cache.
 * Will be synced to server in background, or queued for later if offline.
 */
export async function deleteDishFromCache(dishId: string): Promise<void> {
  const existing = await db.dishes.get(dishId);
  if (existing) {
    const deleted: CachedDish = {
      ...existing,
      deletedAt: new Date().toISOString(),
      _syncStatus: 'pending',
      _localUpdatedAt: new Date().toISOString(),
    };
    await db.dishes.put(deleted);

    if (isOnline) {
      pushChanges();
    } else {
      await enqueueOperation('delete', 'dish', dishId);
      await notifySyncState('offline');
    }
  }
}

/**
 * Get all dishes from local cache for a household.
 */
export async function getDishesFromCache(householdId: string): Promise<Dish[]> {
  const dishes = await db.dishes
    .where('householdId')
    .equals(householdId)
    .toArray();

  // Filter out soft-deleted dishes and strip cache metadata
  return dishes
    .filter((d) => !d.deletedAt)
    .map((d) => stripCacheMetadata(d));
}

/**
 * Add a meal plan to local cache.
 * Will be synced to server in background, or queued for later if offline.
 */
export async function addPlanToCache(plan: MealPlan): Promise<void> {
  const cached = withSyncMetadata(plan, 'pending');
  await db.mealPlans.put(cached);

  if (isOnline) {
    pushChanges();
  } else {
    await enqueueOperation('add', 'mealPlan', plan.id);
    await notifySyncState('offline');
  }
}

/**
 * Update a meal plan in local cache.
 * Will be synced to server in background, or queued for later if offline.
 */
export async function updatePlanInCache(plan: MealPlan): Promise<void> {
  const cached = withSyncMetadata(plan, 'pending');
  await db.mealPlans.put(cached);

  if (isOnline) {
    pushChanges();
  } else {
    await enqueueOperation('update', 'mealPlan', plan.id);
    await notifySyncState('offline');
  }
}

/**
 * Soft-delete a meal plan in local cache.
 * Will be synced to server in background, or queued for later if offline.
 */
export async function deletePlanFromCache(planId: string): Promise<void> {
  const existing = await db.mealPlans.get(planId);
  if (existing) {
    const deleted: CachedMealPlan = {
      ...existing,
      deletedAt: new Date().toISOString(),
      _syncStatus: 'pending',
      _localUpdatedAt: new Date().toISOString(),
    };
    await db.mealPlans.put(deleted);

    if (isOnline) {
      pushChanges();
    } else {
      await enqueueOperation('delete', 'mealPlan', planId);
      await notifySyncState('offline');
    }
  }
}

/**
 * Get all meal plans from local cache for a household.
 */
export async function getPlansFromCache(householdId: string): Promise<MealPlan[]> {
  const plans = await db.mealPlans
    .where('householdId')
    .equals(householdId)
    .toArray();

  return plans
    .filter((p) => !p.deletedAt)
    .map((p) => stripCacheMetadata(p));
}

// ============================================================================
// TRANSFORM FUNCTIONS
// ============================================================================

/**
 * Transform a dish from Supabase format to app format.
 */
function transformDishFromServer(record: Record<string, unknown>): Dish {
  return {
    id: record.id as string,
    householdId: record.household_id as string,
    name: record.name as string,
    type: record.type as Dish['type'],
    cookTimeMinutes: record.cook_time_minutes as number | undefined,
    recipeUrl: record.recipe_url as string | undefined,
    addedBy: record.added_by as string,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    deletedAt: record.deleted_at as string | undefined,
  };
}

/**
 * Transform a dish to Supabase format.
 */
function transformDishToServer(
  dish: Dish
): Record<string, unknown> {
  return {
    id: dish.id,
    household_id: dish.householdId,
    name: dish.name,
    type: dish.type,
    cook_time_minutes: dish.cookTimeMinutes ?? null,
    recipe_url: dish.recipeUrl ?? null,
    added_by: dish.addedBy,
    created_at: dish.createdAt,
    updated_at: dish.updatedAt,
    deleted_at: dish.deletedAt ?? null,
  };
}

/**
 * Transform a meal plan from Supabase format to app format.
 */
function transformPlanFromServer(record: Record<string, unknown>): MealPlan {
  return {
    id: record.id as string,
    householdId: record.household_id as string,
    name: record.name as string | undefined,
    startDate: record.start_date as string,
    days: record.days as MealPlan['days'],
    createdBy: record.created_by as string,
    lockedBy: record.locked_by as string | undefined,
    lockedAt: record.locked_at as string | undefined,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    deletedAt: record.deleted_at as string | undefined,
  };
}

/**
 * Transform a meal plan to Supabase format.
 */
function transformPlanToServer(
  plan: MealPlan
): Record<string, unknown> {
  return {
    id: plan.id,
    household_id: plan.householdId,
    name: plan.name ?? null,
    start_date: plan.startDate,
    days: plan.days,
    created_by: plan.createdBy,
    locked_by: plan.lockedBy ?? null,
    locked_at: plan.lockedAt ?? null,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
    deleted_at: plan.deletedAt ?? null,
  };
}

/**
 * Strip cache metadata from an entity.
 */
function stripCacheMetadata<T extends { _syncStatus?: unknown; _localUpdatedAt?: unknown; _serverUpdatedAt?: unknown }>(
  entity: T
): Omit<T, '_syncStatus' | '_localUpdatedAt' | '_serverUpdatedAt'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _syncStatus, _localUpdatedAt, _serverUpdatedAt, ...rest } = entity;
  return rest as Omit<T, '_syncStatus' | '_localUpdatedAt' | '_serverUpdatedAt'>;
}

/**
 * Strip cache metadata from a cached dish, returning a plain Dish.
 */
function stripCacheMetadataFromDish(cached: CachedDish): Dish {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _syncStatus, _localUpdatedAt, _serverUpdatedAt, ...dish } = cached;
  return dish;
}

/**
 * Strip cache metadata from a cached meal plan, returning a plain MealPlan.
 */
function stripCacheMetadataFromPlan(cached: CachedMealPlan): MealPlan {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _syncStatus, _localUpdatedAt, _serverUpdatedAt, ...plan } = cached;
  return plan;
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up sync resources.
 * Call this on logout or when switching households.
 */
export function cleanupSync(): void {
  unsubscribeFromHousehold();
  currentHouseholdId = null;
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Get all unresolved conflicts.
 */
export { getConflicts, getConflictCount };

/**
 * Resolution strategy for a conflict.
 * - 'local': Keep the local version, discard server changes
 * - 'server': Keep the server version, discard local changes
 */
export type ConflictResolution = 'local' | 'server';

/**
 * Resolve a conflict by choosing which version to keep.
 *
 * @param entityId - The ID of the entity in conflict
 * @param resolution - Which version to keep: 'local' or 'server'
 * @returns True if resolution was successful
 */
export async function resolveConflict(
  entityId: string,
  resolution: ConflictResolution
): Promise<boolean> {
  const conflict = await db.conflicts.get(entityId);
  if (!conflict) {
    console.warn(`No conflict found for entity: ${entityId}`);
    return false;
  }

  try {
    if (conflict.entityType === 'dish') {
      if (resolution === 'local') {
        // Keep local version, mark as pending to push to server
        const localDish = conflict.localVersion as Dish;
        const cached = withSyncMetadata(localDish, 'pending');
        await db.dishes.put(cached);
        // Queue for sync
        await enqueueOperation('update', 'dish', entityId);
      } else {
        // Keep server version
        const serverDish = conflict.serverVersion as Dish;
        const cached = withSyncMetadata(serverDish, 'synced');
        await db.dishes.put(cached);
      }
    } else if (conflict.entityType === 'mealPlan') {
      if (resolution === 'local') {
        // Keep local version, mark as pending to push to server
        const localPlan = conflict.localVersion as MealPlan;
        const cached = withSyncMetadata(localPlan, 'pending');
        await db.mealPlans.put(cached);
        // Queue for sync
        await enqueueOperation('update', 'mealPlan', entityId);
      } else {
        // Keep server version
        const serverPlan = conflict.serverVersion as MealPlan;
        const cached = withSyncMetadata(serverPlan, 'synced');
        await db.mealPlans.put(cached);
      }
    }

    // Remove the conflict record
    await removeConflict(entityId);

    // Notify listeners
    await notifyConflicts();
    dataChangeCallbacks.forEach((callback) => callback());

    // If we kept local, try to push now
    if (resolution === 'local' && isOnline) {
      pushChanges();
    }

    return true;
  } catch (error) {
    console.error('Failed to resolve conflict:', error);
    return false;
  }
}

// ============================================================================
// LOCAL DISH MIGRATION
// ============================================================================

import { getDishes as getLocalDishes, deleteDish as deleteLocalDish } from './storage';

/**
 * Check if there are local dishes that can be migrated to a household.
 * Local dishes are stored in localStorage (not IndexedDB) and don't have a householdId.
 *
 * @returns The number of local dishes available for migration
 */
export function getLocalDishCount(): number {
  const localDishes = getLocalDishes();
  return localDishes.length;
}

/**
 * Get all local dishes that can be migrated.
 *
 * @returns Array of local dishes
 */
export function getLocalDishesForMigration(): Dish[] {
  return getLocalDishes() as Dish[];
}

/**
 * Migrate local dishes to a household.
 * This uploads them to Supabase, stores them in IndexedDB, and clears localStorage.
 *
 * @param householdId - The household to migrate dishes to
 * @param userId - The user performing the migration (becomes addedBy)
 * @returns Result of the migration
 */
export async function migrateLocalDishes(
  householdId: string,
  userId: string
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  const localDishes = getLocalDishes();

  if (localDishes.length === 0) {
    return { success: true, migratedCount: 0 };
  }

  try {
    const timestamp = new Date().toISOString();
    let migratedCount = 0;

    for (const localDish of localDishes) {
      // Create the dish with household context
      const dish: Dish = {
        id: localDish.id,
        name: localDish.name,
        type: localDish.type,
        householdId,
        addedBy: userId,
        createdAt: localDish.createdAt,
        updatedAt: timestamp,
        ...(localDish.recipeUrls && { recipeUrls: localDish.recipeUrls }),
        ...(localDish.cookTimeMinutes !== undefined && {
          cookTimeMinutes: localDish.cookTimeMinutes,
        }),
      };

      // Upload to Supabase
      const serverDish = transformDishToServer(dish);
      const { error } = await supabase.from('dishes').upsert(serverDish, {
        onConflict: 'id',
      });

      if (error) {
        console.error('Failed to migrate dish:', dish.name, error);
        continue; // Try to migrate remaining dishes
      }

      // Store in local IndexedDB cache
      const cached = withSyncMetadata(dish, 'synced');
      await db.dishes.put(cached);

      // Remove from localStorage
      deleteLocalDish(localDish.id);

      migratedCount++;
    }

    // Notify listeners that data changed
    dataChangeCallbacks.forEach((callback) => callback());

    return { success: true, migratedCount };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : 'Migration failed',
    };
  }
}
