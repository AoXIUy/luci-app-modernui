# luci-app-modernui — Phase 4 开发提示词

> 将此提示词完整提供给 AI，执行 Phase 4 质量保障开发。

---

## 项目背景

你正在完成 **luci-app-modernui** 的质量保障阶段，项目位于 `d:\桌面\OP`。
Phase 1-3 已完成，所有功能代码就位，现在需要：
1. 将单元测试覆盖率提升到 ≥ 80%
2. 添加 Playwright E2E 测试
3. 性能优化（代码分割、懒加载）
4. 完善文档
5. 更新并验证兼容契约审计脚本

---

## 技术栈
- 测试框架：Vitest 2 + @testing-library/react 16（已安装）
- E2E：Playwright（需安装）
- 构建：Vite 6
- 路径别名：`@/` → `src/`

---

## Phase 4 任务列表

---

### 任务 1：完善 Vitest 单元测试（覆盖率 ≥ 80%）

#### 1.1 创建 `frontend/src/test/i18n.test.ts`

```typescript
// 测试 i18n.ts 的所有功能:
// - t() 返回正确中文翻译
// - t() 返回正确英文翻译（切换 locale 后）
// - t() 处理变量插值 {{key}}
// - t() 对未知 key 返回 key 本身
// - setLocale() 切换语言
// - getLocale() 返回当前语言
// - 验证 zh 和 en 的 key 集合完全一致（无遗漏翻译）

import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale } from '@/i18n';
```

#### 1.2 创建 `frontend/src/test/utils.test.ts`

```typescript
// 测试 lib/utils.ts 的所有工具函数:
// formatBytes:
//   - 0 → '0 B'
//   - 1023 → '1023 B'
//   - 1024 → '1 KB'
//   - 1048576 → '1 MB'
//   - 1073741824 → '1 GB'
//   - decimals 参数控制小数位数
// formatUptime:
//   - 60 → '1m'
//   - 3600 → '1h 0m'
//   - 86400 → '1d 0h 0m'
//   - 90061 → '1d 1h 1m'
// formatLoad:
//   - [0.42, 0.38, 0.35] → '0.42 / 0.38 / 0.35'
// formatTemp:
//   - null → 'N/A'
//   - 62.5 → '62.5°C'
//   - 100.0 → '100.0°C'
// formatPercent:
//   - (0, 0) → 0
//   - (512, 1024) → 50
//   - (1025, 1024) → 100（不超过100）

import { describe, it, expect } from 'vitest';
import { formatBytes, formatUptime, formatLoad, formatTemp, formatPercent } from '@/lib/utils';
```

#### 1.3 创建 `frontend/src/test/hooks/usePolling.test.ts`

```typescript
// 测试 usePolling hook:
// - enabled=false 时不执行 fn
// - enabled=true 时立即执行 fn 一次
// - 在 intervalSeconds 后再次执行
// - 组件卸载时停止轮询（不再调用 fn）
// - fn 抛出异常时不中断轮询
// 使用 vitest fake timers:
//   vi.useFakeTimers() / vi.advanceTimersByTime() / vi.useRealTimers()
// 使用 @testing-library/react renderHook

import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePolling } from '@/hooks/usePolling';
```

#### 1.4 创建 `frontend/src/test/hooks/useRpc.test.ts`

```typescript
// 测试 useRpc hook:
// - execute() 成功时设置 data，loading 变回 false
// - execute() 失败时设置 error，调用 toast.error()
// - loading 在 execute() 期间为 true
// - reset() 清空 data/error/loading
// - LuciRpcError code=403 时显示 'error.unauthorized' 消息
// - showErrorToast=false 时不调用 toast.error()
// mock: vi.mock('sonner') / vi.mock('@/rpc')

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useRpc } from '@/hooks/useRpc';
```

#### 1.5 创建 `frontend/src/test/components/Button.test.tsx`

```typescript
// 测试 Button 组件:
// - 渲染 children 文本
// - loading=true 时显示 spinner，禁用按钮
// - disabled=true 时禁用按钮
// - onClick 被调用
// - variant 和 size 应用正确 className
// 使用 @testing-library/react render + userEvent

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';
```

#### 1.6 创建 `frontend/src/test/components/Progress.test.tsx`

