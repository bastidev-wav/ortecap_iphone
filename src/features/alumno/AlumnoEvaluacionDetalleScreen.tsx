import { useLocalSearchParams } from 'expo-router';
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFecha } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { SignatureCaptureField, SignatureCaptureHandle } from '../../shared/components/SignatureCaptureField';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

const VALOR_INFO: Record<string, { texto: string; color: string }> = {
  B: { texto: 'Bien', color: AppColors.success },
  R: { texto: 'Regular', color: AppColors.warning },
  M: { texto: 'Mal', color: AppColors.danger },
};

export function AlumnoEvaluacionDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const evaluacionId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.evaluacionDetalle(evaluacionId), [evaluacionId]);
  const firmaRef = useRef<SignatureCaptureHandle>(null);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(detalle) => {
          const ruta = detalle.ruta as Record<string, unknown>;
          const items = (detalle.items as Record<string, unknown>) ?? {};
          const notas = (detalle.notas as Record<string, unknown>) ?? {};
          const necesitaFirma = ruta.firma_alumno_img == null && ruta.estado === 'finalizada';

          const firmar = async () => {
            const firma = await firmaRef.current?.obtenerFirmaBase64();
            if (!firma) {
              showToast('Dibuja tu firma antes de continuar.', true);
              return;
            }
            try {
              await AlumnoRepository.firmarEvaluacion({ idRuta: evaluacionId, firmaAlumno: firma });
              showToast('¡Documento firmado! Clase finalizada.');
              refetch();
            } catch (e) {
              showToast(friendlyErrorMessage(e), true);
            }
          };

          return (
            <>
              <Card>
                <InfoRow label="Instructor" value={`${ruta.instr_nombre} ${ruta.instr_apellido ?? ''}`} />
                <InfoRow label="Vehículo" value={`${ruta.patente} · ${ruta.modelo ?? ''}`} />
                <InfoRow label="Fecha" value={formatFecha(ruta.fecha as string)} />
                <InfoRow label="Resultado" value={String(ruta.resultado_practico ?? 'En curso')} />
                <InfoRow label="Aprobación" value={`${ruta.porcentaje_aprobacion ?? 0}%`} />
              </Card>

              {Object.keys(notas).length > 0 ? (
                <>
                  <SectionHeader title="Pauta de evaluación" />
                  <Card>
                    {Object.entries(notas).map(([key, value]) => {
                      const info = VALOR_INFO[String(value)] ?? { texto: String(value), color: AppColors.textSecondary };
                      return (
                        <View key={key} style={styles.itemRow}>
                          <Text style={styles.itemLabel}>{String(items[key] ?? key)}</Text>
                          <Text style={[styles.itemValor, { color: info.color }]}>{info.texto}</Text>
                        </View>
                      );
                    })}
                  </Card>
                </>
              ) : null}

              {ruta.observaciones ? (
                <>
                  <SectionHeader title="Observaciones del instructor" />
                  <Text style={styles.observaciones}>{String(ruta.observaciones)}</Text>
                </>
              ) : null}

              {necesitaFirma ? (
                <>
                  <SectionHeader title="Tu firma" />
                  <Text style={styles.descripcion}>Confirma que estás de acuerdo con esta evaluación firmando abajo.</Text>
                  <SignatureCaptureField ref={firmaRef} label="Firma del alumno" />
                  <View style={styles.submitButton}>
                    <Button label="Firmar y confirmar" onPress={firmar} />
                  </View>
                </>
              ) : null}
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
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemLabel: { flex: 1, fontSize: 13, color: AppColors.textPrimary, marginRight: 8 },
  itemValor: { fontWeight: '700', fontSize: 12 },
  observaciones: { color: AppColors.textPrimary },
  descripcion: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 12 },
  submitButton: { marginTop: 16 },
});
