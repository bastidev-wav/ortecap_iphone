import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

/** Botón del header que abre "Mi cuenta" (recordatorios, soporte, contraseña, cerrar sesión). */
export function HeaderCuentaButton({ ruta }: { ruta: '/alumno/cuenta' | '/instructor/cuenta' }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(ruta)} hitSlop={12} style={{ marginRight: 4 }} accessibilityLabel="Mi cuenta">
      <Ionicons name="person-circle-outline" size={26} color="#FFFFFF" />
    </TouchableOpacity>
  );
}
