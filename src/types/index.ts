/**
 * Type Definitions
 *
 * Central export point for all TypeScript types used in DishCourse.
 *
 * Entity naming convention:
 * - Dish: Individual food item (e.g., "Grilled Chicken")
 * - Meal: Combination of dishes for one day (not a type - just conceptual)
 * - MealPlan: Schedule of meals across multiple days
 */

// Dish types
export type {
  Dish,
  DishType,
  CreateDishInput,
  UpdateDishInput,
  MealSuggestion,
} from './dish';

// Plan types
export type {
  MealPlan,
  DayAssignment,
  CreateMealPlanInput,
  UpdateMealPlanInput,
} from './plan';

// Storage types
export { STORAGE_KEYS, SCHEMA_VERSION } from './storage';
export type { ExportData } from './storage';

// Auth types
export type {
  User,
  Profile,
  UpdateProfileInput,
  AuthState,
  MagicLinkResult,
  SignOutResult,
} from './auth';

// Household types
export type {
  Household,
  CreateHouseholdInput,
  UpdateHouseholdInput,
  MemberRole,
  HouseholdMember,
  HouseholdMemberWithProfile,
  Invite,
  InviteValidation,
  HouseholdState,
} from './household';

// Proposal types
export type {
  Proposal,
  ProposalStatus,
  Vote,
  ProposalDismissal,
  ProposedMeal,
  CreateProposalInput,
  ProposalRow,
  VoteRow,
  DismissalRow,
} from './proposal';
