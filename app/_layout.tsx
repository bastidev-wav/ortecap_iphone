import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreenNative from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppRole } from '../src/core/auth/types';
import { useAuthStore } from '../src/core/auth/authStore';
import { PushNotificationService } from '../src/core/notifications/pushNotificationService';
import { AppColors } from '../src/core/theme/colors';
import { SplashScreen } from '../src/features/auth/SplashScreen';
import { sincronizarRecordatoriosDesdeServidor } from '../src/features/recordatorios/sincronizar';
import { ToastHost } from '../src/shared/components/Toast';

SplashScreenNative.preventAutoHideAsync().catch(() => {});

// Rutas accesibles por cualquier usuario autenticado, sin importar su rol.
const RUTAS_COMUNES = ['cambiar-password', 'soporte'];
// Rutas accesibles sin sesión.
const RUTAS_PUBLICAS = ['login', 'soporte'];

function homeFor(role: AppRole): string {
  switch (role) {
    case 'admin':
    case 'secretaria':
    case 'inspector':
      return '/admin/dashboard';
    case 'instructor':
      return '/instructor/dashboard';
    case 'alumno':
      return '/alumno/dashboard';
  }
}

function pathPermitidoPara(role: AppRole, primerSegmento: string | undefined): boolean {
  if (primerSegmento && RUTAS_COMUNES.includes(primerSegmento)) return true;
  switch (role) {
    case 'admin':
    case 'secretaria':
    case 'inspector':
      return primerSegmento === 'admin';
    case 'instructor':
      return primerSegmento === 'instructor';
    case 'alumno':
      return primerSegmento === 'alumno';
  }
}

/**
 * Guard de navegación equivalente al redirect() de go_router en la app
 * Flutter: decide a qué ruta llevar al usuario según AuthStatus y la
 * sección actual, cada vez que cualquiera de los dos cambia.
 */
function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    if (status === 'unknown') return;

    const segmentList = segments as readonly string[];
    const primerSegmento = segmentList[0] as string | undefined;

    if (status === 'unauthenticated') {
      if (!primerSegmento || !RUTAS_PUBLICAS.includes(primerSegmento)) router.replace('/login');
      return;
    }

    if (status === 'requiresTwoFactor') {
      if (!(primerSegmento === 'login' && segmentList[1] === 'verify-2fa')) {
        router.replace('/login/verify-2fa');
      }
      return;
    }

    // authenticated
    if (!user) {
      router.replace('/login');
      return;
    }
    if (primerSegmento === 'login' || primerSegmento === undefined) {
      router.replace(homeFor(user.rol) as Parameters<typeof router.replace>[0]);
      return;
    }
    if (!pathPermitidoPara(user.rol, primerSegmento)) {
      router.replace(homeFor(user.rol) as Parameters<typeof router.replace>[0]);
    }
  }, [status, user, segments, router]);
}

/**
 * Al tocar un recordatorio de clase (local o push) se abre la pantalla donde
 * se ven las clases agendadas. También procesa el toque que abrió la app.
 */
function useNotificacionesDeClase() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const rol = useAuthStore((s) => s.user?.rol);
  const inicialProcesada = useRef(false);

  useEffect(() => {
    const abrir = (data: Record<string, unknown>) => {
      if (data?.tipo !== 'recordatorio_clase') return;
      const actual = useAuthStore.getState().user?.rol;
      if (actual === 'alumno') router.push('/alumno/dashboard');
      else if (actual === 'instructor') router.push('/instructor/agenda');
    };
    PushNotificationService.setOnTap(abrir);

    if (status === 'authenticated' && !inicialProcesada.current && Platform.OS !== 'web') {
      inicialProcesada.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then((r) => {
          if (r) abrir(r.notification.request.content.data as Record<string, unknown>);
        })
        .catch(() => {});
    }
    return () => PushNotificationService.setOnTap(null);
  }, [router, status]);

  // Cada vez que se abre la app con sesión iniciada se reprograman los
  // recordatorios con las clases vigentes (por si se agendó o canceló
  // algo desde la web o desde administración).
  useEffect(() => {
    if (status === 'authenticated' && rol) void sincronizarRecordatoriosDesdeServidor(rol);
  }, [status, rol]);
}

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  useAuthGuard();
  useNotificacionesDeClase();

  useEffect(() => {
    PushNotificationService.initialize();
    SplashScreenNative.hideAsync().catch(() => {});
  }, []);

  const headerApp = {
    headerShown: true,
    headerStyle: { backgroundColor: AppColors.primary },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: { fontWeight: '800' as const },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal' as const,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {status === 'unknown' ? (
          <SplashScreen />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="cambiar-password" options={{ headerShown: true }} />
            <Stack.Screen name="soporte" options={{ ...headerApp, title: 'Ayuda y soporte' }} />
            <Stack.Screen name="admin" />
            <Stack.Screen name="instructor" />
            <Stack.Screen name="alumno" />
          </Stack>
        )}
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
