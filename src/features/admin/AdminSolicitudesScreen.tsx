import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFecha } from '../../core/utils/formatters';
import { dataAsList } from '../../core/api/apiTypes';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { AdminRepository } from './adminRepository';

const ESTADOS = ['pendiente', 'contactado', 'matriculado', 'rechazado'];

function capitalizar(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function AdminSolicitudesScreen() {
  const router = useRouter();
  const [estado, setEstado] = useState('pendiente');
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.solicitudes({ estado }), [estado]);

  return (
    <View style={styles.flex}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {ESTADOS.map((e) => {
          const selected = e === estado;
          return (
            <TouchableOpacity key={e} onPress={() => setEstado(e)} style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{capitalizar(e)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(result) => {
          const items = dataAsList(result);
          if (items.length === 0) return <EmptyView message="No hay solicitudes en este estado." icon="mail-unread-outline" />;
          return (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item: s }) => (
                <TouchableOpacity onPress={() => router.push(`/admin/solicitudes/${s.id}`)}>
                  <Card style={styles.itemCard}>
                    <AppAvatar nombre={String(s.nombres ?? '?')} />
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>
                        {String(s.nombres ?? '')} {String(s.apellidos ?? '')}
                      </Text>
                      <Text style={styles.itemSubtitle}>
                        {String(s.curso_nombre ?? s.curso_interes ?? '')} · {String(s.sede_nombre ?? '')}
                      </Text>
                    </View>
                    <Text style={styles.itemDate}>{formatFecha(s.fecha_solicitud as string)}</Text>
                  </Card>
                </TouchableOpacity>
              )}
            />
          );
        }}
      </AsyncGate>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  chipTextSelected: { color: '#FFFFFF' },
  listContent: { padding: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  itemDate: { fontSize: 12, color: AppColors.textSecondary },
});
