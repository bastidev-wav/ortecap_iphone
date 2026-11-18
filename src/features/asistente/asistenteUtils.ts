import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React from 'react';

import { AppColors } from '../../core/theme/colors';

/** Ícono del canal por el que escribe la persona. */
export function iconoCanal(canal: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (canal) {
    case 'whatsapp':
      return 'logo-whatsapp';
    case 'messenger':
    case 'facebook':
      return 'logo-facebook';
    case 'instagram':
      return 'logo-instagram';
    default:
      return 'flask-outline';
  }
}

export function colorCanal(canal: string): string {
  switch (canal) {
    case 'whatsapp':
      return '#16A34A';
    case 'messenger':
    case 'facebook':
      return '#2563EB';
    case 'instagram':
      return '#DB2777';
    default:
      return AppColors.textSecondary;
  }
}

/** 'AAAA-MM-DD HH:MM:SS' → "14:05" si es de hoy, "ayer", o "12/10". */
export function cuandoCorto(raw: string): string {
  const f = dayjs(raw);
  if (!raw || !f.isValid()) return '';
  const dif = dayjs().startOf('day').diff(f.startOf('day'), 'day');
  if (dif === 0) return f.format('HH:mm');
  if (dif === 1) return 'ayer';
  return f.format('DD/MM');
}
