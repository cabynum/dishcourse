/**
 * Household Service
 *
 * Handles all household-related operations: creating, joining, leaving,
 * and managing household membership.
 *
 * @example
 * ```typescript
 * // Create a new household
 * const household = await createHousehold('Smith Family', userId);
 *
 * // Get all households for a user
 * const households = await getHouseholds(userId);
 *
 * // Get members of a household
 * const members = await getMembers(householdId);
 * ```
 */

import { supabase } from '@/lib/supabase';
import type {
  Household,
  HouseholdMember,
  HouseholdMemberWithProfile,
} from '@/types';

/**
 * Fetches all households the user belongs to.
 *
 * @param userId - The user's profile ID
 * @returns Array of households
 */
export async function getHouseholds(userId: string): Promise<Household[]> {
  // First get the household IDs the user is a member of
  const { data: memberships, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId);

  if (memberError || !memberships) {
    console.error('Failed to fetch household memberships:', memberError);
    return [];
  }

  if (memberships.length === 0) {
    return [];
  }

  // Then fetch the household details
  const householdIds = memberships.map((m) => m.household_id);
  const { data: households, error: householdError } = await supabase
    .from('households')
    .select('id, name, created_by, created_at, updated_at')
    .in('id', householdIds)
    .order('created_at', { ascending: false });

  if (householdError || !households) {
    console.error('Failed to fetch households:', householdError);
    return [];
  }

  return households.map((h) => ({
    id: h.id,
    name: h.name,
    createdBy: h.created_by,
    createdAt: h.created_at,
    updatedAt: h.updated_at,
  }));
}

/**
 * Fetches a single household by ID.
 *
 * @param householdId - The household ID
 * @returns The household, or null if not found
 */
export async function getHousehold(householdId: string): Promise<Household | null> {
  const { data, error } = await supabase
    .from('households')
    .select('id, name, created_by, created_at, updated_at')
    .eq('id', householdId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Fetches all members of a household with their profiles.
 *
 * @param householdId - The household ID
 * @returns Array of members with profile information
 */
export async function getMembers(
  householdId: string
): Promise<HouseholdMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select(`
      id,
      household_id,
      user_id,
      role,
      joined_at,
      profiles:user_id (
        id,
        display_name,
        email
      )
    `)
    .eq('household_id', householdId)
    .order('joined_at', { ascending: true });

  if (error || !data) {
    console.error('Failed to fetch members:', error);
    return [];
  }

  return data.map((m) => {
    // Handle the profile data - it comes as an object from the join
    const profile = m.profiles as unknown as { id: string; display_name: string; email: string };
    
    return {
      id: m.id,
      householdId: m.household_id,
      userId: m.user_id,
      role: m.role as 'creator' | 'member',
      joinedAt: m.joined_at,
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        email: profile.email,
      },
    };
  });
}

/**
 * Creates a new household and adds the creator as the first member.
 *
 * @param name - The household name
 * @param creatorId - The creating user's profile ID
 * @returns The created household
 * @throws Error if creation fails
 */
export async function createHousehold(
  name: string,
  creatorId: string
): Promise<Household> {
  // Create the household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({
      name: name.trim(),
      created_by: creatorId,
    })
    .select('id, name, created_by, created_at, updated_at')
    .single();

  if (householdError || !household) {
    throw new Error('Unable to create household. Please try again.');
  }

  // Add the creator as the first member with 'creator' role
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: creatorId,
      role: 'creator',
    });

  if (memberError) {
    // Try to clean up the household if member creation fails
    await supabase.from('households').delete().eq('id', household.id);
    throw new Error('Unable to create household. Please try again.');
  }

  return {
    id: household.id,
    name: household.name,
    createdBy: household.created_by,
    createdAt: household.created_at,
    updatedAt: household.updated_at,
  };
}

/**
 * Updates a household's details.
 *
 * @param householdId - The household ID
 * @param updates - The fields to update
 * @returns The updated household
 * @throws Error if update fails
 */
