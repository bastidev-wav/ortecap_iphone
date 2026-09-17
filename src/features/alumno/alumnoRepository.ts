import { ApiClient } from '../../core/api/apiClient';
import { dataAsList, dataAsMap } from '../../core/api/apiTypes';

export const AlumnoRepository = {
  // ---------------- Dashboard / Agenda ----------------
  async dashboard() {
    const r = await ApiClient.get('/alumno/dashboard');
    return dataAsMap(r);
  },

  async disponibles(params: { tipo?: string; fecha?: string } = {}) {
    const r = await ApiClient.get('/alumno/agenda/disponibles', {
      ...(params.tipo ? { tipo: params.tipo } : {}),
      ...(params.fecha ? { fecha: params.fecha } : {}),
    });
    return dataAsMap(r);
  },

  async reservar(bloquesIds: number[]): Promise<number> {
    const r = await ApiClient.post('/alumno/agenda/reservar', { bloques_ids: bloquesIds });
    return dataAsMap(r).reservados as number;
  },

  async cancelarClase(idBloque: number) {
    await ApiClient.delete(`/alumno/agenda/${idBloque}`);
  },

  // ---------------- Horario de referencia (solo consulta) ----------------
  async horarioReferencia() {
    const r = await ApiClient.get('/alumno/horario-referencia');
    return dataAsMap(r);
  },

  // ---------------- Nota Moodle (solo lectura) ----------------
  async miNotaMoodle() {
    const r = await ApiClient.get('/alumno/moodle/nota');
    return dataAsMap(r);
  },

  // ---------------- Pagos ----------------
  async pagos() {
    const r = await ApiClient.get('/alumno/pagos');
    return dataAsMap(r);
  },

  async pagarPorTransferencia(comprobante: { uri: string; fileName?: string; mimeType?: string }) {
    await ApiClient.uploadMultipart('/alumno/pagos/transferencia', {
      files: [{ fieldName: 'comprobante', uri: comprobante.uri, fileName: comprobante.fileName, mimeType: comprobante.mimeType }],
    });
  },

  async iniciarWebpay() {
    const r = await ApiClient.post('/alumno/webpay/iniciar');
    return dataAsMap(r);
  },

  // ---------------- Documentos / Contrato ----------------
  async documentos() {
    const r = await ApiClient.get('/alumno/documentos');
    return dataAsMap(r);
  },

  async guardarResena(params: {
    calificacion: number;
    comentario: string;
    obtuvoLicencia?: boolean;
    video?: { uri: string; fileName?: string; mimeType?: string };
  }) {
    await ApiClient.uploadMultipart('/alumno/documentos/resena', {
      fields: {
        calificacion: params.calificacion,
        comentario: params.comentario,
        obtuvo_licencia: params.obtuvoLicencia ?? false,
      },
      files: params.video
        ? [{ fieldName: 'video', uri: params.video.uri, fileName: params.video.fileName, mimeType: params.video.mimeType }]
        : [],
    });
  },

  async contrato(contratoId?: number) {
    const r = await ApiClient.get('/alumno/contrato', contratoId ? { contrato_id: contratoId } : undefined);
    return dataAsMap(r);
  },

  async firmarContrato(params: { contratoId?: number; matriculaId?: number; firmaBase64: string }) {
    await ApiClient.post('/alumno/contrato/firmar', {
      ...(params.contratoId ? { contrato_id: params.contratoId } : {}),
      ...(params.matriculaId ? { matricula_id: params.matriculaId } : {}),
      firma_base64: params.firmaBase64,
    });
  },

  async certificado() {
    const r = await ApiClient.get('/alumno/certificado');
    return dataAsMap(r);
  },

  // ---------------- Evaluaciones ----------------
  async evaluaciones() {
    const r = await ApiClient.get('/alumno/evaluaciones');
    return dataAsList(r);
  },

  async evaluacionDetalle(id: number) {
    const r = await ApiClient.get(`/alumno/evaluaciones/${id}`);
    return dataAsMap(r);
  },

  async firmarEvaluacion(params: { idRuta: number; firmaAlumno: string }) {
    await ApiClient.post('/alumno/evaluaciones/firmar', {
      id_ruta: params.idRuta,
      firma_alumno: params.firmaAlumno,
    });
  },

  // ---------------- Académico ----------------
  async progreso() {
    const r = await ApiClient.get('/alumno/academico/progreso');
    return dataAsMap(r);
  },

  async perfil() {
    const r = await ApiClient.get('/alumno/academico/perfil');
    return dataAsMap(r);
  },

  // ---------------- Simulador ----------------
  async simuladorResumen() {
    const r = await ApiClient.get('/alumno/simulador');
    return dataAsMap(r);
  },

  async iniciarExamen(tema?: number) {
    const r = await ApiClient.get('/alumno/simulador/iniciar', tema !== undefined ? { tema } : undefined);
    return dataAsMap(r);
  },

  async finalizarExamen(respuestas: Record<string, number>) {
    const r = await ApiClient.post('/alumno/simulador/finalizar', { respuestas });
    return dataAsMap(r);
  },

  // ---------------- Mensajería ----------------
  async mensajeria() {
    const r = await ApiClient.get('/alumno/mensajeria');
    return dataAsList(r);
  },

  async enviarMensaje(mensaje: string) {
    await ApiClient.post('/alumno/mensajeria/enviar', { mensaje });
  },

  async mensajesNuevos(): Promise<number> {
    const r = await ApiClient.get('/alumno/mensajeria/check-nuevos');
    return dataAsMap(r).unread as number;
  },
};
