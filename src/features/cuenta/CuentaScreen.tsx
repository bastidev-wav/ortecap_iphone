import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { nombreCompleto } from '../../core/auth/types';
import { AppColors } from '../../core/theme/colors';
import { formatRut } from '../../core/utils/formatters';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { MenuDivider, MenuItem } from '../../shared/components/MenuItem';
import { showConfirmDialog } from '../../shared/dialogs';

type Ruta = Parameters<ReturnType<typeof useRouter>['push']>[0];

interface Opcion {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  etiqueta: string;
  ruta: string;
}

const OPCIONES_ALUMNO: Opcion[] = [
  { icono: 'clipboard-outline', etiqueta: 'Mis evaluaciones', ruta: '/alumno/evaluaciones' },
  { icono: 'ribbon-outline', etiqueta: 'Constancias de asistencia', ruta: '/alumno/constancias' },
  { icono: 'card-outline', etiqueta: 'Pagos', ruta: '/alumno/pagos' },
  { icono: 'chatbox-ellipses-outline', etiqueta: 'Buzón de sugerencias', ruta: '/alumno/buzon' },
];

/** Menú "Mi cuenta" de Alumno e Instructor (Admin usa la pestaña "Más"). */
export function CuentaScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const base = user?.rol === 'instructor' ? '/instructor' : '/alumno';
  const opciones = user?.rol === 'alumno' ? OPCIONES_ALUMNO : [];

  return (
    <ScrollView style={styles.flex}>
      <View style={styles.perfil}>
        <AppAvatar nombre={user ? nombreCompleto(user) : ''} radius={28} />
        <View style={styles.flex1}>
          <Text style={styles.nombre}>{user ? nombreCompleto(user) : ''}</Text>
          <Text style={styles.detalle}>{user?.rut ? formatRut(user.rut) : ''}</Text>
          {user?.correo ? <Text style={styles.detalle}>{user.correo}</Text> : null}
        </View>
      </View>
      <MenuDivider />
      {opciones.map((o) => (
        <MenuItem key={o.ruta} icon={o.icono} label={o.etiqueta} onPress={() => router.push(o.ruta as Ruta)} />
      ))}
      {opciones.length ? <MenuDivider /> : null}
      <MenuItem icon="alarm-outline" label="Recordatorios de clases" onPress={() => router.push(`${base}/recordatorios` as Ruta)} />
      <MenuItem icon="help-circle-outline" label="Ayuda y soporte" onPress={() => router.push('/soporte')} />
      <MenuItem icon="lock-closed-outline" label="Cambiar contraseña" onPress={() => router.push('/cambiar-password')} />
      <MenuDivider />
      <MenuItem
        icon="log-out-outline"
        label="Cerrar sesión"
        color={AppColors.danger}
        onPress={async () => {
          const ok = await showConfirmDialog({ title: 'Cerrar sesión', message: '¿Estás seguro que quieres cerrar sesión?' });
          if (ok) await logout();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  perfil: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  nombre: { fontWeight: '800', fontSize: 16, color: AppColors.textPrimary },
  detalle: { color: AppColors.textSecondary, marginTop: 2, fontSize: 13 },
});
