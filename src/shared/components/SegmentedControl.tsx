import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

export function SegmentedControl({
  options,
  selectedIndex,
  onChange,
}: {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}) {
  return (
    <View style={styles.container}>
      {options.map((label, i) => {
        const selected = i === selectedIndex;
        return (
          <TouchableOpacity key={label} style={[styles.segment, selected && styles.segmentSelected]} onPress={() => onChange(i)}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AppColors.background,
    borderRadius: Radii.md,
    padding: 4,
    margin: 12,
  },
  segment: { flex: 1, paddingVertical: 8, borderRadius: Radii.sm, alignItems: 'center' },
  segmentSelected: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  label: { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary },
  labelSelected: { color: AppColors.textPrimary },
});
