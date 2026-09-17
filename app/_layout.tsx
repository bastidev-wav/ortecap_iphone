import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreenNative from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppRole } from '../src/core/auth/types';
import { useAuthStore } from '../src/core/auth/authStore';
import { PushNotificationService } from '../src/core/notifications/pushNotificationService';
import { SplashScreen } from '../src/features/auth/SplashScreen';
import { ToastHost } from '../src/shared/components/Toast';

SplashScreenNative.preventAutoHideAsync().catch(() => {});

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
  if (primerSegmento === 'cambiar-password') return true;
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
      if (primerSegmento !== 'login') router.replace('/login');
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

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  useAuthGuard();

  useEffect(() => {
    PushNotificationService.initialize();
    SplashScreenNative.hideAsync().catch(() => {});
  }, []);

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
