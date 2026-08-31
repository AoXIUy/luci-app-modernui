import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/i18n';

interface LuciCompatProps {
  path: string; // e.g. '/admin/network/interfaces'
  title?: string;
}

export function LuciCompat({ path, title }: LuciCompatProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const url = `/cgi-bin/luci${path}`;

  useEffect(() => {
    setLoading(true);
  }, [path]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Banner */}
      <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          {t('compat.banner')}
          {title && <> — <strong>{title}</strong></>}
        </span>
      </div>

      {/* Loading overlay */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-950">
            <Spinner size="lg" />
            <p className="text-sm text-zinc-500">{t('compat.loading')}</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          className="h-full w-full border-0"
          title={title ?? 'LuCI Page'}
          onLoad={() => setLoading(false)}
          style={{ minHeight: 'calc(100vh - 7rem)' }}
        />
      </div>
    </div>
  );
}
