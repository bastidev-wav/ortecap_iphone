import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { LoadingView } from '../../shared/components/StateViews';
import { AutoStatusBadge, StatusBadge } from '../../shared/components/StatusBadge';
import { AdminRepository } from './adminRepository';

const VALOR_LABELS: Record<string, { texto: string; color: string }> = {
  B: { texto: 'Bien', color: AppColors.success },
  R: { texto: 'Regular', color: AppColors.warning },
  M: { texto: 'Mal', color: AppColors.danger },
};

export function AdminHojaRutaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hojaRutaId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.hojaRutaDetalle(hojaRutaId), [hojaRutaId]);
  const { data: mapa, loading: loadingMapa } = useApiQuery(() => AdminRepository.hojaRutaMapa(hojaRutaId), [hojaRutaId]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(detalle) => {
          const ruta = detalle.ruta as Record<string, unknown>;
          const items = (detalle.items as Record<string, unknown>) ?? {};
          const evaluacion = (detalle.evaluacion as Record<string, unknown>) ?? {};

          return (
            <>
              <View style={styles.header}>
                <View style={styles.flex1}>
                  <Text style={styles.nombre}>
                    {ruta.prof_nombre as string} {(ruta.prof_apellido as string) ?? ''}
                  </Text>
                  <Text style={styles.subtitle}>
                    {ruta.patente as string} · {(ruta.auto_modelo as string) ?? ''}
                  </Text>
                </View>
                <AutoStatusBadge estado={String(ruta.estado ?? '')} />
              </View>

              <Card>
                <InfoRow label="Alumno" value={ruta.alu_nombre ? `${ruta.alu_nombre} ${ruta.alu_apellido ?? ''}` : 'Sin asignar'} />
                <InfoRow label="Fecha" value={formatFecha(ruta.fecha as string)} />
                <InfoRow label="Horario" value={`${formatHora(ruta.hora_inicio as string)} - ${formatHora(ruta.hora_fin as string)}`} />
                <InfoRow label="Km inicio → fin" value={`${ruta.km_inicio} → ${ruta.km_fin ?? '-'}`} />
                <InfoRow label="Resultado" value={String(ruta.resultado_practico ?? 'Pendiente')} />
                <InfoRow label="Aprobación" value={`${ruta.porcentaje_aprobacion ?? 0}%`} />
              </Card>

              {Object.keys(evaluacion).length > 0 ? (
                <>
                  <SectionHeader title="Pauta de evaluación (30 puntos)" />
                  <Card>
                    {Object.entries(evaluacion).map(([key, value]) => {
                      const info = VALOR_LABELS[String(value)] ?? { texto: String(value), color: AppColors.textSecondary };
                      return (
                        <View key={key} style={styles.itemRow}>
                          <Text style={styles.itemLabel}>{String(items[key] ?? `Ítem ${key}`)}</Text>
                          <StatusBadge label={info.texto} color={info.color} />
                        </View>
                      );
                    })}
                  </Card>
                </>
              ) : null}

              <SectionHeader title="Recorrido GPS" />
              {loadingMapa ? (
                <LoadingView />
              ) : (
                (() => {
                  const puntos = (mapa?.puntos_gps as Record<string, unknown>[]) ?? [];
                  if (puntos.length === 0) {
                    return <Text style={styles.emptyText}>No se registraron puntos GPS para este recorrido.</Text>;
                  }
                  return (
                    <Card>
                      <Text style={styles.puntosTitle}>{puntos.length} puntos registrados</Text>
                      <Text style={styles.puntosSubtitle}>
                        Visualización de mapa disponible próximamente. Los puntos GPS ya se están capturando correctamente.
                      </Text>
                    </Card>
                  );
                })()
              )}

              {ruta.observaciones ? (
                <>
                  <SectionHeader title="Observaciones" />
                  <Text style={styles.observaciones}>{String(ruta.observaciones)}</Text>
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
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  nombre: { fontSize: 16, fontWeight: '800', color: AppColors.textPrimary },
  subtitle: { color: AppColors.textSecondary, marginTop: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemLabel: { flex: 1, fontSize: 13, color: AppColors.textPrimary, marginRight: 8 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  puntosTitle: { fontWeight: '700', color: AppColors.textPrimary },
  puntosSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
  observaciones: { color: AppColors.textPrimary },
});
