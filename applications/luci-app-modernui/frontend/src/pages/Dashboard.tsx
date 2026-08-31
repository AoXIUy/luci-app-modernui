import { useState, useCallback } from 'react';
import { RefreshCw, Cpu, MemoryStick, Thermometer, Clock, Wifi, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { TrafficChart } from '@/components/charts/TrafficChart';
import { usePolling } from '@/hooks/usePolling';
import { useThemeStore } from '@/store/themeStore';
import { rpc } from '@/rpc';
import { t } from '@/i18n';
import {
  formatBytes,
  formatUptime,
  formatLoad,
  formatTemp,
  formatPercent,
} from '@/lib/utils';
import { toast } from 'sonner';
import type { SystemInfo, NetworkInterface, DhcpLease, TrafficSample } from '@/rpc';

const MAX_TRAFFIC_SAMPLES = 30;

export function Dashboard() {
  const { pollingInterval, dashboardCards } = useThemeStore();
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [leases, setLeases] = useState<DhcpLease[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<TrafficSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [info, netStatus, dhcp, traffic] = await Promise.all([
        rpc.getSystemInfo(),
        rpc.getNetworkStatus(),
        rpc.getDhcpLeases(),
        rpc.getNetworkTraffic(),
      ]);
      setSysInfo(info);
      setInterfaces(netStatus.interfaces);
      setLeases(dhcp.leases);
      setTrafficHistory((prev) => {
        const next = [...prev, { ts: traffic.ts, rx: traffic.rx, tx: traffic.tx }];
        return next.slice(-MAX_TRAFFIC_SAMPLES);
      });
      setLastUpdate(new Date());
    } catch {
      toast.error(t('error.rpc_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchData, pollingInterval);

  const memUsed = sysInfo ? formatPercent(sysInfo.memory.used, sysInfo.memory.total) : 0;
  const memUsedBytes = sysInfo ? sysInfo.memory.used : 0;
  const memTotal = sysInfo ? sysInfo.memory.total : 0;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {sysInfo?.hostname} • {sysInfo?.model} • {sysInfo?.firmware}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-zinc-400">
              {t('dashboard.refresh_interval', { seconds: String(pollingInterval) })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData()}
          >
            <RefreshCw className="h-4 w-4" />
            {t('action.refresh')}
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.cpu && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-500">{t('dashboard.cpu_usage')}</CardTitle>
                <Cpu className="h-4 w-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {sysInfo ? Math.round((sysInfo.load[0] / 1) * 100) + '%' : 'N/A'}
                </span>
                <span className="text-xs text-zinc-500">
                  {sysInfo ? formatLoad(sysInfo.load) : ''}
                </span>
              </div>
              <Progress
                value={sysInfo ? Math.min(100, Math.round(sysInfo.load[0] * 100)) : 0}
                className="mt-3"
              />
            </CardContent>
          </Card>
        )}

        {dashboardCards.memory && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-500">{t('dashboard.memory_usage')}</CardTitle>
                <MemoryStick className="h-4 w-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {memUsed}%
                </span>
                <span className="text-xs text-zinc-500">
                  {formatBytes(memUsedBytes)} / {formatBytes(memTotal)}
                </span>
              </div>
              <Progress value={memUsed} className="mt-3" />
            </CardContent>
          </Card>
        )}

        {dashboardCards.temp && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-500">{t('dashboard.temperature')}</CardTitle>
                <Thermometer className="h-4 w-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatTemp(sysInfo?.temperature ?? null)}
                </span>
                <span className="text-xs text-zinc-500">
                  {sysInfo?.temperature ? (
                    sysInfo.temperature >= 80 ? '⚠️ High' :
                    sysInfo.temperature >= 60 ? '🟡 Warm' : '🟢 Normal'
                  ) : ''}
                </span>
              </div>
              <Progress
                value={sysInfo?.temperature ? Math.min(100, (sysInfo.temperature / 100) * 100) : 0}
                colorClass={sysInfo?.temperature ? (
                  sysInfo.temperature >= 80 ? 'bg-red-500' :
                  sysInfo.temperature >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                ) : undefined}
                className="mt-3"
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-500">{t('dashboard.uptime')}</CardTitle>
              <Clock className="h-4 w-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {sysInfo ? formatUptime(sysInfo.uptime) : 'N/A'}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {t('dashboard.load_avg')}: {sysInfo ? formatLoad(sysInfo.load) : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic chart */}
      {dashboardCards.traffic && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{t('dashboard.network_traffic')}</CardTitle>
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-indigo-500" />
                  <span className="text-xs text-zinc-500">{t('dashboard.rx')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-500">{t('dashboard.tx')}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TrafficChart data={trafficHistory} />
          </CardContent>
        </Card>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Interfaces */}
        {dashboardCards.interfaces && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-zinc-400" />
                <CardTitle>{t('dashboard.interfaces')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {interfaces.length === 0 ? (
                <p className="text-sm text-zinc-500">{t('status.loading')}</p>
              ) : (
                interfaces.map((iface) => (
                  <div
                    key={iface.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          iface.up ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {iface.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {iface.ipv4 ?? iface.protocol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={iface.up ? 'success' : 'muted'}>
                        {iface.up ? t('status.up') : t('status.down')}
                      </Badge>
                      {iface.up && (
                        <p className="mt-1 text-xs text-zinc-400">
                          ↑{formatBytes(iface.tx_bytes)} ↓{formatBytes(iface.rx_bytes)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* DHCP leases */}
        {dashboardCards.dhcp && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-zinc-400" />
                <CardTitle>{t('dashboard.dhcp_leases')}</CardTitle>
                <Badge variant="muted" className="ml-auto">
                  {leases.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {leases.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-500">No active leases</p>
                ) : (
                  leases.map((lease, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {lease.hostname || t('status.unknown')}
                        </p>
                        <p className="text-xs text-zinc-500">{lease.mac}</p>
                      </div>
                      <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {lease.ip}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
