import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { LuciRpcError } from '@/rpc';
import { t } from '@/i18n';

interface UseRpcResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useRpc<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (err: string) => void;
    showErrorToast?: boolean;
    showSuccessToast?: string;
  },
): UseRpcResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
        options?.onSuccess?.(result);
        if (options?.showSuccessToast) {
          toast.success(options.showSuccessToast);
        }
        return result;
      } catch (e) {
        const msg =
          e instanceof LuciRpcError
            ? e.code === 403
              ? t('error.unauthorized')
              : e.message || t('error.rpc_failed')
            : t('error.rpc_failed');
        setError(msg);
        options?.onError?.(msg);
        if (options?.showErrorToast !== false) {
          toast.error(msg);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fn, options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
