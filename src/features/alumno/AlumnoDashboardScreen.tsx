import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { useApiQuery } from '../../core/hooks/useApiQuery';
import { PushNotificationService } from '../../core/notifications/pushNotificationService';
import { AppColors } from '../../core/theme/colors';
import { formatCLP, formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { AlumnoRepository } from './alumnoRepository';

function useNotificacionesBloqueadas() {
  const [bloqueadas, setBloqueadas] = useState(false);

  const check = useCallback(() => {
    PushNotificationService.permisoBloqueado().then(setBloqueadas);
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  return { bloqueadas, refrescar: check };
}

export function AlumnoDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.dashboard());
  const { bloqueadas, refrescar } = useNotificacionesBloqueadas();

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refetch} />}
    >
      {bloqueadas ? (
        <Card style={styles.warningCard}>
          <Ionicons name="notifications-off-outline" size={20} color={AppColors.warning} />
          <Text style={styles.warningText}>Tienes las notificaciones bloqueadas: no te avisaremos de tus clases.</Text>
          <TouchableOpacity
            onPress={async () => {
              await Linking.openSettings();
              refrescar();
            }}
          >
            <Text style={styles.link}>Activar</Text>
          </TouchableOpacity>
        </Card>
      ) : null}

      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(dashboard) => {
          const matricula = dashboard.matricula as Record<string, unknown> | null;
          const financiero = dashboard.financiero as Record<string, unknown> | null;
          const proximas = (dashboard.proximas_clases as Record<string, unknown>[]) ?? [];
          const clasesRealizadas = Number(dashboard.clases_realizadas ?? 0);
          const totalClases = Number(dashboard.total_clases_curso ?? 0);

          return (
            <>
              <Text style={styles.saludo}>Hola, {user?.nombres?.split(' ')[0] ?? ''} 👋</Text>

              {matricula ? (
                <>
                  <Text style={styles.cursoNombre}>{String(matricula.curso_nombre ?? '')}</Text>
                  <Card style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTitle}>Progreso del curso</Text>
                      <AutoStatusBadge estado={String(matricula.estado ?? '')} />
                    </View>
                    <ProgressBar value={totalClases > 0 ? clasesRealizadas / totalClases : 0} />
                    <Text style={styles.progressSubtitle}>
                      {clasesRealizadas} de {totalClases} clases realizadas
                    </Text>
                  </Card>
                </>
              ) : null}

              {financiero ? (
                <Card style={styles.financeCard}>
                  <InfoRow label="Total curso" value={formatCLP(financiero.precio_final ?? matricula?.precio_final)} />
                  {financiero.saldo_pendiente != null ? (
                    <InfoRow label="Saldo pendiente" value={formatCLP(financiero.saldo_pendiente)} />
                  ) : null}
                </Card>
              ) : null}

              <SectionHeader
                title="Próximas clases"
                trailing={
                  <TouchableOpacity onPress={() => router.push('/alumno/reservar')}>
                    <Text style={styles.link}>Reservar</Text>
                  </TouchableOpacity>
                }
              />
              {proximas.length === 0 ? (
                <Text style={styles.emptyText}>No tienes clases agendadas. ¡Reserva tu próxima clase!</Text>
              ) : (
                proximas.map((c, i) => (
                  <Card key={i} style={styles.listCard}>
                    <Text style={styles.fecha}>{formatFecha(c.fecha as string).slice(0, 5)}</Text>
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>
                        {formatHora(c.hora_inicio as string)} · {String(c.tipo_clase ?? '')}
                      </Text>
                      <Text style={styles.itemSubtitle}>
                        {String(c.instructor_nombre ?? '')} {String(c.instructor_apellido ?? '')}
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
  saludo: { fontSize: 20, fontWeight: '800', color: AppColors.textPrimary },
  cursoNombre: { color: AppColors.textSecondary, marginTop: 4, marginBottom: 16 },
  progressCard: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontWeight: '700', color: AppColors.textPrimary },
  progressSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 6 },
  financeCard: { marginBottom: 4 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${AppColors.warning}1F`,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  warningText: { flex: 1, fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  listCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  link: { color: AppColors.primary, fontWeight: '600' },
  fecha: { fontWeight: '800', color: AppColors.primary, fontSize: 12, width: 48 },
});
