import { useState, useCallback } from 'react';
import { RefreshCw, Network as NetworkIcon, ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { usePolling } from '@/hooks/usePolling';
import { useThemeStore } from '@/store/themeStore';
import { rpc } from '@/rpc';
import { t } from '@/i18n';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';
import type { NetworkInterface, DhcpLease, Route } from '@/rpc';

type Tab = 'interfaces' | 'leases' | 'routes';

export function Network() {
  const { pollingInterval } = useThemeStore();
  const [tab, setTab] = useState<Tab>('interfaces');
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [leases, setLeases] = useState<DhcpLease[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [netStatus, dhcp, routeList] = await Promise.all([
        rpc.getNetworkStatus(),
        rpc.getDhcpLeases(),
        rpc.getRoutes(),
      ]);
      setInterfaces(netStatus.interfaces);
      setLeases(dhcp.leases);
      setRoutes(routeList.routes);
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchData, pollingInterval);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'interfaces', label: t('network.interface') },
    { id: 'leases',     label: t('network.dhcp_leases') },
    { id: 'routes',     label: t('network.routes') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('network.title')}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchData()}>
          <RefreshCw className="h-4 w-4" />
          {t('action.refresh')}
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
        {TABS.map((t_) => (
          <button
            key={t_.id}
            onClick={() => setTab(t_.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              tab === t_.id
                ? 'bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {t_.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Interfaces tab */}
          {tab === 'interfaces' && (
            <div className="space-y-3">
              {interfaces.map((iface) => (
                <Card key={iface.name}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <NetworkIcon className="h-8 w-8 rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{iface.name}</span>
                            <Badge variant={iface.up ? 'success' : 'danger'}>
                              {iface.up ? t('status.up') : t('status.down')}
                            </Badge>
                            <Badge variant="muted">{iface.protocol}</Badge>
                          </div>
                          <p className="mt-0.5 text-sm text-zinc-500">{iface.mac}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <div>
                          <span className="text-zinc-400">{t('network.ip_address')}: </span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300">{iface.ipv4 ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400">{t('network.gateway')}: </span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300">{iface.gateway ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowDown className="h-3 w-3 text-indigo-500" />
                          <span className="text-zinc-700 dark:text-zinc-300">{formatBytes(iface.rx_bytes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-zinc-700 dark:text-zinc-300">{formatBytes(iface.tx_bytes)}</span>
                        </div>
                        {iface.dns.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-zinc-400">{t('network.dns')}: </span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300">{iface.dns.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* DHCP Leases tab */}
          {tab === 'leases' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('network.dhcp_leases')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="pb-2 text-left font-medium text-zinc-500">{t('network.lease_ip')}</th>
                        <th className="pb-2 text-left font-medium text-zinc-500">{t('network.lease_mac')}</th>
                        <th className="pb-2 text-left font-medium text-zinc-500">{t('network.lease_hostname')}</th>
                        <th className="pb-2 text-left font-medium text-zinc-500">{t('network.lease_expires')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {leases.map((lease, i) => (
                        <tr key={i} className="py-2">
                          <td className="py-2 font-mono text-zinc-700 dark:text-zinc-300">{lease.ip}</td>
                          <td className="py-2 font-mono text-zinc-500">{lease.mac}</td>
                          <td className="py-2 text-zinc-700 dark:text-zinc-300">{lease.hostname || '—'}</td>
                          <td className="py-2 text-zinc-500">
                            {new Date(lease.expires * 1000).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {leases.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-zinc-400">No active leases</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Routes tab */}
          {tab === 'routes' && (
            <Card>
              <CardHeader><CardTitle>{t('network.routes')}</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="pb-2 text-left font-medium text-zinc-500">Target</th>
                        <th className="pb-2 text-left font-medium text-zinc-500">Gateway</th>
                        <th className="pb-2 text-left font-medium text-zinc-500">Interface</th>
                        <th className="pb-2 text-left font-medium text-zinc-500">Metric</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {routes.map((r, i) => (
                        <tr key={i}>
                          <td className="py-2 font-mono text-zinc-700 dark:text-zinc-300">{r.target}</td>
                          <td className="py-2 font-mono text-zinc-500">{r.gateway || '—'}</td>
                          <td className="py-2 text-zinc-700 dark:text-zinc-300">{r.interface}</td>
                          <td className="py-2 text-zinc-500">{r.metric}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
