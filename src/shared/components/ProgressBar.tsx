import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppColors } from '../../core/theme/colors';

export function ProgressBar({ value, color = AppColors.success }: { value: number; color?: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 8,
    backgroundColor: AppColors.background,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
