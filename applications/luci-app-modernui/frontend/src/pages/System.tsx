import { useState, useCallback, useEffect } from 'react';
import { Server, Download, RefreshCw, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { rpc } from '@/rpc';
import { t } from '@/i18n';
import { formatUptime } from '@/lib/utils';
import { toast } from 'sonner';
import type { SystemInfo } from '@/rpc';

export function System() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebooting, setRebooting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sysInfo, sysLogs] = await Promise.all([
        rpc.getSystemInfo(),
        rpc.getSystemLogs(100),
      ]);
      setInfo(sysInfo);
      setLogs(sysLogs.logs);
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleReboot = useCallback(async () => {
    if (!window.confirm(t('system.reboot_confirm'))) return;
    setRebooting(true);
    try {
      await fetch('/cgi-bin/luci/admin/system/reboot', { method: 'POST' });
      toast.success('Rebooting...');
    } catch {
      toast.error(t('error.rpc_failed'));
      setRebooting(false);
    }
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('system.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchData()}>
            <RefreshCw className="h-4 w-4" />
            {t('action.refresh')}
          </Button>
          <Button variant="destructive" size="sm" loading={rebooting} onClick={() => void handleReboot()}>
            <RotateCcw className="h-4 w-4" />
            {t('system.reboot')}
          </Button>
        </div>
      </div>

      {/* System info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-zinc-400" />
              <CardTitle>System Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: t('dashboard.hostname'), value: info?.hostname },
              { label: t('dashboard.model'),    value: info?.model },
              { label: t('dashboard.firmware'), value: info?.firmware },
              { label: t('dashboard.uptime'),   value: info ? formatUptime(info.uptime) : 'N/A' },
              { label: t('dashboard.load_avg'), value: info?.load.map(v => v.toFixed(2)).join(' / ') },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">{label}</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value ?? 'N/A'}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Backup &amp; Restore</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-500">
              Download a backup of your current configuration, or restore from a previous backup file.
            </p>
            <a
              href="/cgi-bin/luci/admin/system/flash/backupdownload"
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
            >
              <Download className="h-4 w-4" />
              {t('system.download_backup')}
            </a>
            <a
              href="/cgi-bin/luci/admin/system/flash"
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
            >
              <Server className="h-4 w-4" />
              {t('system.firmware')} (LuCI Compat)
            </a>
          </CardContent>
        </Card>
      </div>

      {/* System logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('system.logs')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void fetchData()}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t('action.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-zinc-500">No logs available</p>
            ) : (
              logs.map((line, i) => (
                <div key={i} className="text-zinc-300 leading-relaxed">
                  {line}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
