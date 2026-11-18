import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { useApiQuery, friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { useRefetchOnFocus } from '../../core/hooks/useRefetchOnFocus';
import { AppColors } from '../../core/theme/colors';
import { formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { StatChip } from '../../shared/components/StatCard';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { InstructorRepository } from './instructorRepository';

export function InstructorDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.dashboard());
  // Hoja de ruta iniciada y sin cerrar: lo primero que debe ver el instructor, para no abrir una
  // segunda ni dejarla colgada (igual que el inicio del panel web).
  const { data: vehiculos, refetch: refetchVehiculos } = useApiQuery(() => InstructorRepository.vehiculosDashboard());
  const rutaAbierta = (vehiculos?.ruta_activa as Record<string, unknown> | null | undefined) ?? null;

  const refrescar = useCallback(() => {
    refetch();
    refetchVehiculos();
  }, [refetch, refetchVehiculos]);
  useRefetchOnFocus(refrescar);

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
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refrescar} />}
    >
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(dashboard) => {
          const stats = dashboard.stats as Record<string, unknown>;
          const clasesHoy = (dashboard.clases_hoy as Record<string, unknown>[]) ?? [];
          const misCursos = (dashboard.mis_cursos as Record<string, unknown>[]) ?? [];

          return (
            <>
              {rutaAbierta ? (
                <Card style={styles.rutaCard}>
                  <View style={styles.rutaTitulo}>
                    <Ionicons name="navigate" size={20} color={AppColors.primary} />
                    <Text style={styles.rutaTituloTexto}>Tienes una hoja de ruta abierta</Text>
                  </View>
                  <Text style={styles.rutaTexto}>
                    Inició a las {formatHora(String(rutaAbierta.hora_inicio ?? ''))}
                    {rutaAbierta.patente ? ` con el vehículo ${String(rutaAbierta.patente)}` : ''}. Cuando termine la clase, ciérrala ahí
                    mismo: evalúa al alumno y firmen los dos.
                  </Text>
                  <Button
                    label="Continuar mi hoja de ruta"
                    onPress={() => router.push(`/instructor/vehiculos/hoja-ruta/${rutaAbierta.id}`)}
                    icon={<Ionicons name="play" size={18} color="#FFFFFF" />}
                  />
                </Card>
              ) : null}

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
  rutaCard: { backgroundColor: `${AppColors.primary}14`, borderColor: 'transparent', marginBottom: 16, gap: 8 },
  rutaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rutaTituloTexto: { flex: 1, fontWeight: '800', fontSize: 15, color: AppColors.textPrimary },
  rutaTexto: { fontSize: 13, color: AppColors.textPrimary, marginBottom: 4 },
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
