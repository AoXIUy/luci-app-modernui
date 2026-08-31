import { useState, useCallback, useEffect } from 'react';
import { Sun, Moon, Monitor, Save, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { t } from '@/i18n';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { rpc } from '@/rpc';
import type { RouteEntry, RouteMode } from '@/rpc';
import type { Theme } from '@/store/themeStore';
import type { Locale } from '@/i18n';

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const THEMES: { value: Theme; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { value: 'light', icon: Sun,     labelKey: 'settings.theme.light' },
  { value: 'dark',  icon: Moon,    labelKey: 'settings.theme.dark'  },
  { value: 'auto',  icon: Monitor, labelKey: 'settings.theme.auto'  },
];

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: 'zh', label: t('settings.language.zh') },
  { value: 'en', label: t('settings.language.en') },
];

const ROUTE_MODES: RouteMode[] = ['native', 'compat', 'hidden'];

type DashboardCardKey = 'cpu' | 'memory' | 'temp' | 'traffic' | 'interfaces' | 'dhcp';

const DASHBOARD_CARDS: { key: DashboardCardKey; labelKey: string }[] = [
  { key: 'cpu',        labelKey: 'settings.card_cpu'        },
  { key: 'memory',     labelKey: 'settings.card_memory'     },
  { key: 'temp',       labelKey: 'settings.card_temp'       },
  { key: 'traffic',    labelKey: 'settings.card_traffic'    },
  { key: 'interfaces', labelKey: 'settings.card_interfaces' },
  { key: 'dhcp',       labelKey: 'settings.card_dhcp'       },
];

// ────────────────────────────────────────────────────────────────
// RouteModesPanel
// ────────────────────────────────────────────────────────────────

function RouteModesPanel() {
  const [routes,  setRoutes]  = useState<RouteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState<Record<string, boolean>>({});
  const [search,  setSearch]  = useState('');

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rpc.listRoutes();
      setRoutes(data.routes ?? []);
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRoutes(); }, [fetchRoutes]);

  const setMode = useCallback(async (path: string, mode: RouteMode) => {
    setSaving((prev) => ({ ...prev, [path]: true }));
    try {
      await rpc.setRouteMode(path, mode);
      setRoutes((prev) =>
        prev.map((r) => (r.path === path ? { ...r, mode } : r)),
      );
      toast.success(t('settings.route_mode_saved'));
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setSaving((prev) => ({ ...prev, [path]: false }));
    }
  }, []);

  const filtered = routes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.path.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('settings.route_modes_title')}</CardTitle>
            <CardDescription className="mt-1">
              {t('settings.route_modes_desc')}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void fetchRoutes()}
            disabled={loading}
            title={t('action.refresh')}
          >
            {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('settings.route_search')}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:focus:bg-zinc-800 dark:text-zinc-200"
          />
        </div>

        {/* Table */}
        {loading && routes.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
            <Spinner className="h-4 w-4" />
            {t('status.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            {routes.length === 0 ? t('settings.no_routes') : t('palette.no_results')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    {t('settings.route_path')}
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    {t('settings.route_title')}
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    {t('settings.route_action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((route) => (
                  <tr
                    key={route.path}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {route.path}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                      {route.title}
                    </td>
                    <td className="px-4 py-2.5">
                      {saving[route.path] ? (
                        <Spinner className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <div className="flex gap-1">
                          {ROUTE_MODES.map((mode) => (
                            <button
                              key={mode}
                              onClick={() => void setMode(route.path, mode)}
                              className={cn(
                                'rounded px-2.5 py-1 text-xs font-medium transition-all',
                                route.mode === mode
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
                              )}
                            >
                              {t(`settings.mode.${mode}`)}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────
// DashboardCardsPanel
// ────────────────────────────────────────────────────────────────

function DashboardCardsPanel() {
  const { dashboardCards, toggleDashboardCard } = useThemeStore();

  const handleToggle = useCallback(
    async (card: DashboardCardKey) => {
      toggleDashboardCard(card);
      // Optimistic update; persist to router in the background
      const next = { ...dashboardCards, [card]: !dashboardCards[card] };
      try {
        await rpc.setThemeConfig({
          dashboard_cards: {
            show_cpu:        next.cpu,
            show_memory:     next.memory,
            show_temp:       next.temp,
            show_traffic:    next.traffic,
            show_interfaces: next.interfaces,
            show_dhcp:       next.dhcp,
          },
        });
      } catch {
        // Non-fatal: local state already updated
      }
    },
    [dashboardCards, toggleDashboardCard],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.dashboard_cards_title')}</CardTitle>
        <CardDescription>
          Toggle which cards are displayed on the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {DASHBOARD_CARDS.map(({ key, labelKey }) => (
            <Switch
              key={key}
              id={`card-${key}`}
              label={t(labelKey)}
              checked={dashboardCards[key]}
              onCheckedChange={() => void handleToggle(key)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────
// Settings page
// ────────────────────────────────────────────────────────────────

export function Settings() {
  const {
    theme, language, pollingInterval,
    saveTheme, saveLanguage, setPollingInterval,
  } = useTheme();
  const [interval, setInterval] = useState(pollingInterval);
  const [saving,   setSaving]   = useState(false);

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      setPollingInterval(interval);
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setSaving(false);
    }
  }, [interval, setPollingInterval]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {t('settings.title')}
      </h1>

      {/* ── Appearance ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance')}</CardTitle>
          <CardDescription>Customize the look and feel of ModernUI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t('settings.theme')}
            </label>
            <div className="flex gap-3">
              {THEMES.map(({ value, icon: Icon, labelKey }) => (
                <button
                  key={value}
                  onClick={() => void saveTheme(value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-all',
                    theme === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t('settings.language')}
            </label>
            <div className="flex gap-3">
              {LANGUAGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => void saveLanguage(value)}
                  className={cn(
                    'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                    language === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Data refresh ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.polling')}</CardTitle>
          <CardDescription>
            How often the dashboard refreshes data from the router
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t('settings.polling_interval')}:
              <span className="ml-2 text-indigo-600 dark:text-indigo-400">{interval}s</span>
            </label>
            <input
              type="range"
              min={2}
              max={60}
              step={1}
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>2s (fastest)</span>
              <span>60s (slowest)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button loading={saving} onClick={() => void saveAll()}>
          <Save className="h-4 w-4" />
          {t('action.save')}
        </Button>
      </div>

      {/* ── Route Rendering Modes ─────────────────────────────── */}
      <RouteModesPanel />

      {/* ── Dashboard Cards ───────────────────────────────────── */}
      <DashboardCardsPanel />
    </div>
  );
}
