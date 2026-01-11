-- DishCourse DELETE RLS Recursion Fix
-- Migration: 009_fix_delete_rls_recursion
-- Date: 2025-01-11
--
-- Fixes infinite recursion in household_members DELETE policies.
-- The "Creator can remove members" policy references household_members
-- in a subquery, causing PostgreSQL to loop infinitely.
--
-- Solution: Create a SECURITY DEFINER function to check creator status,
-- which bypasses RLS when checking household membership.

-- ============================================================================
-- CREATE HELPER FUNCTION
-- ============================================================================

-- SECURITY DEFINER function to check if a user is the creator of a household
-- Bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_household_creator(p_household_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
      AND user_id = p_user_id
      AND role = 'creator'
  );
$$;

-- ============================================================================
-- DROP PROBLEMATIC DELETE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Creator can remove members" ON household_members;
DROP POLICY IF EXISTS "Users can leave household" ON household_members;

-- ============================================================================
-- RECREATE DELETE POLICIES WITH SAFE FUNCTION
-- ============================================================================

-- Users can remove themselves (leave household)
-- Simple check: the row's user_id matches the authenticated user
CREATE POLICY "Users can leave household"
  ON household_members FOR DELETE
  USING (user_id = auth.uid());

-- Household creators can remove other members (not themselves)
-- Uses is_household_creator() SECURITY DEFINER function to avoid recursion
CREATE POLICY "Creator can remove members"
  ON household_members FOR DELETE
  USING (
    -- User is the creator of this household (checked via SECURITY DEFINER)
    is_household_creator(household_id, auth.uid())
    -- And they're not trying to remove themselves
    AND user_id != auth.uid()
  );
