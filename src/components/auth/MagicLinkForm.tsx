/**
 * OTP Authentication Form Component
 *
 * Two-step email authentication form:
 * 1. User enters email → receives verification code via email
 * 2. User enters code → gets signed in
 *
 * This works better than magic links for PWA users because
 * there's no redirect required — users simply enter the code.
 *
 * Follows Constitution principle I: User-First Simplicity.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { getUserFriendlyError } from '@/utils';

export interface MagicLinkFormProps {
  /** Called when authentication is complete */
  onSuccess: () => void;
  /** Whether the form is for sign in or sign up (display only) */
  mode: 'signin' | 'signup';
  /** Externally controlled loading state */
  loading?: boolean;
  /** Function to send the OTP code */
  sendMagicLink: (email: string) => Promise<void>;
  /** Function to verify the OTP code */
  verifyCode?: (email: string, code: string) => Promise<unknown>;
}

/**
 * Validates email format.
 * Basic check — Supabase will do the real validation.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * OTP Authentication Form
 *
 * Features:
 * - Email input with validation
 * - Code entry with auto-focus
 * - Loading states during send/verify
 * - Error display for failures
 * - Resend code option
 * - Mobile-friendly with proper touch targets
 *
 * @example
 * ```tsx
 * <MagicLinkForm
 *   mode="signin"
 *   sendMagicLink={sendOtpCode}
 *   verifyCode={verifyOtpCode}
 *   onSuccess={() => navigate('/')}
 * />
 * ```
 */
export function MagicLinkForm({
  onSuccess,
  mode,
  loading: externalLoading,
  sendMagicLink,
  verifyCode,
}: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [resendCountdown, setResendCountdown] = useState(0);

  const loading = externalLoading ?? isLoading;

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  /**
   * Handle email submission — sends OTP code
   */
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await sendMagicLink(trimmedEmail);
      setStep('code');
      setResendCountdown(60); // 60 second cooldown before resend
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle code submission — verifies OTP and signs in
   */
  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Please enter the code from your email.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('Please enter the verification code from your email.');
      return;
    }

    if (!verifyCode) {
      setError('Verification not available.');
      return;
    }

    setIsLoading(true);

    try {
      await verifyCode(email.trim().toLowerCase(), trimmedCode);
      onSuccess();
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Resend the OTP code
   */
  async function handleResend() {
    if (resendCountdown > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      await sendMagicLink(email.trim().toLowerCase());
      setResendCountdown(60);
      setCode('');
    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Go back to email step
   */
  function handleBack() {
    setStep('email');
    setCode('');
    setError(null);
  }

  // Step 2: Code entry
  if (step === 'code') {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Email icon */}
        <div className="text-center">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: 'var(--color-primary)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            Check your email
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            We sent a code to{' '}
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>
              {email}
            </span>
          </p>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <Input
            label="Verification code"
            value={code}
            onChange={setCode}
            autoFocus
            placeholder="123456"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={8}
            disabled={loading}
            error={error ?? undefined}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading || code.length < 6}
          >
            Sign in
          </Button>
        </form>

        {/* Resend option */}
        <p
          className="text-center text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Didn&apos;t get the code?{' '}
          {resendCountdown > 0 ? (
            <span>Resend in {resendCountdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="underline hover:no-underline transition-all"
              style={{ color: 'var(--color-secondary)' }}
            >
              Resend code
            </button>
          )}
        </p>
      </div>
    );
  }

  // Step 1: Email entry
  return (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <Input
        label="Email address"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        type="email"
        autoComplete="email"
        autoFocus
        disabled={loading}
        error={error ?? undefined}
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        {mode === 'signin' ? 'Send code' : 'Continue'}
      </Button>

      <p
        className="text-center text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        No password needed — we&apos;ll email you a code.
      </p>
    </form>
  );
}
