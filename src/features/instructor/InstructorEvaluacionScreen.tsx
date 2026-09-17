import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { EvaluacionChecklist, porcentajeAprobacion } from '../../shared/components/EvaluacionChecklist';
import { SignatureCaptureField, SignatureCaptureHandle } from '../../shared/components/SignatureCaptureField';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { InstructorRepository } from './instructorRepository';

export function InstructorEvaluacionScreen() {
  const router = useRouter();
  const { agendaId: agendaIdParam } = useLocalSearchParams<{ agendaId: string }>();
  const agendaId = Number(agendaIdParam);
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.evaluacionFormulario(agendaId), [agendaId]);

  const [observaciones, setObservaciones] = useState('');
  const [evaluacion, setEvaluacion] = useState<Record<string, string>>({});
  const firmaInstructorRef = useRef<SignatureCaptureHandle>(null);
  const firmaAlumnoRef = useRef<SignatureCaptureHandle>(null);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(form) => {
          const clase = form.clase as Record<string, unknown>;
          const items = (form.items as Record<string, unknown>) ?? {};
          const porcentaje = porcentajeAprobacion(items, evaluacion);

          const guardar = async () => {
            const firmaInstructor = await firmaInstructorRef.current?.obtenerFirmaBase64();
            const firmaAlumno = await firmaAlumnoRef.current?.obtenerFirmaBase64();
            if (!firmaInstructor || !firmaAlumno) {
              showToast('Ambas firmas son obligatorias.', true);
              return;
            }
            try {
              const resultado = await InstructorRepository.guardarEvaluacion({
                agenda_id: agendaId,
                alumno_rut: clase.alumno_rut,
                item: evaluacion,
                porcentaje_aprobacion: porcentaje,
                observaciones: observaciones.trim(),
                firma_instructor: firmaInstructor,
                firma_alumno: firmaAlumno,
              });
              showToast(`Evaluación guardada: ${resultado.resultado} (${resultado.porcentaje}%)`);
              if (router.canGoBack()) router.back();
            } catch (e) {
              showToast(friendlyErrorMessage(e), true);
            }
          };

          return (
            <>
              <Text style={styles.nombre}>
                {clase.alumno_nombre as string} {(clase.alumno_apellido as string) ?? ''}
              </Text>
              <Text style={styles.curso}>{String(clase.curso_nombre ?? '')}</Text>

              <SectionHeader title={`Evaluación (${Math.round(porcentaje)}% de aprobación)`} />
              <EvaluacionChecklist items={items} onChanged={setEvaluacion} />

              <TextField label="Observaciones (opcional)" value={observaciones} onChangeText={setObservaciones} multiline numberOfLines={3} />

              <SectionHeader title="Firmas" />
              <SignatureCaptureField ref={firmaInstructorRef} label="Firma del instructor" />
              <View style={{ height: 16 }} />
              <SignatureCaptureField ref={firmaAlumnoRef} label="Firma del alumno" />

              <View style={styles.submitButton}>
                <Button label="Guardar evaluación" onPress={guardar} />
              </View>
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
  nombre: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  curso: { color: AppColors.textSecondary, marginTop: 2 },
  submitButton: { marginTop: 24 },
});
