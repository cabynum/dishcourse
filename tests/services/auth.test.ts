/**
 * Auth Service Tests
 *
 * Tests for authentication operations using mocked Supabase client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set up mocks before any imports that use them
// These must be defined at the top level since vi.mock is hoisted
vi.mock('@/lib/supabase', () => {
  const mockAuth = {
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    refreshSession: vi.fn(),
  };

  const mockFrom = vi.fn();

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
    },
  };
});

// Mock window.location.origin for magic link redirect
vi.stubGlobal('window', {
  location: {
    origin: 'http://localhost:5173',
  },
});

// Import after mocking
import { supabase } from '@/lib/supabase';
import {
  sendOtpCode,
  verifyOtpCode,
  signOut,
  getCurrentUser,
  getSession,
  getProfile,
  updateProfile,
  onAuthStateChange,
  refreshSession,
} from '@/services/auth';

// Get references to mocks after import
const mockSupabaseAuth = supabase.auth as unknown as {
  signInWithOtp: ReturnType<typeof vi.fn>;
  verifyOtp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  getUser: ReturnType<typeof vi.fn>;
  getSession: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
  refreshSession: ReturnType<typeof vi.fn>;
};

const mockSupabaseFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendOtpCode', () => {
    it('calls Supabase signInWithOtp with email', async () => {
      mockSupabaseAuth.signInWithOtp.mockResolvedValue({ error: null });

      await sendOtpCode('test@example.com');

      expect(mockSupabaseAuth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          shouldCreateUser: true,
        },
      });
    });

    it('throws user-friendly error on rate limit', async () => {
      mockSupabaseAuth.signInWithOtp.mockResolvedValue({
        error: { message: 'rate limit exceeded' },
      });

      await expect(sendOtpCode('test@example.com')).rejects.toThrow(
        'Too many attempts'
      );
    });

    it('throws user-friendly error on invalid email', async () => {
      mockSupabaseAuth.signInWithOtp.mockResolvedValue({
        error: { message: 'invalid email address' },
      });

      await expect(sendOtpCode('bad-email')).rejects.toThrow(
        'valid email address'
      );
    });

    it('throws generic error on other failures', async () => {
      mockSupabaseAuth.signInWithOtp.mockResolvedValue({
        error: { message: 'unknown error' },
      });

      await expect(sendOtpCode('test@example.com')).rejects.toThrow(
        'Auth error: unknown error'
      );
    });
  });

  describe('verifyOtpCode', () => {
    it('calls Supabase verifyOtp with email and code', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth.verifyOtp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await verifyOtpCode('test@example.com', '123456');

      expect(mockSupabaseAuth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email',
      });
      expect(user).toEqual(mockUser);
    });

    it('throws user-friendly error on expired code', async () => {
      mockSupabaseAuth.verifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token has expired' },
      });

      await expect(verifyOtpCode('test@example.com', '123456')).rejects.toThrow(
        'code has expired'
      );
    });

    it('throws user-friendly error on invalid code', async () => {
      mockSupabaseAuth.verifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await expect(verifyOtpCode('test@example.com', '000000')).rejects.toThrow(
        'Invalid code'
      );
    });

    it('throws error when user is null after verification', async () => {
      mockSupabaseAuth.verifyOtp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(verifyOtpCode('test@example.com', '123456')).rejects.toThrow(
        'Verification failed'
      );
    });
  });

  describe('signOut', () => {
    it('calls Supabase signOut', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      await signOut();

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('throws user-friendly error on failure', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: { message: 'sign out failed' },
      });

      await expect(signOut()).rejects.toThrow('Unable to sign out');
    });
  });

  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('returns null when not authenticated', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it('returns null on error', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'session expired' },
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('getSession', () => {
    it('returns session when available', async () => {
      const mockSession = { access_token: 'token-123', user: { id: 'user-123' } };
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      const session = await getSession();

      expect(session).toEqual(mockSession);
    });

    it('returns null when no session', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('returns profile with camelCase keys', async () => {
      const mockDbProfile = {
        id: 'user-123',
        display_name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockDbProfile, error: null }),
          }),
        }),
      });

      const profile = await getProfile('user-123');

      expect(profile).toEqual({
        id: 'user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
    });

    it('returns null when profile not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      });

      const profile = await getProfile('nonexistent');

      expect(profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('updates profile and returns with camelCase keys', async () => {
      const mockUpdatedProfile = {
        id: 'user-123',
        display_name: 'Updated Name',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      // Mock both the availability check and the update
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            // For isDisplayNameAvailable check
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
            // For updateProfile
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const profile = await updateProfile('user-123', { displayName: 'Updated Name' });

      expect(profile.displayName).toBe('Updated Name');
    });

    it('throws error when display name is taken', async () => {
      // Mock availability check returning existing user
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [{ id: 'other-user' }], error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(updateProfile('user-123', { displayName: 'Taken Name' })).rejects.toThrow(
        'already taken'
      );
    });

    it('throws user-friendly error on update failure', async () => {
      // Mock availability check passing but update failing
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'update failed' } }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(updateProfile('user-123', { displayName: 'Test' })).rejects.toThrow(
        'Unable to update profile'
      );
    });
  });

  describe('onAuthStateChange', () => {
    it('subscribes to auth state changes', () => {
      const mockUnsubscribe = vi.fn();
      mockSupabaseAuth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const callback = vi.fn();
      const unsubscribe = onAuthStateChange(callback);

      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();

      // Verify unsubscribe function works
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('calls callback with user from session', () => {
      let authCallback: ((event: string, session: unknown) => void) | undefined;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const callback = vi.fn();
      onAuthStateChange(callback);

      // Simulate auth change with user
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      authCallback?.('SIGNED_IN', { user: mockUser });

      expect(callback).toHaveBeenCalledWith(mockUser);
    });

    it('calls callback with null when session is null', () => {
      let authCallback: ((event: string, session: unknown) => void) | undefined;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const callback = vi.fn();
      onAuthStateChange(callback);

      // Simulate sign out (no session)
      authCallback?.('SIGNED_OUT', null);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('refreshSession', () => {
    it('calls Supabase refreshSession', async () => {
      mockSupabaseAuth.refreshSession.mockResolvedValue({ error: null });

      await refreshSession();

      expect(mockSupabaseAuth.refreshSession).toHaveBeenCalled();
    });

    it('throws user-friendly error on failure', async () => {
      mockSupabaseAuth.refreshSession.mockResolvedValue({
        error: { message: 'refresh failed' },
      });

      await expect(refreshSession()).rejects.toThrow('Unable to refresh session');
    });
  });
});
