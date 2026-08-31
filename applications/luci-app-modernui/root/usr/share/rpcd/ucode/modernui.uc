// /usr/share/rpcd/ucode/modernui.uc
// ModernUI backend RPC - runs under rpcd with root privileges
// All functions registered here are callable via JSON-RPC 2.0

'use strict';

import { readfile, stat } from 'fs';
import { cursor } from 'uci';
import { connect, socket, AF_UNIX, SOCK_STREAM } from 'socket';

const ubus = require('ubus');
const conn = ubus.connect();

const CONSOLE_SOCK = '/var/run/modernui-console.sock';

// Send a JSON request to the modernui-console daemon over UNIX socket.
// Returns parsed response object, or { ok: false, error: '<msg>' } on failure.
function console_socket_call(payload) {
  let sock;
  try {
    sock = socket(AF_UNIX, SOCK_STREAM, 0);
    if (!sock) {
      return { ok: false, error: 'Failed to create socket' };
    }
    const r = connect(sock, CONSOLE_SOCK);
    if (r !== 0) {
      return { ok: false, error: 'Console daemon not running. Install modernui-console package.' };
    }
    const msg = json(payload) + '\n';
    sock.send(msg);
    // Read response (up to 65536 bytes)
    let raw = '';
    let chunk;
    while ((chunk = sock.recv(4096)) !== null && length(chunk) > 0) {
      raw += chunk;
      if (index(raw, '\n') >= 0) break;
    }
    raw = trim(raw);
    if (!length(raw)) {
      return { ok: false, error: 'Empty response from daemon' };
    }
    const resp = json(raw);
    return resp ?? { ok: false, error: 'Invalid JSON from daemon' };
  } catch (e) {
    return { ok: false, error: 'Socket error: ' + e };
  } finally {
    if (sock) sock.close();
  }
}


// ──────────────────────────────────────────────────────────────────
// Helper utilities
// ──────────────────────────────────────────────────────────────────

function validate_string(val, max_len) {
  if (typeof val !== 'string') return false;
  if (max_len && length(val) > max_len) return false;
  return true;
}

function validate_ip(ip) {
  if (!validate_string(ip)) return false;
  return match(ip, /^\d{1,3}(\. \d{1,3}){3}$/) !== null;
}

function uci_get(pkg, sec, opt, def) {
  const c = cursor();
  c.load(pkg);
  const val = c.get(pkg, sec, opt);
  return val ?? def;
}

function uci_set(pkg, sec, opt, val) {
  const c = cursor();
  c.load(pkg);
  c.set(pkg, sec, opt, val);
  return c.save() && c.apply();
}

function read_thermal() {
  // Try common thermal zone paths
  const paths = [
    '/sys/class/thermal/thermal_zone0/temp',
    '/sys/class/thermal/thermal_zone1/temp',
    '/sys/bus/platform/drivers/armada_thermal/f10d8078.thermal:thermal-sensor/hwmon/hwmon0/temp1_input',
  ];
  for (const p of paths) {
    const raw = readfile(p);
    if (raw) {
      const val = int(trim(raw));
      if (!isnan(val) && val > 0) {
        // Values > 1000 are in millidegrees
        return val > 1000 ? val / 1000 : val;
      }
    }
  }
  return null;
}

function parse_meminfo() {
  const content = readfile('/proc/meminfo');
  if (!content) return { total: 0, free: 0, cached: 0, used: 0 };
  const result = { total: 0, free: 0, cached: 0, buffers: 0 };
  for (const line of split(content, '\n')) {
    const m = match(line, /^(\w+):\s+(\d+)/);
    if (!m) continue;
    const kb = int(m[2]);
    switch (m[1]) {
      case 'MemTotal':   result.total = kb * 1024; break;
      case 'MemFree':    result.free  = kb * 1024; break;
      case 'Cached':     result.cached = kb * 1024; break;
      case 'Buffers':    result.buffers = kb * 1024; break;
    }
  }
  result.used = result.total - result.free - result.cached - result.buffers;
  return result;
}