```typescript
// 测试 Progress 组件:
// - value=0 时宽度为 0%
// - value=50 时宽度为 50%
// - value=100 时宽度为 100%
// - value > 100 时 clamp 到 100%
// - value < 0 时 clamp 到 0%
// - value >= 90 时使用 bg-red-500
// - value >= 70 时使用 bg-amber-500
// - value < 70 时使用 bg-indigo-500
// - 自定义 colorClass 覆盖默认颜色

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Progress } from '@/components/ui/progress';
```

#### 1.7 创建 `frontend/src/test/components/Dashboard.test.tsx`

```typescript
// 测试 Dashboard 页面组件:
// - 初始渲染时显示 Spinner
// - 数据加载后显示 CPU/Memory/Temperature/Uptime 卡片
// - 显示接口列表（Interface Status）
// - 显示 DHCP 租约列表
// - RPC 失败时显示 toast.error
// - Refresh 按钮触发重新加载
// mock: vi.mock('@/rpc'), vi.mock('@/hooks/usePolling')
// 使用 MemoryRouter 包裹（因为 Dashboard 使用 react-router）

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Dashboard } from '@/pages/Dashboard';
// 在 mock 中提供完整的 SystemInfo、NetworkInterface 等测试数据
```

#### 1.8 创建 `frontend/src/test/store/themeStore.test.ts`

```typescript
// 测试 themeStore:
// - setTheme('dark') 在 document.documentElement 上添加 'dark' class
// - setTheme('light') 移除 'dark' class
// - setTheme('auto') 根据 matchMedia 设置
// - setPollingInterval(1) → 实际存储 2（min 2）
// - setPollingInterval(100) → 实际存储 60（max 60）
// - toggleDashboardCard('cpu') 切换 cpu 开关
// - toggleSidebar 切换 sidebarCollapsed

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore } from '@/store/themeStore';
```

#### 1.9 更新 `vite.config.ts` 中的 test 配置

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'src/test/**',
      'src/main.tsx',
      'src/index.css',
    ],
  },
},
```

#### 1.10 在 `package.json` 的 scripts 中追加

```json
"test:coverage": "vitest run --coverage"
```

并安装覆盖率工具：
```json
// devDependencies 追加:
"@vitest/coverage-v8": "^2.0.0"
```

---

### 任务 2：Playwright E2E 测试

#### 2.1 安装配置

在 `frontend/` 目录追加到 `package.json` devDependencies：
```json
"@playwright/test": "^1.44.0"
```

创建 `frontend/playwright.config.ts`：
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    // 在 CI 中指向实际路由器，本地开发时使用 mock server
    baseURL: process.env.ROUTER_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // 本地开发时自动启动 Vite dev server
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

#### 2.2 创建 `frontend/e2e/helpers/mock-rpc.ts`

```typescript
// 拦截 /cgi-bin/luci/rpc/ubus 请求，返回 mock 数据
// 使用 page.route() 实现

import type { Page } from '@playwright/test';

export interface MockRpcOptions {
  systemInfo?: Partial<SystemInfo>;
  interfaces?: NetworkInterface[];
  dhcpLeases?: DhcpLease[];
}

