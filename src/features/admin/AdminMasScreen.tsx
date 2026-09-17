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
      <MenuDivider />
      <MenuItem icon="book-outline" label="Cursos y precios" onPress={() => router.push('/admin/cursos')} />
      <MenuItem icon="pricetag-outline" label="Promociones" onPress={() => router.push('/admin/promociones')} />
      <MenuItem icon="car-outline" label="Vehículos" onPress={() => router.push('/admin/vehiculos')} />
      <MenuItem icon="chatbubbles-outline" label="Mensajería" onPress={() => router.push('/admin/mensajeria')} />
      <MenuItem icon="ribbon-outline" label="Certificados" onPress={() => router.push('/admin/certificados')} />
      <MenuItem icon="bar-chart-outline" label="Reportes" onPress={() => router.push('/admin/reportes')} />
      <MenuItem icon="people-outline" label="Personal (Staff)" onPress={() => router.push('/admin/staff')} />
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  profileInfo: { flex: 1 },
  nombre: { fontWeight: '800', fontSize: 16, color: AppColors.textPrimary },
  cargo: { color: AppColors.textSecondary, marginTop: 2 },
});
