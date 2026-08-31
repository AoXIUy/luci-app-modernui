import { useState, useCallback } from 'react';
import { Moon, Sun, Monitor, Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { useTheme } from '@/hooks/useTheme';
import { CommandPalette } from './CommandPalette';
import { MobileDrawer } from './MobileDrawer';
import type { Theme } from '@/store/themeStore';

const THEME_ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark:  Moon,
  auto:  Monitor,
};

const THEME_CYCLE: Theme[] = ['light', 'dark', 'auto'];

export function Header() {
  const { theme, saveTheme } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const cycleTheme = useCallback(() => {
    const idx  = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    void saveTheme(next);
  }, [theme, saveTheme]);

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 md:px-6 dark:border-zinc-800 dark:bg-zinc-950">
        {/* Mobile: hamburger menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t('nav.open_menu')}
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="h-5 w-5 text-zinc-500" />
        </Button>

        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">{t('nav.search_placeholder')}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Notifications placeholder */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-zinc-500" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            title={t('settings.theme.' + theme)}
          >
            <ThemeIcon className="h-5 w-5 text-zinc-500" />
          </Button>

          {/* User avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            R
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Mobile drawer — rendered via portal */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