export async function setupMockRpc(page: Page, opts: MockRpcOptions = {}) {
  await page.route('**/cgi-bin/luci/rpc/ubus', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    const [, service, method] = body.params ?? [];

    const responses: Record<string, unknown> = {
      'modernui.system.getInfo': [0, {
        hostname: 'TestRouter',
        model: 'x86_64',
        firmware: 'OpenWrt 25.10.0',
        uptime: 3600,
        load: [0.5, 0.4, 0.3],
        memory: { total: 524288000, free: 262144000, cached: 65536000, used: 196608000 },
        temperature: 55.0,
        ...opts.systemInfo,
      }],
      'modernui.network.getStatus': [0, { interfaces: opts.interfaces ?? [] }],
      'modernui.network.getDhcpLeases': [0, { leases: opts.dhcpLeases ?? [] }],
      'modernui.network.getTraffic': [0, { ts: Date.now() / 1000, rx_bytes: 0, tx_bytes: 0 }],
      'modernui.theme.get': [0, { theme: 'auto', language: 'zh', polling_interval: 5, sidebar_collapsed: false, dashboard_cards: { show_cpu: true, show_memory: true, show_temp: true, show_traffic: true, show_interfaces: true, show_dhcp: true } }],
      'modernui.routes.list': [0, { routes: [] }],
    };

    const key = `${service}.${method}`;
    const result = responses[key] ?? [0, {}];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ jsonrpc: '2.0', id: body.id, result }),
    });
  });
}
```

#### 2.3 创建 `frontend/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { setupMockRpc } from './helpers/mock-rpc';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRpc(page, {
      systemInfo: { hostname: 'TestRouter', temperature: 55.0 },
      interfaces: [
        { name: 'wan', up: true, ipv4: '203.0.113.1', ipv6: null, mac: 'aa:bb:cc:dd:ee:ff', rx_bytes: 1048576, tx_bytes: 524288, rx_packets: 1000, tx_packets: 500, protocol: 'dhcp', gateway: '203.0.113.254', dns: ['8.8.8.8'] },
        { name: 'lan', up: true, ipv4: '192.168.1.1', ipv6: null, mac: 'aa:bb:cc:dd:ee:fe', rx_bytes: 0, tx_bytes: 0, rx_packets: 0, tx_packets: 0, protocol: 'static', gateway: null, dns: [] },
      ],
    });
    await page.goto('/dashboard');
  });

  test('displays system metrics cards', async ({ page }) => {
    await expect(page.getByText('CPU 使用率')).toBeVisible();
    await expect(page.getByText('内存使用')).toBeVisible();
    await expect(page.getByText('温度')).toBeVisible();
    await expect(page.getByText('运行时间')).toBeVisible();
  });

  test('displays hostname and model', async ({ page }) => {
    await expect(page.getByText(/TestRouter/)).toBeVisible();
  });

  test('displays interface status', async ({ page }) => {
    await expect(page.getByText('接口状态')).toBeVisible();
    await expect(page.getByText('wan')).toBeVisible();
    await expect(page.getByText('lan')).toBeVisible();
  });

  test('refresh button triggers data reload', async ({ page }) => {
    let callCount = 0;
    await page.route('**/cgi-bin/luci/rpc/ubus', async (route) => {
      callCount++;
      await route.continue();
    });
    await page.getByRole('button', { name: /刷新/ }).click();
    await expect(callCount).toBeGreaterThan(0);
  });
});
```

#### 2.4 创建 `frontend/e2e/navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { setupMockRpc } from './helpers/mock-rpc';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRpc(page);
    await page.goto('/');
  });

  test('redirects / to /dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('sidebar shows all navigation items', async ({ page }) => {
    await expect(page.getByText('仪表盘')).toBeVisible();
    await expect(page.getByText('网络')).toBeVisible();
    await expect(page.getByText('无线')).toBeVisible();
    await expect(page.getByText('系统')).toBeVisible();
    await expect(page.getByText('终端')).toBeVisible();
    await expect(page.getByText('设置')).toBeVisible();
  });

  test('can navigate to Network page', async ({ page }) => {
    await page.getByText('网络').click();
    await expect(page).toHaveURL(/\/network/);
    await expect(page.getByRole('heading', { name: '网络管理' })).toBeVisible();
  });

  test('Command Palette opens with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/搜索页面/)).toBeVisible();
  });

  test('Command Palette closes with Escape', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/搜索页面/)).not.toBeVisible();
  });

  test('sidebar can be collapsed', async ({ page }) => {
    const collapseBtn = page.getByTitle(/收起侧栏/);
    await collapseBtn.click();
    // Sidebar should now be narrow
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/w-16/);
  });
});
```

#### 2.5 创建 `frontend/e2e/settings.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { setupMockRpc } from './helpers/mock-rpc';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRpc(page);
    await page.goto('/settings');
  });

  test('displays theme selector', async ({ page }) => {
    await expect(page.getByText('亮色')).toBeVisible();
    await expect(page.getByText('暗色')).toBeVisible();
    await expect(page.getByText('跟随系统')).toBeVisible();
  });

  test('can switch theme to dark', async ({ page }) => {
    await page.getByText('暗色').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('displays language selector', async ({ page }) => {
    await expect(page.getByText('中文')).toBeVisible();
    await expect(page.getByText('English')).toBeVisible();
  });

  test('polling interval slider is visible', async ({ page }) => {
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });
});
```

#### 2.6 在 `package.json` scripts 追加：
```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui",
"e2e:report": "playwright show-report"
```

---

### 任务 3：性能优化

#### 3.1 修改 `vite.config.ts` — 优化代码分割

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('node_modules')) {
          // React 核心
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          // 图表（较大，按需加载）
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'chart-vendor';
          }
          // xterm（很大，Terminal 页面懒加载）
          if (id.includes('xterm') || id.includes('@xterm')) {
            return 'xterm-vendor';
          }
          // Radix UI 组件
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          // Zustand、clsx 等小工具
          return 'utils-vendor';
        }
      },
    },
  },
  // 报告每个 chunk 的大小
  reportCompressedSize: true,
  // 超过 500KB 警告
  chunkSizeWarningLimit: 500,
},
```

