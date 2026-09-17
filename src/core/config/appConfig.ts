/**
 * Configuración global de la app.
 *
 * IMPORTANTE: [apiBaseUrl] debe apuntar al servidor real antes de compilar
 * para producción. Se puede sobrescribir con la variable de entorno
 * EXPO_PUBLIC_API_BASE_URL (ver app.json / eas.json por perfil de build).
 */
export const AppConfig = {
  /** URL base de la API, SIN slash final. Ej: https://ortecap.cl/api/v1 */
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://ortecap.cl/api/v1',

  /** Timeout de conexión/respuesta para todas las llamadas HTTP (ms). */
  connectTimeoutMs: 15000,
  receiveTimeoutMs: 20000,

  /** Nombre visible de la app (AppBars, splash, etc.) */
  appName: 'Ortecap',

  /** Logo oficial de Ortecap, cargado desde el sitio web. */
  logoUrl: 'https://ortecap.cl/img/logo.png',

  /**
   * Esquema de deep link para el retorno de Webpay. Debe coincidir con
   * "scheme" en app.json y con DEEP_LINK_SCHEME en el backend
   * (WebpayCallbackController.php).
   */
  webpayDeepLinkScheme: 'ortecapapp',
} as const;
