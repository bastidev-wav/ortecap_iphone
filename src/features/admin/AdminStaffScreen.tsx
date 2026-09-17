import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { showConfirmDialog } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminStaffScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.staff());

  const desactivar = async (persona: Record<string, unknown>) => {
    const confirmar = await showConfirmDialog({
      title: 'Desactivar usuario',
      message: `¿Desactivar a ${persona.nombres}? No podrá volver a iniciar sesión.`,
    });
    if (!confirmar) return;
    try {
      await AdminRepository.desactivarStaff(persona.rut as string);
      showToast('Usuario desactivado.');
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(staff) => {
        if (staff.length === 0) return <EmptyView message="No hay personal registrado." icon="people-outline" />;
        return (
          <FlatList
            data={staff}
            keyExtractor={(item) => String(item.rut)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: s }) => {
              const activo = s.activo === 1 || s.activo === true;
              return (
                <Card style={styles.itemCard}>
                  <AppAvatar nombre={String(s.nombres ?? '?')} />
                  <View style={styles.flex1}>
                    <Text style={styles.itemTitle}>
                      {s.nombres as string} {(s.apellidos as string) ?? ''}
                    </Text>
                    <Text style={styles.itemSubtitle}>
                      {String(s.cargo ?? s.rol ?? '')} · {String(s.correo ?? '')}
                    </Text>
                  </View>
                  {activo ? (
                    <TouchableOpacity onPress={() => desactivar(s)} hitSlop={8}>
                      <Ionicons name="person-remove-outline" size={22} color={AppColors.danger} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="ban-outline" size={20} color={AppColors.textSecondary} />
                  )}
                </Card>
              );
            }}
          />
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 12, backgroundColor: AppColors.background },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
