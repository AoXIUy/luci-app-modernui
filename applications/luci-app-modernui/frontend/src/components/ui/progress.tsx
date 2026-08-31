import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  colorClass?: string;
}

export function Progress({ value, className, colorClass, ...props }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color = colorClass ??
    (clampedValue >= 90 ? 'bg-red-500' :
     clampedValue >= 70 ? 'bg-amber-500' :
     'bg-indigo-500');
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800', className)}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
