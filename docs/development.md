# ModernUI Developer Guide

## Prerequisites

- Node.js 22+
- npm 10+
- An OpenWrt router on your local network (for development proxy)

## Quick Start

```bash
# Install frontend dependencies
cd applications/luci-app-modernui/frontend
npm install

# Edit vite.config.ts to point to your router
# Change: target: 'http://192.168.1.1'

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

## Code Style Rules

1. **TypeScript strict mode** — no `any`, no `@ts-ignore`
2. **Function components + Hooks only** — no class components
3. **Tailwind CSS v4** — utility classes only, no inline styles
4. **i18n** — ALL user-facing strings via `t()` function in `i18n.ts`
5. **Error handling** — `toast.error()` on RPC failures, never uncaught exceptions
6. **Loading states** — `useState<boolean>` + spinner for async operations

## Adding a New RPC Function

1. Add the function to `modernui.uc` with input validation
2. Add the method to the ACL file `luci-app-modernui.json`
3. Add a typed wrapper method to `rpc.ts`
4. Add tests to `rpc.test.ts`
5. Add i18n strings to `i18n.ts`

## Adding a New Page

1. Create `src/pages/MyPage.tsx`
2. Add route to `App.tsx`
3. Add nav item to `Sidebar.tsx`
4. Add i18n keys to `i18n.ts` (both `zh` and `en`)
5. Run audit: `bash scripts/audit-compat-contract.sh`

## Building

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

## OpenWrt Package Build

Requires the OpenWrt SDK. See [Using the SDK](https://openwrt.org/docs/guide-developer/toolchain/using_the_sdk).

```bash
# From SDK root
make package/luci-app-modernui/compile V=s
```

## Project Structure

```
src/
├── i18n.ts          # All translations
├── rpc.ts           # Backend API client
├── App.tsx          # Router setup
├── main.tsx         # Entry point
├── components/
│   ├── ui/          # shadcn/ui base components
│   ├── layout/      # Sidebar, Header, LuciCompat
│   └── charts/      # Chart wrappers
├── pages/           # Route pages
├── hooks/           # Custom hooks
├── store/           # Zustand stores
└── lib/
    └── utils.ts     # Helpers
```
