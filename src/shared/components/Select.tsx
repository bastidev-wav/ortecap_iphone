import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

export interface SelectOption<T> {
  label: string;
  value: T;
}

interface SelectProps<T> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

/** Selector estilo dropdown, envoltorio de @react-native-picker/picker. */
export function Select<T extends string | number>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.pickerWrap}>
        <Picker selectedValue={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((opt) => (
            <Picker.Item key={String(opt.value)} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  pickerWrap: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});
