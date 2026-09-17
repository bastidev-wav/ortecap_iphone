import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '../../core/theme/colors';

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
}

export function MenuItem({ icon, label, onPress, color }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color ?? AppColors.textPrimary} />
      <Text style={[styles.label, color ? { color } : null]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
    </TouchableOpacity>
  );
}

export function MenuDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  label: { flex: 1, fontSize: 15, color: AppColors.textPrimary },
  divider: { height: 1, backgroundColor: AppColors.border },
});
