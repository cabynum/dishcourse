/**
 * BottomNav Component
 *
 * A mobile-friendly bottom navigation bar with tab-style navigation.
 * Uses Lucide icons with consistent stroke-width for visual harmony.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dices, Calendar, Settings } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  /** Match these paths as "active" for this tab */
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: <Home size={24} strokeWidth={2} />,
  },
  {
    path: '/suggest',
    label: 'Suggest',
    icon: <Dices size={24} strokeWidth={2} />,
  },
  {
    path: '/plan',
    label: 'Plans',
    icon: <Calendar size={24} strokeWidth={2} />,
    matchPaths: ['/plan'],
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <Settings size={24} strokeWidth={2} />,
  },
];

/**
 * Bottom navigation bar for mobile app navigation.
 *
 * Features:
 * - 4 main tabs: Home, Suggest, Plans, Settings
 * - Active state highlighting with accent color
 * - Glassmorphism blur effect
 * - Safe area padding for iOS devices
 * - 44px minimum touch targets
 */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Check if a nav item should be shown as active
   */
  const isActive = (item: NavItem): boolean => {
    // Exact match
    if (location.pathname === item.path) return true;
    
    // Check matchPaths for prefix matching (e.g., /plan/123)
    if (item.matchPaths) {
      return item.matchPaths.some((path) => location.pathname.startsWith(path));
    }
    
    return false;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="max-w-lg mx-auto flex justify-around items-center px-2 pt-2 pb-6">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={[
                'flex flex-col items-center gap-1',
                'min-w-[64px] min-h-[44px]',
                'py-1 px-2',
                'rounded-xl',
                'transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                active ? '' : 'hover:bg-black/5',
              ].join(' ')}
              style={{
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={[
                  'flex items-center justify-center',
                  'w-10 h-10 rounded-full',
                  'transition-all duration-150',
                ].join(' ')}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-primary)',
                      }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

