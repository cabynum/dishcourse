/**
 * useInvite Hook
 *
 * Provides React components with invite functionality for a household.
 * Handles generating invites, validating codes, and joining via invite.
 *
 * @example
 * ```tsx
 * function InviteSection({ householdId }) {
 *   const { invite, inviteLink, isLoading, generateInvite } = useInvite(householdId);
 *
 *   return (
 *     <div>
 *       {invite ? (
 *         <div>
 *           <p>Share this link: {inviteLink}</p>
 *           <button onClick={() => navigator.clipboard.writeText(inviteLink)}>
 *             Copy Link
 *           </button>
 *         </div>
 *       ) : (
 *         <button onClick={generateInvite} disabled={isLoading}>
 *           Create Invite
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { Invite, Household, InviteValidation } from '@/types';
import {
  generateInvite as generateInviteService,
  validateInvite as validateInviteService,
  useInvite as useInviteService,
  getInviteUrl,
  getActiveInvite,
} from '@/services';
import { useAuthContext } from '@/components/auth';
import { getUserFriendlyError } from '@/utils';

/**
 * Return type for the useInvite hook.
 */
export interface UseInviteReturn {
  /** The current active invite for this household */
  invite: Invite | null;

  /** The shareable invite URL */
  inviteLink: string;

  /** True while loading or generating invite */
  isLoading: boolean;

  /** Generate a new invite (or refresh existing) */
  generateInvite: () => Promise<Invite>;

  /** Validate an invite code */
  validateCode: (code: string) => Promise<InviteValidation>;

  /** Join a household using an invite code */
  joinWithCode: (code: string) => Promise<Household>;

  /** Error from the last operation, if any */
  error: string | null;

  /** Clear the current error */
  clearError: () => void;
}

/**
 * Hook for managing household invites.
 *
 * @param householdId - The household to manage invites for (optional)
 *                      If not provided, only validation/join features work
 */
export function useInvite(householdId?: string): UseInviteReturn {
  const { user } = useAuthContext();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute the invite link
  const inviteLink = invite ? getInviteUrl(invite.code) : '';

  // Load existing active invite when householdId changes
  useEffect(() => {
    if (!householdId) {
      setInvite(null);
      return;
    }

    let isMounted = true;

    async function loadActiveInvite() {
      if (!householdId) return;
      try {
        const activeInvite = await getActiveInvite(householdId);
        if (isMounted) {
          setInvite(activeInvite);
        }
      } catch (err) {
        console.error('Failed to load active invite:', err);
      }
    }

    loadActiveInvite();

    return () => {
      isMounted = false;
    };
  }, [householdId]);

  /**
   * Generate a new invite for the household.
   */
  const generateInvite = useCallback(async (): Promise<Invite> => {
    if (!householdId) {
      throw new Error('No household specified.');
    }
    if (!user) {
      throw new Error('You must be signed in to create an invite.');
    }

    setError(null);
    setIsLoading(true);

    try {
      const newInvite = await generateInviteService(householdId, user.id);
      setInvite(newInvite);
      return newInvite;
    } catch (err) {
      setError(getUserFriendlyError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [householdId, user]);

  /**
   * Validate an invite code.
   */
  const validateCode = useCallback(
    async (code: string): Promise<InviteValidation> => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await validateInviteService(code);
        return result;
      } catch (err) {
        setError(getUserFriendlyError(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Join a household using an invite code.
   */
  const joinWithCode = useCallback(
    async (code: string): Promise<Household> => {
      if (!user) {
        throw new Error('You must be signed in to join a household.');
      }

      setError(null);
      setIsLoading(true);

      try {
        const household = await useInviteService(code, user.id);
        return household;
      } catch (err) {
        setError(getUserFriendlyError(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  /**
   * Clear the current error.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    invite,
    inviteLink,
    isLoading,
    generateInvite,
    validateCode,
    joinWithCode,
    error,
    clearError,
  };
}
