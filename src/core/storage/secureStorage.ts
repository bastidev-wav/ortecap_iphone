import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Envoltorio sobre expo-secure-store para guardar todo lo sensible de la
 * sesión: el token Bearer, el token de dispositivo de confianza (2FA) y el
 * tipo de usuario/rol actual.
 *
 * Se guarda todo cifrado en el Keychain de iOS, nunca en AsyncStorage.
 *
 * expo-secure-store no tiene implementación nativa en web (solo se usa acá
 * para previsualizar en el navegador durante desarrollo) — en ese caso cae
 * a localStorage, sin cifrado. La build de iOS siempre usa el Keychain.
 */
async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return window.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

const KEY_TOKEN = 'auth_token';
const KEY_USER_TYPE = 'auth_user_type';
const KEY_ROL = 'auth_rol';
const KEY_DEVICE_ID = 'device_id';
// El device_trust_token se guarda con una llave por RUT, porque en el mismo
// teléfono se podría cerrar sesión y entrar con otra cuenta admin.
const KEY_DEVICE_TRUST_PREFIX = 'device_trust_';

async function saveSession(params: { token: string; userType: string; rol: string }): Promise<void> {
  await setItem(KEY_TOKEN, params.token);
  await setItem(KEY_USER_TYPE, params.userType);
  await setItem(KEY_ROL, params.rol);
}

async function readToken(): Promise<string | null> {
  return getItem(KEY_TOKEN);
}

async function readUserType(): Promise<string | null> {
  return getItem(KEY_USER_TYPE);
}

async function readRol(): Promise<string | null> {
  return getItem(KEY_ROL);
}

async function clearSession(): Promise<void> {
  await deleteItem(KEY_TOKEN);
  await deleteItem(KEY_USER_TYPE);
  await deleteItem(KEY_ROL);
}

/**
 * Identificador estable de este dispositivo/instalación (se genera una vez
 * y se reutiliza en cada login, para que el backend pueda identificar "el
 * mismo teléfono" al emitir/revocar tokens).
 */
async function getOrCreateDeviceId(): Promise<string> {
  let id = await getItem(KEY_DEVICE_ID);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    await setItem(KEY_DEVICE_ID, id);
  }
  return id;
}

async function saveDeviceTrustToken(rut: string, token: string): Promise<void> {
  await setItem(`${KEY_DEVICE_TRUST_PREFIX}${rut}`, token);
}

async function readDeviceTrustToken(rut: string): Promise<string | null> {
  return getItem(`${KEY_DEVICE_TRUST_PREFIX}${rut}`);
}

export const SecureStorageService = {
  saveSession,
  readToken,
  readUserType,
  readRol,
  clearSession,
  getOrCreateDeviceId,
  saveDeviceTrustToken,
  readDeviceTrustToken,
};
