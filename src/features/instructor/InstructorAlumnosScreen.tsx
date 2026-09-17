import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { InstructorRepository } from './instructorRepository';

export function InstructorAlumnosScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.alumnos());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(alumnos) => {
        if (alumnos.length === 0) return <EmptyView message="Aún no tienes alumnos asignados." icon="school-outline" />;
        return (
          <FlatList
            data={alumnos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: a }) => (
              <TouchableOpacity onPress={() => router.push(`/instructor/alumnos/${a.id}`)}>
                <Card style={styles.itemCard}>
                  <AppAvatar nombre={String(a.nombres ?? '?')} />
                  <View style={styles.flex1}>
                    <Text style={styles.itemTitle}>
                      {a.nombres as string} {(a.apellidos as string) ?? ''}
                    </Text>
                    <Text style={styles.itemSubtitle}>{String(a.curso_nombre ?? '')}</Text>
                  </View>
                  <AutoStatusBadge estado={String(a.estado ?? '')} />
                </Card>
              </TouchableOpacity>
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
