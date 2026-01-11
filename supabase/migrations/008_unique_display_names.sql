-- DishCourse Display Name Uniqueness
-- Migration: 008_unique_display_names
-- Date: 2026-01-11
--
-- Adds case-insensitive uniqueness check for display names.
-- Users can change their display name to anything not already taken.

-- ============================================================================
-- HELPER FUNCTION: Check if display name is available
-- ============================================================================
-- Case-insensitive check. Returns true if the name is available.
-- Excludes the current user's ID so they can keep their own name.

CREATE OR REPLACE FUNCTION is_display_name_available(
  p_display_name TEXT,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(TRIM(display_name)) = LOWER(TRIM(p_display_name))
    AND (p_exclude_user_id IS NULL OR id != p_exclude_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEX: For efficient case-insensitive lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower 
ON profiles (LOWER(display_name));