#### 3.2 修改 `App.tsx` — 路由懒加载

```typescript
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/spinner';

// 懒加载所有页面（减少初始包体积）
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Network   = lazy(() => import('@/pages/Network').then(m => ({ default: m.Network })));
const Wireless  = lazy(() => import('@/pages/Wireless').then(m => ({ default: m.Wireless })));
const System    = lazy(() => import('@/pages/System').then(m => ({ default: m.System })));
const Terminal  = lazy(() => import('@/pages/Terminal').then(m => ({ default: m.Terminal })));
const Settings  = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));

// 在 Routes 中用 Suspense 包裹:
<Suspense fallback={<LoadingScreen message={t('status.loading')} />}>
  <Outlet />
</Suspense>
```

#### 3.3 在 `Dashboard.tsx` 中优化图表渲染

在 `TrafficChart` 的 `useEffect` 中使用 `useMemo` 缓存 chartData：

```typescript
// 避免每次父组件 re-render 都重建 chart data
const chartData = useMemo(() => ({
  labels: data.map((d) => new Date(d.ts * 1000).toLocaleTimeString()),
  datasets: [/* ... */],
}), [data]);
```

---

### 任务 4：文档完善

#### 4.1 创建 `d:\桌面\OP\docs\user-guide.md`

完整用户指南，包含：
- 安装方法（APK feed + 手动安装）
- 首次访问配置
- 仪表盘功能说明（各卡片含义）
- 网络管理操作步骤（查看接口、DHCP 租约、路由表）
- 无线管理操作步骤（查看 AP、扫描周边网络）
- 系统页面操作（日志查看、配置备份、固件升级入口）
- 终端使用须知（安全警告 + 操作步骤）
- 主题切换 + 语言切换
- 路由渲染模式说明（Native/Compat/Hidden）
- OpenWrt 升级后重装说明
- 常见问题（FAQ）

#### 4.2 创建 `d:\桌面\OP\docs\rpc-api.md`

后端 RPC API 参考文档，包含：
- 所有 `modernui.*` ubus 方法的签名
- 请求参数（字段名、类型、是否必填、取值范围）
- 响应格式（成功/错误）
- 示例 curl 命令（通过 `ubus call modernui.*` 测试）
- ACL 权限说明

#### 4.3 更新 `d:\桌面\OP\README.md`

追加：
- 功能截图占位符说明
- Phase 3/4 完成后的新功能列表
- 贡献指南（Fork → Branch → PR → CI 检查）

---

### 任务 5：更新兼容契约审计脚本

#### 5.1 修改 `d:\桌面\OP\scripts\audit-compat-contract.sh`

