import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { AppAvatar, SectionHeader } from '../../shared/components/CommonWidgets';
import { Card } from '../../shared/components/Card';
import { StatCard } from '../../shared/components/StatCard';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { formatHora } from '../../core/utils/formatters';
import { AdminRepository } from './adminRepository';

export function AdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.dashboard());

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refetch} />}
    >
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(dashboard) => {
          const stats = dashboard.stats as Record<string, unknown>;
          const ultimasSolicitudes = (dashboard.ultimas_solicitudes as Record<string, unknown>[]) ?? [];
          const clasesHoy = (dashboard.clases_hoy as Record<string, unknown>[]) ?? [];
          const notificaciones = (dashboard.notificaciones as Record<string, unknown>[]) ?? [];

          return (
            <>
              <Text style={styles.saludo}>
                {String(dashboard.saludo ?? 'Hola')}, {user?.nombres?.split(' ')[0] ?? ''} 👋
              </Text>

              <View style={styles.statsRow}>
                <StatCard
                  label={'Solicitudes\npendientes'}
                  value={String(stats.solicitudes_pendientes ?? 0)}
                  icon="mail-unread-outline"
                  color={AppColors.warning}
                  onPress={() => router.push('/admin/solicitudes')}
                />
                <StatCard
                  label={'Alumnos\ntotales'}
                  value={String(stats.alumnos_totales ?? 0)}
                  icon="school-outline"
                  color={AppColors.info}
                  onPress={() => router.push('/admin/alumnos')}
                />
                <StatCard
                  label={'Clases\nhoy'}
                  value={String(stats.clases_hoy ?? 0)}
                  icon="calendar-outline"
                  color={AppColors.success}
                  onPress={() => router.push('/admin/agenda')}
                />
              </View>

              {notificaciones.length > 0 ? (
                <>
                  <SectionHeader title={`Notificaciones (${notificaciones.length})`} />
                  {notificaciones.map((n, i) => (
                    <TouchableOpacity key={i} onPress={() => router.push('/admin/solicitudes')}>
                      <Card style={styles.listCard}>
                        <Ionicons name="notifications-outline" size={20} color={AppColors.warning} />
                        <View style={styles.flex1}>
                          <Text style={styles.notifMessage}>{String(n.mensaje)}</Text>
                          <Text style={styles.notifTime}>{String(n.tiempo)}</Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </>
              ) : null}

              <SectionHeader
                title="Últimas solicitudes"
                trailing={
                  <TouchableOpacity onPress={() => router.push('/admin/solicitudes')}>
                    <Text style={styles.link}>Ver todas</Text>
                  </TouchableOpacity>
                }
              />
              {ultimasSolicitudes.length === 0 ? (
                <Text style={styles.emptyText}>No hay solicitudes recientes.</Text>
              ) : (
                ultimasSolicitudes.map((s, i) => (
                  <TouchableOpacity key={i} onPress={() => router.push(`/admin/solicitudes/${s.id}`)}>
                    <Card style={styles.listCard}>
                      <AppAvatar nombre={String(s.nombres ?? '?')} />
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>
                          {String(s.nombres ?? '')} {String(s.apellidos ?? '')}
                        </Text>
                        <Text style={styles.itemSubtitle}>{String(s.curso_nombre ?? s.curso_interes ?? '')}</Text>
                      </View>
                      <AutoStatusBadge estado={String(s.estado ?? '')} />
                    </Card>
                  </TouchableOpacity>
                ))
              )}

              <SectionHeader title="Clases de hoy" />
              {clasesHoy.length === 0 ? (
                <Text style={styles.emptyText}>No hay clases programadas para hoy.</Text>
              ) : (
                clasesHoy.map((c, i) => (
                  <Card key={i} style={styles.listCard}>
                    <Text style={styles.hora}>{formatHora(c.hora_inicio as string)}</Text>
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>
                        {String(c.instructor_nombre ?? '')} {String(c.instructor_apellido ?? '')}
                      </Text>
                      <Text style={styles.itemSubtitle}>
                        {c.alumno_nombre ? `Con ${c.alumno_nombre} ${c.alumno_apellido ?? ''}` : 'Sin alumno asignado'}
                      </Text>
                    </View>
                  </Card>
                ))
              )}
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
  statsRow: { flexDirection: 'row', gap: 12 },
  listCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  notifMessage: { fontSize: 13, color: AppColors.textPrimary },
  notifTime: { fontSize: 11, color: AppColors.textSecondary, marginTop: 2 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  link: { color: AppColors.primary, fontWeight: '600' },
  hora: { fontWeight: '800', color: AppColors.primary, width: 48 },
});
