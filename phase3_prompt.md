# luci-app-modernui — Phase 3 开发提示词

> 将此提示词完整提供给 AI，执行 Phase 3 高级功能开发。

---

## 项目背景

你正在开发 **luci-app-modernui**，一个 OpenWrt 25.10 的现代化 LuCI UI 插件。
Phase 1（基础框架）和 Phase 2（核心功能）已完成，项目位于 `d:\桌面\OP`。

### 技术栈（已确立，不可更改）
- 前端：React 19 + Vite 6 + TypeScript strict + Tailwind CSS v4
- 组件：shadcn/ui 本地组件（已在 `src/components/ui/`）
- 状态：Zustand 5（`src/store/themeStore.ts`、`src/store/routeStore.ts`）
- RPC：`src/rpc.ts`（LuCI JSON-RPC 2.0，`rpc.call(service, method, args)`）
- i18n：`src/i18n.ts`，所有用户字符串必须通过 `t()` 函数
- 错误：失败时 `toast.error(t('error.rpc_failed'))`，不抛出未捕获异常
- 加载：`useState<boolean>` + `<Spinner>` 组件

### 现有目录结构
```
d:\桌面\OP\
├── applications/luci-app-modernui/
│   ├── Makefile
│   ├── frontend/src/
│   │   ├── i18n.ts              ← 在此追加翻译
│   │   ├── rpc.ts               ← 在此追加 RPC 方法
│   │   ├── components/ui/       ← button/card/badge/spinner/progress
│   │   ├── components/layout/   ← AppLayout/Sidebar/Header/LuciCompat/CommandPalette
│   │   ├── components/charts/   ← TrafficChart
│   │   ├── pages/               ← Dashboard/Network/Wireless/System/Terminal/Settings
│   │   ├── hooks/               ← useRpc/usePolling/useTheme
│   │   └── store/               ← themeStore/routeStore
│   └── root/usr/share/rpcd/ucode/modernui.uc  ← 后端 RPC
├── themes/luci-theme-modernui/
└── utils/modernui-console/src/  ← 待创建 C 守护进程
```

---

## Phase 3 任务列表

---

### 任务 1：modernui-console C 守护进程

**目标**：实现安全的 PTY 会话守护进程，使 Terminal 页面可以真正工作。

#### 1.1 创建 `d:\桌面\OP\utils\modernui-console\src\main.c`

完整实现以下功能：
- 监听 UNIX Domain Socket：`/var/run/modernui-console.sock`
- socket 权限设置为 `0600`（仅 root 可访问）
- 支持多个 PTY 会话（最多 5 个并发）
- 每个会话有唯一 `session_id`（UUID v4 格式）和 `token`（32 字节随机 hex）
- 协议：换行符分隔的 JSON 消息

```c
// 支持的请求类型（通过 UNIX socket 接收）:
// {"action":"create"}
//   → {"session_id":"<uuid>","token":"<32hex>","pid":<int>}
//
// {"action":"input","session_id":"<>","token":"<>","data":"<base64>"}
//   → {"output":"<base64>","ok":true}
//
// {"action":"resize","session_id":"<>","token":"<>","cols":<>,"rows":<>}
//   → {"ok":true}
//
// {"action":"destroy","session_id":"<>","token":"<>"}
//   → {"ok":true}
//
// 错误响应格式:
// {"error":"<message>","ok":false}
```

关键实现要求：
- 使用 `forkpty()` 创建 PTY，执行 `/bin/sh`（或 `/bin/ash` 在 OpenWrt 上）
- session 空闲超过 300 秒自动销毁
- token 验证：每次 input/resize/destroy 必须校验 token 匹配 session_id
- 非阻塞 I/O，使用 `select()` 或 `epoll()` 多路复用
- 守护进程化（`daemon(1, 0)`）
- 写 PID 文件到 `/var/run/modernui-console.pid`
- 信号处理：`SIGTERM`/`SIGINT` 优雅退出，`SIGCHLD` 回收子进程

