import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { useApiQuery, friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { StatChip } from '../../shared/components/StatCard';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { InstructorRepository } from './instructorRepository';

export function InstructorDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.dashboard());

  const finalizarClase = async (idClase: number) => {
    const confirmar = await showConfirmDialog({
      title: 'Finalizar clase',
      message: '¿Marcar esta clase como realizada?',
    });
    if (!confirmar) return;
    try {
      await InstructorRepository.finalizarClase(idClase);
      refetch();
      showToast('Clase finalizada.');
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refetch} />}
    >
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(dashboard) => {
          const stats = dashboard.stats as Record<string, unknown>;
          const clasesHoy = (dashboard.clases_hoy as Record<string, unknown>[]) ?? [];
          const misCursos = (dashboard.mis_cursos as Record<string, unknown>[]) ?? [];

          return (
            <>
              <Text style={styles.saludo}>Hola, {user?.nombres?.split(' ')[0] ?? ''} 👋</Text>

              <View style={styles.statsRow}>
                <StatChip label="Total hoy" value={String(stats.total_hoy ?? 0)} color={AppColors.primary} />
                <StatChip label="Pendientes" value={String(stats.pendientes_hoy ?? 0)} color={AppColors.warning} />
                <StatChip label="Realizadas" value={String(stats.realizadas_hoy ?? 0)} color={AppColors.success} />
              </View>

              <SectionHeader title="Clases de hoy" />
              {clasesHoy.length === 0 ? (
                <Text style={styles.emptyText}>No tienes clases programadas para hoy.</Text>
              ) : (
                clasesHoy.map((c, i) => (
                  <Card key={i} style={styles.listCard}>
                    <Text style={styles.hora}>{formatHora(c.hora_inicio as string)}</Text>
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>
                        {c.alumno_nombre ? `${c.alumno_nombre} ${c.alumno_apellido ?? ''}` : 'Sin alumno asignado'}
                      </Text>
                      <Text style={styles.itemSubtitle}>{String(c.curso_nombre ?? c.tipo_clase ?? '')}</Text>
                    </View>
                    {c.estado === 'reservado' ? (
                      <TouchableOpacity onPress={() => finalizarClase(c.id as number)} hitSlop={8}>
                        <Ionicons name="checkmark-circle-outline" size={26} color={AppColors.success} />
                      </TouchableOpacity>
                    ) : (
                      <AutoStatusBadge estado={String(c.estado ?? '')} />
                    )}
                  </Card>
                ))
              )}

              {misCursos.length > 0 ? (
                <>
                  <SectionHeader title="Cursos que dictas" />
                  <View style={styles.chipsWrap}>
                    {misCursos.map((curso, i) => (
                      <View key={i} style={styles.chip}>
                        <Text style={styles.chipText}>{String(curso.nombre)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          );
        }}
      </AsyncGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1, marginLeft: 12 },
  content: { padding: 16, paddingBottom: 40 },
  saludo: { fontSize: 20, fontWeight: '800', color: AppColors.textPrimary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  listCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 20, textAlign: 'center' },
  hora: { fontWeight: '800', color: AppColors.primary, width: 48 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: AppColors.background, borderWidth: 1, borderColor: AppColors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '600', color: AppColors.textPrimary },
});
