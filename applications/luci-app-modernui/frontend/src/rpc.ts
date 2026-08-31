// LuCI JSON-RPC 2.0 client
// All backend calls go through here

export interface SystemInfo {
  hostname: string;
  model: string;
  firmware: string;
  uptime: number;
  load: [number, number, number];
  memory: { total: number; free: number; cached: number; used: number };
  temperature: number | null;
}

export interface NetworkInterface {
  name: string;
  up: boolean;
  ipv4: string | null;
  ipv6: string | null;
  mac: string;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  protocol: string;
  gateway: string | null;
  dns: string[];
}

export interface TrafficSample {
  ts: number;
  rx: number;
  tx: number;
}

export interface DhcpLease {
  ip: string;
  mac: string;
  hostname: string;
  expires: number;
}

export interface Route {
  target: string;
  gateway: string;
  metric: number;
  interface: string;
}

export interface WirelessRadio {
  device: string;
  band: string;
  channel: number;
  frequency: number;
}

export interface WirelessInterface {
  ifname: string;
  ssid: string;
  encryption: string;
  channel: number;
  signal: number;
  noise: number;
  clients: number;
  hidden: boolean;
  radio: string;
}

export interface ScanResult {
  ssid: string;
  bssid: string;
  signal: number;
  channel: number;
  encryption: string;
  quality: number;
}

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
  polling_interval: number;
  sidebar_collapsed: boolean;
  dashboard_cards: {
    show_cpu: boolean;
    show_memory: boolean;
    show_temp: boolean;
    show_traffic: boolean;
    show_interfaces: boolean;
    show_dhcp: boolean;
  };
}

export type RouteMode = 'native' | 'compat' | 'hidden';

export interface RouteEntry {
  path: string;
  title: string;
  mode: RouteMode;
  order: number;
}

export interface ConsoleSession {
  session_id: string;
  token: string;
}

class LuciRpcError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
  ) {
    super(message);
    this.name = 'LuciRpcError';
  }
}

class LuciRpc {
  private readonly baseUrl = '/cgi-bin/luci/rpc/ubus';
  private sessionId: string = '00000000000000000000000000000000';
  private reqId = 0;

  setSession(id: string): void {
    this.sessionId = id;
  }

  getSession(): string {
    return this.sessionId;
  }

  async call<T>(
    service: string,
    method: string,
    args: Record<string, unknown> = {},
  ): Promise<T> {
    const id = ++this.reqId;
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'call',
      params: [this.sessionId, service, method, args],
    });

    let res: Response;
    try {
      res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      throw new LuciRpcError(
        e instanceof Error ? e.message : 'Network error',
      );
    }

    if (res.status === 403) {
      throw new LuciRpcError('Unauthorized', 403);
    }
    if (!res.ok) {
      throw new LuciRpcError(`HTTP ${res.status}`);
    }

    let data: { result?: unknown; error?: { message: string; code: number } };
    try {
      data = await res.json() as typeof data;
    } catch {
      throw new LuciRpcError('Failed to parse response');
    }

    if (data.error) {
      throw new LuciRpcError(data.error.message, data.error.code);
    }

    // ubus response format: [code, payload]
    const result = data.result as [number, T] | null;
    if (!result) throw new LuciRpcError('Empty response');
    const [code, payload] = result;
    if (code !== 0) throw new LuciRpcError(`ubus error code: ${code}`, code);
    return payload;
  }

  // ─── Typed API methods ────────────────────────────────────────────

  async getSystemInfo(): Promise<SystemInfo> {
    return this.call<SystemInfo>('modernui', 'system.getInfo');
  }

  async getSystemLogs(lines = 200): Promise<{ logs: string[] }> {
    return this.call('modernui', 'system.getLogs', { lines });
  }

  async setHostname(hostname: string): Promise<{ success: boolean }> {
    return this.call('modernui', 'system.setHostname', { hostname });
  }

  async getNetworkStatus(): Promise<{ interfaces: NetworkInterface[] }> {
    return this.call('modernui', 'network.getStatus');
  }

  async getNetworkTraffic(iface?: string): Promise<TrafficSample> {
    return this.call('modernui', 'network.getTraffic',
      iface ? { interface: iface } : {});
  }

  async getRoutes(): Promise<{ routes: Route[] }> {
    return this.call('modernui', 'network.getRoutes');
  }

  async getDhcpLeases(): Promise<{ leases: DhcpLease[] }> {
    return this.call('modernui', 'network.getDhcpLeases');
  }

  async getWirelessStatus(): Promise<{
    radios: WirelessRadio[];
    interfaces: WirelessInterface[];
  }> {
    return this.call('modernui', 'wireless.getStatus');
  }

  async scanWireless(device: string): Promise<{ results: ScanResult[] }> {
    return this.call('modernui', 'wireless.scan', { device });
  }

  async setWirelessConfig(
    data: Partial<WirelessInterface>,
  ): Promise<{ success: boolean; error?: string }> {
    return this.call('modernui', 'wireless.setConfig', data as Record<string, unknown>);
  }

  async getThemeConfig(): Promise<ThemeConfig> {
    return this.call<ThemeConfig>('modernui', 'theme.get');
  }

  async setThemeConfig(
    cfg: Partial<ThemeConfig>,
  ): Promise<{ success: boolean }> {
    return this.call('modernui', 'theme.set', cfg as Record<string, unknown>);
  }

  async listRoutes(): Promise<{ routes: RouteEntry[] }> {
    return this.call('modernui', 'routes.list');
  }

  async setRouteMode(
    path: string,
    mode: RouteMode,
  ): Promise<{ success: boolean }> {
    return this.call('modernui', 'routes.setMode', { path, mode });
  }

  async createConsoleSession(): Promise<ConsoleSession> {
    return this.call<ConsoleSession>('modernui', 'console.create');
  }

  async sendConsoleInput(
    session_id: string,
    token: string,
    data: string,
  ): Promise<{ output: string }> {
    return this.call('modernui', 'console.input', { session_id, token, data });
  }

  async destroyConsoleSession(
    session_id: string,
    token: string,
  ): Promise<{ success: boolean }> {
    return this.call('modernui', 'console.destroy', { session_id, token });
  }

  async resizeConsole(
    session_id: string,
    token: string,
    cols: number,
    rows: number,
  ): Promise<{ success: boolean }> {
    return this.call('modernui', 'console.resize', { session_id, token, cols, rows });
  }
}

export const rpc = new LuciRpc();
export { LuciRpcError };

// Read session from DOM data attribute injected by LuCI template
const root = document.getElementById('modernui-root');
if (root?.dataset.session) {
  rpc.setSession(root.dataset.session);
}
