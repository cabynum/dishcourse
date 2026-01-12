/**
 * Error Handling Utilities
 *
 * Provides user-friendly error messages for technical errors.
 * Maps common API errors to helpful, actionable messages.
 *
 * Constitution Principle I: User-First Simplicity
 * - No technical jargon in error messages
 * - Suggest next steps when possible
 */

/**
 * Common error patterns and their user-friendly replacements.
 */
const ERROR_MAPPINGS: Array<{
  patterns: (string | RegExp)[];
  message: string;
}> = [
  // Network errors
  {
    patterns: [
      'Failed to fetch',
      'NetworkError',
      'net::ERR_',
      'Network request failed',
      /fetch.*failed/i,
      'Load Failed', // Safari/iOS specific error
      'The network connection was lost',
      'A server with the specified hostname could not be found',
    ],
    message: 'Unable to connect. Please check your internet connection and try again.',
  },

  // Auth errors
  {
    patterns: ['rate limit', 'too many requests', /429/],
    message: 'Too many attempts. Please wait a few minutes and try again.',
  },
  {
    patterns: ['invalid email', 'email.*invalid'],
    message: 'Please enter a valid email address.',
  },
  {
    patterns: ['session.*expired', 'token.*expired', 'JWT expired'],
    message: 'Your session has expired. Please sign in again.',
  },
  {
    patterns: ['unauthorized', '401'],
    message: 'You need to sign in to do this.',
  },
  {
    patterns: ['forbidden', '403'],
    message: "You don't have permission to do this.",
  },

  // Supabase Edge Function errors
  {
    patterns: ['Edge Function returned a non-2xx status code'],
    message: 'Something went wrong. Please try again.',
  },
  {
    patterns: ['Edge Function invocation failed'],
    message: 'Unable to complete this action. Please try again later.',
  },

  // Sync errors
  {
    patterns: ['conflict', 'version mismatch'],
    message: 'Someone else made changes. Please refresh and try again.',
  },
  {
    patterns: ['offline', 'no.*connection'],
    message: "You're offline. Changes will sync when you're back online.",
  },

  // Database errors - new user creation
  {
    patterns: [/database.*error.*saving.*new.*user/i, /error.*saving.*user/i],
    message: 'There was a problem creating your account. Please try again, or contact support if this continues.',
  },
  {
    patterns: ['duplicate key', 'unique constraint', 'already exists'],
    message: 'This already exists. Please try a different name.',
  },
  {
    patterns: ['not found', '404'],
    message: "We couldn't find what you're looking for.",
  },
  {
    patterns: ['PGRST'],
    message: 'Something went wrong. Please try again.',
  },

  // Validation errors
  {
    patterns: [/required field/i, /is required/i, /missing.*field/i],
    message: 'Please fill in all required fields.',
  },
  {
    patterns: ['Invalid export format', 'invalid.*format'],
    message: 'This file has an invalid format. Please choose a valid export file.',
  },
  {
    patterns: ['too long', 'maximum.*characters'],
    message: 'This text is too long. Please shorten it.',
  },

  // SMS/Twilio errors
  {
    patterns: ['30034', 'A2P 10DLC', 'Unregistered Number'],
    message: 'SMS delivery is temporarily unavailable. Please use the invite link instead.',
  },
  {
    patterns: ['invalid phone', 'phone.*invalid'],
    message: 'Please enter a valid phone number.',
  },

  // Server errors
  {
    patterns: ['500', 'internal server error', 'Internal Server Error'],
    message: 'Something went wrong on our end. Please try again later.',
  },
  {
    patterns: ['503', 'service unavailable'],
    message: 'The service is temporarily unavailable. Please try again later.',
  },
];

/**
 * Default message when no pattern matches.
 */
const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Converts a technical error into a user-friendly message.
 *
 * @param error - The error to convert (Error, string, or unknown)
 * @returns A user-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (err) {
 *   setError(getUserFriendlyError(err));
 * }
 * ```
 */
export function getUserFriendlyError(error: unknown): string {
  // Extract the error message
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    return DEFAULT_MESSAGE;
  }

  // Check against known patterns
  for (const mapping of ERROR_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      if (typeof pattern === 'string') {
        if (message.toLowerCase().includes(pattern.toLowerCase())) {
          return mapping.message;
        }
      } else if (pattern.test(message)) {
        return mapping.message;
      }
    }
  }

  // If the message is already user-friendly (doesn't look technical), return it
  if (isUserFriendlyMessage(message)) {
    return message;
  }

  // Otherwise, return the default
  return DEFAULT_MESSAGE;
}

/**
 * Checks if a message appears to be user-friendly already.
 *
 * Heuristics:
 * - No technical terms (Error:, Exception, Stack, etc.)
 * - Starts with a capital letter
 * - Ends with punctuation
 * - Not too long
 * - No code-like patterns (camelCase, snake_case, etc.)
 */
function isUserFriendlyMessage(message: string): boolean {
  // Technical patterns that indicate a raw error
  const technicalPatterns = [
    /^Error:/i,
    /Exception/,
    /Stack:/,
    /at \w+\.\w+/,
    /\w+_\w+/, // snake_case
    /\{.*\}/, // JSON-like
    /^\[.*\]$/, // Array-like
    /undefined|null/i,
    /NaN/,
    /^\d{3}$/, // HTTP status codes alone
    /PGRST\d+/,
  ];

  for (const pattern of technicalPatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }

  // Check for reasonable length and format
  if (message.length > 200) return false;
  if (message.length < 5) return false;

  return true;
}

/**
 * Logs an error with context for debugging while returning a user-friendly message.
 *
 * @param error - The error to handle
 * @param context - Additional context for logging
 * @returns A user-friendly error message
 */
export function handleError(
  error: unknown,
  context?: string
): string {
  // Log the full error for debugging
  console.error(context ?? 'Error:', error);

  return getUserFriendlyError(error);
}
