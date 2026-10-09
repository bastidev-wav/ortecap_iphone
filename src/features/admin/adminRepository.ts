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

  /** Devuelve el mensaje del servidor (incluye cuántos bloques se omitieron por choque de horario). */
  async crearBloquesAgenda(datos: Record<string, unknown>): Promise<string> {
    const r = await ApiClient.post('/admin/agenda/bloques', datos);
    return r.message || `Se crearon ${dataAsMap(r).bloques_creados ?? 0} bloques.`;
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

  // ---------------- Buzón de sugerencias ----------------
  async retroalimentaciones(tipo?: string) {
    const r = await ApiClient.get('/admin/retroalimentaciones', tipo ? { tipo } : undefined);
    return dataAsMap(r);
  },

  async marcarRetroalimentacionLeida(id: number) {
    await ApiClient.post(`/admin/retroalimentaciones/${id}/leido`);
  },

  async responderRetroalimentacion(id: number, respuesta: string) {
    await ApiClient.post(`/admin/retroalimentaciones/${id}/responder`, { respuesta });
  },

  // ---------------- Horario de referencia (cursos sin reserva) ----------------
  async horarioReferencia(cursoId?: number) {
    const r = await ApiClient.get('/admin/horario-referencia', cursoId ? { curso_id: cursoId } : undefined);
    return dataAsMap(r);
  },

  async agregarBloqueHorario(datos: { curso_id: number; dia_semana: number; hora_inicio: string; hora_fin: string; modulo?: string; responsable?: string }) {
    await ApiClient.post('/admin/horario-referencia', datos);
  },

  async eliminarBloqueHorario(id: number) {
    await ApiClient.delete(`/admin/horario-referencia/${id}`);
  },

  // ---------------- Agenda de matrículas presenciales ----------------
  async jornadasMatricula(params: { desde?: string; hasta?: string; localidadId?: number; q?: string } = {}) {
    const r = await ApiClient.get('/admin/agenda-matriculas', {
      ...(params.desde ? { desde: params.desde } : {}),
      ...(params.hasta ? { hasta: params.hasta } : {}),
      ...(params.localidadId ? { localidad_id: params.localidadId } : {}),
      ...(params.q ? { q: params.q } : {}),
    });
    return dataAsMap(r);
  },

  async jornadaMatricula(id: number) {
    const r = await ApiClient.get(`/admin/agenda-matriculas/${id}`);
    return dataAsMap(r);
  },

  async crearJornadaMatricula(datos: Record<string, unknown>) {
    const r = await ApiClient.post('/admin/agenda-matriculas', datos);
    return { id: dataAsMap(r).id as number, mensaje: r.message, horarios: Number(dataAsMap(r).horarios_creados ?? 0) };
  },

  async actualizarJornadaMatricula(id: number, datos: Record<string, unknown>) {
    await ApiClient.put(`/admin/agenda-matriculas/${id}`, datos);
  },

  async eliminarJornadaMatricula(id: number) {
    await ApiClient.delete(`/admin/agenda-matriculas/${id}`);
  },

  async agregarCupoMatricula(jornadaId: number, hora: string) {
    await ApiClient.post(`/admin/agenda-matriculas/${jornadaId}/cupos`, { hora });
  },

  async agendarCupoMatricula(cupoId: number, datos: { nombre: string; telefono?: string; rut?: string; correo?: string }) {
    await ApiClient.post(`/admin/agenda-matriculas/cupos/${cupoId}/agendar`, datos);
  },

  async eliminarCupoMatricula(cupoId: number) {
    await ApiClient.delete(`/admin/agenda-matriculas/cupos/${cupoId}`);
  },

  /** Datos de la persona agendada para abrir "Matricular alumno" ya rellenado. */
  async prellenadoCupo(cupoId: number) {
    const r = await ApiClient.get(`/admin/agenda-matriculas/cupos/${cupoId}/prellenado`);
    return dataAsMap(r);
  },

  // ---------------- Correos a alumnos ----------------
  async destinatariosCorreo(params: { modo: 'todos' | 'sin_ingresar' | 'uno'; rut?: string; cursoId?: string; localidadId?: string }) {
    const r = await ApiClient.post('/admin/correos/destinatarios', {
      modo: params.modo,
      ...(params.rut ? { rut: params.rut } : {}),
      ...(params.cursoId ? { curso_id: params.cursoId } : {}),
      ...(params.localidadId ? { localidad_id: params.localidadId } : {}),
    });
    return dataAsMap(r);
  },

  async buscarAlumnoCorreo(q: string) {
    const r = await ApiClient.get('/admin/correos/buscar-alumno', { q });
    return dataAsList(r);
  },

  async previsualizarCorreo(asunto: string, cuerpoHtml: string): Promise<string> {
    const r = await ApiClient.post('/admin/correos/previsualizar', { asunto, cuerpo_b64: aBase64(cuerpoHtml) });
    return String(dataAsMap(r).html ?? '');
  },

  /** Envía a hasta 10 alumnos (o solo a [pruebaA]). Cada alumno recibe un correo individual. */
  async enviarLoteCorreo(params: { asunto: string; cuerpoHtml: string; ruts?: string[]; pruebaA?: string }) {
    const r = await ApiClient.post('/admin/correos/enviar-lote', {
      asunto: params.asunto,
      cuerpo_b64: aBase64(params.cuerpoHtml),
      ...(params.pruebaA ? { prueba_a: params.pruebaA } : { ruts: params.ruts ?? [] }),
    });
    return dataAsMap(r);
  },

  // ---------------- Supervisión de hojas de ruta ----------------
  async sesionesAbiertas() {
    const r = await ApiClient.get('/admin/vehiculos/sesiones-abiertas');
    return dataAsList(r);
  },

  async forzarCierreSesion(id: number) {
    const r = await ApiClient.post('/admin/vehiculos/forzar-cierre', { id });
    return r.message;
  },

  async intercambiarFirmas(hojaRutaId: number) {
    const r = await ApiClient.post(`/admin/hojas-ruta/${hojaRutaId}/intercambiar-firmas`);
    return r.message;
  },

  async resumenHojasAlumno(rut: string) {
    const r = await ApiClient.get(`/admin/hojas-ruta/alumno/${rut}/resumen`);
    return dataAsMap(r);
  },

  // ---------------- Auditoría de horas / hojas de ruta faltantes ----------------
  async auditoriaHoras(params: { desde?: string; hasta?: string } = {}) {
    const r = await ApiClient.get('/admin/vehiculos/auditoria-horas', {
      ...(params.desde ? { fecha_desde: params.desde } : {}),
      ...(params.hasta ? { fecha_hasta: params.hasta } : {}),
    });
    return dataAsMap(r);
  },

  /** Hoja de ruta de una clase realizada. Si no existe, lanza 404 con data.puede_crear_hoja. */
  async hojaRutaDeClase(agendaId: number): Promise<number> {
    const r = await ApiClient.get(`/admin/agenda/${agendaId}/hoja-ruta`);
    return Number(dataAsMap(r).hoja_ruta_id);
  },

  async formularioHojaFaltante(agendaId: number) {
    const r = await ApiClient.get(`/admin/agenda/${agendaId}/hoja-ruta-faltante`);
    return dataAsMap(r);
  },

  async crearHojaFaltante(agendaId: number, datos: Record<string, unknown>) {
    const r = await ApiClient.post(`/admin/agenda/${agendaId}/hoja-ruta-faltante`, datos);
    return { hojaRutaId: Number(dataAsMap(r).hoja_ruta_id), mensaje: r.message };
  },
};

/** El backend acepta el HTML del correo en base64 para que el firewall no bloquee etiquetas. */
function aBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  bytes.forEach((b) => {
    binario += String.fromCharCode(b);
  });
  return globalThis.btoa(binario);
}
