import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { AdminRepository } from './adminRepository';

export function AdminInstructoresScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.instructores());

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/admin/instructores/nuevo')} hitSlop={12}>
              <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(instructores) => {
          if (instructores.length === 0) return <EmptyView message="No hay instructores registrados." icon="people-outline" />;
          return (
            <FlatList
              data={instructores}
              keyExtractor={(item) => String(item.rut)}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item: ins }) => {
                const activo = ins.activo === 1 || ins.activo === true;
                return (
                  <TouchableOpacity onPress={() => router.push(`/admin/instructores/${ins.rut}/editar`)}>
                    <Card style={styles.itemCard}>
                      <AppAvatar nombre={String(ins.nombres ?? '?')} />
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>
                          {ins.nombres as string} {(ins.apellidos as string) ?? ''}
                        </Text>
                        <Text style={styles.itemSubtitle}>{String(ins.correo ?? '')}</Text>
                      </View>
                      <Ionicons
                        name={activo ? 'checkmark-circle' : 'close-circle'}
                        color={activo ? AppColors.success : AppColors.danger}
                        size={20}
                      />
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
  listContent: { padding: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