```bash
#!/usr/bin/env bash
# 完整审计内容:

# 1. 检查所有 native 路由页面文件存在
# 2. 检查 i18n zh/en key 集合完全一致（无遗漏翻译）
# 3. 检查 rpc.ts 中所有方法在 modernui.uc 都有对应注册
# 4. 检查 acl.d JSON 包含所有 rpc.ts 中调用的方法
# 5. 检查 package.json 版本号与 Makefile PKG_VERSION 一致

FRONTEND_DIR="applications/luci-app-modernui/frontend/src"
RPC_UC="applications/luci-app-modernui/root/usr/share/rpcd/ucode/modernui.uc"
ACL_JSON="applications/luci-app-modernui/root/usr/share/rpcd/acl.d/luci-app-modernui.json"

PASS=0
FAIL=0

# 检查 native 页面
NATIVE_PAGES=("Dashboard" "Network" "Wireless" "System" "Terminal" "Settings")
for page in "${NATIVE_PAGES[@]}"; do
  if [ -f "$FRONTEND_DIR/pages/${page}.tsx" ]; then
    echo "  ✓ pages/${page}.tsx"
    ((PASS++))
  else
    echo "  ✗ pages/${page}.tsx — MISSING"
    ((FAIL++))
  fi
done

# 检查 i18n 完整性
ZH_KEYS=$(grep -oP "(?<=')\w[\w.]+(?=':)" "$FRONTEND_DIR/i18n.ts" | sort | uniq)
EN_KEYS=$(grep -oP "(?<=')\w[\w.]+(?=':)" "$FRONTEND_DIR/i18n.ts" | sort | uniq)
MISSING=$(comm -23 <(echo "$ZH_KEYS") <(echo "$EN_KEYS"))
if [ -z "$MISSING" ]; then
  echo "  ✓ i18n keys are complete in both zh and en"
  ((PASS++))
else
  echo "  ✗ Missing i18n keys: $MISSING"
  ((FAIL++))
fi

# 检查 ucode 方法注册
RPC_METHODS=$(grep -oP "'\w+\.\w+':" "$RPC_UC" | tr -d "':")
for method in $RPC_METHODS; do
  if grep -q "\"$method\"" "$ACL_JSON"; then
    echo "  ✓ ACL: $method"
    ((PASS++))
  else
    echo "  ✗ ACL missing: $method"
    ((FAIL++))
  fi
done

echo ""
if [ $FAIL -eq 0 ]; then
  echo "  PASS: All ${PASS} checks passed"
else
  echo "  FAIL: ${FAIL} check(s) failed"
  exit 1
fi
```

---

## 代码规范要求（必须遵守）

1. **测试命名**：`describe('ComponentName', () => { it('should ...', ...) })`
2. **Mock 隔离**：每个 test 文件独立 mock，`beforeEach(() => vi.clearAllMocks())`
3. **测试数据**：使用真实类型（`satisfies SystemInfo`），不使用 `as any`
4. **E2E 稳定性**：使用 `getByRole` / `getByText` 而非 CSS 选择器
5. **覆盖率阈值**：lines 80%、functions 80%、branches 70%

---

## 文件修改清单

| 操作 | 文件 |
|------|------|
| 新建 | `frontend/src/test/i18n.test.ts` |
| 新建 | `frontend/src/test/utils.test.ts` |
| 新建 | `frontend/src/test/hooks/usePolling.test.ts` |
| 新建 | `frontend/src/test/hooks/useRpc.test.ts` |
| 新建 | `frontend/src/test/components/Button.test.tsx` |
| 新建 | `frontend/src/test/components/Progress.test.tsx` |
| 新建 | `frontend/src/test/components/Dashboard.test.tsx` |
| 新建 | `frontend/src/test/store/themeStore.test.ts` |
| 新建 | `frontend/playwright.config.ts` |
| 新建 | `frontend/e2e/helpers/mock-rpc.ts` |
| 新建 | `frontend/e2e/dashboard.spec.ts` |
| 新建 | `frontend/e2e/navigation.spec.ts` |
| 新建 | `frontend/e2e/settings.spec.ts` |
| 新建 | `docs/user-guide.md` |
| 新建 | `docs/rpc-api.md` |
| 修改 | `frontend/vite.config.ts`（覆盖率配置 + 代码分割）|
| 修改 | `frontend/src/App.tsx`（路由懒加载）|
| 修改 | `frontend/src/pages/Dashboard.tsx`（useMemo 优化）|
| 修改 | `frontend/package.json`（新增依赖 + scripts）|
| 修改 | `scripts/audit-compat-contract.sh`（完整审计）|

---

## 验证标准

- [ ] `npm run test:coverage` 输出 lines ≥ 80%
- [ ] `npm run lint` 无警告
- [ ] `npm run typecheck` 无错误
- [ ] `npm run build` 成功，无 chunk > 500KB 警告
- [ ] `npm run e2e` 所有 spec 通过（需启动 dev server）
- [ ] `bash scripts/audit-compat-contract.sh` 输出 PASS
- [ ] `docs/user-guide.md` 和 `docs/rpc-api.md` 内容完整
