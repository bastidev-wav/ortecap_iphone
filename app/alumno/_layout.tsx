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
      <Stack.Screen name="constancias/index" options={{ title: 'Constancias de asistencia' }} />
      <Stack.Screen name="constancias/[id]" options={{ title: 'Constancia' }} />
      <Stack.Screen name="buzon" options={{ title: 'Buzón de sugerencias' }} />
      <Stack.Screen name="cuenta" options={{ title: 'Mi cuenta' }} />
      <Stack.Screen name="recordatorios" options={{ title: 'Recordatorios' }} />
    </Stack>
  );
}
