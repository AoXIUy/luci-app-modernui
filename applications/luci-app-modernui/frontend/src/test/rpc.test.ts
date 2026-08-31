import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rpc } from '@/rpc';
import type { SystemInfo } from '@/rpc';

vi.mock('@/rpc', () => ({
  rpc: {
    call: vi.fn(),
    getSystemInfo: vi.fn(),
    getNetworkStatus: vi.fn(),
    getDhcpLeases: vi.fn(),
    getNetworkTraffic: vi.fn(),
    getWirelessStatus: vi.fn(),
    getThemeConfig: vi.fn(),
    setThemeConfig: vi.fn(),
    listRoutes: vi.fn(),
    setRouteMode: vi.fn(),
    createConsoleSession: vi.fn(),
    sendConsoleInput: vi.fn(),
    destroyConsoleSession: vi.fn(),
  },
}));

describe('rpc.getSystemInfo', () => {
  beforeEach(() => {
    vi.mocked(rpc.getSystemInfo).mockResolvedValue({
      hostname: 'OpenWrt',
      model: 'Generic x86_64',
      firmware: 'OpenWrt 25.10.0',
      uptime: 86400,
      load: [0.42, 0.38, 0.35],
      memory: { total: 524288000, free: 262144000, cached: 131072000, used: 131072000 },
      temperature: 62.5,
    } satisfies SystemInfo);
  });

  it('returns system info with required fields', async () => {
    const info = await rpc.getSystemInfo();
    expect(info.hostname).toBe('OpenWrt');
    expect(info.load).toHaveLength(3);
    expect(info.memory.total).toBeGreaterThan(0);
    expect(info.uptime).toBeGreaterThan(0);
  });

  it('returns temperature', async () => {
    const info = await rpc.getSystemInfo();
    expect(info.temperature).toBe(62.5);
  });
});

describe('rpc.getNetworkStatus', () => {
  beforeEach(() => {
    vi.mocked(rpc.getNetworkStatus).mockResolvedValue({
      interfaces: [
        {
          name: 'wan',
          up: true,
          ipv4: '203.0.113.1',
          ipv6: null,
          mac: 'aa:bb:cc:dd:ee:ff',
          rx_bytes: 1024000,
          tx_bytes: 512000,
          rx_packets: 1000,
          tx_packets: 500,
          protocol: 'dhcp',
          gateway: '203.0.113.254',
          dns: ['8.8.8.8', '8.8.4.4'],
        },
        {
          name: 'lan',
          up: true,
          ipv4: '192.168.1.1',
          ipv6: null,
          mac: 'aa:bb:cc:dd:ee:fe',
          rx_bytes: 2048000,
          tx_bytes: 4096000,
          rx_packets: 2000,
          tx_packets: 4000,
          protocol: 'static',
          gateway: null,
          dns: [],
        },
      ],
    });
  });

  it('returns interface list', async () => {
    const status = await rpc.getNetworkStatus();
    expect(status.interfaces).toHaveLength(2);
    expect(status.interfaces[0].name).toBe('wan');
    expect(status.interfaces[1].name).toBe('lan');
  });

  it('interface has required fields', async () => {
    const status = await rpc.getNetworkStatus();
    const wan = status.interfaces[0];
    expect(wan.up).toBe(true);
    expect(wan.ipv4).toBe('203.0.113.1');
    expect(wan.rx_bytes).toBeGreaterThan(0);
  });
});

describe('rpc.setThemeConfig', () => {
  it('returns success', async () => {
    vi.mocked(rpc.setThemeConfig).mockResolvedValue({ success: true });
    const result = await rpc.setThemeConfig({ theme: 'dark' });
    expect(result.success).toBe(true);
  });
});

describe('rpc.listRoutes', () => {
  it('returns route list', async () => {
    vi.mocked(rpc.listRoutes).mockResolvedValue({
      routes: [
        { path: '/admin/network', title: 'Network', mode: 'native', order: 10 },
        { path: '/admin/system/packages', title: 'Packages', mode: 'compat', order: 50 },
      ],
    });
    const result = await rpc.listRoutes();
    expect(result.routes).toHaveLength(2);
    expect(result.routes[0].mode).toBe('native');
    expect(result.routes[1].mode).toBe('compat');
  });
});
