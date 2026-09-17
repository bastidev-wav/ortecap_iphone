import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, colorEstadoAgenda } from '../../core/theme/colors';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { showConfirmDialog } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { InstructorRepository } from './instructorRepository';

function nombresInscritos(bloque: Record<string, unknown>): string {
  const inscritos = (bloque.inscritos as Record<string, unknown>[]) ?? [];
  const cupo = bloque.cupo ?? 30;
  if (inscritos.length === 0) return `Sin alumnos inscritos aún (${cupo} cupos)`;
  const nombres = inscritos.map((a) => String(a.nombres ?? '').split(' ')[0]).join(', ');
  return `${nombres} (${inscritos.length}/${cupo})`;
}

export function InstructorAgendaScreen() {
  const router = useRouter();
  const [fecha, setFecha] = useState(new Date());
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.agenda(dayjs(fecha).format('YYYY-MM-DD')), [fecha]);

  const eliminarHorario = async (id: number) => {
    const confirmar = await showConfirmDialog({ title: 'Eliminar horario', message: '¿Eliminar este bloque disponible de tu agenda?' });
    if (!confirmar) return;
    try {
      await InstructorRepository.eliminarHorario(id);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setFecha(dayjs(fecha).subtract(7, 'day').toDate())} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFecha(dayjs(fecha).add(7, 'day').toDate())} hitSlop={8}>
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(agenda) => {
          const bloques = (agenda.bloques as Record<string, unknown>[]) ?? [];
          const rango = agenda.rango as Record<string, unknown>;

          const porDia = new Map<string, Record<string, unknown>[]>();
          for (const b of bloques) {
            const dia = (b.fecha as string).substring(0, 10);
            if (!porDia.has(dia)) porDia.set(dia, []);
            porDia.get(dia)!.push(b);
          }

          return (
            <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}>
              <Text style={styles.rango}>
                Semana del {formatFecha(rango?.lunes as string)} al {formatFecha(rango?.domingo as string)}
              </Text>
              {bloques.length === 0 ? (
                <EmptyView message="No tienes bloques en esta semana." icon="calendar-outline" />
              ) : (
                Array.from(porDia.entries()).map(([dia, bloquesDia]) => (
                  <View key={dia}>
                    <Text style={styles.diaTitulo}>{formatFecha(dia)}</Text>
                    {bloquesDia.map((b, i) => {
                      const estado = String(b.estado ?? '');
                      const esTeorica = b.tipo_clase === 'teorica';
                      return (
                        <Card key={i} style={styles.bloqueCard}>
                          <View style={[styles.bar, { backgroundColor: colorEstadoAgenda(estado) }]} />
                          <View style={styles.flex1}>
                            <Text style={styles.horaTitulo}>
                              {formatHora(b.hora_inicio as string)} - {formatHora(b.hora_fin as string)}
                            </Text>
                            <Text style={styles.subtitulo}>
                              {esTeorica
                                ? `${b.tipo_clase} · ${b.modulo ?? 'Sin módulo'}\n${nombresInscritos(b)}`
                                : b.alumno_nombre
                                ? `${b.tipo_clase} · ${b.alumno_nombre} ${b.alumno_apellido ?? ''}`
                                : `${b.tipo_clase} · Disponible`}
                            </Text>
                          </View>
                          {estado === 'disponible' ? (
                            <TouchableOpacity onPress={() => eliminarHorario(b.id as number)} hitSlop={8}>
                              <Ionicons name="trash-outline" size={20} color={AppColors.danger} />
                            </TouchableOpacity>
                          ) : estado === 'reservado' ? (
                            <TouchableOpacity onPress={() => router.push(`/instructor/evaluacion/${b.id}`)} hitSlop={8}>
                              <Ionicons name="clipboard-outline" size={20} color={AppColors.primary} />
                            </TouchableOpacity>
                          ) : (
                            <AutoStatusBadge estado={estado} />
                          )}
                        </Card>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          );
        }}
      </AsyncGate>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  headerActions: { flexDirection: 'row', gap: 16, marginRight: 4 },
  content: { padding: 12, paddingBottom: 40 },
  rango: { color: AppColors.textSecondary, fontSize: 12, marginBottom: 8, paddingHorizontal: 4 },
  diaTitulo: { fontWeight: '800', fontSize: 14, marginTop: 12, marginBottom: 6, paddingHorizontal: 4, color: AppColors.textPrimary },
  bloqueCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12, paddingVertical: 12 },
  bar: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  flex1: { flex: 1 },
  horaTitulo: { fontWeight: '700', fontSize: 13, color: AppColors.textPrimary },
  subtitulo: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
});
