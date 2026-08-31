import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar — hidden on mobile (<md), visible on desktop (md+) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header includes MobileDrawer trigger on small screens */}
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'font-sans text-sm',
          },
        }}
      />
    </div>
  );
}
