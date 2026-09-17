import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AppColors } from '../../../src/core/theme/colors';
import { HeaderLogoutButton } from '../../../src/shared/components/HeaderLogoutButton';

export default function AlumnoTabsLayout() {
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
          title: 'Mi curso',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
          headerRight: () => <HeaderLogoutButton />,
        }}
      />
      <Tabs.Screen
        name="reservar"
        options={{
          title: 'Reservar clases',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'Mis documentos',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="academico"
        options={{
          title: 'Mi progreso académico',
          tabBarLabel: 'Académico',
          tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mensajeria"
        options={{
          title: 'Mensajería con Ortecap',
          tabBarLabel: 'Mensajes',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
