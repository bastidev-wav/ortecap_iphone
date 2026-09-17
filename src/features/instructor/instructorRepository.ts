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
