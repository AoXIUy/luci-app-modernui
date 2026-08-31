import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Network } from '@/pages/Network';
import { Wireless } from '@/pages/Wireless';
import { System } from '@/pages/System';
import { Terminal } from '@/pages/Terminal';
import { Settings } from '@/pages/Settings';

export function App() {
  // Base path: /cgi-bin/luci/admin/modernui
  // In dev mode, vite serves from root
  const basePath = window.location.pathname.includes('/cgi-bin/luci')
    ? '/cgi-bin/luci/admin/modernui'
    : '/';

  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="network/*" element={<Network />} />
          <Route path="wireless/*" element={<Wireless />} />
          <Route path="system/*" element={<System />} />
          <Route path="terminal" element={<Terminal />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
