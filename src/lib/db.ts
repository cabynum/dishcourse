/**
 * Local Database (IndexedDB via Dexie)
 *
 * This provides offline-first data storage. All reads come from here first,
 * and writes are queued for sync to Supabase when online.
 *
 * The local cache enables:
 * - Instant UI responses (no network latency)
 * - Offline access to previously synced data
 * - Optimistic updates with background sync
 */

import Dexie, { type Table } from 'dexie';

// ============================================================================
// SYNC STATUS
// ============================================================================

/**
 * Tracks the sync state of a cached item.
 * - synced: Matches the server state
 * - pending: Local changes not yet uploaded
 * - conflict: Local and server changes conflict (needs resolution)
 */
export type SyncStatus = 'synced' | 'pending' | 'conflict';

// ============================================================================
// ENTITY TYPES (matching Supabase schema)
// ============================================================================

/**
 * User profile information.
 */
export interface Profile {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A household is a group that shares dishes and meal plans.
 */
export interface Household {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Membership linking a user to a household.
 */
export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: 'creator' | 'member';
  joinedAt: string;
}

/**
 * Invite to join a household.
 */
export interface Invite {
  id: string;
  householdId: string;
  code: string;
  createdBy: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
}

/**
 * Dish type categories.
 */
export type DishType = 'entree' | 'side' | 'other';

/**
 * A dish in the household's collection.
 */
export interface Dish {
  id: string;
  householdId: string;
  name: string;
  type: DishType;
  cookTimeMinutes?: number;
  recipeUrl?: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  /** Side dish IDs that pair well with this entree (only applies to entrees) */
  pairsWellWith?: string[];
}

/**
 * A day's meal assignment within a plan.
 */
export interface DayAssignment {
  date: string;
  dishIds: string[];
  assignedBy?: string;
}

/**
 * A meal plan for a household.
 */
export interface MealPlan {
  id: string;
  householdId: string;
  name?: string;
  startDate: string;
  days: DayAssignment[];
  createdBy: string;
  lockedBy?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ============================================================================
// PROPOSAL TYPES (for meal proposals and voting)
// ============================================================================

/**
 * Proposal status values.
 */
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'expired';

/**
 * The meal being proposed.
 */
export interface ProposedMeal {
  entreeId: string;
  sideIds: string[];
}

/**
 * A meal proposal for household voting.
 */
export interface Proposal {
  id: string;
  householdId: string;
  proposedBy: string;
  proposedAt: string;
  targetDate: string;
  meal: ProposedMeal;
  status: ProposalStatus;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A vote on a proposal.
 */
export interface ProposalVote {
  id: string;
  proposalId: string;
  voterId: string;
  vote: 'approve' | 'reject';
  votedAt: string;
}

/**
 * A dismissal of a proposal from a user's view (Rule 4).
 */
export interface ProposalDismissal {
  id: string;
  proposalId: string;
  userId: string;
  dismissedAt: string;
}

// ============================================================================
// CACHED ENTITY TYPES (with sync metadata)
// ============================================================================

/**
 * A cached entity includes sync metadata for offline support.
 */
interface CacheMetadata {
  /** Current sync status */
  _syncStatus: SyncStatus;
  /** When this item was last modified locally */
  _localUpdatedAt: string;
  /** Server version for conflict detection (optional) */
  _serverUpdatedAt?: string;
}

export type CachedProfile = Profile & CacheMetadata;
export type CachedHousehold = Household & CacheMetadata;
export type CachedHouseholdMember = HouseholdMember & CacheMetadata;
export type CachedDish = Dish & CacheMetadata;
export type CachedMealPlan = MealPlan & CacheMetadata;
export type CachedProposal = Proposal & CacheMetadata;
export type CachedProposalVote = ProposalVote & CacheMetadata;
export type CachedProposalDismissal = ProposalDismissal & CacheMetadata;

// ============================================================================
// SYNC METADATA
// ============================================================================

/**
 * Metadata about the sync state, stored in IndexedDB.
 */
export interface SyncMeta {
  key: string;
  value: unknown;
}

// ============================================================================
// OFFLINE QUEUE
// ============================================================================

/**
 * Types of operations that can be queued for offline sync.
 */
export type QueuedOperationType = 'add' | 'update' | 'delete';

/**
 * Entity types that can be synced.
 */
export type QueuedEntityType = 'dish' | 'mealPlan' | 'proposal' | 'proposalVote' | 'proposalDismissal';

/**
 * A queued operation waiting to be synced to the server.
 * Operations are processed in FIFO order (by createdAt timestamp).
 */
export interface QueuedOperation {
  /** Unique ID for this queue entry */
  id: string;
  /** Type of operation: add, update, or delete */
  operationType: QueuedOperationType;
  /** Type of entity: dish or mealPlan */
  entityType: QueuedEntityType;
  /** ID of the entity being operated on */
  entityId: string;
  /** When this operation was queued */
  createdAt: string;
  /** Number of times we've tried to process this operation */
  retryCount: number;
  /** Last error message if processing failed */
  lastError?: string;
  /** When we last attempted to process this */
  lastAttemptAt?: string;
}

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

/**
 * The DishCourse local database.
 *
 * Uses Dexie.js for a clean API over IndexedDB.
 */
class DishCourseDB extends Dexie {
  // Tables with typed access
  profiles!: Table<CachedProfile>;
  households!: Table<CachedHousehold>;
  members!: Table<CachedHouseholdMember>;
  dishes!: Table<CachedDish>;
  mealPlans!: Table<CachedMealPlan>;
  proposals!: Table<CachedProposal>;
  proposalVotes!: Table<CachedProposalVote>;
  proposalDismissals!: Table<CachedProposalDismissal>;
  syncMeta!: Table<SyncMeta>;
  offlineQueue!: Table<QueuedOperation>;
  conflicts!: Table<ConflictRecord>;

