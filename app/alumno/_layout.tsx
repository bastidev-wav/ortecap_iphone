import { Stack } from 'expo-router';
import React from 'react';

import { AppColors } from '../../src/core/theme/colors';

const headerOptions = {
  headerStyle: { backgroundColor: AppColors.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '800' as const },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
};

export default function AlumnoLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pagos/index" options={{ title: 'Activar mi cuenta' }} />
      <Stack.Screen name="pagos/webpay" options={{ title: 'Pago con Webpay' }} />
      <Stack.Screen name="documentos/contrato" options={{ title: 'Contrato de matrícula' }} />
      <Stack.Screen name="evaluaciones/index" options={{ title: 'Mis evaluaciones' }} />
      <Stack.Screen name="evaluaciones/[id]" options={{ title: 'Detalle de evaluación' }} />
      <Stack.Screen name="simulador/index" options={{ title: 'Simulador teórico' }} />
      <Stack.Screen name="simulador/examen" options={{ title: 'Examen teórico' }} />
    </Stack>
  );
}
