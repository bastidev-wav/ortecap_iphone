import dayjs from 'dayjs';

/** Documentos del vehículo con fecha de vencimiento (columna del servidor → nombre). */
export const DOCUMENTOS_VEHICULO: Record<string, string> = {
  fecha_revision_tecnica: 'Revisión técnica',
  fecha_emision_gases: 'Emisión de gases',
  fecha_soap: 'SOAP',
  fecha_permiso_circulacion: 'Permiso de circulación',
  fecha_poliza: 'Póliza de seguro',
};

/** 'AAAA-MM-DD' (o con hora) → Date, o null si viene vacío o inválido. */
export function fechaDeServidor(valor: unknown): Date | null {
  const s = String(valor ?? '');
  if (s.length < 10 || s.startsWith('0000')) return null;
  const d = dayjs(s.substring(0, 10));
  return d.isValid() ? d.toDate() : null;
}

/** Date → 'AAAA-MM-DD' ('' si no hay fecha). */
export function fechaParaServidor(f: Date | null): string {
  return f ? dayjs(f).format('YYYY-MM-DD') : '';
}

export function entero(v: unknown): number {
  return parseInt(String(v ?? '').split('.')[0], 10) || 0;
}
