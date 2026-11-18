import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { useRefetchOnFocus } from '../../core/hooks/useRefetchOnFocus';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { AdminRepository } from './adminRepository';

export function AdminVehiculosScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.vehiculos());
  useRefetchOnFocus(refetch);

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/admin/vehiculos/nuevo')} hitSlop={12} accessibilityLabel="Nuevo vehículo">
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(vehiculos) => {
          if (vehiculos.length === 0) {
            return (
              <EmptyView
                message="No hay vehículos registrados."
                icon="car-outline"
                action={<Button label="Registrar vehículo" fullWidth={false} onPress={() => router.push('/admin/vehiculos/nuevo')} />}
              />
            );
          }
          return (
            <FlatList
              data={vehiculos}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item: v }) => {
                const alertas = (v.alertas as string[]) ?? [];
                return (
                  <TouchableOpacity onPress={() => router.push(`/admin/vehiculos/${v.id}`)}>
                    <Card style={styles.itemCard}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="car-sport-outline" size={22} color={alertas.length > 0 ? AppColors.warning : AppColors.primary} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>
                          {v.marca as string} {v.modelo as string} · {v.patente as string}
                        </Text>
                        <Text style={styles.itemSubtitle}>{alertas.length > 0 ? alertas.join(' · ') : `${v.kilometraje_actual} km`}</Text>
                      </View>
                      <AutoStatusBadge estado={String(v.estado ?? '')} />
                    </Card>
                  </TouchableOpacity>
                );
              }}
            />
          );
        }}
      </AsyncGate>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  listContent: { padding: 12, backgroundColor: AppColors.background },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
