import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppConfig } from '../../core/config/appConfig';
import { AppColors } from '../../core/theme/colors';
import { AppLogo } from '../../shared/components/AppLogo';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <AppLogo size={96} sobreFondoOscuro />
      <Text style={styles.title}>{AppConfig.appName}</Text>
      <Text style={styles.subtitle}>Escuela de Conductores</Text>
      <ActivityIndicator color="#FFFFFF" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  spinner: {
    marginTop: 40,
  },
});