#### 1.2 创建 `d:\桌面\OP\utils\modernui-console\src\pty.c` 和 `pty.h`

```c
// pty.h 定义:
typedef struct {
    char session_id[37];    // UUID 格式
    char token[65];         // 32字节 hex + null
    int  master_fd;         // PTY master
    pid_t child_pid;
    time_t last_active;
    int cols;
    int rows;
} PtySession;

// 函数:
PtySession* pty_create(void);
int pty_input(PtySession* s, const char* data, size_t len);
ssize_t pty_read(PtySession* s, char* buf, size_t buflen);
int pty_resize(PtySession* s, int cols, int rows);
void pty_destroy(PtySession* s);
void pty_generate_uuid(char out[37]);
void pty_generate_token(char out[65]);
```

#### 1.3 创建 `d:\桌面\OP\utils\modernui-console\Makefile`

```makefile
include $(TOPDIR)/rules.mk

PKG_NAME:=modernui-console
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/modernui-console
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=ModernUI Console PTY Daemon
  DEPENDS:=+libc
endef

define Package/modernui-console/description
  Secure PTY session daemon for ModernUI web terminal.
  Manages shell sessions behind a root-only UNIX socket.
endef

define Build/Compile
	$(TARGET_CC) $(TARGET_CFLAGS) \
		-o $(PKG_BUILD_DIR)/modernui-console \
		$(PKG_BUILD_DIR)/src/main.c \
		$(PKG_BUILD_DIR)/src/pty.c \
		-lutil
endef

define Package/modernui-console/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/modernui-console $(1)/usr/sbin/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/modernui-console.init $(1)/etc/init.d/modernui-console
endef

$(eval $(call BuildPackage,modernui-console))
```

#### 1.4 创建 `d:\桌面\OP\utils\modernui-console\files\modernui-console.init`

```sh
#!/bin/sh /etc/rc.common
USE_PROCD=1
START=95
STOP=05

start_service() {
    procd_open_instance
    procd_set_param command /usr/sbin/modernui-console
    procd_set_param respawn 3600 5 5
    procd_set_param pidfile /var/run/modernui-console.pid
    procd_set_param stdout 0
    procd_set_param stderr 0
    procd_close_instance
}
```

#### 1.5 更新 `modernui.uc` 中 console.* 方法

将三个 console 占位方法替换为实际实现，通过 UNIX socket 与守护进程通信：

```javascript
// console.create 实际实现
'console.create': {
  call: function(request) {
    // 连接到 /var/run/modernui-console.sock
    // 发送 {"action":"create"}
    // 返回 {session_id, token}
    // 如果 socket 不存在，返回 {error: "Console daemon not running"}
  }
}
// console.input / console.destroy 同理
```

在 `ucode` 中使用 `socket` 模块连接 UNIX socket：
```javascript
import { AF_UNIX, SOCK_STREAM, connect, socket } from 'socket';
```

#### 1.6 更新 `d:\桌面\OP\applications\luci-app-modernui\frontend\src\pages\Terminal.tsx`

将现有的轮询模式改为更流畅的实现：
- 连接后立即开始 100ms 间隔轮询 `rpc.sendConsoleInput()` 读取输出
- 用户输入通过 `term.onData()` 发送
- 实现 `xterm.js` resize 监听，调用 `rpc.call('modernui', 'console.resize', {session_id, token, cols, rows})`
- 断线重连按钮

在 `rpc.ts` 中新增：
```typescript
async resizeConsole(session_id: string, token: string, cols: number, rows: number): Promise<{success: boolean}>;
```

在 `modernui.uc` 中新增：
```javascript
'console.resize': {
  call: function(request) { /* forward to daemon */ },
  args: { session_id: '', token: '', cols: 80, rows: 24 }
}
```

在 `i18n.ts` 中追加（zh 和 en 均需添加）：
```
'terminal.resize': '调整终端大小'
'terminal.session_expired': '会话已过期，请重新连接'
'terminal.max_sessions': '已达最大会话数限制'
```

