/**
 * Paleta de marca de Ortecap, tomada de los mismos colores que usa el
 * sitio web (botones dorados, azul institucional, etc.) para que la app
 * se sienta coherente con la marca ya conocida por los usuarios.
 */
export const AppColors = {
  primary: '#003782', // azul institucional
  primaryDark: '#00265C',
  accent: '#FBBF24', // dorado (botones destacados)
  slate: '#1E293B',

  background: '#F8FAFC',
  surface: '#FFFFFF',

  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  info: '#2563EB',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',

  // Estados de agenda_clases (mismo mapeo que badge_estado() del backend)
  estadoDisponible: '#16A34A',
  estadoReservado: '#2563EB',
  estadoBloqueado: '#64748B',
  estadoRealizada: '#7C3AED',
} as const;

/**
 * Devuelve el color de estado para un bloque de agenda
 * ('disponible' | 'reservado' | 'bloqueado' | 'realizada'), replicando
 * badge_estado() del backend.
 */
export function colorEstadoAgenda(estado: string): string {
  switch (estado) {
    case 'disponible':
      return AppColors.estadoDisponible;
    case 'reservado':
      return AppColors.estadoReservado;
    case 'bloqueado':
      return AppColors.estadoBloqueado;
    case 'realizada':
      return AppColors.estadoRealizada;
    default:
      return AppColors.textSecondary;
  }
}

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;
