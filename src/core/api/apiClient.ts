import axios, { AxiosInstance, AxiosError } from 'axios';

import { AppConfig } from '../config/appConfig';
import { SecureStorageService } from '../storage/secureStorage';
import { ApiException, ApiMeta, ApiResult, apiMetaFromJson, ApiFileUpload } from './apiTypes';

/**
 * Cliente HTTP único para toda la app. Envuelve axios, agrega
 * automáticamente el header `Authorization: Bearer <token>` a cada
 * request (si hay sesión activa), y traduce el formato de respuesta del
 * backend `{success, message, data, meta, errors}` a [ApiResult] /
 * [ApiException].
 *
 * El token se lee de SecureStorageService en cada request (no se cachea en
 * memoria) para que un logout en cualquier parte de la app tenga efecto
 * inmediato en la siguiente llamada.
 */
class ApiClientImpl {
  private axios: AxiosInstance;

  /**
   * Callback opcional que la capa de autenticación registra para reaccionar
   * a un 401 en cualquier request (cerrar sesión y volver al login).
   */
  onUnauthorized: (() => void) | null = null;

  constructor() {
    this.axios = axios.create({
      baseURL: AppConfig.apiBaseUrl,
      timeout: AppConfig.receiveTimeoutMs,
      headers: { Accept: 'application/json' },
      // Dejamos que sea nuestro código el que decida qué hacer con cada
      // status code (401, 402, 403, 404, 409, 422...).
      validateStatus: () => true,
    });

    this.axios.interceptors.request.use(async (config) => {
      const token = await SecureStorageService.readToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  get(path: string, query?: Record<string, unknown>) {
    return this.request(() => this.axios.get(path, { params: query }));
  }

  post(path: string, data?: unknown) {
    return this.request(() => this.axios.post(path, data));
  }

  put(path: string, data?: unknown) {
    return this.request(() => this.axios.put(path, data));
  }

  patch(path: string, data?: unknown) {
    return this.request(() => this.axios.patch(path, data));
  }

  delete(path: string, data?: unknown) {
    return this.request(() => this.axios.delete(path, { data }));
  }

  /**
   * POST/PUT con `multipart/form-data`, para endpoints que reciben archivos
   * (documentos, comprobantes, fotos).
   *
   * [fields] son los campos de texto normales. Para arrays estilo PHP usa
   * la clave con sufijo `[]` (ej. `'cursos[]'`) y un array como valor; cada
   * elemento se envía como un campo repetido con esa misma clave, que PHP
   * arma automáticamente como array.
   */
  async uploadMultipart(
    path: string,
    params: { fields?: Record<string, unknown>; files?: ApiFileUpload[]; isPut?: boolean } = {},
  ) {
    const { fields = {}, files = [], isPut = false } = params;
    const formData = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          formData.append(key, String(item));
        }
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else {
        formData.append(key, String(value));
      }
    }

    for (const f of files) {
      const fileName = f.fileName ?? f.uri.split('/').pop() ?? 'archivo';
      // React Native acepta este objeto "pseudo-File" en FormData.
      formData.append(f.fieldName, {
        uri: f.uri,
        name: fileName,
        type: f.mimeType ?? 'application/octet-stream',
      } as unknown as Blob);
    }

    return this.request(() => {
      if (isPut) {
        // CI4 no procesa bien multipart en PUT nativo; usamos el truco
        // estándar de "method override".
        return this.axios.post(path, formData, {
          params: { _method: 'PUT' },
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return this.axios.post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    });
  }

  private async request(call: () => Promise<import('axios').AxiosResponse>): Promise<ApiResult> {
    let response;
    try {
      response = await call();
    } catch (e) {
      throw new ApiException({ message: this.mensajeErrorRed(e as AxiosError) });
    }

    const body = response.data;
    let json: Record<string, unknown> | null = null;

    if (body && typeof body === 'object') {
      json = body as Record<string, unknown>;
    } else if (typeof body === 'string' && body.trim().length > 0) {
      try {
        const decoded = JSON.parse(body);
        if (decoded && typeof decoded === 'object') json = decoded;
      } catch {
        // no era JSON de verdad
      }
    }

    if (json === null) {
      const status = response.status ?? 0;
      const snippet = typeof body === 'string' ? (body.length > 200 ? `${body.substring(0, 200)}...` : body) : typeof body;
      throw new ApiException({
        message: `El servidor respondió con un formato inesperado (HTTP ${status}). Detalle: ${snippet}`,
        statusCode: status,
      });
    }

    const success = json.success === true;
    const message = typeof json.message === 'string' ? json.message : '';

    if (!success) {
      if (response.status === 401) {
        this.onUnauthorized?.();
      }
      throw new ApiException({
        message: message || 'Ocurrió un error inesperado.',
        statusCode: response.status,
        errors: (json.errors as Record<string, unknown> | undefined) ?? null,
      });
    }

    let meta: ApiMeta | undefined;
    if (json.meta && typeof json.meta === 'object') {
      meta = apiMetaFromJson(json.meta as Record<string, unknown>);
    }

    return { data: json.data, message, meta };
  }

  private mensajeErrorRed(e: AxiosError): string {
    if (e.code === 'ECONNABORTED') {
      return 'El servidor está demorando en responder. Intenta nuevamente.';
    }
    if (!e.response) {
      return 'No hay conexión a internet. Verifica tu red e intenta de nuevo.';
    }
    return 'Ocurrió un problema de conexión. Intenta nuevamente.';
  }
}

export const ApiClient = new ApiClientImpl();
