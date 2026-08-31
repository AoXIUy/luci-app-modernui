import { useThemeStore } from '@/store/themeStore';
import { useCallback } from 'react';
import { rpc } from '@/rpc';
import { toast } from 'sonner';
import { t } from '@/i18n';
import type { Theme } from '@/store/themeStore';
import type { Locale } from '@/i18n';

export function useTheme() {
  const store = useThemeStore();

  const saveTheme = useCallback(
    async (theme: Theme) => {
      store.setTheme(theme);
      try {
        await rpc.setThemeConfig({ theme });
      } catch {
        toast.error(t('error.rpc_failed'));
      }
    },
    [store],
  );

  const saveLanguage = useCallback(
    async (language: Locale) => {
      store.setLanguage(language);
      try {
        await rpc.setThemeConfig({ language });
      } catch {
        toast.error(t('error.rpc_failed'));
      }
    },
    [store],
  );

  return {
    ...store,
    saveTheme,
    saveLanguage,
  };
}
