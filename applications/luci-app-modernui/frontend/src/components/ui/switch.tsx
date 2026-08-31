import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  id,
}: SwitchProps) {
  const switchId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium leading-none',
                disabled
                  ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                  : 'cursor-pointer text-zinc-700 dark:text-zinc-300',
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
          )}
        </div>
      )}

      <SwitchPrimitive.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'peer inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full',
          'border-2 border-transparent outline-none',
          'transition-colors duration-150',
          'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          checked
            ? 'bg-indigo-600'
            : 'bg-zinc-200 dark:bg-zinc-700',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-150',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
