import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, colorEstadoAgenda } from '../../core/theme/colors';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { showConfirmDialog, showOptionsActionSheet } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AdminCrearBloquesModal } from './AdminCrearBloquesModal';
import { AdminGestionarAlumnosModal } from './AdminGestionarAlumnosModal';
import { AdminRepository } from './adminRepository';

export function AdminAgendaScreen() {
  const [fecha, setFecha] = useState(new Date());
  const [crearVisible, setCrearVisible] = useState(false);
  const [gestionarClaseId, setGestionarClaseId] = useState<number | null>(null);

  const { data, loading, error, refetch } = useApiQuery(
    () => AdminRepository.agenda({ fecha: dayjs(fecha).format('YYYY-MM-DD'), vista: 'semanal' }),
    [fecha],
  );

  const eliminarBloque = async (id: number) => {
    const confirmar = await showConfirmDialog({
      title: 'Eliminar bloque',
      message: '¿Eliminar este bloque de agenda? Esta acción no se puede deshacer.',
    });
    if (!confirmar) return;
    try {
      await AdminRepository.eliminarBloqueAgenda(id);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const abrirMenuClase = async (clase: Record<string, unknown>) => {
    const esTeorica = clase.tipo_clase === 'teorica';
    const opciones = esTeorica ? ['Gestionar alumnos', 'Eliminar bloque'] : ['Eliminar bloque'];
    const seleccion = await showOptionsActionSheet({ options: opciones, destructiveIndex: opciones.length - 1 });
    if (seleccion === null) return;
    const opcion = opciones[seleccion];
    if (opcion === 'Gestionar alumnos') setGestionarClaseId(clase.id as number);
    if (opcion === 'Eliminar bloque') eliminarBloque(clase.id as number);
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
          const clases = (agenda.clases as Record<string, unknown>[]) ?? [];
          const rango = agenda.rango as Record<string, unknown>;
          const rangoTexto = `Semana del ${formatFecha(rango?.desde as string)} al ${formatFecha(rango?.hasta as string)}`;

          const porDia = new Map<string, Record<string, unknown>[]>();
          for (const c of clases) {
            const dia = (c.fecha as string).substring(0, 10);
            if (!porDia.has(dia)) porDia.set(dia, []);
            porDia.get(dia)!.push(c);
          }

          return (
            <ScrollView
              contentContainerStyle={styles.content}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            >
              <Text style={styles.rango}>{rangoTexto}</Text>
              {clases.length === 0 ? (
                <EmptyView message="No hay clases en esta semana." icon="calendar-outline" />
              ) : (
                Array.from(porDia.entries()).map(([dia, clasesDia]) => (
                  <View key={dia}>
                    <Text style={styles.diaTitulo}>{formatFecha(dia)}</Text>
                    {clasesDia.map((clase, i) => {
                      const estado = String(clase.estado ?? '');
                      const esTeorica = clase.tipo_clase === 'teorica';
                      return (
                        <TouchableOpacity key={i} onPress={() => abrirMenuClase(clase)}>
                          <Card style={styles.claseCard}>
                            <View style={[styles.claseBar, { backgroundColor: colorEstadoAgenda(estado) }]} />
                            <View style={styles.flex1}>
                              <Text style={styles.claseTitulo}>
                                {formatHora(clase.hora_inicio as string)} - {String(clase.instructor_nombre ?? '')} {String(clase.instructor_apellido ?? '')}
                              </Text>
                              <Text style={styles.claseSubtitulo}>
                                {esTeorica
                                  ? `${clase.tipo_clase} · ${clase.modulo ?? clase.sucursal ?? 'Sin módulo'} · ${clase.inscritos_count}/${clase.cupo_maximo ?? 30} inscritos`
                                  : clase.alumno_nombre
                                  ? `${clase.tipo_clase} · ${clase.alumno_nombre} ${clase.alumno_apellido ?? ''}`
                                  : `${clase.tipo_clase} · ${clase.sucursal ?? 'Sin sede'}`}
                              </Text>
                            </View>
                            <Ionicons name="ellipsis-vertical" size={18} color={AppColors.textSecondary} />
                          </Card>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          );
        }}
      </AsyncGate>

      <TouchableOpacity style={styles.fab} onPress={() => setCrearVisible(true)}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabLabel}>Crear bloques</Text>
      </TouchableOpacity>

      <AdminCrearBloquesModal
        visible={crearVisible}
        onClose={() => setCrearVisible(false)}
        onCreated={() => {
          setCrearVisible(false);
          refetch();
        }}
      />
      <AdminGestionarAlumnosModal
        agendaClaseId={gestionarClaseId}
        visible={gestionarClaseId !== null}
        onClose={() => {
          setGestionarClaseId(null);
          refetch();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  headerActions: { flexDirection: 'row', gap: 16, marginRight: 4 },
  content: { padding: 12, paddingBottom: 100 },
  rango: { color: AppColors.textSecondary, fontSize: 12, marginBottom: 8, paddingHorizontal: 4 },
  diaTitulo: { fontWeight: '800', fontSize: 14, marginTop: 12, marginBottom: 6, paddingHorizontal: 4, color: AppColors.textPrimary },
  claseCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12, paddingVertical: 12 },
  claseBar: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  flex1: { flex: 1 },
  claseTitulo: { fontWeight: '700', fontSize: 13, color: AppColors.textPrimary },
  claseSubtitulo: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabLabel: { color: '#FFFFFF', fontWeight: '700' },
});