---

### 任务 2：移动端响应式 — Mobile Drawer

**目标**：在小屏幕（< 768px）上，侧边栏变为滑入式 Drawer，而非固定在左侧。

#### 2.1 创建 `d:\桌面\OP\applications\luci-app-modernui\frontend\src\components\layout\MobileDrawer.tsx`

```typescript
// 实现要求:
// - 覆盖整个视口的半透明遮罩（点击关闭）
// - 侧边栏从左侧滑入（translate-x 动画，duration-300）
// - 包含与 Sidebar 相同的导航项目
// - 顶部有关闭按钮（X 图标）
// - 使用 React Portal 渲染到 document.body
// - 打开时禁止 body 滚动（overflow-hidden）

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}
```

#### 2.2 修改 `Header.tsx`

- 在移动端（md:hidden）显示汉堡菜单按钮（`Menu` 图标）
- 点击打开 MobileDrawer
- 使用 `useState` 控制 drawerOpen

#### 2.3 修改 `AppLayout.tsx`

```typescript
// 在 md 以下隐藏固定 Sidebar，显示 MobileDrawer
// 在 md 及以上显示固定 Sidebar，隐藏 MobileDrawer 触发器
```

#### 2.4 更新 `i18n.ts` 追加：
```
'nav.open_menu': '打开菜单' / 'Open menu'
'nav.close_menu': '关闭菜单' / 'Close menu'
```

---

### 任务 3：Settings — 路由渲染模式管理面板

**目标**：在 Settings 页面增加一个面板，列出所有发现的 LuCI 路由，可逐条切换 Native/Compat/Hidden 模式。

#### 3.1 修改 `d:\桌面\OP\applications\luci-app-modernui\frontend\src\pages\Settings.tsx`

在现有内容下方追加 `RouteModesPanel` 组件（可放在同文件或独立文件）：

```typescript
// RouteModesPanel 实现要求:
// - 页面挂载时调用 rpc.listRoutes() 获取路由列表
// - 显示为表格：路径 | 标题 | 当前模式 | 操作
// - 每行有三个按钮: [Native] [Compat] [Hidden]
//   - 当前模式按钮高亮（indigo 背景）
//   - 点击后调用 rpc.setRouteMode(path, mode)
//   - 切换时显示 loading 状态（该行 spinner）
//   - 成功后 toast.success(t('settings.route_mode_saved'))
//   - 失败后 toast.error(t('error.rpc_failed'))
// - 顶部有"刷新"按钮重新发现路由
// - 支持按标题/路径搜索过滤（input 输入框）

interface RouteRow {
  path: string;
  title: string;
  mode: RouteMode;  // 'native' | 'compat' | 'hidden'
  order: number;
}
```

#### 3.2 在 `i18n.ts` 追加：
```
// zh:
'settings.route_modes_title': '路由渲染模式'
'settings.route_modes_desc': '控制每个 LuCI 路由的渲染方式。Native 使用 React 原生屏，Compat 使用 LuCI 原始页面，Hidden 隐藏该路由。'
'settings.route_search': '搜索路由...'
'settings.route_mode_saved': '路由模式已保存'
'settings.route_path': '路由路径'
'settings.route_title': '标题'
'settings.route_mode': '渲染模式'
'settings.route_action': '操作'
'settings.no_routes': '未发现任何路由'

// en: (对应英文)
```

---

### 任务 4：Dashboard — 卡片显示/隐藏开关

**目标**：在 Settings 页面的"Dashboard Cards"部分，实现开关切换仪表盘各卡片的显示。

#### 4.1 修改 `Settings.tsx`

追加 `DashboardCardsPanel`：

