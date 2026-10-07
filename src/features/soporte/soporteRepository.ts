import { ApiClient } from '../../core/api/apiClient';
import { dataAsMap } from '../../core/api/apiTypes';

/** Endpoints públicos de la API v2 (no requieren sesión). */
export const SoporteRepository = {
  /** { clave: etiqueta } — ej. { acceso: 'No puedo ingresar a mi cuenta', ... } */
  async tipos(): Promise<Record<string, string>> {
    const r = await ApiClient.get('/soporte/tipos');
    return dataAsMap(r) as Record<string, string>;
  },

  async enviar(params: { tipo: string; nombre: string; correo: string; mensaje: string; rut?: string; telefono?: string }) {
    const r = await ApiClient.post('/soporte', params);
    return { ticket: String(dataAsMap(r).ticket ?? ''), mensaje: r.message };
  },
};
