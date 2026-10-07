import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow } from '../../shared/components/CommonWidgets';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { InstructorCorregirInicioModal } from './InstructorCorregirInicioModal';
import { InstructorFinalizarRutaModal } from './InstructorFinalizarRutaModal';
import { InstructorRepository } from './instructorRepository';

export function InstructorHojaRutaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const hojaRutaId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.hojaRutaDetalle(hojaRutaId), [hojaRutaId]);
  const [finalizarVisible, setFinalizarVisible] = useState(false);
  const [corregirVisible, setCorregirVisible] = useState(false);
  const [puntosEnviados, setPuntosEnviados] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enCurso = (data?.ruta as Record<string, unknown> | undefined)?.estado === 'en_curso';

  const detenerGps = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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
    return detenerGps;
  }, [enCurso, hojaRutaId]);

  const cancelarRuta = async () => {
    const ok = await showConfirmDialog({
      title: 'Cancelar ruta',
      message: 'Se eliminará esta hoja de ruta, el vehículo quedará disponible y la clase volverá a quedar pendiente. ¿Continuar?',
      confirmLabel: 'Cancelar ruta',
      cancelLabel: 'Volver',
    });
    if (!ok) return;
    try {
      const msg = await InstructorRepository.cancelarRuta(hojaRutaId);
      detenerGps();
      showToast(msg || 'Ruta cancelada.');
      if (router.canGoBack()) router.back();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(detalle) => {
          const ruta = detalle.ruta as Record<string, unknown>;
          const items = (detalle.items as Record<string, unknown>) ?? {};
          const evaluacionGuardada = (detalle.evaluacion as Record<string, string>) ?? {};
          const fechaRuta = String(ruta.fecha ?? '').substring(0, 10);
          const deOtroDia = enCurso && fechaRuta !== dayjs().format('YYYY-MM-DD');

          return (
            <>
              {enCurso ? (
                <Card style={styles.trackingCard}>
                  <Ionicons name="locate" size={20} color="#FFFFFF" />
                  <Text style={styles.trackingText}>Ruta en curso · {puntosEnviados} puntos GPS registrados</Text>
                </Card>
              ) : null}

              {deOtroDia ? (
                <Card style={styles.avisoCard}>
                  <Ionicons name="calendar-outline" size={20} color={AppColors.warning} />
                  <Text style={styles.avisoTexto}>
                    Esta ruta se abrió el {formatFecha(fechaRuta)}. Si la clase fue otro día, corrige los datos de inicio antes de finalizarla.
                  </Text>
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
                <View style={styles.acciones}>
                  <Button
                    label="Finalizar ruta"
                    onPress={() => setFinalizarVisible(true)}
                    icon={<Ionicons name="flag" size={18} color="#FFFFFF" />}
                  />
                  <Button
                    label="Corregir datos de inicio"
                    variant="outline"
                    onPress={() => setCorregirVisible(true)}
                    icon={<Ionicons name="create-outline" size={18} color={AppColors.primary} />}
                  />
                  <Button label="Cancelar ruta (iniciada por error)" variant="text" destructive onPress={cancelarRuta} />
                </View>
              ) : null}

              <InstructorFinalizarRutaModal
                visible={finalizarVisible}
                onClose={() => setFinalizarVisible(false)}
                hojaRutaId={hojaRutaId}
                ruta={ruta}
                items={items}
                evaluacionGuardada={evaluacionGuardada}
                onFinalizado={() => {
                  setFinalizarVisible(false);
                  detenerGps();
                  refetch();
                }}
              />
              <InstructorCorregirInicioModal
                visible={corregirVisible}
                onClose={() => setCorregirVisible(false)}
                ruta={ruta}
                onGuardado={() => {
                  setCorregirVisible(false);
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
  avisoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${AppColors.warning}1F`, borderColor: 'transparent', marginBottom: 16 },
  avisoTexto: { flex: 1, fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  acciones: { marginTop: 20, gap: 10 },
});
