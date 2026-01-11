/**
 * SyncStatus Component
 *
 * Displays the current sync state with appropriate icons and messaging.
 * Shows different states: synced (cloud), syncing (spinner), offline (no wifi),
 * and error (warning).
 *
 * Meets accessibility requirements with proper ARIA labels and
 * color-independent status indication.
 */

import { useState, useRef, useEffect } from 'react';
import { useSync } from '@/hooks';

export interface SyncStatusProps {
  /** Show the status text label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Cloud icon for synced state
 */
function CloudIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

/**
 * Cloud with check icon for fully synced
 */
function CloudCheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      <polyline points="9 14 11 16 15 12" />
    </svg>
  );
}

/**
 * Spinning cloud for syncing state
 */
function SyncingIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/**
 * Cloud off icon for offline state
 */
function OfflineIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m2 2 20 20" />
      <path d="M5.93 6.93A8 8 0 0 0 9 20h9a5 5 0 0 0 1.75-.31" />
      <path d="M21.21 15.89A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-3-5.95" />
    </svg>
  );
}

/**
 * Warning icon for error state
 */
function ErrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Get status configuration based on sync state
 */
function getStatusConfig(
  state: 'idle' | 'syncing' | 'offline' | 'error',
  pendingCount: number
) {
  switch (state) {
    case 'syncing':
      return {
        icon: SyncingIcon,
        label: 'Syncing...',
        ariaLabel: 'Syncing your data',
        colorClass: 'text-yellow-500',
        bgClass: 'bg-yellow-500/10',
      };
    case 'offline':
      return {
        icon: OfflineIcon,
        label: pendingCount > 0 ? `${pendingCount} pending` : 'Offline',
        ariaLabel: pendingCount > 0
          ? `Offline with ${pendingCount} changes pending`
          : 'You are offline',
        colorClass: 'text-gray-400',
        bgClass: 'bg-gray-500/10',
      };
    case 'error':
      return {
        icon: ErrorIcon,
        label: 'Sync error',
        ariaLabel: 'There was an error syncing your data',
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
      };
    case 'idle':
    default:
      if (pendingCount > 0) {
        return {
          icon: CloudIcon,
          label: `${pendingCount} pending`,
          ariaLabel: `${pendingCount} changes waiting to sync`,
          colorClass: 'text-yellow-500',
          bgClass: 'bg-yellow-500/10',
        };
      }
      return {
        icon: CloudCheckIcon,
        label: 'Synced',
        ariaLabel: 'All changes synced',
        colorClass: 'text-green-500',
        bgClass: 'bg-green-500/10',
      };
  }
}

/**
 * SyncStatus component showing current sync state.
 *
 * Can be rendered in compact mode (icon only) or with label.
 * Includes a tooltip on hover for additional context.
 */
export function SyncStatus({
  showLabel = false,
  className = '',
}: SyncStatusProps) {
  const { syncState, pendingCount, lastSyncTime, syncNow } = useSync();
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = getStatusConfig(syncState, pendingCount);
  const Icon = config.icon;

  // Format last sync time for tooltip
  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  // Cleanup tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    tooltipTimeout.current = setTimeout(() => setShowTooltip(true), 300);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setShowTooltip(false);
  };

  const handleClick = () => {
    // Trigger manual sync on click (if online)
    if (syncState !== 'offline' && syncState !== 'syncing') {
      syncNow();
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-full
          transition-colors duration-200
          ${config.bgClass}
          hover:opacity-80
          focus:outline-none focus:ring-2 focus:ring-yellow-500/50
        `}
        aria-label={config.ariaLabel}
        disabled={syncState === 'syncing'}
      >
        <Icon className={`w-4 h-4 ${config.colorClass}`} />
        {showLabel && (
          <span className={`text-xs font-medium ${config.colorClass}`}>
            {config.label}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="
            absolute right-0 top-full mt-2 z-50
            px-3 py-2 rounded-lg
            bg-charcoal border border-white/10
            shadow-lg
            text-xs text-white/80
            whitespace-nowrap
          "
        >
          <div className="font-medium text-white mb-1">{config.label}</div>
          {formattedLastSync && (
            <div className="text-white/60">Last synced: {formattedLastSync}</div>
          )}
          {pendingCount > 0 && syncState !== 'offline' && (
            <div className="text-white/60 mt-1">Click to sync now</div>
          )}
          {/* Tooltip arrow */}
          <div
            className="
              absolute -top-1 right-4
              w-2 h-2 rotate-45
              bg-charcoal border-l border-t border-white/10
            "
          />
        </div>
      )}
    </div>
  );
}