```typescript
// 实现要求:
// - 显示 6 个开关（Switch UI 组件）:
//   CPU 使用率 | 内存使用 | 温度 | 网络流量 | 接口状态 | DHCP 客户端
// - 使用 useThemeStore().toggleDashboardCard(card) 切换
// - themeStore 已有 dashboardCards 状态和 toggleDashboardCard action
// - 切换立即生效（乐观更新），无需保存按钮
// - 同步调用 rpc.setThemeConfig({ dashboard_cards: ... }) 持久化到路由器

// 需要新建 Switch UI 组件
```

#### 4.2 创建 `d:\桌面\OP\applications\luci-app-modernui\frontend\src\components\ui\switch.tsx`

```typescript
// 基于 @radix-ui/react-switch 封装
// 样式: 选中时 bg-indigo-600，未选中时 bg-zinc-200 dark:bg-zinc-700
// 动画: translate-x 过渡，duration-150

import * as SwitchPrimitive from '@radix-ui/react-switch';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}
```

#### 4.3 在 `i18n.ts` 追加：
```
'settings.dashboard_cards_title': '仪表盘卡片' / 'Dashboard Cards'
'settings.card_cpu': 'CPU 使用率' / 'CPU Usage'
'settings.card_memory': '内存使用' / 'Memory'
'settings.card_temp': '温度' / 'Temperature'
'settings.card_traffic': '网络流量' / 'Network Traffic'
'settings.card_interfaces': '接口状态' / 'Interfaces'
'settings.card_dhcp': 'DHCP 客户端' / 'DHCP Clients'
```

---

## 代码规范要求（必须遵守）

1. **TypeScript strict**：无 `any`，无 `@ts-ignore`，无 `// eslint-disable`
2. **函数组件 + Hooks**：无 class 组件
3. **Tailwind CSS v4**：无内联 style（动画除外），无自定义 CSS
4. **i18n**：所有用户字符串通过 `t()`，中英文同步添加
5. **错误处理**：`toast.error()` 捕获所有 RPC 异常
6. **加载状态**：每个异步操作必须有 loading spinner
7. **RPC 新函数**：在 `modernui.uc` 注册 + `acl.d/luci-app-modernui.json` 授权 + `rpc.ts` 类型化封装
8. **提交前执行**：`npm run lint && npm run typecheck && npm run test`

---

## 文件修改清单

| 操作 | 文件 |
|------|------|
| 新建 | `utils/modernui-console/src/main.c` |
| 新建 | `utils/modernui-console/src/pty.c` |
| 新建 | `utils/modernui-console/src/pty.h` |
| 新建 | `utils/modernui-console/Makefile` |
| 新建 | `utils/modernui-console/files/modernui-console.init` |
| 新建 | `frontend/src/components/layout/MobileDrawer.tsx` |
| 新建 | `frontend/src/components/ui/switch.tsx` |
| 修改 | `frontend/src/pages/Terminal.tsx`（真实 PTY 集成）|
| 修改 | `frontend/src/pages/Settings.tsx`（路由模式面板 + Dashboard 卡片面板）|
| 修改 | `frontend/src/components/layout/Header.tsx`（移动端汉堡菜单）|
| 修改 | `frontend/src/components/layout/AppLayout.tsx`（移动端布局）|
| 修改 | `frontend/src/rpc.ts`（追加 resizeConsole）|
| 修改 | `frontend/src/i18n.ts`（追加所有新增翻译）|
| 修改 | `root/usr/share/rpcd/ucode/modernui.uc`（console.* 实际实现 + console.resize）|
| 修改 | `root/usr/share/rpcd/acl.d/luci-app-modernui.json`（追加 console.resize 权限）|

---

## 验证标准

- [ ] `npm run lint` 无错误
- [ ] `npm run typecheck` 无错误  
- [ ] `npm run test` 无失败
- [ ] Terminal 页面能显示连接按钮并与 modernui-console 通信
- [ ] 移动端（< 768px）侧边栏变为 Drawer 模式
- [ ] Settings 页面显示路由列表，可切换模式
- [ ] Settings 页面 Dashboard 卡片开关即时生效
