import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Wifi,
  Server,
  Terminal,
  Settings,
  LogOut,
  Router,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/network',   icon: Network,          labelKey: 'nav.network'   },
  { href: '/wireless',  icon: Wifi,             labelKey: 'nav.wireless'  },
  { href: '/system',    icon: Server,           labelKey: 'nav.system'    },
  { href: '/terminal',  icon: Terminal,         labelKey: 'nav.terminal'  },
  { href: '/settings',  icon: Settings,         labelKey: 'nav.settings'  },
];

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const location = useLocation();

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close drawer on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        aria-label={t('nav.open_menu')}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col',
          'bg-white dark:bg-zinc-950',
          'border-r border-zinc-200 dark:border-zinc-800',
          'transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Router className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">ModernUI</div>
              <div className="text-[10px] text-zinc-500">OpenWrt</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('nav.close_menu')}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + '/');
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300',
                  )}
                />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: logout */}
        <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
          <a
            href="/cgi-bin/luci/admin/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-all duration-150 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>{t('nav.logout')}</span>
          </a>
        </div>
      </aside>
    </>,
    document.body,
  );
}
