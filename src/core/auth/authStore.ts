import { Platform } from 'react-native';
import { create } from 'zustand';

import { ApiClient } from '../api/apiClient';
import { PushNotificationService } from '../notifications/pushNotificationService';
import { SecureStorageService } from '../storage/secureStorage';
import { AuthRepository } from './authRepository';
import { AppUser, AuthSession, AuthStatus, LoginResult } from './types';

interface AuthStoreState {
  status: AuthStatus;
  user: AppUser | null;

  /** Solo viene poblado si el backend está en modo desarrollo (nunca en producción). */
  lastDebugOtpCode: string | null;
  pendingOtpSession: string | null;
  pendingRut: string | null;

  restoreSession: () => Promise<void>;
  login: (params: { rut: string; password: string }) => Promise<LoginResult>;
  verifyTwoFactor: (params: { otpCode: string; rememberDevice?: boolean }) => Promise<AuthSession>;
  cancelTwoFactor: () => void;
  logout: () => Promise<void>;
  forceLogout: () => void;
  refreshUser: () => Promise<void>;
}

function nombreDispositivo(): string {
  if (Platform.OS === 'android') return 'Android';
  if (Platform.OS === 'ios') return 'iPhone/iPad';
  return 'App móvil';
}

async function persistSession(
  set: (partial: Partial<AuthStoreState>) => void,
  session: AuthSession,
  rut: string,
) {
  await SecureStorageService.saveSession({
    token: session.token,
    userType: session.user.userType,
    rol: session.user.rol,
  });

  if (session.deviceTrustToken) {
    await SecureStorageService.saveDeviceTrustToken(rut, session.deviceTrustToken);
  }

  set({
    status: 'authenticated',
    user: session.user,
    pendingOtpSession: null,
    pendingRut: null,
  });

  void PushNotificationService.requestPermissionAndRegister();
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  status: 'unknown',
  user: null,
  lastDebugOtpCode: null,
  pendingOtpSession: null,
  pendingRut: null,

  async restoreSession() {
    const token = await SecureStorageService.readToken();
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }
    try {
      const user = await AuthRepository.me();
      set({ status: 'authenticated', user });
      void PushNotificationService.requestPermissionAndRegister();
    } catch {
      await SecureStorageService.clearSession();
      set({ status: 'unauthenticated' });
    }
  },

  async login({ rut, password }) {
    const deviceId = await SecureStorageService.getOrCreateDeviceId();
    const trustToken = await SecureStorageService.readDeviceTrustToken(rut);

    const result = await AuthRepository.login({
      rut,
      password,
      deviceName: nombreDispositivo(),
      deviceId,
      deviceTrustToken: trustToken,
    });

    if (result.requiresTwoFactor) {
      set({
        pendingOtpSession: result.otpSession ?? null,
        pendingRut: rut,
        lastDebugOtpCode: result.debugOtpCode ?? null,
        status: 'requiresTwoFactor',
      });
    } else if (result.session) {
      await persistSession(set, result.session, rut);
    }

    return result;
  },

  async verifyTwoFactor({ otpCode, rememberDevice = false }) {
    const { pendingOtpSession, pendingRut } = get();
    if (!pendingOtpSession || !pendingRut) {
      throw new Error('No hay un proceso de verificación 2FA en curso.');
    }

    const deviceId = await SecureStorageService.getOrCreateDeviceId();

    const session = await AuthRepository.verify2FA({
      otpSession: pendingOtpSession,
      otpCode,
      deviceName: nombreDispositivo(),
      deviceId,
      rememberDevice,
    });

    await persistSession(set, session, pendingRut);
    return session;
  },

  cancelTwoFactor() {
    set({
      pendingOtpSession: null,
      pendingRut: null,
      lastDebugOtpCode: null,
      status: 'unauthenticated',
    });
  },

  async logout() {
    try {
      await AuthRepository.logout();
    } catch {
      // Si falla la llamada igual limpiamos la sesión local — lo
      // importante es que el usuario pueda salir siempre.
    }
    await SecureStorageService.clearSession();
    set({ status: 'unauthenticated', user: null });
  },

  forceLogout() {
    void SecureStorageService.clearSession();
    set({ status: 'unauthenticated', user: null });
  },

  async refreshUser() {
    const user = await AuthRepository.me();
    set({ user });
  },
}));

// Si cualquier llamada a la API recibe un 401, cerramos sesión local de
// inmediato (el token ya no sirve en el servidor).
ApiClient.onUnauthorized = () => useAuthStore.getState().forceLogout();
