import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Wifi,
  Server,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Router,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { useThemeStore } from '@/store/themeStore';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/network',   icon: Network,          labelKey: 'nav.network'   },
  { href: '/wireless',  icon: Wifi,             labelKey: 'nav.wireless'  },
  { href: '/system',    icon: Server,            labelKey: 'nav.system'    },
  { href: '/terminal',  icon: Terminal,          labelKey: 'nav.terminal'  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800',
        sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4',
      )}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Router className="h-4 w-4" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">ModernUI</div>
            <div className="text-[10px] text-zinc-500">OpenWrt</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href ||
            location.pathname.startsWith(item.href + '/');
          return (
            <NavLink
              key={item.href}
              to={item.href}
              title={sidebarCollapsed ? t(item.labelKey) : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                sidebarCollapsed && 'justify-center',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300',
                )}
              />
              {!sidebarCollapsed && (
                <span>{t(item.labelKey)}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-1 border-t border-zinc-200 p-2 dark:border-zinc-800">
        <NavLink
          to="/settings"
          title={sidebarCollapsed ? t('nav.settings') : undefined}
          className={({ isActive }) => cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
            sidebarCollapsed && 'justify-center',
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
          {!sidebarCollapsed && <span>{t('nav.settings')}</span>}
        </NavLink>

        <a
          href="/cgi-bin/luci/admin/logout"
          title={sidebarCollapsed ? t('nav.logout') : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-all duration-150 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400',
            sidebarCollapsed && 'justify-center',
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
        </a>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? t('nav.expand_sidebar') : t('nav.collapse_sidebar')}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-all duration-150 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
            sidebarCollapsed && 'justify-center',
          )}
        >
          {sidebarCollapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft  className="h-4 w-4" />}
          {!sidebarCollapsed && (
            <span className="text-xs">{t('nav.collapse_sidebar')}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
