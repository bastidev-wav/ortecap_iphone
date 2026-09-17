import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

import { AppConfig } from '../../core/config/appConfig';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { LoadingView } from '../../shared/components/StateViews';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

/**
 * Abre el formulario de pago de Webpay Plus en un WebView. Transbank no
 * ofrece SDK nativo para apps — este es el patrón estándar en el mundo
 * móvil, igual que en la versión Flutter.
 */
export function AlumnoWebpayScreen() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const resultadoProcesado = useRef(false);

  React.useEffect(() => {
    AlumnoRepository.iniciarWebpay()
      .then((data) => setRedirectUrl(data.redirect_url as string))
      .catch((e) => setError(friendlyErrorMessage(e)));
  }, []);

  const procesarResultado = (url: string) => {
    if (resultadoProcesado.current) return;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }
    const status = parsed.searchParams.get('status');
    if (!status) return;

    resultadoProcesado.current = true;
    if (status === 'aprobado') {
      showToast('¡Pago aprobado! Tu cuenta ha sido activada.');
    } else {
      showToast('El pago no se completó. Puedes intentarlo nuevamente.', true);
    }
    router.replace('/alumno/dashboard');
  };

  const handleShouldStartLoad = (request: WebViewNavigation): boolean => {
    if (request.url.startsWith(`${AppConfig.webpayDeepLinkScheme}://`)) {
      procesarResultado(request.url);
      return false;
    }
    return true;
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {redirectUrl ? (
        <WebView
          source={{ uri: redirectUrl }}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onLoadEnd={({ nativeEvent }) => {
            setCargando(false);
            if (nativeEvent.url.includes('status=')) procesarResultado(nativeEvent.url);
          }}
        />
      ) : null}
      {cargando || !redirectUrl ? (
        <View style={styles.loadingOverlay}>
          <LoadingView message="Conectando con Webpay..." />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { textAlign: 'center', color: AppColors.textPrimary },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: AppColors.background },
});
