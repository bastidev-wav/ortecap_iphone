import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFecha } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { AutoStatusBadge, StatusBadge } from '../../shared/components/StatusBadge';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoEvaluacionesScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.evaluaciones());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(evaluaciones) => {
        if (evaluaciones.length === 0) return <EmptyView message="Aún no tienes evaluaciones prácticas." icon="clipboard-outline" />;
        return (
          <FlatList
            data={evaluaciones}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: e }) => {
              const necesitaFirma = e.firma_alumno_img == null && e.estado === 'finalizada';
              return (
                <TouchableOpacity onPress={() => router.push(`/alumno/evaluaciones/${e.id}`)}>
                  <Card style={styles.itemCard}>
                    <Ionicons name="navigate-outline" size={22} color={necesitaFirma ? AppColors.warning : AppColors.primary} />
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>
                        {formatFecha(e.fecha as string)} · {e.nombres as string} {(e.apellidos as string) ?? ''}
                      </Text>
                      <Text style={styles.itemSubtitle}>
                        {String(e.patente ?? '')} · {String(e.resultado_practico ?? 'En curso')}
                      </Text>
                    </View>
                    {necesitaFirma ? <StatusBadge label="Firma pendiente" color={AppColors.warning} /> : <AutoStatusBadge estado={String(e.estado ?? '')} />}
                  </Card>
                </TouchableOpacity>
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
  itemTitle: { fontWeight: '700', fontSize: 13, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
