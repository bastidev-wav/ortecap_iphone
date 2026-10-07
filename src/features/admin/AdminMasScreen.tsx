import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { nombreCompleto } from '../../core/auth/types';
import { AppColors } from '../../core/theme/colors';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { MenuDivider, MenuItem } from '../../shared/components/MenuItem';
import { showConfirmDialog } from '../../shared/dialogs';

export function AdminMasScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <ScrollView style={styles.flex}>
      <View style={styles.profileRow}>
        <AppAvatar nombre={user ? nombreCompleto(user) : ''} radius={26} />
        <View style={styles.profileInfo}>
          <Text style={styles.nombre}>{user ? nombreCompleto(user) : ''}</Text>
          <Text style={styles.cargo}>{user?.cargo ?? user?.rol ?? ''}</Text>
        </View>
      </View>
      <Grupo titulo="Matrículas y cursos" />
      <MenuItem icon="calendar-number-outline" label="Agenda de matrículas" onPress={() => router.push('/admin/agenda-matriculas')} />
      <MenuItem icon="book-outline" label="Cursos y precios" onPress={() => router.push('/admin/cursos')} />
      <MenuItem icon="time-outline" label="Horario de referencia" onPress={() => router.push('/admin/horario-referencia')} />
      <MenuItem icon="pricetag-outline" label="Promociones" onPress={() => router.push('/admin/promociones')} />
      <MenuItem icon="ribbon-outline" label="Certificados" onPress={() => router.push('/admin/certificados')} />

      <Grupo titulo="Flota y hojas de ruta" />
      <MenuItem icon="car-outline" label="Vehículos" onPress={() => router.push('/admin/vehiculos')} />
      <MenuItem icon="navigate-circle-outline" label="Rutas abiertas" onPress={() => router.push('/admin/sesiones-abiertas')} />
      <MenuItem icon="search-outline" label="Auditoría de horas" onPress={() => router.push('/admin/auditoria-horas')} />

      <Grupo titulo="Comunicación" />
      <MenuItem icon="chatbubbles-outline" label="Mensajería" onPress={() => router.push('/admin/mensajeria')} />
      <MenuItem icon="mail-outline" label="Correos a alumnos" onPress={() => router.push('/admin/correos')} />
      <MenuItem icon="chatbox-ellipses-outline" label="Buzón de sugerencias" onPress={() => router.push('/admin/buzon')} />

      <Grupo titulo="Administración" />
      <MenuItem icon="person-outline" label="Instructores" onPress={() => router.push('/admin/instructores')} />
      <MenuItem icon="people-outline" label="Personal (Staff)" onPress={() => router.push('/admin/staff')} />
      <MenuItem icon="bar-chart-outline" label="Reportes" onPress={() => router.push('/admin/reportes')} />
      <MenuItem icon="phone-portrait-outline" label="Dispositivos 2FA" onPress={() => router.push('/admin/dispositivos')} />
      <MenuDivider />
      <MenuItem icon="lock-closed-outline" label="Cambiar contraseña" onPress={() => router.push('/cambiar-password')} />
      <MenuItem
        icon="log-out-outline"
        label="Cerrar sesión"
        color={AppColors.danger}
        onPress={async () => {
          const confirmar = await showConfirmDialog({
            title: 'Cerrar sesión',
            message: '¿Estás seguro que quieres cerrar sesión?',
          });
          if (confirmar) await logout();
        }}
      />
    </ScrollView>
  );
}

function Grupo({ titulo }: { titulo: string }) {
  return (
    <>
      <MenuDivider />
      <Text style={styles.grupo}>{titulo.toUpperCase()}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  grupo: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: AppColors.textSecondary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  profileInfo: { flex: 1 },
  nombre: { fontWeight: '800', fontSize: 16, color: AppColors.textPrimary },
  cargo: { color: AppColors.textSecondary, marginTop: 2 },
});
