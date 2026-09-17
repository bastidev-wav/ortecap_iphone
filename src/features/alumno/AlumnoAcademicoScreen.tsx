import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { nombreCompleto } from '../../core/auth/types';
import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFechaHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar, SectionHeader } from '../../shared/components/CommonWidgets';
import { LoadingView } from '../../shared/components/StateViews';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { AlumnoRepository } from './alumnoRepository';

const NOMBRES_METRICAS: Record<string, string> = {
  estacionamiento: 'Estacionamiento',
  embrague: 'Uso del embrague',
  senaletica: 'Señalética',
  velocidad: 'Control de velocidad',
  virajes: 'Virajes',
};

function NotaMoodleCard() {
  const { data, loading, error } = useApiQuery(() => AlumnoRepository.miNotaMoodle());

  if (loading) return <LoadingView />;
  const cursos = (!error && (data?.cursos as Record<string, unknown>[])) || [];
  if (error || cursos.length === 0) {
    return (
      <Card>
        <Text style={styles.noDisponible}>Aún no disponible.</Text>
      </Card>
    );
  }
  return (
    <Card>
      {cursos.map((curso, i) => (
        <View key={i} style={styles.moodleRow}>
          <View style={styles.flex1}>
            <Text style={styles.itemTitle}>{String(curso.curso_nombre ?? '')}</Text>
            <Text style={styles.itemSubtitle}>
              {curso.nota_maxima != null ? `Nota final: ${curso.nota_curso ?? '-'} / ${curso.nota_maxima}` : 'Aún sin nota registrada'}
            </Text>
          </View>
          <Ionicons name="school-outline" size={20} color={AppColors.primary} />
        </View>
      ))}
    </Card>
  );
}

export function AlumnoAcademicoScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.progreso());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const matricula = datos.matricula as Record<string, unknown>;
        const metricas = (datos.metricas as Record<string, number>) ?? {};
        const comentarios = (datos.comentarios as Record<string, unknown>[]) ?? [];
        const progresoGlobal = Number(datos.progreso_global ?? 0);

        return (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          >
            <View style={styles.header}>
              <AppAvatar nombre={user ? nombreCompleto(user) : ''} radius={28} />
              <View style={styles.flex1}>
                <Text style={styles.nombre}>{user ? nombreCompleto(user) : ''}</Text>
                <Text style={styles.curso}>{String(matricula.curso_nombre ?? '')}</Text>
              </View>
            </View>

            <Card>
              <View style={styles.progresoHeader}>
                <Text style={styles.progresoLabel}>Avance global</Text>
                <Text style={styles.progresoValor}>{progresoGlobal}%</Text>
              </View>
              <ProgressBar value={progresoGlobal / 100} />
            </Card>

            <SectionHeader title="Habilidades evaluadas" />
            <Card>
              {Object.entries(metricas).map(([key, value], i) => (
                <View key={key} style={i > 0 ? styles.metricaRow : undefined}>
                  <View style={styles.metricaHeader}>
                    <Text style={styles.metricaLabel}>{NOMBRES_METRICAS[key] ?? key}</Text>
                    <Text style={styles.metricaValor}>{value}%</Text>
                  </View>
                  <ProgressBar value={value / 100} color={AppColors.info} />
                </View>
              ))}
            </Card>

            <SectionHeader title="Nota Moodle" />
            <NotaMoodleCard />

            <SectionHeader title="Notas de tu instructor" />
            {comentarios.length === 0 ? (
              <Text style={styles.emptyText}>Aún no hay notas registradas.</Text>
            ) : (
              comentarios.map((c, i) => (
                <Card key={i} style={styles.comentarioCard}>
                  <Text style={styles.comentarioTexto}>{String(c.comentario ?? '')}</Text>
                  <Text style={styles.comentarioFecha}>{formatFechaHora(c.created_at as string)}</Text>
                </Card>
              ))
            )}
          </ScrollView>
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1, marginLeft: 12 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  nombre: { fontSize: 16, fontWeight: '800', color: AppColors.textPrimary },
  curso: { color: AppColors.textSecondary, marginTop: 2 },
  progresoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progresoLabel: { fontWeight: '700', color: AppColors.textPrimary },
  progresoValor: { fontWeight: '800', color: AppColors.primary },
  metricaRow: { marginTop: 12 },
  metricaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metricaLabel: { fontSize: 13, color: AppColors.textPrimary },
  metricaValor: { fontSize: 12, fontWeight: '700', color: AppColors.textPrimary },
  noDisponible: { color: AppColors.textSecondary, fontSize: 13 },
  moodleRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  comentarioCard: { marginBottom: 8 },
  comentarioTexto: { fontSize: 13, color: AppColors.textPrimary },
  comentarioFecha: { fontSize: 11, color: AppColors.textSecondary, marginTop: 4 },
});
