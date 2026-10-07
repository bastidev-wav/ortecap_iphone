import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AppColors } from '../../../src/core/theme/colors';
import { HeaderCuentaButton } from '../../../src/shared/components/HeaderCuentaButton';

export default function InstructorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: AppColors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Mis clases de hoy',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
          headerRight: () => <HeaderCuentaButton ruta="/instructor/cuenta" />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Mi agenda',
          tabBarLabel: 'Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="alumnos"
        options={{
          title: 'Mis alumnos',
          tabBarLabel: 'Alumnos',
          tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vehiculos"
        options={{
          title: 'Vehículos',
          tabBarLabel: 'Vehículo',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
