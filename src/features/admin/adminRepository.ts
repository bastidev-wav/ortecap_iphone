import { ApiClient } from '../../core/api/apiClient';
import { ApiResult, dataAsList, dataAsMap } from '../../core/api/apiTypes';

/** Encapsula todas las llamadas HTTP a `/api/v1/admin/*`. */
export const AdminRepository = {
  // ---------------- Dashboard ----------------
  async dashboard() {
    const r = await ApiClient.get('/admin/dashboard');
    return dataAsMap(r);
  },

  async marcarNotificacionLeida(params: { id: number; tipo: string }) {
    await ApiClient.post('/admin/dashboard/marcar-leida', params);
  },

  // ---------------- Solicitudes ----------------
  solicitudes(params: { estado?: string; page?: number } = {}): Promise<ApiResult> {
    return ApiClient.get('/admin/solicitudes', {
      ...(params.estado ? { estado: params.estado } : {}),
      page: params.page ?? 1,
    });
  },

  async solicitudDetalle(id: number) {
    const r = await ApiClient.get(`/admin/solicitudes/${id}`);
    return dataAsMap(r);
  },

  async aprobarSolicitud(id: number, params: { bloqueTeoricoId?: unknown; bloquePracticoId?: unknown } = {}) {
    const r = await ApiClient.post(`/admin/solicitudes/${id}/aprobar`, {
      bloque_teorico_id: params.bloqueTeoricoId ?? 'omitir',
      bloque_practico_id: params.bloquePracticoId ?? 'omitir',
    });
    return dataAsMap(r);
  },

  async rechazarSolicitud(id: number, motivo: string) {
    await ApiClient.post(`/admin/solicitudes/${id}/rechazar`, { motivo_rechazo: motivo });
  },

  documentoSolicitudUrl(id: number, index: number) {
    return `/admin/solicitudes/${id}/documento/${index}`;
  },

  // ---------------- Alumnos ----------------
  async alumnosResumen() {
    const r = await ApiClient.get('/admin/alumnos');
    return dataAsMap(r);
  },

  alumnosPorCurso(cursoId: string, page = 1): Promise<ApiResult> {
    return ApiClient.get('/admin/alumnos', { curso_id: cursoId, page });
  },

  async alumnoDetalle(rut: string) {
    const r = await ApiClient.get(`/admin/alumnos/${rut}`);
    return dataAsMap(r);
  },

  async resetearPasswordAlumno(rut: string) {
    const r = await ApiClient.post(`/admin/alumnos/${rut}/reset-password`);
    return dataAsMap(r);
  },

  async actualizarEstadoMatricula(matriculaId: number, campo: string, estado: string) {
    await ApiClient.patch(`/admin/alumnos/matricula/${matriculaId}/estado`, { campo, estado });
  },

  async firmarContrato(params: { contratoId?: number; matriculaId?: number; firmaBase64: string; tipoFirma?: string }) {
    await ApiClient.post('/admin/contratos/firmar', {
      ...(params.contratoId ? { contrato_id: params.contratoId } : {}),
      ...(params.matriculaId ? { matricula_id: params.matriculaId } : {}),
      tipo_firma: params.tipoFirma ?? 'admin',
      firma_base64: params.firmaBase64,
    });
  },

  documentoAlumnoUrl(rut: string, index: number) {
    return `/admin/alumnos/${rut}/documento/${index}`;
  },
  comprobanteAlumnoUrl(rut: string) {
    return `/admin/alumnos/${rut}/comprobante`;
  },
  contratoFisicoAlumnoUrl(rut: string) {
    return `/admin/alumnos/${rut}/contrato-fisico`;
  },

  // ---------------- Instructores ----------------
  async instructores() {
    const r = await ApiClient.get('/admin/instructores');
    return dataAsList(r);
  },

  async instructorDetalle(rut: string) {
    const r = await ApiClient.get(`/admin/instructores/${rut}`);
    return dataAsMap(r);
  },

  async guardarInstructor(params: { rutExistente?: string; datos: Record<string, unknown> }) {
    if (params.rutExistente) {
      await ApiClient.put(`/admin/instructores/${params.rutExistente}`, params.datos);
    } else {
      await ApiClient.post('/admin/instructores', params.datos);
    }
  },

  // ---------------- Staff ----------------
  async staff() {
    const r = await ApiClient.get('/admin/staff');
    return dataAsList(r);
  },

  async guardarStaff(params: { rutExistente?: string; datos: Record<string, unknown> }) {
    if (params.rutExistente) {
      await ApiClient.put(`/admin/staff/${params.rutExistente}`, params.datos);
    } else {
      await ApiClient.post('/admin/staff', params.datos);
    }
  },

  async desactivarStaff(rut: string) {
    await ApiClient.delete(`/admin/staff/${rut}`);
  },

  // ---------------- Cursos ----------------
  async cursos() {
    const r = await ApiClient.get('/admin/cursos');
    return dataAsMap(r);
  },

  async matrizPrecios() {
    const r = await ApiClient.get('/admin/cursos/precios');
    return dataAsMap(r);
  },

  async guardarPrecio(params: { cursoId: number; localidadId: number; precios: Record<string, unknown> }) {
    await ApiClient.post('/admin/cursos/precios', {
      curso_id: params.cursoId,
      localidad_id: params.localidadId,
      ...params.precios,
    });
  },

  // ---------------- Promociones ----------------
  async promociones() {
    const r = await ApiClient.get('/admin/promociones');
    return dataAsList(r);
  },

  async togglePromocion(id: number) {
    await ApiClient.post(`/admin/promociones/${id}/toggle`);
  },

  async eliminarPromocion(id: number) {
    await ApiClient.delete(`/admin/promociones/${id}`);
  },

  // ---------------- Agenda global ----------------
  async agenda(params: { fecha?: string; vista?: string; instructor?: string; tipoClase?: string; localidad?: unknown } = {}) {
    const r = await ApiClient.get('/admin/agenda', {
      ...(params.fecha ? { fecha: params.fecha } : {}),
      ...(params.vista ? { vista: params.vista } : {}),
      ...(params.instructor ? { instructor: params.instructor } : {}),
      ...(params.tipoClase ? { tipo_clase: params.tipoClase } : {}),
      ...(params.localidad !== undefined ? { localidad: params.localidad } : {}),
    });
    return dataAsMap(r);
  },

  async crearBloquesAgenda(datos: Record<string, unknown>): Promise<number> {
    const r = await ApiClient.post('/admin/agenda/bloques', datos);
    return dataAsMap(r).bloques_creados as number;
  },

  async actualizarBloquesAgenda(ids: number[], cambios: Record<string, unknown>) {
    await ApiClient.patch('/admin/agenda/bloques', { ids, ...cambios });
  },

  async eliminarBloqueAgenda(id: number) {
    await ApiClient.delete(`/admin/agenda/bloques/${id}`);
  },

  /** Roster de una clase TEÓRICA (varios alumnos, con cupo). */
  async alumnosClase(agendaClaseId: number) {
    const r = await ApiClient.get(`/admin/agenda/${agendaClaseId}/alumnos`);
    return dataAsMap(r);
  },

  async agregarAlumnoClase(params: { agendaClaseId: number; alumnoRut: string }) {
    const r = await ApiClient.post('/admin/agenda/alumnos', {
      agenda_clase_id: params.agendaClaseId,
      alumno_rut: params.alumnoRut,
    });
    return dataAsMap(r);
  },

  async quitarAlumnoClase(params: { agendaClaseId: number; alumnoRut: string }) {
    const r = await ApiClient.delete('/admin/agenda/alumnos', {
      agenda_clase_id: params.agendaClaseId,
      alumno_rut: params.alumnoRut,
    });
    return dataAsMap(r);
  },

  // ---------------- Vehículos ----------------
  async vehiculos() {
    const r = await ApiClient.get('/admin/vehiculos');
    return dataAsList(r);
  },

  async vehiculoDetalle(id: number) {
    const r = await ApiClient.get(`/admin/vehiculos/${id}`);
    return dataAsMap(r);
  },

  async guardarMantenimiento(vehiculoId: number, datos: Record<string, unknown>) {
    await ApiClient.post(`/admin/vehiculos/${vehiculoId}/mantenimiento`, datos);
  },

  async historialVehiculo(id: number) {
    const r = await ApiClient.get(`/admin/vehiculos/${id}/historial`);
    return (dataAsMap(r).historial as Record<string, unknown>[]) ?? [];
  },

  async hojaRutaDetalle(id: number) {
    const r = await ApiClient.get(`/admin/hojas-ruta/${id}`);
    return dataAsMap(r);
  },

  async hojaRutaMapa(id: number) {
    const r = await ApiClient.get(`/admin/hojas-ruta/${id}/mapa`);
    return dataAsMap(r);
  },

  async corregirHojaRuta(id: number, datos: Record<string, unknown>) {
    await ApiClient.put(`/admin/hojas-ruta/${id}`, datos);
  },

  // ---------------- Mensajería ----------------
  async mensajeriaContactos() {
    const r = await ApiClient.get('/admin/mensajeria/contactos');
    return dataAsMap(r);
  },

  async chat(rut: string) {
    const r = await ApiClient.get(`/admin/mensajeria/chat/${rut}`);
    return dataAsMap(r);
  },

  async enviarMensaje(params: { destinatarioId: string; mensaje: string }) {
    await ApiClient.uploadMultipart('/admin/mensajeria/enviar', {
      fields: { destinatario_id: params.destinatarioId, mensaje: params.mensaje },
    });
  },

  async mensajesNuevos(): Promise<number> {
    const r = await ApiClient.get('/admin/mensajeria/check-nuevos');
    return dataAsMap(r).unread as number;
  },

  // ---------------- Dispositivos 2FA ----------------
  async dispositivos() {
    const r = await ApiClient.get('/admin/dispositivos');
    return dataAsList(r);
  },

  async revocarDispositivo(id: number) {
    await ApiClient.delete(`/admin/dispositivos/${id}`);
  },

  // ---------------- Reseñas ----------------
  async resenas() {
    const r = await ApiClient.get('/admin/resenas');
    return dataAsList(r);
  },

  // ---------------- Reportes y estadísticas ----------------
  async reportes(params: { mes?: string; anio?: string } = {}) {
    const r = await ApiClient.get('/admin/reportes', {
      ...(params.mes ? { mes: params.mes } : {}),
      ...(params.anio ? { anio: params.anio } : {}),
    });
    return dataAsMap(r);
  },

  async reporteConversion() {
    const r = await ApiClient.get('/admin/reportes/conversion');
    return dataAsMap(r);
  },

  // ---------------- Certificados ----------------
  async certificados() {
    const r = await ApiClient.get('/admin/certificados');
    return dataAsMap(r);
  },

  async emitirCertificado(params: { matriculaId: number; numeroFolio: string }) {
    const r = await ApiClient.post('/admin/certificados/emitir', {
      matricula_id: params.matriculaId,
      numero_folio: params.numeroFolio,
    });
    return dataAsMap(r);
  },

  // ---------------- Simulador (banco de preguntas) ----------------
  async simuladorResumen() {
    const r = await ApiClient.get('/admin/simulador');
    return dataAsMap(r);
  },

  async simuladorCategorias() {
    const r = await ApiClient.get('/admin/simulador/categorias');
    return dataAsList(r);
  },

  async simuladorPreguntas(categoria?: number) {
    const r = await ApiClient.get('/admin/simulador/preguntas', categoria !== undefined ? { categoria } : undefined);
    return dataAsList(r);
  },
};
