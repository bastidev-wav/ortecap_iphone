import { ApiClient } from '../../core/api/apiClient';
import { dataAsList, dataAsMap } from '../../core/api/apiTypes';

export const InstructorRepository = {
  // ---------------- Dashboard ----------------
  async dashboard() {
    const r = await ApiClient.get('/instructor/dashboard');
    return dataAsMap(r);
  },

  async finalizarClase(idClase: number) {
    await ApiClient.post('/instructor/dashboard/finalizar-clase', { id_clase: idClase });
  },

  // ---------------- Agenda ----------------
  async agenda(fecha?: string) {
    const r = await ApiClient.get('/instructor/agenda', fecha ? { fecha } : undefined);
    return dataAsMap(r);
  },

  async eliminarHorario(id: number) {
    await ApiClient.delete(`/instructor/agenda/${id}`);
  },

  // ---------------- Alumnos ----------------
  async alumnos() {
    const r = await ApiClient.get('/instructor/alumnos');
    return dataAsList(r);
  },

  async alumnoDetalle(matriculaId: number) {
    const r = await ApiClient.get(`/instructor/alumnos/${matriculaId}`);
    return dataAsMap(r);
  },

  async actualizarEstado(matriculaId: number, campo: string, estado: string) {
    await ApiClient.patch(`/instructor/alumnos/matricula/${matriculaId}/estado`, { campo, estado });
  },

  async guardarComentario(params: { alumnoRut: string; comentario: string }) {
    await ApiClient.post('/instructor/alumnos/comentario', {
      alumno_rut: params.alumnoRut,
      comentario: params.comentario,
    });
  },

  // ---------------- Vehículos / Hoja de ruta ----------------
  async vehiculosDashboard() {
    const r = await ApiClient.get('/instructor/vehiculos');
    return dataAsMap(r);
  },

  async iniciarRuta(datos: Record<string, unknown>): Promise<number> {
    const r = await ApiClient.post('/instructor/vehiculos/iniciar', datos);
    return dataAsMap(r).hoja_ruta_id as number;
  },

  async registrarPuntoGps(params: { idRuta: number; lat: number; lng: number }) {
    await ApiClient.post('/instructor/vehiculos/punto-gps', {
      id_ruta: params.idRuta,
      lat: params.lat,
      lng: params.lng,
    });
  },

  async finalizarRuta(datos: Record<string, unknown>) {
    await ApiClient.post('/instructor/vehiculos/finalizar', datos);
  },

  /** Cancela una ruta iniciada por error: libera el vehículo y devuelve la clase a "reservado". */
  async cancelarRuta(idRuta: number) {
    const r = await ApiClient.post('/instructor/vehiculos/cancelar', { id_ruta: idRuta });
    return r.message;
  },

  /** Corrige fecha / alumno / km de salida de una ruta en curso. */
  async actualizarInicioRuta(params: { idRuta: number; kmInicio: number; fecha?: string; alumnoRut?: string | null }) {
    const r = await ApiClient.post('/instructor/vehiculos/actualizar-inicio', {
      id_ruta: params.idRuta,
      km_inicio: params.kmInicio,
      ...(params.fecha ? { fecha: params.fecha } : {}),
      alumno_rut: params.alumnoRut ?? '',
    });
    return r.message;
  },

  /** Autoguardado del cierre de ruta: lo llenado no se pierde si se corta la conexión. */
  async guardarBorradorRuta(datos: Record<string, unknown>) {
    await ApiClient.post('/instructor/vehiculos/guardar-borrador', datos);
  },

  async historialRutas() {
    const r = await ApiClient.get('/instructor/vehiculos/historial');
    return dataAsList(r);
  },

  async mantenimientoVehiculo(id: number) {
    const r = await ApiClient.get(`/instructor/vehiculos/${id}/mantenimiento`);
    return dataAsMap(r);
  },

  async guardarMantenimiento(id: number, datos: Record<string, unknown>) {
    await ApiClient.post(`/instructor/vehiculos/${id}/mantenimiento`, datos);
  },

  async hojaRutaDetalle(id: number) {
    const r = await ApiClient.get(`/instructor/vehiculos/hojas-ruta/${id}`);
    return dataAsMap(r);
  },

  // ---------------- Evaluación práctica ----------------
  async evaluacionFormulario(agendaId: number) {
    const r = await ApiClient.get(`/instructor/evaluacion/${agendaId}`);
    return dataAsMap(r);
  },

  async guardarEvaluacion(datos: Record<string, unknown>) {
    const r = await ApiClient.post('/instructor/evaluacion', datos);
    return dataAsMap(r);
  },
};
