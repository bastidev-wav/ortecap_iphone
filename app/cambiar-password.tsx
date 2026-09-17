import { Stack } from 'expo-router';
import React from 'react';

import { ChangePasswordScreen } from '../src/features/auth/ChangePasswordScreen';
import { AppColors } from '../src/core/theme/colors';

export default function CambiarPasswordRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cambiar contraseña',
          headerStyle: { backgroundColor: AppColors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
        }}
      />
      <ChangePasswordScreen />
    </>
  );
}
