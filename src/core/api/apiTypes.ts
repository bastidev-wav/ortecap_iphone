/**
 * Excepción estándar para cualquier error que venga de la API.
 *
 * Refleja el formato de error del backend:
 * { "success": false, "message": "...", "errors": {...} }
 */
export class ApiException extends Error {
  readonly statusCode?: number;
  readonly errors?: Record<string, unknown> | null;

  constructor(params: { message: string; statusCode?: number; errors?: Record<string, unknown> | null }) {
    super(params.message);
    this.name = 'ApiException';
    this.statusCode = params.statusCode;
    this.errors = params.errors ?? null;
  }

  /** true si el backend devolvió errores de validación por campo (HTTP 422). */
  get isValidationError(): boolean {
    return this.statusCode === 422 && !!this.errors;
  }

  /** true si el error es por token inválido/expirado. */
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /** true si el error es por falta de permisos para el rol actual. */
  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  /** true si el error es porque la cuenta tiene un pago pendiente. */
  get isPaymentRequired(): boolean {
    return this.statusCode === 402;
  }

  /** Extrae el primer mensaje de error de campo, si existe, o [message]. */
  firstFieldError(): string {
    if (!this.errors || Object.keys(this.errors).length === 0) return this.message;
    const firstValue = Object.values(this.errors)[0];
    return typeof firstValue === 'string' ? firstValue : this.message;
  }
}

/** Metadata de paginación, presente en los endpoints tipo listado. */
export interface ApiMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export function apiMetaFromJson(json: Record<string, unknown>): ApiMeta {
  return {
    page: typeof json.page === 'number' ? json.page : 1,
    perPage: typeof json.per_page === 'number' ? json.per_page : 15,
    total: typeof json.total === 'number' ? json.total : 0,
    totalPages: typeof json.total_pages === 'number' ? json.total_pages : 1,
  };
}

export function apiMetaHasNextPage(meta: ApiMeta): boolean {
  return meta.page < meta.totalPages;
}

/**
 * Envoltorio del resultado exitoso de una llamada a la API.
 *
 * Refleja el formato estándar del backend:
 * { "success": true, "message": "...", "data": ..., "meta": {...}? }
 */
export interface ApiResult<T = unknown> {
  data: T;
  message: string;
  meta?: ApiMeta;
}

export function dataAsMap(result: ApiResult): Record<string, unknown> {
  return result.data as Record<string, unknown>;
}

export function dataAsList(result: ApiResult): Record<string, unknown>[] {
  return result.data as Record<string, unknown>[];
}

/**
 * Un archivo a subir en una llamada multipart. [fieldName] debe incluir el
 * sufijo `[]` cuando el backend PHP espera un array (ej. `documentos[]`).
 */
export interface ApiFileUpload {
  fieldName: string;
  uri: string;
  fileName?: string;
  mimeType?: string;
}
