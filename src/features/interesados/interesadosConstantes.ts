import { AppColors } from '../../core/theme/colors';

export const ESTADOS_INTERESADO: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  en_seguimiento: 'En seguimiento',
  matriculado: 'Matriculado',
  no_interesado: 'No interesado',
};

/** Estados con el caso todavía abierto (los que pueden tener un seguimiento pendiente). */
export const ESTADOS_ABIERTOS = ['nuevo', 'contactado', 'en_seguimiento'];

export const ORIGENES_INTERESADO: Record<string, string> = {
  llamada: 'Llamada',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
  redes_sociales: 'Redes sociales',
  recomendado: 'Recomendado',
  otro: 'Otro',
};

export function colorEstadoInteresado(estado: string): string {
  switch (estado) {
    case 'nuevo':
      return AppColors.info;
    case 'contactado':
      return AppColors.primary;
    case 'en_seguimiento':
      return AppColors.warning;
    case 'matriculado':
      return AppColors.success;
    default:
      return AppColors.textSecondary;
  }
}

export interface OpcionCatalogo {
  id: number;
  nombre: string;
}

export function catalogo(lista: unknown): OpcionCatalogo[] {
  return ((lista as Record<string, unknown>[] | undefined) ?? []).map((x) => ({ id: Number(x.id), nombre: String(x.nombre ?? '') }));
}
