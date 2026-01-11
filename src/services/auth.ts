/**
 * Auth Service
 *
 * Handles all authentication operations using Supabase Auth.
 * Provides magic link authentication (passwordless email-based login)
 * which aligns with the Constitution's User-First Simplicity principle.
 *
 * @example
 * ```typescript
 * // Send a magic link
 * await signInWithMagicLink('user@example.com');
 *
 * // Get the current user
 * const user = await getCurrentUser();
 *
 * // Listen for auth changes
 * const unsubscribe = onAuthStateChange((user) => {
 *   console.log('Auth changed:', user?.email);
 * });
 * ```
 */

import { supabase } from '@/lib/supabase';
import type { User, Profile, UpdateProfileInput } from '@/types';

/**
 * Sends a magic link email for passwordless authentication.
 *
 * The user will receive an email with a link that signs them in
 * when clicked. No password required.
 *
 * @param email - The user's email address
 * @throws Error if the email fails to send
 */
export async function signInWithMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Where to redirect after clicking the magic link
      emailRedirectTo: `${window.location.origin}/auth/verify`,
    },
  });

  if (error) {
    // Log the full error for debugging
    console.error('Supabase auth error:', {
      message: error.message,
      status: error.status,
      name: error.name,
      code: (error as unknown as Record<string, unknown>).code,
    });
    
    // Provide user-friendly error messages
    if (error.message.includes('rate limit')) {
      throw new Error('Too many attempts. Please wait a few minutes and try again.');
    }
    if (error.message.includes('invalid email')) {
      throw new Error('Please enter a valid email address.');
    }
    // Safari/iOS network errors
    if (error.message.includes('Load Failed') || 
        error.message.includes('network connection was lost') ||
        error.message.includes('NetworkError')) {
      throw new Error('Unable to connect. Please check your internet connection and try again.');
    }
    throw new Error(`Auth error: ${error.message}`);
  }
}

/**
 * Signs out the current user.
 *
 * Clears the session from Supabase and local storage.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error('Unable to sign out. Please try again.');
  }
}

/**
 * Gets the currently authenticated user.
 *
 * Returns null if not authenticated or session is expired.
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // Session errors are expected when not logged in
    return null;
  }

  return user;
}

/**
 * Gets the current session.
 *
 * Useful for checking if a valid session exists without
 * making a network request to validate the token.
 */
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Fetches a user's profile from the database.
 *
 * Profiles are created automatically when users sign up
 * via the database trigger on auth.users.
 *
 * @param userId - The user's ID (matches auth.users.id)
 * @returns The profile, or null if not found
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  // Transform snake_case database columns to camelCase
  return {
    id: data.id,
    displayName: data.display_name,
    email: data.email,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Updates a user's profile.
 *
 * Only the display name can be updated by the user.
 * Email changes would require a different flow.
 *
 * @param userId - The user's ID
 * @param updates - The fields to update
 * @returns The updated profile
 * @throws Error if the update fails
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileInput
): Promise<Profile> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.displayName !== undefined) {
    // Capitalize first letter of each word for proper name formatting
    const formatted = updates.displayName
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    updateData.display_name = formatted;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select('id, display_name, email, created_at, updated_at')
    .single();

  if (error) {
    console.error('Profile update error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Unable to update profile: ${error.message}`);
  }

  return {
    id: data.id,
    displayName: data.display_name,
    email: data.email,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Subscribes to authentication state changes.
 *
 * The callback is invoked immediately with the current state,
 * and again whenever the auth state changes (login, logout, token refresh).
 *
 * @param callback - Function called with the user (or null) on auth changes
 * @returns Unsubscribe function to stop listening
 *
 * @example
 * ```typescript
 * const unsubscribe = onAuthStateChange((user) => {
 *   if (user) {
 *     console.log('Signed in as', user.email);
 *   } else {
 *     console.log('Signed out');
 *   }
 * });
 *
 * // Later, to stop listening:
 * unsubscribe();
 * ```
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Refreshes the current session.
 *
 * This is typically handled automatically by Supabase,
 * but can be called manually if needed.
 */
export async function refreshSession(): Promise<void> {
  const { error } = await supabase.auth.refreshSession();

  if (error) {
    throw new Error('Unable to refresh session. Please sign in again.');
  }
}

/**
 * Development-only auto-login for testing.
 *
 * Automatically signs in with the test user credentials from environment
 * variables. This makes testing authenticated features much easier during
 * development — no need to go through the magic link flow every time.
 *
 * Only works in development mode (import.meta.env.DEV === true).
 * Requires VITE_DEV_TEST_EMAIL and VITE_DEV_TEST_PASSWORD in .env.local.
 *
 * @returns The authenticated user, or null if auto-login is not configured
 */
export async function devAutoLogin(): Promise<User | null> {
  // Only run in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const testEmail = import.meta.env.VITE_DEV_TEST_EMAIL;
  const testPassword = import.meta.env.VITE_DEV_TEST_PASSWORD;

  // Skip if test credentials are not configured
  if (!testEmail || !testPassword) {
    return null;
  }

  console.log('🧪 Dev auto-login: Signing in as', testEmail);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error) {
    console.error('🧪 Dev auto-login failed:', error.message);
    return null;
  }

  console.log('🧪 Dev auto-login successful!');
  return data.user;
}

/**
 * Development-only sign in with email and password.
 *
 * Allows switching between test users during development.
 * Only works in development mode.
 *
 * @param email - Test user email
 * @param password - Test user password
 * @returns The authenticated user
 * @throws Error if sign in fails or not in dev mode
 */
export async function devSignInWithPassword(
  email: string,
  password: string
): Promise<User> {
  if (!import.meta.env.DEV) {
    throw new Error('devSignInWithPassword is only available in development mode');
  }

  console.log('🧪 Dev sign-in: Switching to', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('🧪 Dev sign-in failed:', error.message);
    throw new Error(`Sign in failed: ${error.message}`);
  }

  console.log('🧪 Dev sign-in successful!');
  return data.user;
}
