import React from 'react';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { ErrorView, LoadingView } from './StateViews';

interface AsyncGateProps<T> {
  loading: boolean;
  error: unknown;
  data: T | undefined;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
}

/**
 * Envuelve el resultado de useApiQuery y muestra automáticamente
 * LoadingView / ErrorView / los datos. Equivalente a AsyncValueWidget de
 * la app Flutter.
 */
export function AsyncGate<T>({ loading, error, data, onRetry, children }: AsyncGateProps<T>) {
  if (loading && data === undefined) return <LoadingView />;
  if (error) return <ErrorView message={friendlyErrorMessage(error)} onRetry={onRetry} />;
  if (data === undefined) return <LoadingView />;
  return <>{children(data)}</>;
}
