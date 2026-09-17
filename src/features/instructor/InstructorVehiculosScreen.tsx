import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { AppAvatar, SectionHeader } from '../../shared/components/CommonWidgets';
import { InstructorHistorialRutasModal } from './InstructorHistorialRutasModal';
import { InstructorIniciarRutaModal } from './InstructorIniciarRutaModal';
import { InstructorRepository } from './instructorRepository';

export function InstructorVehiculosScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.vehiculosDashboard());
  const [iniciarVisible, setIniciarVisible] = useState(false);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [historial, setHistorial] = useState<Record<string, unknown>[]>([]);

  const abrirHistorial = async () => {
    const h = await InstructorRepository.historialRutas();
    setHistorial(h);
    setHistorialVisible(true);
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={abrirHistorial} hitSlop={12}>
              <Ionicons name="time-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(dashboard) => {
          const rutaActiva = dashboard.ruta_activa as Record<string, unknown> | null;
          const alumnoDetectado = dashboard.alumno_detectado as Record<string, unknown> | null;
          const vehiculos = (dashboard.vehiculos as Record<string, unknown>[]) ?? [];
          const disponibles = vehiculos.filter((v) => v.estado === 'disponible');

          return (
            <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}>
              {rutaActiva ? (
                <TouchableOpacity onPress={() => router.push(`/instructor/vehiculos/hoja-ruta/${rutaActiva.id}`)}>
                  <Card style={styles.rutaActivaCard}>
                    <Ionicons name="navigate" size={22} color="#FFFFFF" />
                    <View style={styles.flex1}>
                      <Text style={styles.rutaActivaTitulo}>Ruta en curso</Text>
                      <Text style={styles.rutaActivaSubtitulo}>
                        {String(rutaActiva.patente)} · {String(rutaActiva.marca)} {String(rutaActiva.modelo)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </Card>
                </TouchableOpacity>
              ) : (
                <>
                  {alumnoDetectado ? (
                    <Card style={styles.detectadoCard}>
                      <AppAvatar nombre={String(alumnoDetectado.nombres ?? '?')} />
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>
                          Alumno detectado: {String(alumnoDetectado.nombres)} {String(alumnoDetectado.apellidos ?? '')}
                        </Text>
                        <Text style={styles.itemSubtitle}>Tienes una clase con este alumno ahora</Text>
                      </View>
                    </Card>
                  ) : null}
                  <View style={styles.iniciarButton}>
                    <Button
                      label="Iniciar ruta"
                      onPress={() => setIniciarVisible(true)}
                      disabled={disponibles.length === 0}
                      icon={<Ionicons name="play" size={18} color="#FFFFFF" />}
                    />
                  </View>
                </>
              )}

              <SectionHeader title="Flota disponible" />
              {vehiculos.map((v, i) => (
                <Card key={i} style={styles.vehiculoCard}>
                  <Ionicons name="car-sport-outline" size={22} color={v.estado === 'disponible' ? AppColors.success : AppColors.textSecondary} />
                  <View style={styles.flex1}>
                    <Text style={styles.itemTitle}>
                      {String(v.marca)} {String(v.modelo)} · {String(v.patente)}
                    </Text>
                    <Text style={styles.itemSubtitle}>
                      {String(v.kilometraje_actual)} km · {String(v.estado)}
                    </Text>
                  </View>
                </Card>
              ))}

              <InstructorIniciarRutaModal
                visible={iniciarVisible}
                onClose={() => setIniciarVisible(false)}
                vehiculosDisponibles={disponibles}
                alumnoDetectado={alumnoDetectado}
                onIniciado={() => {
                  setIniciarVisible(false);
                  refetch();
                }}
              />
            </ScrollView>
          );
        }}
      </AsyncGate>

      <InstructorHistorialRutasModal visible={historialVisible} onClose={() => setHistorialVisible(false)} historial={historial} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  flex1: { flex: 1, marginLeft: 12 },
  rutaActivaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderColor: 'transparent', marginBottom: 16 },
  rutaActivaTitulo: { color: '#FFFFFF', fontWeight: '800' },
  rutaActivaSubtitulo: { color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  detectadoCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  iniciarButton: { marginBottom: 8 },
  vehiculoCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
});