// ──────────────────────────────────────────────────────────────────
// Method: system.getInfo
// ──────────────────────────────────────────────────────────────────
return {
  // Function registry - all exported methods
  'system.getInfo': {
    call: function(request) {
      // Get system info via ubus
      const sysinfo = conn.call('system', 'info', {}) ?? {};
      const board = conn.call('system', 'board', {}) ?? {};
      const mem = parse_meminfo();
      const temp = read_thermal();
      const load = sysinfo.load ?? [0, 0, 0];

      return {
        hostname: board.hostname ?? 'OpenWrt',
        model:    board.model ?? 'Unknown',
        firmware: board.release?.distribution + ' ' + (board.release?.version ?? '') ?? 'Unknown',
        uptime:   sysinfo.uptime ?? 0,
        load:     [
          (load[0] ?? 0) / 65536,
          (load[1] ?? 0) / 65536,
          (load[2] ?? 0) / 65536,
        ],
        memory:      mem,
        temperature: temp,
      };
    },
    args: {},
  },

  // ── system.getLogs ──────────────────────────────────────────────
  'system.getLogs': {
    call: function(request) {
      const lines = int(request.args?.lines ?? 200);
      if (isnan(lines) || lines < 1 || lines > 5000) {
        return { error: 'Invalid lines parameter (1-5000)' };
      }
      // Read from kernel log
      const result = conn.call('system', 'log', { lines }) ?? {};
      return { logs: result.log ?? [] };
    },
    args: { lines: 200 },
  },

  // ── system.setHostname ──────────────────────────────────────────
  'system.setHostname': {
    call: function(request) {
      const hostname = request.args?.hostname;
      if (!validate_string(hostname, 64)) {
        return { error: 'Invalid hostname: must be a string up to 64 chars' };
      }
      if (!match(hostname, /^[a-zA-Z0-9][a-zA-Z0-9\-\.]*$/)) {
        return { error: 'Invalid hostname format' };
      }
      const ok = uci_set('system', '@system[0]', 'hostname', hostname);
      if (!ok) return { error: 'Failed to save hostname' };
      return { success: true };
    },
    args: { hostname: '' },
  },

  // ── network.getStatus ───────────────────────────────────────────
  'network.getStatus': {
    call: function(request) {
      const dump = conn.call('network.interface', 'dump', {}) ?? {};
      const ifaces = [];
      for (const iface of (dump.interface ?? [])) {
        const ipv4 = iface.ipv4_address?.[0]?.address ?? null;
        const ipv6 = iface.ipv6_address?.[0]?.address ?? null;
        ifaces.push({
          name:       iface.interface ?? '',
          up:         iface.up ?? false,
          ipv4,
          ipv6,
          mac:        iface.mac ?? '',
          rx_bytes:   iface.statistics?.rx_bytes ?? 0,
          tx_bytes:   iface.statistics?.tx_bytes ?? 0,
          rx_packets: iface.statistics?.rx_packets ?? 0,
          tx_packets: iface.statistics?.tx_packets ?? 0,
          protocol:   iface.proto ?? 'none',
          gateway:    iface.route?.[0]?.nexthop ?? null,
          dns:        iface['dns-server'] ?? [],
        });
      }
      return { interfaces: ifaces };
    },
    args: {},
  },

  // ── network.getTraffic ──────────────────────────────────────────
  'network.getTraffic': {
    call: function(request) {
      const iface_name = request.args?.interface;
      const dump = conn.call('network.interface', 'dump', {}) ?? {};
      let rx = 0, tx = 0;
      for (const iface of (dump.interface ?? [])) {
        if (iface_name && iface.interface !== iface_name) continue;
        rx += iface.statistics?.rx_bytes ?? 0;
        tx += iface.statistics?.tx_bytes ?? 0;
      }
      return { ts: time(), rx_bytes: rx, tx_bytes: tx };
    },
    args: { interface: null },
  },

  // ── network.getDhcpLeases ───────────────────────────────────────
  'network.getDhcpLeases': {
    call: function(request) {
      const content = readfile('/tmp/dhcp.leases');
      const leases = [];
      if (content) {
        for (const line of split(content, '\n')) {
          const parts = split(trim(line), ' ');
          if (length(parts) >= 4) {
            leases.push({
              expires:  int(parts[0]),
              mac:      parts[1],
              ip:       parts[2],
              hostname: parts[3] !== '*' ? parts[3] : '',
            });
          }
        }
      }
      return { leases };
    },
    args: {},
  },

  // ── network.getRoutes ───────────────────────────────────────────
  'network.getRoutes': {
    call: function(request) {
      const ipv4 = conn.call('network.route', 'list', { v6: false }) ?? {};
      const routes = (ipv4.routes ?? []).map((r) => ({
        target:    r.target + '/' + r.prefix,
        gateway:   r.nexthop ?? '',
        metric:    r.metric ?? 0,
        interface: r.interface ?? '',
      }));
      return { routes };
    },
    args: {},
  },

  // ── wireless.getStatus ──────────────────────────────────────────
  'wireless.getStatus': {
    call: function(request) {
      const status = conn.call('network.wireless', 'status', {}) ?? {};
      const radios = [];
      const interfaces = [];
      for (const [devname, dev] of pairs(status)) {
        radios.push({
          device:    devname,
          band:      dev.config?.band ?? '',
          channel:   dev.config?.channel ?? 0,
          frequency: dev.config?.frequency ?? 0,
        });
        for (const iface of (dev.interfaces ?? [])) {
          interfaces.push({
            ifname:     iface.ifname ?? '',
            ssid:       iface.config?.ssid ?? '',
            encryption: iface.config?.encryption ?? 'none',
            channel:    dev.config?.channel ?? 0,
            signal:     iface.station?.signal ?? 0,
            noise:      iface.station?.noise ?? 0,
            clients:    length(iface.stations ?? []),
            hidden:     iface.config?.hidden ?? false,
            radio:      devname,
          });
        }
      }
      return { radios, interfaces };
    },
    args: {},
  },

  // ── wireless.scan ───────────────────────────────────────────────
  'wireless.scan': {
    call: function(request) {
      const device = request.args?.device;
      if (!validate_string(device, 32)) {
        return { error: 'Missing or invalid device parameter' };
      }
      const result = conn.call('hostapd.' + device, 'scan', {}) ?? {};
      return { results: result.results ?? [] };
    },
    args: { device: '' },
  },

  // ── wireless.setConfig ──────────────────────────────────────────
  'wireless.setConfig': {
    call: function(request) {
      const args = request.args ?? {};
      const ifname = args.ifname;
      if (!validate_string(ifname, 16)) {
        return { error: 'Missing or invalid ifname' };
      }
      const c = cursor();
      c.load('wireless');
      // Find the UCI section matching ifname
      let section = null;
      c.foreach('wireless', 'wifi-iface', (s) => {
        if (s.ifname === ifname || s['.name'] === ifname) {
          section = s['.name'];
        }
      });
      if (!section) return { error: 'Interface not found: ' + ifname };

      const ALLOWED = ['ssid', 'key', 'encryption', 'channel', 'hidden', 'disabled'];
      for (const key of ALLOWED) {
        if (args[key] !== null && args[key] !== undefined) {
          c.set('wireless', section, key, '' + args[key]);
        }
      }
      const ok = c.save() && c.apply();
      if (!ok) return { error: 'Failed to save wireless config' };
      conn.call('network', 'reload', {});
      return { success: true };
    },
    args: { ifname: '', ssid: null, key: null, encryption: null, hidden: null },
  },

  // ── theme.get ───────────────────────────────────────────────────
  'theme.get': {
    call: function(request) {
      const c = cursor();
      c.load('modernui');
      return {
        theme:            c.get('modernui', 'global', 'theme') ?? 'auto',
        language:         c.get('modernui', 'global', 'language') ?? 'zh',
        polling_interval: int(c.get('modernui', 'global', 'polling_interval') ?? 5),
        sidebar_collapsed: (c.get('modernui', 'global', 'sidebar_collapsed') ?? '0') === '1',
        dashboard_cards: {
          show_cpu:        (c.get('modernui', 'dashboard', 'show_cpu') ?? '1') === '1',
          show_memory:     (c.get('modernui', 'dashboard', 'show_memory') ?? '1') === '1',
          show_temp:       (c.get('modernui', 'dashboard', 'show_temp') ?? '1') === '1',
          show_traffic:    (c.get('modernui', 'dashboard', 'show_traffic') ?? '1') === '1',
          show_interfaces: (c.get('modernui', 'dashboard', 'show_interfaces') ?? '1') === '1',
          show_dhcp:       (c.get('modernui', 'dashboard', 'show_dhcp') ?? '1') === '1',
        },
      };
    },
    args: {},
  },

  // ── theme.set ───────────────────────────────────────────────────
  'theme.set': {
    call: function(request) {
      const args = request.args ?? {};
      const c = cursor();
      c.load('modernui');
      const VALID_THEMES = ['light', 'dark', 'auto'];
      const VALID_LANGS  = ['zh', 'en'];

      if (args.theme && !VALID_THEMES.includes(args.theme)) {
        return { error: 'Invalid theme: ' + args.theme };
      }
      if (args.language && !VALID_LANGS.includes(args.language)) {
        return { error: 'Invalid language: ' + args.language };
      }
      if (args.theme)    c.set('modernui', 'global', 'theme', args.theme);
      if (args.language) c.set('modernui', 'global', 'language', args.language);
      if (args.polling_interval) {
        const iv = int(args.polling_interval);
        if (iv >= 2 && iv <= 60) {
          c.set('modernui', 'global', 'polling_interval', '' + iv);
        }
      }
      if (args.sidebar_collapsed !== undefined) {
        c.set('modernui', 'global', 'sidebar_collapsed', args.sidebar_collapsed ? '1' : '0');
      }
      const ok = c.save() && c.apply();
      return ok ? { success: true } : { error: 'Failed to save settings' };
    },
    args: { theme: null, language: null, polling_interval: null, sidebar_collapsed: null },
  },

  // ── routes.list ─────────────────────────────────────────────────
  'routes.list': {
    call: function(request) {
      // Discover routes from LuCI menu.d files
      const routes = [];
      const menu_dir = '/usr/share/luci/menu.d/';
      // Read each menu JSON file
      const KNOWN_MODES = { /* populated by uci-defaults */ };
      const c = cursor();
      c.load('modernui');
      c.foreach('modernui', 'route', (s) => {
        KNOWN_MODES[s.path] = s.mode ?? 'compat';
      });

      // We parse menu files via filesystem (simplified)
      const menu_entries = conn.call('luci', 'getMenuEntries', {}) ?? {};
      for (const [path, entry] of pairs(menu_entries)) {
        routes.push({
          path:  path,
          title: entry.title ?? path,
          mode:  KNOWN_MODES[path] ?? 'compat',
          order: entry.order ?? 999,
        });
      }
      return { routes };
    },
    args: {},
  },

  // ── routes.setMode ──────────────────────────────────────────────
  'routes.setMode': {
    call: function(request) {
      const path = request.args?.path;
      const mode = request.args?.mode;
      const VALID_MODES = ['native', 'compat', 'hidden'];
      if (!validate_string(path, 256)) {
        return { error: 'Invalid path' };
      }
      if (!VALID_MODES.includes(mode)) {
        return { error: 'Invalid mode: ' + mode };
      }
      const c = cursor();
      c.load('modernui');
      // Find or create the route section
      let section = null;
      c.foreach('modernui', 'route', (s) => {
        if (s.path === path) section = s['.name'];
      });
      if (!section) {
        section = c.add('modernui', 'route');
        c.set('modernui', section, 'path', path);
      }
      c.set('modernui', section, 'mode', mode);
      const ok = c.save() && c.apply();
      return ok ? { success: true } : { error: 'Failed to save route mode' };
    },
    args: { path: '', mode: 'compat' },
  },

  // ── console.create ──────────────────────────────────────────────
  'console.create': {
    call: function(request) {
      const resp = console_socket_call({ action: 'create' });
      if (!resp.ok) {
        return { error: resp.error ?? 'Failed to create session' };
      }
      return {
        session_id: resp.session_id,
        token:      resp.token,
      };
    },
    args: {},
  },

  'console.input': {
    call: function(request) {
      const session_id = request.args?.session_id;
      const token      = request.args?.token;
      const data       = request.args?.data ?? '';
      if (!session_id || !token) {
        return { error: 'Missing session_id or token' };
      }
      const resp = console_socket_call({
        action: 'input',
        session_id,
        token,
        data,
      });
      if (!resp.ok) {
        return { error: resp.error ?? 'Input failed' };
      }
      // Decode base64 output so frontend receives raw string
      return { output: resp.output ?? '' };
    },
    args: { session_id: '', token: '', data: '' },
  },

  'console.resize': {
    call: function(request) {
      const session_id = request.args?.session_id;
      const token      = request.args?.token;
      const cols       = int(request.args?.cols ?? 80);
      const rows       = int(request.args?.rows ?? 24);
      if (!session_id || !token) {
        return { error: 'Missing session_id or token' };
      }
      const resp = console_socket_call({
        action: 'resize',
        session_id,
        token,
        cols,
        rows,
      });
      if (!resp.ok) {
        return { error: resp.error ?? 'Resize failed' };
      }
      return { success: true };
    },
    args: { session_id: '', token: '', cols: 80, rows: 24 },
  },

  'console.destroy': {
    call: function(request) {
      const session_id = request.args?.session_id;
      const token      = request.args?.token;
      if (!session_id || !token) {
        return { error: 'Missing session_id or token' };
      }
      const resp = console_socket_call({
        action: 'destroy',
        session_id,
        token,
      });
      if (!resp.ok) {
        return { error: resp.error ?? 'Destroy failed' };
      }
      return { success: true };
    },
    args: { session_id: '', token: '' },
  },
};
