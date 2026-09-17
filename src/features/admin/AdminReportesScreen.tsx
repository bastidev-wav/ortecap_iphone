import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatCLP } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { AdminRepository } from './adminRepository';

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <Card style={styles.kpiCard}>
      <Ionicons name={icon} size={22} color={AppColors.primary} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  );
}

export function AdminReportesScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.reportes());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const kpis = datos.kpis as Record<string, unknown>;
        const porCurso = (datos.alumnos_por_curso as Record<string, unknown>[]) ?? [];
        return (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          >
            <View style={styles.row}>
              <View style={styles.flex1}>
                <KpiCard label="Alumnos totales" value={String(kpis.total_alumnos ?? 0)} icon="school-outline" />
              </View>
              <View style={styles.flex1}>
                <KpiCard label="Solicitudes pendientes" value={String(kpis.solicitudes_pendientes ?? 0)} icon="mail-unread-outline" />
              </View>
            </View>
            <KpiCard label="Ingresos del mes" value={formatCLP(kpis.ingresos_mes)} icon="cash-outline" />

            <SectionHeader title="Alumnos por curso" />
            {porCurso.map((c, i) => (
              <Card key={i} style={styles.cursoRow}>
                <Text style={styles.cursoNombre}>{String(c.nombre)}</Text>
                <Text style={styles.cursoTotal}>{String(c.total)}</Text>
              </Card>
            ))}
          </ScrollView>
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  flex1: { flex: 1 },
  kpiCard: { alignItems: 'flex-start', marginBottom: 12 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: AppColors.textPrimary, marginTop: 8 },
  kpiLabel: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  cursoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cursoNombre: { color: AppColors.textPrimary, flex: 1 },
  cursoTotal: { fontWeight: '800', color: AppColors.textPrimary },
});
