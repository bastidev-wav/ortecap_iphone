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

export default function AdminLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="solicitudes/[id]" options={{ title: 'Solicitud' }} />
      <Stack.Screen name="alumnos/nuevo" options={{ title: 'Nuevo alumno' }} />
      <Stack.Screen name="alumnos/[rut]/index" options={{ title: 'Alumno' }} />
      <Stack.Screen name="alumnos/[rut]/editar" options={{ title: 'Editar alumno' }} />
      <Stack.Screen name="instructores/index" options={{ title: 'Instructores' }} />
      <Stack.Screen name="instructores/nuevo" options={{ title: 'Nuevo instructor' }} />
      <Stack.Screen name="instructores/[rut]/editar" options={{ title: 'Editar instructor' }} />
      <Stack.Screen name="vehiculos/index" options={{ title: 'Vehículos' }} />
      <Stack.Screen name="vehiculos/[id]" options={{ title: 'Vehículo' }} />
      <Stack.Screen name="vehiculos/hoja-ruta/[id]" options={{ title: 'Hoja de ruta' }} />
      <Stack.Screen name="mensajeria/index" options={{ title: 'Mensajería' }} />
      <Stack.Screen name="mensajeria/[rut]" options={{ title: 'Chat' }} />
      <Stack.Screen name="cursos" options={{ title: 'Cursos y precios' }} />
      <Stack.Screen name="promociones" options={{ title: 'Promociones' }} />
      <Stack.Screen name="certificados" options={{ title: 'Certificados' }} />
      <Stack.Screen name="reportes" options={{ title: 'Reportes' }} />
      <Stack.Screen name="staff" options={{ title: 'Staff' }} />
      <Stack.Screen name="dispositivos" options={{ title: 'Dispositivos' }} />
    </Stack>
  );
}
