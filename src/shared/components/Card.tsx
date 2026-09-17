import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
  },
});
