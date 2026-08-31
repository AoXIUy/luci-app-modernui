import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Network, Wifi, Server, Terminal, Settings, Search,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

interface Page {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  keywords: string[];
}

const PAGES: Page[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', keywords: ['dashboard', '仪表盘', 'cpu', 'memory', '流量'] },
  { href: '/network',   icon: Network,          labelKey: 'nav.network',   keywords: ['network', '网络', 'interface', 'dhcp', 'route'] },
  { href: '/wireless',  icon: Wifi,             labelKey: 'nav.wireless',  keywords: ['wireless', '无线', 'wifi', 'ssid', 'ap'] },
  { href: '/system',    icon: Server,            labelKey: 'nav.system',    keywords: ['system', '系统', 'log', 'backup', 'reboot', 'firmware'] },
  { href: '/terminal',  icon: Terminal,          labelKey: 'nav.terminal',  keywords: ['terminal', '终端', 'console', 'shell', 'ssh'] },
  { href: '/settings',  icon: Settings,          labelKey: 'nav.settings',  keywords: ['settings', '设置', 'theme', 'language', '主题', '语言'] },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = query
    ? PAGES.filter((p) =>
        t(p.labelKey).toLowerCase().includes(query.toLowerCase()) ||
        p.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase())),
      )
    : PAGES;

  const select = useCallback(
    (href: string) => {
      navigate(href);
      onOpenChange(false);
      setQuery('');
    },
    [navigate, onOpenChange],
  );

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <Search className="h-5 w-5 flex-shrink-0 text-zinc-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('palette.placeholder')}
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
          <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              {t('palette.no_results')}
            </p>
          ) : (
            <>
              <p className="mb-1 px-2 text-xs font-medium text-zinc-400">
                {query ? t('palette.pages') : t('palette.recent')}
              </p>
              {filtered.map((page) => (
                <button
                  key={page.href}
                  onClick={() => select(page.href)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left',
                    'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    'transition-colors duration-100',
                  )}
                >
                  <page.icon className="h-5 w-5 flex-shrink-0 text-zinc-400" />
                  <span className="font-medium">{t(page.labelKey)}</span>
                  <span className="ml-auto text-xs text-zinc-400">{page.href}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
