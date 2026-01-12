-- ============================================================================
-- MIGRATION 011: Allow Users to Insert Their Own Profile
-- ============================================================================
-- Adds an INSERT policy for the profiles table so users can create their
-- own profile if it doesn't exist (fallback for when trigger fails).
-- ============================================================================

-- Allow users to insert their own profile (id must match their auth.uid())
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
