// All user-facing strings must go through t()

type Locale = 'zh' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  zh: {
    // Navigation
    'nav.dashboard': '仪表盘',
    'nav.network': '网络',
    'nav.wireless': '无线',
    'nav.system': '系统',
    'nav.terminal': '终端',
    'nav.settings': '设置',
    'nav.logout': '退出登录',
    'nav.search_placeholder': '搜索页面... (⌘K)',
    'nav.collapse_sidebar': '收起侧栏',
    'nav.expand_sidebar': '展开侧栏',

    // Dashboard
    'dashboard.title': '仪表盘',
    'dashboard.subtitle': '系统状态概览',
    'dashboard.cpu_usage': 'CPU 使用率',
    'dashboard.memory_usage': '内存使用',
    'dashboard.temperature': '温度',
    'dashboard.uptime': '运行时间',
    'dashboard.load_avg': '负载均值',
    'dashboard.network_traffic': '网络流量',
    'dashboard.rx': '下行',
    'dashboard.tx': '上行',
    'dashboard.interfaces': '接口状态',
    'dashboard.dhcp_leases': 'DHCP 客户端',
    'dashboard.hostname': '主机名',
    'dashboard.model': '设备型号',
    'dashboard.firmware': '固件版本',
    'dashboard.refresh_interval': '刷新间隔: {{seconds}}秒',

    // Network
    'network.title': '网络管理',
    'network.interface': '接口',
    'network.status': '状态',
    'network.ip_address': 'IP 地址',
    'network.mac_address': 'MAC 地址',
    'network.rx_bytes': '接收',
    'network.tx_bytes': '发送',
    'network.protocol': '协议',
    'network.gateway': '网关',
    'network.dns': 'DNS 服务器',
    'network.edit': '编辑接口',
    'network.routes': '路由表',
    'network.dhcp_leases': 'DHCP 租约',
    'network.lease_ip': 'IP 地址',
    'network.lease_mac': 'MAC 地址',
    'network.lease_hostname': '主机名',
    'network.lease_expires': '过期时间',

    // Wireless
    'wireless.title': '无线管理',
    'wireless.ssid': '网络名称 (SSID)',
    'wireless.password': '密码',
    'wireless.encryption': '加密方式',
    'wireless.channel': '信道',
    'wireless.band': '频段',
    'wireless.hidden': '隐藏网络',
    'wireless.connected_clients': '已连接设备',
    'wireless.signal': '信号强度',
    'wireless.scan': '扫描周边网络',
    'wireless.scanning': '正在扫描...',
    'wireless.edit': '编辑无线配置',

    // System
    'system.title': '系统',
    'system.hostname': '主机名',
    'system.timezone': '时区',
    'system.ntp_server': 'NTP 服务器',
    'system.logs': '系统日志',
    'system.backup': '备份配置',
    'system.restore': '恢复配置',
    'system.firmware': '固件升级',
    'system.reboot': '重启',
    'system.reboot_confirm': '确定要重启路由器吗？',
    'system.download_backup': '下载备份',
    'system.upload_restore': '上传恢复文件',
    'system.log_lines': '日志行数',
    'system.clear_logs': '清空日志',
    'system.save': '保存设置',

    // Terminal
    'terminal.title': 'Web 终端',
    'terminal.connecting': '正在连接...',
    'terminal.connected': '已连接',
    'terminal.disconnected': '连接断开',
    'terminal.reconnect': '重新连接',
    'terminal.close': '关闭',
    'terminal.fullscreen': '全屏',
    'terminal.exit_fullscreen': '退出全屏',
    'terminal.warning': '终端直接访问路由器系统，请谨慎操作',
    'terminal.resize': '调整终端大小',
    'terminal.session_expired': '会话已过期，请重新连接',
    'terminal.max_sessions': '已达最大会话数限制',

    // Navigation (mobile)
    'nav.open_menu': '打开菜单',
    'nav.close_menu': '关闭菜单',

    // Settings
    'settings.title': '设置',
    'settings.appearance': '外观',
    'settings.theme': '主题',
    'settings.theme.light': '亮色',
    'settings.theme.dark': '暗色',
    'settings.theme.auto': '跟随系统',
    'settings.language': '语言',
    'settings.language.zh': '中文',
    'settings.language.en': 'English',
    'settings.polling': '数据刷新',
    'settings.polling_interval': '刷新间隔（秒）',
    'settings.route_modes': '路由渲染模式',
    'settings.route_modes_desc': '控制每个 LuCI 路由的渲染方式',
    'settings.route_modes_title': '路由渲染模式',
    'settings.mode.native': '原生',
    'settings.mode.compat': '兼容',
    'settings.mode.hidden': '隐藏',
    'settings.route_search': '搜索路由...',
    'settings.route_mode_saved': '路由模式已保存',
    'settings.route_path': '路由路径',
    'settings.route_title': '标题',
    'settings.route_mode': '渲染模式',
    'settings.route_action': '操作',
    'settings.no_routes': '未发现任何路由',
    'settings.dashboard_cards': '仪表盘卡片',
    'settings.dashboard_cards_title': '仪表盘卡片',
    'settings.card_cpu': 'CPU 使用率',
    'settings.card_memory': '内存使用',
    'settings.card_temp': '温度',
    'settings.card_traffic': '网络流量',
    'settings.card_interfaces': '接口状态',
    'settings.card_dhcp': 'DHCP 客户端',
    'settings.saved': '设置已保存',

    // Actions
    'action.save': '保存',
    'action.cancel': '取消',
    'action.refresh': '刷新',
    'action.edit': '编辑',
    'action.delete': '删除',
    'action.add': '添加',
    'action.apply': '应用',
    'action.close': '关闭',
    'action.confirm': '确认',
    'action.back': '返回',
    'action.copy': '复制',
    'action.copied': '已复制',

    // Status
    'status.loading': '加载中...',
    'status.online': '在线',
    'status.offline': '离线',
    'status.up': '已启用',
    'status.down': '已禁用',
    'status.unknown': '未知',
    'status.connected': '已连接',
    'status.disconnected': '未连接',
    'status.saving': '保存中...',
    'status.success': '操作成功',

    // Errors
    'error.rpc_failed': 'RPC 请求失败，请重试',
    'error.unauthorized': '会话已过期，请重新登录',
    'error.network': '网络错误，请检查连接',
    'error.invalid_input': '输入无效，请检查参数',
    'error.not_found': '资源不存在',
    'error.server': '服务器内部错误',
    'error.timeout': '请求超时',
    'error.parse': '数据解析失败',

    // LuCI Compat
    'compat.banner': '此页面使用 LuCI 兼容模式',
    'compat.loading': '正在加载 LuCI 页面...',

    // Command Palette
    'palette.title': '快速导航',
    'palette.placeholder': '输入命令或搜索页面...',
    'palette.no_results': '没有找到匹配结果',
    'palette.recent': '最近访问',
    'palette.pages': '所有页面',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.network': 'Network',
    'nav.wireless': 'Wireless',
    'nav.system': 'System',
    'nav.terminal': 'Terminal',
    'nav.settings': 'Settings',
    'nav.logout': 'Log Out',
    'nav.search_placeholder': 'Search pages... (⌘K)',
    'nav.collapse_sidebar': 'Collapse Sidebar',
    'nav.expand_sidebar': 'Expand Sidebar',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'System Status Overview',
    'dashboard.cpu_usage': 'CPU Usage',
    'dashboard.memory_usage': 'Memory',
    'dashboard.temperature': 'Temperature',
    'dashboard.uptime': 'Uptime',
    'dashboard.load_avg': 'Load Average',
    'dashboard.network_traffic': 'Network Traffic',
    'dashboard.rx': 'Download',
    'dashboard.tx': 'Upload',
    'dashboard.interfaces': 'Interfaces',
    'dashboard.dhcp_leases': 'DHCP Clients',
    'dashboard.hostname': 'Hostname',
    'dashboard.model': 'Device Model',
    'dashboard.firmware': 'Firmware',
    'dashboard.refresh_interval': 'Refresh: every {{seconds}}s',

    // Network
    'network.title': 'Network',
    'network.interface': 'Interface',
    'network.status': 'Status',
    'network.ip_address': 'IP Address',
    'network.mac_address': 'MAC Address',
    'network.rx_bytes': 'Received',
    'network.tx_bytes': 'Sent',
    'network.protocol': 'Protocol',
    'network.gateway': 'Gateway',
    'network.dns': 'DNS Servers',
    'network.edit': 'Edit Interface',
    'network.routes': 'Routes',
    'network.dhcp_leases': 'DHCP Leases',
    'network.lease_ip': 'IP Address',
    'network.lease_mac': 'MAC Address',
    'network.lease_hostname': 'Hostname',
    'network.lease_expires': 'Expires',

    // Wireless
    'wireless.title': 'Wireless',
    'wireless.ssid': 'Network Name (SSID)',
    'wireless.password': 'Password',
    'wireless.encryption': 'Encryption',
    'wireless.channel': 'Channel',
    'wireless.band': 'Band',
    'wireless.hidden': 'Hidden Network',
    'wireless.connected_clients': 'Connected Clients',
    'wireless.signal': 'Signal Strength',
    'wireless.scan': 'Scan Nearby Networks',
    'wireless.scanning': 'Scanning...',
    'wireless.edit': 'Edit Wireless Config',

    // System
    'system.title': 'System',
    'system.hostname': 'Hostname',
    'system.timezone': 'Timezone',
    'system.ntp_server': 'NTP Server',
    'system.logs': 'System Logs',
    'system.backup': 'Backup Config',
    'system.restore': 'Restore Config',
    'system.firmware': 'Firmware Upgrade',
    'system.reboot': 'Reboot',
    'system.reboot_confirm': 'Are you sure you want to reboot the router?',
    'system.download_backup': 'Download Backup',
    'system.upload_restore': 'Upload Restore File',
    'system.log_lines': 'Log Lines',
    'system.clear_logs': 'Clear Logs',
    'system.save': 'Save Settings',

    // Terminal
    'terminal.title': 'Web Terminal',
    'terminal.connecting': 'Connecting...',
    'terminal.connected': 'Connected',
    'terminal.disconnected': 'Disconnected',
    'terminal.reconnect': 'Reconnect',
    'terminal.close': 'Close',
    'terminal.fullscreen': 'Fullscreen',
    'terminal.exit_fullscreen': 'Exit Fullscreen',
    'terminal.warning': 'The terminal has direct access to the router system. Use with caution.',
    'terminal.resize': 'Resize terminal',
    'terminal.session_expired': 'Session expired, please reconnect',
    'terminal.max_sessions': 'Maximum session limit reached',

    // Navigation (mobile)
    'nav.open_menu': 'Open menu',
    'nav.close_menu': 'Close menu',

    // Settings
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.auto': 'System',
    'settings.language': 'Language',
    'settings.language.zh': '中文',
    'settings.language.en': 'English',
    'settings.polling': 'Data Refresh',
    'settings.polling_interval': 'Refresh Interval (seconds)',
    'settings.route_modes': 'Route Rendering Modes',
    'settings.route_modes_desc': 'Control how each LuCI route is rendered. Native uses the React screen, Compat uses the original LuCI page, Hidden removes the route.',
    'settings.route_modes_title': 'Route Rendering Modes',
    'settings.mode.native': 'Native',
    'settings.mode.compat': 'Compat',
    'settings.mode.hidden': 'Hidden',
    'settings.route_search': 'Search routes...',
    'settings.route_mode_saved': 'Route mode saved',
    'settings.route_path': 'Route Path',
    'settings.route_title': 'Title',
    'settings.route_mode': 'Mode',
    'settings.route_action': 'Action',
    'settings.no_routes': 'No routes discovered',
    'settings.dashboard_cards': 'Dashboard Cards',
    'settings.dashboard_cards_title': 'Dashboard Cards',
    'settings.card_cpu': 'CPU Usage',
    'settings.card_memory': 'Memory',
    'settings.card_temp': 'Temperature',
    'settings.card_traffic': 'Network Traffic',
    'settings.card_interfaces': 'Interfaces',
    'settings.card_dhcp': 'DHCP Clients',
    'settings.saved': 'Settings saved',

    // Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.refresh': 'Refresh',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.add': 'Add',
    'action.apply': 'Apply',
    'action.close': 'Close',
    'action.confirm': 'Confirm',
    'action.back': 'Back',
    'action.copy': 'Copy',
    'action.copied': 'Copied',

    // Status
    'status.loading': 'Loading...',
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.up': 'Up',
    'status.down': 'Down',
    'status.unknown': 'Unknown',
    'status.connected': 'Connected',
    'status.disconnected': 'Disconnected',
    'status.saving': 'Saving...',
    'status.success': 'Success',

    // Errors
    'error.rpc_failed': 'RPC request failed, please try again',
    'error.unauthorized': 'Session expired, please log in again',
    'error.network': 'Network error, please check your connection',
    'error.invalid_input': 'Invalid input, please check parameters',
    'error.not_found': 'Resource not found',
    'error.server': 'Internal server error',
    'error.timeout': 'Request timed out',
    'error.parse': 'Failed to parse response',

    // LuCI Compat
    'compat.banner': 'This page uses LuCI compatibility mode',
    'compat.loading': 'Loading LuCI page...',

    // Command Palette
    'palette.title': 'Quick Navigation',
    'palette.placeholder': 'Type a command or search pages...',
    'palette.no_results': 'No results found',
    'palette.recent': 'Recent',
    'palette.pages': 'All Pages',
  },
};

let currentLocale: Locale = 'zh';

export function t(key: string, vars?: Record<string, string>): string {
  let text =
    translations[currentLocale]?.[key] ??
    translations['en']?.[key] ??
    key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\\\{\\\\{${k}\\\\}\\\\}`, 'g'), v);
    });
  }
  return text;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  document.documentElement.lang = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export type { Locale };
