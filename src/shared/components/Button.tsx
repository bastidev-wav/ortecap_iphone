import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

type Variant = 'primary' | 'accent' | 'outline' | 'text';

interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: Variant;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

/**
 * Botón que muestra un spinner mientras onPress (async) está en curso, y se
 * deshabilita automáticamente para evitar doble tap. Equivalente a
 * LoadingButton de la app Flutter.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  destructive = false,
  disabled = false,
  icon,
  style,
  fullWidth = true,
}: ButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onPress();
    } finally {
      setLoading(false);
    }
  };

  const isOutline = variant === 'outline';
  const isText = variant === 'text';
  const isAccent = variant === 'accent';

  const backgroundColor = isOutline || isText ? 'transparent' : destructive ? AppColors.danger : isAccent ? AppColors.accent : AppColors.primary;
  const textColor = isOutline || isText ? (destructive ? AppColors.danger : AppColors.primary) : isAccent ? AppColors.slate : '#FFFFFF';
  const borderColor = isOutline ? (destructive ? AppColors.danger : AppColors.primary) : 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderWidth: isOutline ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        isText && styles.textVariantPadding,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: textColor }, icon ? { marginLeft: 8 } : null]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.md,
  },
  textVariantPadding: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
  },
});
