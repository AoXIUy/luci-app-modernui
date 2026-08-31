import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400',
        sizes[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      )}
    </div>
  );
}
