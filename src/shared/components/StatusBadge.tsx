import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

interface StatusBadgeProps {
  label: string;
  color: string;
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1F` }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const ESTADOS_OK = ['aprobado', 'disponible', 'emitido', 'realizada', 'cursando', 'activo', 'matriculado'];
const ESTADOS_MAL = ['reprobado', 'rechazado', 'bloqueado', 'inactivo', 'vencido'];
const ESTADOS_WARNING = ['pendiente', 'pendiente_pago', 'en_curso', 'inicializado'];
const ESTADOS_INFO = ['reservado', 'en_ruta', 'finalizada'];

function formatearEstado(estado: string): string {
  return estado
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Constructor de conveniencia para estados típicos de texto plano
 * (aprobado/pendiente/reprobado/cursando/etc.), mapeando a un color
 * razonable automáticamente. Equivalente a StatusBadge.auto() en Flutter.
 */
export function AutoStatusBadge({ estado }: { estado: string }) {
  const normalizado = estado.toLowerCase();
  let color: string = AppColors.textSecondary;
  if (ESTADOS_OK.includes(normalizado)) color = AppColors.success;
  else if (ESTADOS_MAL.includes(normalizado)) color = AppColors.danger;
  else if (ESTADOS_WARNING.includes(normalizado)) color = AppColors.warning;
  else if (ESTADOS_INFO.includes(normalizado)) color = AppColors.info;

  return <StatusBadge label={formatearEstado(estado)} color={color} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
