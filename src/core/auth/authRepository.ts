import { ApiClient } from '../api/apiClient';
import { dataAsList, dataAsMap } from '../api/apiTypes';
import { AppUser, appUserFromJson, AuthSession, ForgotPasswordResult, LoginResult } from './types';

/** Encapsula todas las llamadas HTTP relacionadas a `/api/v1/auth/*`. */
export const AuthRepository = {
  async login(params: {
    rut: string;
    password: string;
    deviceName?: string;
    deviceId?: string;
    deviceTrustToken?: string | null;
  }): Promise<LoginResult> {
    const result = await ApiClient.post('/auth/login', {
      rut: params.rut,
      password: params.password,
      ...(params.deviceName ? { device_name: params.deviceName } : {}),
      ...(params.deviceId ? { device_id: params.deviceId } : {}),
      ...(params.deviceTrustToken ? { device_trust_token: params.deviceTrustToken } : {}),
    });

    const data = dataAsMap(result);

    if (data.requires_2fa === true) {
      return {
        requiresTwoFactor: true,
        otpSession: (data.otp_session as string) ?? null,
        debugOtpCode: (data.debug_otp_code as string) ?? null,
      };
    }

    return { requiresTwoFactor: false, session: sessionFromJson(data) };
  },

  async verify2FA(params: {
    otpSession: string;
    otpCode: string;
    deviceName?: string;
    deviceId?: string;
    rememberDevice?: boolean;
  }): Promise<AuthSession> {
    const result = await ApiClient.post('/auth/verify-2fa', {
      otp_session: params.otpSession,
      otp_code: params.otpCode,
      ...(params.deviceName ? { device_name: params.deviceName } : {}),
      ...(params.deviceId ? { device_id: params.deviceId } : {}),
      remember_device: params.rememberDevice ?? false,
    });
    return sessionFromJson(dataAsMap(result));
  },

  async me(): Promise<AppUser> {
    const result = await ApiClient.get('/auth/me');
    return appUserFromJson(dataAsMap(result));
  },

  async logout(): Promise<void> {
    await ApiClient.post('/auth/logout');
  },

  async refresh(): Promise<string> {
    const result = await ApiClient.post('/auth/refresh');
    return dataAsMap(result).token as string;
  },

  async devices(): Promise<Record<string, unknown>[]> {
    const result = await ApiClient.get('/auth/devices');
    return dataAsList(result);
  },

  async revokeDevice(tokenId: number): Promise<void> {
    await ApiClient.post('/auth/devices/revoke', { token_id: tokenId });
  },

  async revokeAllDevices(): Promise<void> {
    await ApiClient.post('/auth/devices/revoke-all');
  },

  /** Registra/actualiza el push token del dispositivo actual. */
  async updatePushToken(pushToken: string): Promise<void> {
    await ApiClient.post('/auth/push-token', { push_token: pushToken });
  },

  async changePassword(params: { currentPassword: string; newPassword: string }): Promise<void> {
    await ApiClient.post('/auth/change-password', {
      current_password: params.currentPassword,
      new_password: params.newPassword,
      confirm_password: params.newPassword,
    });
  },

  /** [rutOCorreo] puede ser el RUT o el correo del usuario. */
  async forgotPassword(rutOCorreo: string): Promise<ForgotPasswordResult> {
    const result = await ApiClient.post('/auth/forgot-password', { rut: rutOCorreo });
    const data = dataAsMap(result);
    return {
      otpSession: data.otp_session as string,
      debugOtpCode: (data.debug_otp_code as string) ?? null,
    };
  },

  async resetPassword(params: { otpSession: string; otpCode: string; newPassword: string }): Promise<void> {
    await ApiClient.post('/auth/reset-password', {
      otp_session: params.otpSession,
      otp_code: params.otpCode,
      new_password: params.newPassword,
      confirm_password: params.newPassword,
    });
  },
};

function sessionFromJson(data: Record<string, unknown>): AuthSession {
  return {
    token: data.token as string,
    user: appUserFromJson(data.user as Record<string, unknown>),
    primerIngreso: (data.primer_ingreso as boolean) ?? false,
    deviceTrustToken: (data.device_trust_token as string) ?? null,
  };
}
