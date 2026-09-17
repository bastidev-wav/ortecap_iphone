import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { showConfirmDialog } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminDispositivosScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.dispositivos());

  const revocar = async (id: number) => {
    const confirmar = await showConfirmDialog({
      title: 'Revocar dispositivo',
      message: 'Ese dispositivo tendrá que verificar su identidad con 2FA nuevamente la próxima vez.',
    });
    if (!confirmar) return;
    try {
      await AdminRepository.revocarDispositivo(id);
      showToast('Dispositivo revocado.');
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(dispositivos) => {
        if (dispositivos.length === 0) return <EmptyView message="No hay dispositivos recordados." icon="phone-portrait-outline" />;
        return (
          <FlatList
            data={dispositivos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: d }) => (
              <Card style={styles.itemCard}>
                <Ionicons name="phone-portrait-outline" size={22} color={AppColors.primary} />
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>
                    {d.nombres as string} {(d.apellidos as string) ?? ''}
                  </Text>
                  <Text style={styles.itemSubtitle}>IP: {String(d.ip_address ?? '-')}</Text>
                </View>
                <TouchableOpacity onPress={() => revocar(d.id as number)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={AppColors.danger} />
                </TouchableOpacity>
              </Card>
            )}
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
