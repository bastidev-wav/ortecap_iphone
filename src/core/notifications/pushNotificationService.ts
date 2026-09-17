import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { AuthRepository } from '../auth/authRepository';

/**
 * Callback invocado cuando el usuario toca una notificación (con la app en
 * primer plano, en segundo plano, o recién abierta desde cero), con los
 * datos que venían en el push — típicamente `{ tipo: ... }`.
 */
export type PushTapCallback = (data: Record<string, unknown>) => void;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let onTap: PushTapCallback | null = null;
let initialized = false;

/**
 * Prepara los listeners de notificaciones. Llamar una sola vez al montar
 * la app (no requiere que el usuario haya iniciado sesión).
 */
function initialize() {
  if (initialized) return;
  initialized = true;

  // App en primer plano o en segundo plano y el usuario tocó la notificación.
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    onTap?.(data);
  });
}

function setOnTap(callback: PushTapCallback | null) {
  onTap = callback;
}

/**
 * Pide el permiso de notificaciones (si aún no está resuelto) y, si queda
 * autorizado, registra el push token actual en el backend. Pensada para
 * llamarse justo después de un login o de restaurar sesión exitosos —
 * nunca lanza, para no poder romper el flujo de autenticación si falla.
 *
 * NOTA: el backend actual (heredado de la app Flutter) espera tokens FCM
 * de Firebase Cloud Messaging para enviar los push. Este cliente registra
 * el token de push nativo de Expo/Apple (APNs) — antes de ir a producción
 * hay que decidir si el backend pasa a usar el servicio de push de Expo,
 * o si se agrega Firebase (vía @react-native-firebase + EAS Build) para
 * mantener compatibilidad total con el envío actual.
 */
async function requestPermissionAndRegister(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ortecap_clases', {
        name: 'Clases y avisos',
        description: 'Recordatorios de tus clases agendadas y avisos de Ortecap.',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    await AuthRepository.updatePushToken(tokenResponse.data);
  } catch {
    // Nunca debe interrumpir el login.
  }
}

/** true si el usuario bloqueó las notificaciones a nivel de sistema. */
async function permisoBloqueado(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status !== 'granted';
}

export const PushNotificationService = {
  initialize,
  setOnTap,
  requestPermissionAndRegister,
  permisoBloqueado,
};
