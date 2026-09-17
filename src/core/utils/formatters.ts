import dayjs from 'dayjs';

/**
 * Formatea un RUT limpio (ej. "154885285" o "20891717k") a formato legible
 * con puntos y guión: "15.488.528-5".
 */
export function formatRut(rutLimpio: string): string {
  if (!rutLimpio) return '';
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  let out = '';
  for (let i = 0; i < cuerpo.length; i++) {
    const posicionDesdeElFinal = cuerpo.length - i;
    out += cuerpo[i];
    if (posicionDesdeElFinal > 1 && posicionDesdeElFinal % 3 === 1) {
      out += '.';
    }
  }
  return `${out}-${dv.toUpperCase()}`;
}

/**
 * Formatea un monto en pesos chilenos: 180000 -> "$180.000". Acepta tanto
 * números como strings numéricos, para no romper la app si algún endpoint
 * devuelve el valor como texto.
 */
export function formatCLP(monto: unknown): string {
  if (monto === null || monto === undefined) return '$0';
  const numero = typeof monto === 'number' ? monto : Number(monto) || 0;
  const redondeado = Math.round(numero);
  const conSeparadores = Math.abs(redondeado)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${redondeado < 0 ? '-' : ''}$${conSeparadores}`;
}

/** Acepta tanto "2026-08-22" como "2026-08-22 00:00:00". */
function parseFechaBackend(raw?: string | null): dayjs.Dayjs | null {
  if (!raw) return null;
  const d = dayjs(raw.length > 10 ? raw.substring(0, 10) : raw);
  return d.isValid() ? d : null;
}

export function formatFecha(raw?: string | null): string {
  const d = parseFechaBackend(raw);
  return d ? d.format('DD/MM/YYYY') : '-';
}

export function formatFechaHora(raw?: string | null): string {
  if (!raw) return '-';
  const d = dayjs(raw);
  return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : raw;
}

/** [raw] en formato "HH:mm:ss" -> "HH:mm". */
export function formatHora(raw?: string | null): string {
  if (!raw) return '-';
  return raw.length >= 5 ? raw.substring(0, 5) : raw;
}
