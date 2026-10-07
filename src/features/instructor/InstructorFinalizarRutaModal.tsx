import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { EvaluacionChecklist, porcentajeAprobacion } from '../../shared/components/EvaluacionChecklist';
import { SignatureCaptureField, SignatureCaptureHandle } from '../../shared/components/SignatureCaptureField';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { InstructorRepository } from './instructorRepository';

export function InstructorFinalizarRutaModal({
  visible,
  onClose,
  hojaRutaId,
  ruta,
  items,
  evaluacionGuardada,
  onFinalizado,
}: {
  visible: boolean;
  onClose: () => void;
  hojaRutaId: number;
  ruta: Record<string, unknown>;
  items: Record<string, unknown>;
  /** Pauta guardada como borrador en un intento anterior (v2: guardar-borrador). */
  evaluacionGuardada?: Record<string, string>;
  onFinalizado: () => void;
}) {
  // Se retoma lo que quedó guardado como borrador si la app se cerró o se cortó la conexión.
  const [kmFin, setKmFin] = useState(() => (ruta.km_fin != null ? String(ruta.km_fin) : ''));
  const [observaciones, setObservaciones] = useState(() => String(ruta.observaciones ?? ''));
  const [evaluacion, setEvaluacion] = useState<Record<string, string>>(() => evaluacionGuardada ?? {});
  const [estadoBorrador, setEstadoBorrador] = useState<'' | 'guardando' | 'guardado'>('');
  const firmaInstructorRef = useRef<SignatureCaptureHandle>(null);
  const firmaAlumnoRef = useRef<SignatureCaptureHandle>(null);

  const porcentaje = porcentajeAprobacion(items, evaluacion);

  // Autoguardado: 1,5 s después del último cambio se envía el borrador al
  // servidor. Los valores solo cambian por edición del usuario con el modal
  // abierto, así que el primer render (modal cerrado) no dispara un guardado.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(async () => {
      setEstadoBorrador('guardando');
      try {
        await InstructorRepository.guardarBorradorRuta({
          id_ruta: hojaRutaId,
          ...(kmFin.trim() ? { km_fin: kmFin.trim() } : {}),
          ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
          ...(Object.keys(evaluacion).length ? { eval: evaluacion, porcentaje_aprobacion: porcentaje } : {}),
        });
        setEstadoBorrador('guardado');
      } catch {
        setEstadoBorrador('');
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kmFin, observaciones, evaluacion]);

  const guardar = async () => {
    if (!kmFin.trim()) {
      showToast('Ingresa el kilometraje final.', true);
      return;
    }

    const firmaInstructor = await firmaInstructorRef.current?.obtenerFirmaBase64();
    const firmaAlumno = await firmaAlumnoRef.current?.obtenerFirmaBase64();
    if (!firmaInstructor || !firmaAlumno) {
      showToast('Ambas firmas son obligatorias para finalizar.', true);
      return;
    }

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Sin GPS disponible, se finaliza igual sin coordenadas de cierre.
    }

    try {
      await InstructorRepository.finalizarRuta({
        id_ruta: hojaRutaId,
        km_fin: kmFin.trim(),
        lat_fin: lat,
        lng_fin: lng,
        alumno_rut: ruta.alumno_rut,
        porcentaje_aprobacion: porcentaje,
        observaciones: observaciones.trim(),
        firma_instructor: firmaInstructor,
        firma_alumno: firmaAlumno,
        eval: evaluacion,
      });
      onFinalizado();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Finalizar ruta</Text>
            {estadoBorrador ? (
              <Text style={styles.borrador}>{estadoBorrador === 'guardando' ? 'Guardando borrador…' : 'Borrador guardado'}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <TextField label="Kilometraje final" keyboardType="number-pad" value={kmFin} onChangeText={setKmFin} />
          <TextField label="Observaciones (opcional)" value={observaciones} onChangeText={setObservaciones} multiline numberOfLines={3} />

          <SectionHeader title={`Evaluación (${Math.round(porcentaje)}% de aprobación)`} />
          <EvaluacionChecklist items={items} valoresIniciales={evaluacion} onChanged={setEvaluacion} />

          <SectionHeader title="Firmas" />
          <SignatureCaptureField ref={firmaInstructorRef} label="Firma del instructor" />
          <View style={{ height: 16 }} />
          <SignatureCaptureField ref={firmaAlumnoRef} label="Firma del alumno" />

          <View style={styles.submitButton}>
            <Button label="Finalizar y guardar" onPress={guardar} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  borrador: { fontSize: 11, color: AppColors.textSecondary, marginTop: 2 },
  content: { padding: 20 },
  submitButton: { marginTop: 24 },
});
