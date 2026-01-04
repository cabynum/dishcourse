/**
 * Services
 *
 * Central export point for all services used in DishCourse.
 */

// Storage service for localStorage operations
export {
  // Dishes
  getDishes,
  getDish,
  saveDish,
  updateDish,
  deleteDish,
  // Plans
  getPlans,
  getPlan,
  savePlan,
  updatePlan,
  deletePlan,
  // Export/Import
  exportData,
  importData,
  clearAllData,
} from './storage';

// Suggestion service for meal recommendations
export { suggest, suggestMany } from './suggestion';

// Auth service for authentication operations
export {
  signInWithMagicLink,
  signOut,
  getCurrentUser,
  getSession,
  getProfile,
  updateProfile,
  onAuthStateChange,
  refreshSession,
  devAutoLogin,
  devSignInWithPassword,
} from './auth';

// Household service for household management
export {
  getHouseholds,
  getHousehold,
  getMembers,
  createHousehold,
  updateHousehold,
  addMember,
  removeMember,
  leaveHousehold,
  isMember,
  getMembership,
} from './households';

// Invite service for household invites
export {
  generateInvite,
  getInvite,
  validateInvite,
  useInvite,
  getInviteUrl,
  getActiveInvite,
} from './invites';

// Sync service for offline-first data synchronization
export {
  // State
  type SyncState,
  onSyncStateChange,
  onDataChange,
  getPendingChangesCount,
  getIsOnline,
  // Network
  initializeNetworkListeners,
  // Sync operations
  fullSync,
  pushChanges,
  processOfflineQueue,
  getLastSyncTime,
  // Real-time
  subscribeToHousehold,
  unsubscribeFromHousehold,
  // Local cache operations
  addDishToCache,
  updateDishInCache,
  deleteDishFromCache,
  getDishesFromCache,
  addPlanToCache,
  updatePlanInCache,
  deletePlanFromCache,
  getPlansFromCache,
  // Conflict detection and resolution
  onConflict,
  getConflicts,
  getConflictCount,
  resolveConflict,
  type ConflictResolution,
  // Cleanup
  cleanupSync,
} from './sync';
