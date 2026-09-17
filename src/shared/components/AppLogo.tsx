import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppConfig } from '../../core/config/appConfig';
import { AppColors, Radii } from '../../core/theme/colors';

/**
 * Logo oficial de Ortecap (cargado desde la web). Si por algún motivo no
 * carga, muestra un ícono de respaldo con los colores de marca en vez de
 * dejar un hueco vacío o un ícono roto.
 */
export function AppLogo({ size = 72, sobreFondoOscuro = false }: { size?: number; sobreFondoOscuro?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: sobreFondoOscuro ? '#FFFFFF' : AppColors.background,
        },
      ]}
    >
      {state === 'error' ? (
        <Ionicons
          name="car-sport-outline"
          size={size * 0.52}
          color={sobreFondoOscuro ? AppColors.primary : AppColors.textSecondary}
        />
      ) : (
        <Image
          source={{ uri: AppConfig.logoUrl }}
          style={{ width: size * 0.85, height: size * 0.85 }}
          contentFit="contain"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
        />
      )}
      {state === 'loading' ? (
        <ActivityIndicator
          style={StyleSheet.absoluteFill}
          size="small"
          color={sobreFondoOscuro ? AppColors.primary : AppColors.textSecondary}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
