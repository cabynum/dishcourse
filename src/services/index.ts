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
  sendOtpCode,
  verifyOtpCode,
  signInWithMagicLink, // @deprecated - use sendOtpCode instead
  signOut,
  getCurrentUser,
  getSession,
  getProfile,
  updateProfile,
  isDisplayNameAvailable,
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
  deleteHousehold,
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
  // Local cache operations - dishes
  addDishToCache,
  updateDishInCache,
  deleteDishFromCache,
  getDishesFromCache,
  // Local cache operations - plans
  addPlanToCache,
  updatePlanInCache,
  deletePlanFromCache,
  getPlansFromCache,
  // Local cache operations - proposals
  addProposalToCache,
  updateProposalInCache,
  getProposalsFromCache,
  getVotesFromCache,
  getDismissalsFromCache,
  addVoteToCache,
  addDismissalToCache,
  // Conflict detection and resolution
  onConflict,
  getConflicts,
  getConflictCount,
  resolveConflict,
  type ConflictResolution,
  // Cleanup
  cleanupSync,
} from './sync';

// Locks service for meal plan locking
export {
  // Constants
  LOCK_TIMEOUT_MS,
  // Types
  type LockResult,
  type LockStatus,
  // Operations
  acquireLock,
  releaseLock,
  forceUnlock,
  checkLock,
  refreshLock,
  // Helpers
  isLockStale,
  formatLockTime,
} from './locks';

// Proposals service for meal proposals and voting
export {
  // Resolution logic
  resolveProposal,
  shouldExpireProposal,
  shouldAutoClearResult,
  isVisibleToUser,
  // CRUD
  createProposal,
  getProposals,
  getProposal,
  // Voting
  castVote,
  withdrawProposal,
  dismissProposal,
  // Status management
  updateProposalStatus,
  expirePendingProposals,
  getPendingProposalCount,
} from './proposals';
