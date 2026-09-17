/** Tipo de cuenta (define en qué tabla vive el usuario en el backend). */
export type UserType = 'administrativo' | 'instructor' | 'alumno';

export function userTypeFromString(value: string): UserType {
  if (value === 'administrativo' || value === 'instructor' || value === 'alumno') return value;
  throw new Error(`user_type desconocido: ${value}`);
}

/** Rol normalizado dentro de un UserType. Un `administrativo` puede ser admin, secretaria o inspector. */
export type AppRole = 'admin' | 'secretaria' | 'inspector' | 'instructor' | 'alumno';

export function appRoleFromString(value: string): AppRole {
  if (['admin', 'secretaria', 'inspector', 'instructor', 'alumno'].includes(value)) return value as AppRole;
  throw new Error(`rol desconocido: ${value}`);
}

/**
 * Usuario autenticado. Refleja `perfilPublico()` del backend
 * (AuthController.php), con campos opcionales según [userType].
 */
export interface AppUser {
  rut: string;
  nombres?: string | null;
  apellidos?: string | null;
  correo?: string | null;
  telefono?: string | null;
  rol: AppRole;
  userType: UserType;
  primerIngreso: boolean;

  // Solo si userType === 'administrativo'
  cargo?: string | null;
  // Solo si userType === 'instructor'
  esEncargado?: boolean | null;
  // Solo si userType === 'alumno'
  localidadId?: number | null;
}

export function nombreCompleto(user: AppUser): string {
  return [user.nombres, user.apellidos].filter((s) => !!s && s.trim().length > 0).join(' ');
}

export function appUserFromJson(json: Record<string, unknown>): AppUser {
  const rawLocalidad = json.localidad_id;
  return {
    rut: json.rut as string,
    nombres: (json.nombres as string | null) ?? null,
    apellidos: (json.apellidos as string | null) ?? null,
    correo: (json.correo as string | null) ?? null,
    telefono: (json.telefono as string | null) ?? null,
    rol: appRoleFromString(json.rol as string),
    userType: userTypeFromString(json.user_type as string),
    primerIngreso: (json.primer_ingreso as boolean) ?? false,
    cargo: (json.cargo as string | null) ?? null,
    esEncargado: (json.es_encargado as boolean | null) ?? null,
    localidadId: typeof rawLocalidad === 'number' ? rawLocalidad : rawLocalidad != null ? Number(rawLocalidad) || null : null,
  };
}

/**
 * Sesión activa: token + usuario + (si aplica) el token de dispositivo de
 * confianza recién emitido tras un 2FA exitoso con "recordar dispositivo".
 */
export interface AuthSession {
  token: string;
  user: AppUser;
  primerIngreso: boolean;
  deviceTrustToken?: string | null;
}

/**
 * Resultado de intentar iniciar sesión: o bien queda autenticado de
 * inmediato ([session] definido), o el backend exige verificación 2FA
 * ([requiresTwoFactor] true, con [otpSession] para el siguiente paso).
 */
export interface LoginResult {
  requiresTwoFactor: boolean;
  otpSession?: string | null;
  debugOtpCode?: string | null;
  session?: AuthSession | null;
}

export interface ForgotPasswordResult {
  otpSession: string;
  debugOtpCode?: string | null;
}

export type AuthStatus = 'unknown' | 'unauthenticated' | 'requiresTwoFactor' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  user?: AppUser | null;
}
