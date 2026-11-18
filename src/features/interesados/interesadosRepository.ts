import { ApiClient } from '../../core/api/apiClient';
import { dataAsMap } from '../../core/api/apiTypes';

/**
 * `/api/v2/admin/interesados/*`: personas que preguntan por un curso y todavía no se
 * matriculan, con su seguimiento (el Asistente RRSS también registra aquí a quien consulta).
 */
export const InteresadosRepository = {
  async listar(params: { estado?: string; cursoId?: number | null; localidadId?: number | null }) {
    const r = await ApiClient.get('/admin/interesados', {
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.cursoId ? { curso_id: params.cursoId } : {}),
      ...(params.localidadId ? { localidad_id: params.localidadId } : {}),
    });
    return dataAsMap(r);
  },

  async detalle(id: number) {
    const r = await ApiClient.get(`/admin/interesados/${id}`);
    return dataAsMap(r);
  },

  /** Crea ([id] nulo) o edita los datos básicos. Al editar solo cambia lo que se envía. Devuelve el id. */
  async guardar(params: { id?: number; datos: Record<string, unknown> }): Promise<number> {
    if (params.id) {
      await ApiClient.put(`/admin/interesados/${params.id}`, params.datos);
      return params.id;
    }
    const r = await ApiClient.post('/admin/interesados', params.datos);
    return Number(dataAsMap(r).id);
  },

  async agregarSeguimiento(id: number, params: { nota: string; estado?: string | null; proximoSeguimiento?: string | null }) {
    await ApiClient.post(`/admin/interesados/${id}/seguimiento`, {
      nota: params.nota,
      ...(params.estado ? { estado: params.estado } : {}),
      proximo_seguimiento: params.proximoSeguimiento ?? '',
    });
  },

  async cambiarEstado(id: number, estado: string) {
    await ApiClient.post(`/admin/interesados/${id}/estado`, { estado });
  },

  async eliminar(id: number) {
    await ApiClient.delete(`/admin/interesados/${id}`);
  },
};