export async function updateHousehold(
  householdId: string,
  updates: { name?: string }
): Promise<Household> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name.trim();
  }

  const { data, error } = await supabase
    .from('households')
    .update(updateData)
    .eq('id', householdId)
    .select('id, name, created_by, created_at, updated_at')
    .single();

  if (error || !data) {
    throw new Error('Unable to update household. Please try again.');
  }

  return {
    id: data.id,
    name: data.name,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Deletes a household and all associated data.
 *
 * Only the creator can delete their household.
 * This will cascade delete:
 * - All household members
 * - All dishes (via database cascade)
 * - All meal plans (via database cascade)
 * - All invites (via database cascade)
 *
 * @param householdId - The household ID
 * @param userId - The user requesting deletion (must be creator)
 * @throws Error if user is not the creator or deletion fails
 */
export async function deleteHousehold(
  householdId: string,
  userId: string
): Promise<void> {
  // Verify the user is the creator
  const { data: household, error: fetchError } = await supabase
    .from('households')
    .select('id, created_by')
    .eq('id', householdId)
    .single();

  if (fetchError || !household) {
    throw new Error('Household not found.');
  }

  if (household.created_by !== userId) {
    throw new Error('Only the creator can delete this household.');
  }

  // Delete the household (members cascade automatically via FK)
  const { error: deleteError } = await supabase
    .from('households')
    .delete()
    .eq('id', householdId);

  if (deleteError) {
    console.error('Household deletion error:', deleteError);
    throw new Error('Unable to delete household. Please try again.');
  }
}

/**
 * Adds a new member to a household.
 *
 * @param householdId - The household ID
 * @param userId - The user's profile ID
 * @returns The created membership
 * @throws Error if the user is already a member or addition fails
 */
export async function addMember(
  householdId: string,
  userId: string
): Promise<HouseholdMember> {
  const { data, error } = await supabase
    .from('household_members')
    .insert({
      household_id: householdId,
      user_id: userId,
      role: 'member',
    })
    .select('id, household_id, user_id, role, joined_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - already a member
      throw new Error('You are already a member of this household.');
    }
    throw new Error('Unable to join household. Please try again.');
  }

  return {
    id: data.id,
    householdId: data.household_id,
    userId: data.user_id,
    role: data.role,
    joinedAt: data.joined_at,
  };
}

/**
 * Removes a member from a household.
 * Only the household creator can remove other members.
 *
 * @param memberId - The membership ID to remove
 * @throws Error if removal fails
 */
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    throw new Error('Unable to remove member. Please try again.');
  }
}

/**
 * Allows a user to leave a household voluntarily.
 *
 * **Orphaned Household Policy: PRESERVE**
 *
 * By design, households cannot become orphaned because:
 * 1. Creators cannot leave their own household
 * 2. Only the creator can remove other members
 * 3. The household always has at least the creator
 *
 * If in the future we support creator account deletion or ownership transfer,
 * we may need to revisit this policy. Options would be:
 * - DELETE: Cascade delete household and all its data when last member leaves
 * - PRESERVE: Keep household data for potential re-invite/rejoin
 *
 * Current implementation: Preserve (no orphan cleanup needed)
 *
 * @param householdId - The household ID
 * @param userId - The user's profile ID
 * @throws Error if the user is the creator (creators cannot leave)
 */
export async function leaveHousehold(
  householdId: string,
  userId: string
): Promise<void> {
  // First check if the user is the creator
  const { data: membership, error: fetchError } = await supabase
    .from('household_members')
    .select('id, role')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !membership) {
    throw new Error('You are not a member of this household.');
  }

  if (membership.role === 'creator') {
    throw new Error(
      'As the creator, you cannot leave the household. ' +
      'Transfer ownership or delete the household instead.'
    );
  }

  const { error: deleteError } = await supabase
    .from('household_members')
    .delete()
    .eq('id', membership.id);

  if (deleteError) {
    console.error('Leave household error:', {
      code: deleteError.code,
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
    });
    throw new Error('Unable to leave household. Please try again.');
  }
}

/**
 * Checks if a user is a member of a specific household.
 *
 * @param householdId - The household ID
 * @param userId - The user's profile ID
 * @returns True if the user is a member
 */
export async function isMember(
  householdId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

/**
 * Gets the user's membership for a specific household.
 *
 * @param householdId - The household ID
 * @param userId - The user's profile ID
 * @returns The membership, or null if not a member
 */
export async function getMembership(
  householdId: string,
  userId: string
): Promise<HouseholdMember | null> {
  const { data, error } = await supabase
    .from('household_members')
    .select('id, household_id, user_id, role, joined_at')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    householdId: data.household_id,
    userId: data.user_id,
    role: data.role,
    joinedAt: data.joined_at,
  };
}
