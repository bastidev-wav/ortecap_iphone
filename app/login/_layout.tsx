import { Stack } from 'expo-router';
import React from 'react';

import { AppColors } from '../../src/core/theme/colors';

export default function LoginLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: AppColors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="verify-2fa" />
      <Stack.Screen name="forgot-password" options={{ title: 'Recuperar contraseña' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Nueva contraseña' }} />
    </Stack>
  );
}
