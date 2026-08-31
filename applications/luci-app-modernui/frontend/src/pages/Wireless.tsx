import { useState, useCallback } from 'react';
import { Wifi, RefreshCw, Radio, Signal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { usePolling } from '@/hooks/usePolling';
import { useThemeStore } from '@/store/themeStore';
import { rpc } from '@/rpc';
import { t } from '@/i18n';
import { toast } from 'sonner';
import type { WirelessInterface, WirelessRadio } from '@/rpc';

export function Wireless() {
  const { pollingInterval } = useThemeStore();
  const [interfaces, setInterfaces] = useState<WirelessInterface[]>([]);
  const [radios, setRadios] = useState<WirelessRadio[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const status = await rpc.getWirelessStatus();
      setInterfaces(status.interfaces);
      setRadios(status.radios);
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchData, pollingInterval);

  const handleScan = useCallback(async (device: string) => {
    setScanning(device);
    try {
      const result = await rpc.scanWireless(device);
      toast.success(`Found ${result.results.length} networks`);
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setScanning(null);
    }
  }, []);

  const signalBars = (signal: number) => {
    const strength = Math.min(4, Math.max(0, Math.round((signal + 100) / 25)));
    return Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className={`w-1 rounded-sm transition-colors ${
          i < strength ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'
        }`}
        style={{ height: `${(i + 1) * 4 + 4}px` }}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('wireless.title')}</h1>
        <Button variant="outline" size="sm" onClick={() => void fetchData()}>
          <RefreshCw className="h-4 w-4" />
          {t('action.refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-4">
          {radios.map((radio) => (
            <div key={radio.device}>
              {/* Radio info */}
              <div className="mb-3 flex items-center gap-3">
                <Radio className="h-5 w-5 text-zinc-400" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {radio.device} — {radio.band} • Ch.{radio.channel} • {radio.frequency} MHz
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  loading={scanning === radio.device}
                  onClick={() => void handleScan(radio.device)}
                >
                  <Wifi className="h-3.5 w-3.5" />
                  {scanning === radio.device ? t('wireless.scanning') : t('wireless.scan')}
                </Button>
              </div>

              {/* Interfaces on this radio */}
              <div className="space-y-3">
                {interfaces
                  .filter((iface) => iface.radio === radio.device)
                  .map((iface) => (
                    <Card key={iface.ifname}>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Wifi className="mt-0.5 h-8 w-8 rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {iface.ssid || '(hidden)'}
                                </span>
                                {iface.hidden && <Badge variant="muted">Hidden</Badge>}
                                <Badge variant="muted">{iface.encryption}</Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-zinc-500">{iface.ifname}</p>
                            </div>
                          </div>

                          <div className="flex items-end gap-6 text-sm">
                            {/* Signal bars */}
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-end gap-0.5">
                                {signalBars(iface.signal)}
                              </div>
                              <span className="text-xs text-zinc-400">{iface.signal} dBm</span>
                            </div>

                            {/* Clients */}
                            <div className="text-center">
                              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                {iface.clients}
                              </div>
                              <div className="text-xs text-zinc-400">{t('wireless.connected_clients')}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}

          {radios.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-zinc-500">
                No wireless interfaces found
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
