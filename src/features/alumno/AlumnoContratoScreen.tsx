import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatCLP, formatRut } from '../../core/utils/formatters';
import { AppColors, Radii } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow } from '../../shared/components/CommonWidgets';
import { SignatureCaptureField, SignatureCaptureHandle } from '../../shared/components/SignatureCaptureField';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoContratoScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.contrato());
  const firmaRef = useRef<SignatureCaptureHandle>(null);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const alumno = datos.alumno as Record<string, unknown>;
          const contratos = (datos.contratos as Record<string, unknown>[]) ?? [];
          const contrato = contratos[0] ?? {};
          const yaFirmado = contrato.firma_alumno_contrato != null;

          const firmar = async () => {
            const firma = await firmaRef.current?.obtenerFirmaBase64();
            if (!firma) {
              showToast('Dibuja tu firma antes de continuar.', true);
              return;
            }
            try {
              await AlumnoRepository.firmarContrato({
                contratoId: contrato.id as number | undefined,
                matriculaId: contrato.id == null ? (alumno.matricula_id as number | undefined) : undefined,
                firmaBase64: firma,
              });
              showToast('¡Contrato firmado exitosamente!');
              if (router.canGoBack()) router.back();
            } catch (e) {
              showToast(friendlyErrorMessage(e), true);
            }
          };

          return (
            <>
              <Card>
                <InfoRow label="Alumno" value={`${alumno.nombres} ${alumno.apellidos ?? ''}`} />
                <InfoRow label="RUT" value={formatRut(alumno.rut as string)} />
                <InfoRow label="Curso" value={alumno.curso_nombre as string} />
                <InfoRow label="Clase de licencia" value={String(contrato.clase_licencia ?? '-')} />
                <InfoRow label="Sede" value={alumno.sede_nombre as string} />
                <InfoRow label="Precio" value={formatCLP(alumno.precio_final)} />
              </Card>

              <Text style={styles.declaracion}>
                Al firmar declaras haber leído y aceptado los términos y condiciones del contrato de prestación de servicios de
                Ortecap - Escuela de Conductores.
              </Text>

              {yaFirmado ? (
                <View style={styles.firmadoBox}>
                  <Ionicons name="checkmark-circle" size={22} color={AppColors.success} />
                  <Text style={styles.firmadoTexto}>Ya firmaste este contrato.</Text>
                </View>
              ) : (
                <>
                  <SignatureCaptureField ref={firmaRef} label="Tu firma" />
                  <View style={styles.submitButton}>
                    <Button label="Firmar contrato" onPress={firmar} icon={<Ionicons name="create-outline" size={18} color="#FFFFFF" />} />
                  </View>
                </>
              )}
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
  declaracion: { fontSize: 13, color: AppColors.textSecondary, marginVertical: 16 },
  firmadoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${AppColors.success}1A`,
    borderRadius: Radii.md,
    padding: 16,
  },
  firmadoTexto: { color: AppColors.success, fontWeight: '700', flex: 1 },
  submitButton: { marginTop: 20 },
});
