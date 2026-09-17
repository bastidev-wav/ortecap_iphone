import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow } from '../../shared/components/CommonWidgets';
import { InstructorFinalizarRutaModal } from './InstructorFinalizarRutaModal';
import { InstructorRepository } from './instructorRepository';

export function InstructorHojaRutaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hojaRutaId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.hojaRutaDetalle(hojaRutaId), [hojaRutaId]);
  const [finalizarVisible, setFinalizarVisible] = useState(false);
  const [puntosEnviados, setPuntosEnviados] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enCurso = (data?.ruta as Record<string, unknown> | undefined)?.estado === 'en_curso';

  useEffect(() => {
    if (!enCurso || timerRef.current) return;
    timerRef.current = setInterval(async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        await InstructorRepository.registrarPuntoGps({ idRuta: hojaRutaId, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPuntosEnviados((p) => p + 1);
      } catch {
        // Silencioso: si falla un punto, se reintenta en el próximo ciclo.
      }
    }, 30000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enCurso, hojaRutaId]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(detalle) => {
          const ruta = detalle.ruta as Record<string, unknown>;
          const items = (detalle.items as Record<string, unknown>) ?? {};

          return (
            <>
              {enCurso ? (
                <Card style={styles.trackingCard}>
                  <Ionicons name="locate" size={20} color="#FFFFFF" />
                  <Text style={styles.trackingText}>Ruta en curso · {puntosEnviados} puntos GPS registrados</Text>
                </Card>
              ) : null}

              <Card>
                <InfoRow label="Vehículo" value={`${ruta.patente} · ${ruta.auto_modelo ?? ''}`} />
                <InfoRow label="Alumno" value={ruta.alu_nombre ? `${ruta.alu_nombre} ${ruta.alu_apellido ?? ''}` : 'Sin asignar'} />
                <InfoRow label="Fecha" value={formatFecha(ruta.fecha as string)} />
                <InfoRow label="Hora inicio" value={formatHora(ruta.hora_inicio as string)} />
                <InfoRow label="Km inicio" value={String(ruta.km_inicio ?? '')} />
                {!enCurso ? (
                  <>
                    <InfoRow label="Km fin" value={String(ruta.km_fin ?? '-')} />
                    <InfoRow label="Resultado" value={String(ruta.resultado_practico ?? '-')} />
                    <InfoRow label="Aprobación" value={`${ruta.porcentaje_aprobacion ?? 0}%`} />
                  </>
                ) : null}
              </Card>

              {enCurso ? (
                <View style={styles.finalizarButton}>
                  <Button
                    label="Finalizar ruta"
                    onPress={() => setFinalizarVisible(true)}
                    icon={<Ionicons name="flag" size={18} color="#FFFFFF" />}
                  />
                </View>
              ) : null}

              <InstructorFinalizarRutaModal
                visible={finalizarVisible}
                onClose={() => setFinalizarVisible(false)}
                hojaRutaId={hojaRutaId}
                ruta={ruta}
                items={items}
                onFinalizado={() => {
                  setFinalizarVisible(false);
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                  refetch();
                }}
              />
            </>
          );
        }}
      </AsyncGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  trackingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: AppColors.success, borderColor: 'transparent', marginBottom: 16 },
  trackingText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, flex: 1 },
  finalizarButton: { marginTop: 20 },
});