  constructor() {
    super('dishcourse');

    // Version 1: Initial schema
    this.version(1).stores({
      profiles: 'id',
      households: 'id',
      members: 'id, householdId, userId',
      dishes: 'id, householdId, _syncStatus',
      mealPlans: 'id, householdId, _syncStatus',
      syncMeta: 'key',
    });

    // Version 2: Add offline queue for reliable sync
    this.version(2).stores({
      profiles: 'id',
      households: 'id',
      members: 'id, householdId, userId',
      dishes: 'id, householdId, _syncStatus',
      mealPlans: 'id, householdId, _syncStatus',
      syncMeta: 'key',
      offlineQueue: 'id, entityType, entityId, createdAt',
    });

    // Version 3: Add conflicts table for conflict resolution
    this.version(3).stores({
      profiles: 'id',
      households: 'id',
      members: 'id, householdId, userId',
      dishes: 'id, householdId, _syncStatus',
      mealPlans: 'id, householdId, _syncStatus',
      syncMeta: 'key',
      offlineQueue: 'id, entityType, entityId, createdAt',
      conflicts: 'id, entityType, entityId',
    });

    // Version 4: Add proposals, votes, and dismissals for meal proposals feature
    this.version(4).stores({
      profiles: 'id',
      households: 'id',
      members: 'id, householdId, userId',
      dishes: 'id, householdId, _syncStatus',
      mealPlans: 'id, householdId, _syncStatus',
      proposals: 'id, householdId, status, _syncStatus',
      proposalVotes: 'id, proposalId, voterId, _syncStatus',
      proposalDismissals: 'id, proposalId, userId, _syncStatus',
      syncMeta: 'key',
      offlineQueue: 'id, entityType, entityId, createdAt',
      conflicts: 'id, entityType, entityId',
    });
  }
}

/**
 * The singleton database instance.
 */
export const db = new DishCourseDB();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Add sync metadata to an entity for local storage.
 */
export function withSyncMetadata<T>(
  entity: T,
  status: SyncStatus = 'pending'
): T & CacheMetadata {
  return {
    ...entity,
    _syncStatus: status,
    _localUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Get all pending (unsynced) items from a table.
 */
export async function getPendingItems<T extends CacheMetadata>(
  table: Table<T>
): Promise<T[]> {
  return table.where('_syncStatus').equals('pending').toArray();
}

/**
 * Mark an item as synced.
 */
export async function markAsSynced<T extends CacheMetadata>(
  table: Table<T>,
  id: string,
  serverUpdatedAt?: string
): Promise<void> {
  // Use modify callback to avoid TypeScript generics issues with Dexie's UpdateSpec
  await table.where('id').equals(id).modify((item) => {
    item._syncStatus = 'synced';
    if (serverUpdatedAt) {
      item._serverUpdatedAt = serverUpdatedAt;
    }
  });
}

/**
 * Clear all local data (for sign out or testing).
 */
export async function clearAllData(): Promise<void> {
  await db.profiles.clear();
  await db.households.clear();
  await db.members.clear();
  await db.dishes.clear();
  await db.mealPlans.clear();
  await db.proposals.clear();
  await db.proposalVotes.clear();
  await db.proposalDismissals.clear();
  await db.syncMeta.clear();
  await db.offlineQueue.clear();
  await db.conflicts.clear();
}

/**
 * Clear all local data for a specific household.
 * Called when a user leaves a household to clean up local cache.
 *
 * @param householdId - The ID of the household to clear data for
 */
export async function clearHouseholdData(householdId: string): Promise<void> {
  // Get proposal IDs before deleting (needed to clear votes and dismissals)
  const proposalIds = await db.proposals.where('householdId').equals(householdId).primaryKeys();
  
  // Clear votes and dismissals for proposals in this household
  for (const proposalId of proposalIds) {
    await db.proposalVotes.where('proposalId').equals(proposalId).delete();
    await db.proposalDismissals.where('proposalId').equals(proposalId).delete();
  }
  
  // Clear proposals for this household
  await db.proposals.where('householdId').equals(householdId).delete();
  
  // Clear dishes for this household
  await db.dishes.where('householdId').equals(householdId).delete();
  
  // Clear meal plans for this household
  await db.mealPlans.where('householdId').equals(householdId).delete();
  
  // Clear members for this household
  await db.members.where('householdId').equals(householdId).delete();
  
  // Clear the household record itself
  await db.households.delete(householdId);
  
  // Clear any pending operations for entities in this household
  // Note: We need to check each queued operation's entity
  const dishIds = await db.dishes.where('householdId').equals(householdId).primaryKeys();
  const planIds = await db.mealPlans.where('householdId').equals(householdId).primaryKeys();
  const entityIds = [...dishIds, ...planIds, ...proposalIds];
  
  for (const entityId of entityIds) {
    await db.offlineQueue.where('entityId').equals(entityId).delete();
    await db.conflicts.where('entityId').equals(entityId).delete();
  }
}

/**
 * Get a sync metadata value.
 */
export async function getSyncMeta<T>(key: string): Promise<T | undefined> {
  const meta = await db.syncMeta.get(key);
  return meta?.value as T | undefined;
}

/**
 * Set a sync metadata value.
 */
export async function setSyncMeta<T>(key: string, value: T): Promise<void> {
  await db.syncMeta.put({ key, value });
}

// ============================================================================
// OFFLINE QUEUE FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID for queue entries.
 */
function generateQueueId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Add an operation to the offline queue.
 * Deduplicates by replacing existing operations for the same entity.
 *
 * @param operationType - The type of operation (add, update, delete)
 * @param entityType - The type of entity (dish, mealPlan)
 * @param entityId - The ID of the entity
 */
export async function enqueueOperation(
  operationType: QueuedOperationType,
  entityType: QueuedEntityType,
  entityId: string
): Promise<void> {
  // Check for existing operations on this entity
  const existing = await db.offlineQueue
    .where('entityId')
    .equals(entityId)
    .first();

  if (existing) {
    // Merge operations intelligently:
    // - add + update = add (still need to create it)
    // - add + delete = remove from queue entirely (never existed on server)
    // - update + update = update (just one update needed)
    // - update + delete = delete (override the update)
    // - delete + anything = keep delete (can't operate on deleted item)

    if (existing.operationType === 'add' && operationType === 'delete') {
      // Item was created and deleted locally before syncing - remove from queue
      await db.offlineQueue.delete(existing.id);
      return;
    }

    if (existing.operationType === 'delete') {
      // Can't update or add a deleted item - keep the delete
      return;
    }

    if (existing.operationType === 'add' && operationType === 'update') {
      // Still an add - the add will include the updated data
      return;
    }

    // For other cases (update+update, update+delete, add+add), replace with new operation
    await db.offlineQueue.update(existing.id, {
      operationType,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastError: undefined,
      lastAttemptAt: undefined,
    });
    return;
  }

  // No existing operation, add new one
  const queuedOperation: QueuedOperation = {
    id: generateQueueId(),
    operationType,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  await db.offlineQueue.add(queuedOperation);
}

/**
 * Get all queued operations, ordered by creation time (FIFO).
 */
export async function getQueuedOperations(): Promise<QueuedOperation[]> {
  return db.offlineQueue.orderBy('createdAt').toArray();
}

/**
 * Get the count of queued operations.
 */
export async function getQueuedOperationCount(): Promise<number> {
  return db.offlineQueue.count();
}

/**
 * Mark a queued operation as attempted (increment retry count, record error).
 */
export async function markQueueAttempt(
  operationId: string,
  error?: string
): Promise<void> {
  const operation = await db.offlineQueue.get(operationId);
  if (operation) {
    await db.offlineQueue.update(operationId, {
      retryCount: operation.retryCount + 1,
      lastError: error,
      lastAttemptAt: new Date().toISOString(),
    });
  }
}

/**
 * Remove a queued operation (after successful sync).
 */
export async function dequeueOperation(operationId: string): Promise<void> {
  await db.offlineQueue.delete(operationId);
}

/**
 * Remove all queued operations for an entity (e.g., after full sync).
 */
export async function clearQueueForEntity(entityId: string): Promise<void> {
  await db.offlineQueue.where('entityId').equals(entityId).delete();
}

/**
 * Clear the entire offline queue.
 */
export async function clearOfflineQueue(): Promise<void> {
  await db.offlineQueue.clear();
}

/**
 * Maximum number of retries before an operation is considered failed.
 */
export const MAX_QUEUE_RETRIES = 5;

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * A record of a sync conflict that needs user resolution.
 * Stores both the local and server versions of an entity.
 */
export interface ConflictRecord {
  /** Unique ID for this conflict (same as entity ID) */
  id: string;
  /** Type of entity: dish or mealPlan */
  entityType: QueuedEntityType;
  /** ID of the entity in conflict */
  entityId: string;
  /** The local version of the entity (user's changes) */
  localVersion: Dish | MealPlan;
  /** The server version of the entity (other user's changes) */
  serverVersion: Dish | MealPlan;
  /** When the conflict was detected */
  detectedAt: string;
  /** Who made the local change (current user) */
  localChangedBy?: string;
  /** Who made the server change (other user) */
  serverChangedBy?: string;
}

/**
 * Add a conflict record to the database.
 */
export async function addConflict(conflict: ConflictRecord): Promise<void> {
  // Remove any existing conflict for this entity
  await db.conflicts.delete(conflict.entityId);
  await db.conflicts.add(conflict);
}

/**
 * Get all unresolved conflicts.
 */
export async function getConflicts(): Promise<ConflictRecord[]> {
  return db.conflicts.toArray();
}

/**
 * Get the count of unresolved conflicts.
 */
export async function getConflictCount(): Promise<number> {
  return db.conflicts.count();
}

/**
 * Get a specific conflict by entity ID.
 */
export async function getConflict(entityId: string): Promise<ConflictRecord | undefined> {
  return db.conflicts.get(entityId);
}

/**
 * Remove a conflict (after resolution).
 */
export async function removeConflict(entityId: string): Promise<void> {
  await db.conflicts.delete(entityId);
}

/**
 * Clear all conflicts.
 */
export async function clearConflicts(): Promise<void> {
  await db.conflicts.clear();
}

/**
 * Mark an entity as having a conflict.
 * Updates the sync status to 'conflict'.
 */
export async function markAsConflict<T extends CacheMetadata>(
  table: Table<T>,
  id: string
): Promise<void> {
  await table.where('id').equals(id).modify((item) => {
    item._syncStatus = 'conflict';
  });
}
