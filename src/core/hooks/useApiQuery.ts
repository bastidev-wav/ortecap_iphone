import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiException } from '../api/apiTypes';

/** Convierte cualquier error capturado en un mensaje entendible para pantalla. */
export function friendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiException) return error.message;
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}

interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Reemplaza el patrón `FutureProvider` de Riverpod: ejecuta [fetcher] al
 * montar (y cada vez que cambian [deps]), exponiendo loading/error/data
 * como en AsyncValueWidget. Usar junto a <AsyncGate />.
 */
export function useApiQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, refetch };
}
