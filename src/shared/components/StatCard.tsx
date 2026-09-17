import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '../../core/theme/colors';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, color, onPress }: StatCardProps) {
  const content = (
    <Card style={styles.card}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.flex}>
      {content}
    </TouchableOpacity>
  );
}

export function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card style={styles.chipCard}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  chipCard: { alignItems: 'center', paddingVertical: 14 },
  value: { fontSize: 20, fontWeight: '800', marginTop: 8, color: AppColors.textPrimary },
  chipValue: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, color: AppColors.textSecondary, textAlign: 'center', marginTop: 2 },
});
