import { create } from 'zustand';
import type { RouteEntry } from '@/rpc';

interface RouteStoreState {
  routes: RouteEntry[];
  loading: boolean;
  error: string | null;
  setRoutes: (routes: RouteEntry[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useRouteStore = create<RouteStoreState>()((set) => ({
  routes: [],
  loading: false,
  error: null,
  setRoutes: (routes) => set({ routes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
