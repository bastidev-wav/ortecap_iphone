import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { SegmentedControl } from '../../shared/components/SegmentedControl';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { AdminRepository } from './adminRepository';

/**
 * Auditoría de horas: clases prácticas "realizadas" sin hoja de ruta que las
 * respalde, y hojas finalizadas con un horario que no se puede sumar.
 */
export function AdminAuditoriaHorasScreen() {
  const router = useRouter();
  const [desde, setDesde] = useState(dayjs().subtract(30, 'day').toDate());
  const [hasta, setHasta] = useState(new Date());
  const [picker, setPicker] = useState<null | 'desde' | 'hasta'>(null);
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useApiQuery(
    () => AdminRepository.auditoriaHoras({ desde: dayjs(desde).format('YYYY-MM-DD'), hasta: dayjs(hasta).format('YYYY-MM-DD') }),
    [desde, hasta],
  );

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refetch} />}
    >
      <View style={styles.fechas}>
        <TouchableOpacity style={styles.fechaBtn} onPress={() => setPicker('desde')}>
          <Text style={styles.fechaText}>Desde {dayjs(desde).format('DD/MM/YYYY')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fechaBtn} onPress={() => setPicker('hasta')}>
          <Text style={styles.fechaText}>Hasta {dayjs(hasta).format('DD/MM/YYYY')}</Text>
        </TouchableOpacity>
      </View>
      {picker ? (
        <DateTimePicker
          value={picker === 'desde' ? desde : hasta}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_, d) => {
            const cual = picker;
            setPicker(null);
            if (!d) return;
            if (cual === 'desde') setDesde(d);
            else setHasta(d);
          }}
        />
      ) : null}

      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const discrepancias = (datos.discrepancias as Record<string, unknown>[]) ?? [];
          const invalidas = (datos.horario_invalido as Record<string, unknown>[]) ?? [];
          return (
            <>
              <SegmentedControl
                options={[`Sin hoja (${discrepancias.length})`, `Horario inválido (${invalidas.length})`]}
                selectedIndex={tab}
                onChange={setTab}
              />
              {tab === 0 ? (
                <>
                  <Text style={styles.ayuda}>
                    Clases prácticas marcadas como realizadas que no tienen una hoja de ruta finalizada. Toca una para crear la hoja.
                  </Text>
                  {discrepancias.length === 0 ? (
                    <Text style={styles.ok}>Sin pendientes en este período.</Text>
                  ) : (
                    discrepancias.map((d) => (
                      <TouchableOpacity key={String(d.id)} onPress={() => router.push(`/admin/agenda/hoja-faltante/${d.id}`)}>
                        <Card style={styles.card}>
                          <Ionicons name="alert-circle-outline" size={22} color={AppColors.warning} />
                          <View style={styles.flex1}>
                            <Text style={styles.titulo}>
                              {formatFecha(d.fecha as string)} · {formatHora(d.hora_inicio as string)} - {formatHora(d.hora_fin as string)}
                            </Text>
                            <Text style={styles.subtitulo}>
                              {String(d.alu_nombre ?? '')} {String(d.alu_apellido ?? '')} · Instr. {String(d.prof_nombre ?? '')}{' '}
                              {String(d.prof_apellido ?? '')}
                            </Text>
                            {d.tiene_hoja_sin_finalizar ? (
                              <View style={styles.badge}>
                                <StatusBadge label="Tiene hoja sin finalizar" color={AppColors.info} />
                              </View>
                            ) : null}
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
                        </Card>
                      </TouchableOpacity>
                    ))
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.ayuda}>
                    Hojas finalizadas con hora de término anterior al inicio (no se suman en las horas del alumno). Toca una para corregirla.
                  </Text>
                  {invalidas.length === 0 ? (
                    <Text style={styles.ok}>No hay hojas con horario inválido.</Text>
                  ) : (
                    invalidas.map((h) => (
                      <TouchableOpacity key={String(h.id)} onPress={() => router.push(`/admin/vehiculos/hoja-ruta/${h.id}`)}>
                        <Card style={styles.card}>
                          <Ionicons name="time-outline" size={22} color={AppColors.danger} />
                          <View style={styles.flex1}>
                            <Text style={styles.titulo}>
                              {formatFecha(h.fecha as string)} · {formatHora(h.hora_inicio as string)} → {formatHora(h.hora_fin as string)}
                            </Text>
                            <Text style={styles.subtitulo}>
                              {String(h.alu_nombre ?? 'Sin alumno')} {String(h.alu_apellido ?? '')} · Instr. {String(h.prof_nombre ?? '')}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
                        </Card>
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}
              <SectionHeader title={`Total pendientes: ${Number(datos.total_pendientes ?? 0)}`} />
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
  content: { padding: 12, paddingBottom: 40 },
  fechas: { flexDirection: 'row', gap: 8 },
  fechaBtn: { flex: 1, borderWidth: 1, borderColor: AppColors.primary, borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center', backgroundColor: '#FFFFFF' },
  fechaText: { color: AppColors.primary, fontWeight: '600', fontSize: 13 },
  ayuda: { color: AppColors.textSecondary, fontSize: 12, marginBottom: 10, paddingHorizontal: 4 },
  ok: { color: AppColors.success, fontWeight: '600', paddingHorizontal: 4, paddingVertical: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  titulo: { fontWeight: '700', color: AppColors.textPrimary, fontSize: 13 },
  subtitulo: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  badge: { marginTop: 6 },
});
