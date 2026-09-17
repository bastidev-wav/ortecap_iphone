import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '../../core/theme/colors';

/** Avatar circular con las iniciales del nombre. */
export function AppAvatar({ nombre, radius = 22, color }: { nombre: string; radius?: number; color?: string }) {
  const partes = nombre.trim().split(/\s+/);
  const primera = partes[0]?.[0] ?? '?';
  const segunda = partes.length > 1 ? partes[1]?.[0] ?? '' : '';
  const iniciales = (primera + segunda).toUpperCase();
  const tint = color ?? AppColors.primary;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: `${tint}1F`,
        },
      ]}
    >
      <Text style={{ color: tint, fontWeight: '800', fontSize: radius * 0.65 }}>{iniciales}</Text>
    </View>
  );
}

/** Fila etiqueta-valor, usada en pantallas de detalle. */
export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value && value.length > 0 ? value : '-'}</Text>
    </View>
  );
}

/** Título de sección con espaciado consistente. */
export function SectionHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoLabel: {
    width: 130,
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
});
