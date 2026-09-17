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

export default function InstructorLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="alumnos/[id]" options={{ title: 'Ficha del alumno' }} />
      <Stack.Screen name="vehiculos/hoja-ruta/[id]" options={{ title: 'Hoja de ruta' }} />
      <Stack.Screen name="evaluacion/[agendaId]" options={{ title: 'Evaluación práctica' }} />
    </Stack>
  );
}
