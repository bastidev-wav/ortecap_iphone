import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={AppColors.textSecondary}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.textPrimary,
  },
  inputError: {
    borderColor: AppColors.danger,
  },
  error: {
    color: AppColors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
