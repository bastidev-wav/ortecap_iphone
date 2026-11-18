import { ApiClient } from '../../core/api/apiClient';
import { dataAsList, dataAsMap } from '../../core/api/apiTypes';

/** La IA puede tardar en redactar una respuesta. */
const ESPERA_IA_MS = 120_000;
/** Enviar por Meta (WhatsApp, Messenger, Instagram) puede tardar más de lo normal. */
const ESPERA_META_MS = 60_000;

/**
 * `/api/v2/admin/asistente-rrss/*`: el bot con IA de WhatsApp, Messenger e Instagram
 * (bandeja, respuestas del equipo, comentarios, base de conocimiento y chat de prueba).
 */
export const AsistenteRepository = {
  // ---------------- Bandeja y conversaciones ----------------
  /** { conversaciones, meta: { total_pages }, estadisticas, configuracion } */
  async bandeja(params: { canal?: string; estado?: string; q?: string; page?: number }) {
    const r = await ApiClient.get('/admin/asistente-rrss', {
      ...(params.canal ? { canal: params.canal } : {}),
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.q ? { q: params.q } : {}),
      page: params.page ?? 1,
    });
    return dataAsMap(r);
  },

  /** Con [desde] solo trae los mensajes posteriores a ese id. */
  async conversacion(id: number, desde?: number) {
    const r = await ApiClient.get(`/admin/asistente-rrss/conversaciones/${id}`, desde ? { desde } : undefined);
    return dataAsMap(r);
  },

  async responder(id: number, texto: string): Promise<string> {
    const r = await ApiClient.post(`/admin/asistente-rrss/conversaciones/${id}/responder`, { texto }, ESPERA_META_MS);
    return r.message;
  },

  /** [accion]: `bot` (devolver al bot), `humano` (tomar la conversación) o `atendida`. */
  async cambiarModo(id: number, accion: 'bot' | 'humano' | 'atendida'): Promise<string> {
    const r = await ApiClient.post(`/admin/asistente-rrss/conversaciones/${id}/modo`, { accion });
    return r.message;
  },

  // ---------------- Comentarios de Facebook e Instagram ----------------
  /** { comentarios, conteo: { estado: n }, modo } */
  async comentarios(estado?: string) {
    const r = await ApiClient.get('/admin/asistente-rrss/comentarios', estado ? { estado } : undefined);
    return dataAsMap(r);
  },

  async publicarComentario(id: number, params: { respuestaPublica: string; mensajePrivado: string }): Promise<string> {
    const r = await ApiClient.post(
      `/admin/asistente-rrss/comentarios/${id}/publicar`,
      { respuesta_publica: params.respuestaPublica, mensaje_privado: params.mensajePrivado },
      ESPERA_META_MS,
    );
    return r.message;
  },

  async descartarComentario(id: number) {
    await ApiClient.post(`/admin/asistente-rrss/comentarios/${id}/descartar`);
  },

  async regenerarComentario(id: number) {
    await ApiClient.post(`/admin/asistente-rrss/comentarios/${id}/regenerar`, undefined, ESPERA_IA_MS);
  },

  // ---------------- Base de conocimiento ----------------
  async conocimiento() {
    const r = await ApiClient.get('/admin/asistente-rrss/conocimiento');
    return dataAsList(r);
  },

  async guardarConocimiento(params: { id?: number; titulo: string; contenido: string; activo: boolean; orden: number }) {
    await ApiClient.post('/admin/asistente-rrss/conocimiento', {
      ...(params.id ? { id: params.id } : {}),
      titulo: params.titulo,
      contenido: params.contenido,
      activo: params.activo,
      orden: params.orden,
    });
  },

  async eliminarConocimiento(id: number) {
    await ApiClient.delete(`/admin/asistente-rrss/conocimiento/${id}`);
  },

  // ---------------- Chat de prueba ----------------
  /** { mensajes, config_ok, modelo } */
  async probar() {
    const r = await ApiClient.get('/admin/asistente-rrss/probar');
    return dataAsMap(r);
  },

  /** { mensaje, derivada, verificado } */
  async probarEnviar(texto: string) {
    const r = await ApiClient.post('/admin/asistente-rrss/probar', { texto }, ESPERA_IA_MS);
    return dataAsMap(r);
  },

  async probarReiniciar() {
    await ApiClient.post('/admin/asistente-rrss/probar/reiniciar');
  },
};
