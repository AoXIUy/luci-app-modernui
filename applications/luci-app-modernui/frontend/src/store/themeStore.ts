import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setLocale } from '@/i18n';
import type { Locale } from '@/i18n';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeState {
  theme: Theme;
  language: Locale;
  pollingInterval: number;
  sidebarCollapsed: boolean;
  dashboardCards: {
    cpu: boolean;
    memory: boolean;
    temp: boolean;
    traffic: boolean;
    interfaces: boolean;
    dhcp: boolean;
  };
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Locale) => void;
  setPollingInterval: (seconds: number) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleDashboardCard: (card: keyof ThemeState['dashboardCards']) => void;
  setDashboardCards: (cards: ThemeState['dashboardCards']) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'auto',
      language: 'zh',
      pollingInterval: 5,
      sidebarCollapsed: false,
      dashboardCards: {
        cpu: true,
        memory: true,
        temp: true,
        traffic: true,
        interfaces: true,
        dhcp: true,
      },

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setLanguage: (language) => {
        set({ language });
        setLocale(language);
      },

      setPollingInterval: (seconds) =>
        set({ pollingInterval: Math.max(2, Math.min(60, seconds)) }),

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      toggleDashboardCard: (card) =>
        set((s) => ({
          dashboardCards: {
            ...s.dashboardCards,
            [card]: !s.dashboardCards[card],
          },
        })),

      setDashboardCards: (cards) => set({ dashboardCards: cards }),
    }),
    { name: 'modernui-theme' },
  ),
);

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

// Apply theme on load
const stored = JSON.parse(
  localStorage.getItem('modernui-theme') ?? '{}',
) as Partial<ThemeState>;
applyTheme(stored.theme ?? 'auto');

// Watch system preference for 'auto' mode
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'auto') applyTheme('auto');
  });
