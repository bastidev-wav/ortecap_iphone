import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Vuelve a cargar los datos cuando la pantalla recupera el foco (al volver de un detalle o
 * formulario). La primera vez no hace nada: useApiQuery ya cargó al montar.
 */
export function useRefetchOnFocus(refetch: () => void) {
  const primera = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primera.current) {
        primera.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
