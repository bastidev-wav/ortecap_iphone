import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { formatFecha, formatHora, formatRut } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { StatChip } from '../../shared/components/StatCard';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { AdminRepository } from './adminRepository';

/** Resumen de todas las hojas de ruta finalizadas de un alumno (para el expediente de certificación). */
export function AdminResumenHojasScreen() {
  const router = useRouter();
  const { rut } = useLocalSearchParams<{ rut: string }>();
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.resumenHojasAlumno(rut), [rut]);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refetch} />}
    >
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const alumno = (datos.alumno as Record<string, unknown>) ?? {};
          const matricula = datos.matricula as Record<string, unknown> | null;
          const hojas = (datos.hojas as Record<string, unknown>[]) ?? [];
          const totales = (datos.totales as Record<string, unknown>) ?? {};
          const invalidas = (datos.hojas_con_horario_invalido as number[]) ?? [];
          const minutos = Number(totales.minutos_realizados ?? 0);

          return (
            <>
              <Text style={styles.nombre}>
                {String(alumno.nombres ?? '')} {String(alumno.apellidos ?? '')}
              </Text>
              <Text style={styles.detalle}>
                {formatRut(String(alumno.rut ?? ''))}
                {matricula?.curso_nombre ? ` · ${matricula.curso_nombre}` : ''}
              </Text>

              <View style={styles.stats}>
                <StatChip label="Sesiones" value={String(totales.sesiones ?? 0)} color={AppColors.primary} />
                <StatChip label="Horas" value={`${Math.floor(minutos / 60)}h ${minutos % 60}m`} color={AppColors.info} />
                <StatChip label="Aprobadas" value={String(totales.sesiones_aprobadas ?? 0)} color={AppColors.success} />
              </View>
              <Text style={styles.km}>{String(totales.km_recorridos ?? 0)} km recorridos</Text>

              {invalidas.length > 0 ? (
                <Card style={styles.aviso}>
                  <Ionicons name="warning-outline" size={20} color={AppColors.warning} />
                  <Text style={styles.avisoTexto}>
                    {invalidas.length} hoja(s) tienen un horario inválido y no se suman. Corrígelas para que cuenten.
                  </Text>
                </Card>
              ) : null}

              <SectionHeader title="Hojas de ruta" />
              {hojas.length === 0 ? (
                <Text style={styles.empty}>El alumno aún no tiene hojas de ruta finalizadas.</Text>
              ) : (
                hojas.map((h) => {
                  const invalida = invalidas.includes(Number(h.id));
                  return (
                    <TouchableOpacity key={String(h.id)} onPress={() => router.push(`/admin/vehiculos/hoja-ruta/${h.id}`)}>
                      <Card style={[styles.hoja, invalida && styles.hojaInvalida]}>
                        <View style={styles.flex1}>
                          <Text style={styles.hojaTitulo}>
                            {formatFecha(h.fecha as string)} · {formatHora(h.hora_inicio as string)} - {formatHora(h.hora_fin as string)}
                          </Text>
                          <Text style={styles.hojaDetalle}>
                            {String(h.patente ?? '')} · {String(h.prof_nombre ?? '')} {String(h.prof_apellido ?? '')} ·{' '}
                            {h.km_fin != null ? `${Number(h.km_fin) - Number(h.km_inicio)} km` : '-'}
                          </Text>
                        </View>
                        {h.resultado_practico ? <AutoStatusBadge estado={String(h.resultado_practico)} /> : null}
                      </Card>
                    </TouchableOpacity>
                  );
                })
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
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  nombre: { fontSize: 18, fontWeight: '800', color: AppColors.textPrimary },
  detalle: { color: AppColors.textSecondary, marginTop: 2, marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 10 },
  km: { textAlign: 'center', color: AppColors.textSecondary, marginTop: 8 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: `${AppColors.warning}1F`, borderColor: 'transparent' },
  avisoTexto: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
  empty: { color: AppColors.textSecondary },
  hoja: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  hojaInvalida: { borderColor: AppColors.warning },
  hojaTitulo: { fontWeight: '700', fontSize: 13, color: AppColors.textPrimary },
  hojaDetalle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
