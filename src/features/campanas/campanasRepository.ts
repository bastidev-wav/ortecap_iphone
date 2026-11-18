import { ApiClient } from '../../core/api/apiClient';
import { dataAsList, dataAsMap } from '../../core/api/apiTypes';

/**
 * `/api/v2/admin/campanas-whatsapp/*`: campañas con una plantilla de WhatsApp aprobada por
 * Meta, enviadas de a lotes a una lista de contactos importada desde un CSV.
 */
export const CampanasRepository = {
  async campanas() {
    const r = await ApiClient.get('/admin/campanas-whatsapp');
    return dataAsList(r);
  },

  /** { campana, contactos (de a 100), meta: { page, total_pages }, lote } */
  async campana(id: number, params: { estado?: string; page?: number } = {}) {
    const r = await ApiClient.get(`/admin/campanas-whatsapp/${id}`, {
      ...(params.estado ? { estado: params.estado } : {}),
      page: params.page ?? 1,
    });
    return dataAsMap(r);
  },

  /** Crea la campaña desde un archivo CSV de contactos. No envía nada todavía. */
  async importar(params: { nombre: string; plantilla: string; csv: { uri: string; name: string; mimeType?: string } }) {
    const r = await ApiClient.uploadMultipart('/admin/campanas-whatsapp', {
      fields: { nombre_campana: params.nombre, plantilla_meta: params.plantilla },
      files: [{ fieldName: 'csv_contactos', uri: params.csv.uri, fileName: params.csv.name, mimeType: params.csv.mimeType ?? 'text/csv' }],
    });
    return { mensaje: r.message, id: Number(dataAsMap(r).id) };
  },

  /** Envía la plantilla a los siguientes contactos pendientes. Puede tardar (hasta 20 mensajes). */
  async enviarLote(id: number): Promise<{ mensaje: string; enviados: number; fallidos: number }> {
    const r = await ApiClient.post(`/admin/campanas-whatsapp/${id}/enviar-lote`, undefined, 150_000);
    const d = dataAsMap(r);
    return { mensaje: r.message, enviados: Number(d.enviados ?? 0), fallidos: Number(d.fallidos ?? 0) };
  },

  async reintentarFallidos(id: number) {
    const r = await ApiClient.post(`/admin/campanas-whatsapp/${id}/reintentar`);
    return r.message;
  },
};
