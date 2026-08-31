import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export function formatLoad(load: [number, number, number]): string {
  return load.map((v) => v.toFixed(2)).join(' / ');
}

export function formatTemp(celsius: number | null): string {
  if (celsius === null) return 'N/A';
  return `${celsius.toFixed(1)}°C`;
}

export function formatPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function ipClass(ip: string | null): 'wan' | 'lan' | 'unknown' {
  if (!ip) return 'unknown';
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return 'lan';
  return 'wan';
}
