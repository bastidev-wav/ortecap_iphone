import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFechaHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoSimuladorScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.simuladorResumen());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const intentos = (datos.intentos as Record<string, unknown>[]) ?? [];
        const tasa = Number(datos.tasa_aprobacion ?? 0);

        return (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          >
            <Card style={styles.tasaCard}>
              <Text style={styles.tasaValor}>{tasa}%</Text>
              <Text style={styles.tasaLabel}>Tasa de aprobación</Text>
            </Card>

            <View style={styles.iniciarButton}>
              <Button
                label="Iniciar nuevo examen (35 preguntas)"
                onPress={() => router.push('/alumno/simulador/examen')}
                icon={<Ionicons name="play" size={18} color="#FFFFFF" />}
              />
            </View>

            <SectionHeader title="Intentos anteriores" />
            {intentos.length === 0 ? (
              <Text style={styles.emptyText}>Aún no has rendido ningún examen.</Text>
            ) : (
              intentos.map((intento, i) => {
                const aprobado = intento.aprobado === 1 || intento.aprobado === true;
                return (
                  <Card key={i} style={styles.itemCard}>
                    <Ionicons name={aprobado ? 'checkmark-circle' : 'close-circle'} size={22} color={aprobado ? AppColors.success : AppColors.danger} />
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>Puntaje: {String(intento.puntaje)}/35</Text>
                      <Text style={styles.itemSubtitle}>{formatFechaHora(intento.created_at as string)}</Text>
                    </View>
                  </Card>
                );
              })
            )}
          </ScrollView>
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  tasaCard: { backgroundColor: AppColors.primary, borderColor: 'transparent', alignItems: 'center', paddingVertical: 20 },
  tasaValor: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  tasaLabel: { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  iniciarButton: { marginTop: 16 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
