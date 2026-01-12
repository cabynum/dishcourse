-- ============================================================================
-- MIGRATION 010: Robust New User Trigger
-- ============================================================================
-- Makes the handle_new_user trigger more robust by using UPSERT
-- to handle cases where:
-- 1. A profile already exists (from a previous failed attempt)
-- 2. Any other transient errors
-- ============================================================================

-- Update the trigger function to use INSERT ... ON CONFLICT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use upsert to handle potential conflicts gracefully
  INSERT INTO profiles (id, display_name, email)
  VALUES (
    NEW.id,
    -- Use display_name from metadata if provided, otherwise use email prefix
    -- Capitalize the first letter of each word
    INITCAP(COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail user creation
    -- A missing profile can be created later
    RAISE WARNING 'handle_new_user failed for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
