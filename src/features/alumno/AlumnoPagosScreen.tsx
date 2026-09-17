import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatCLP } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoPagosScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.pagos());
  const [comprobante, setComprobante] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);

  const elegirComprobante = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'] });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setComprobante({ uri: a.uri, name: a.name, mimeType: a.mimeType });
    }
  };

  const enviarComprobante = async () => {
    if (!comprobante) {
      showToast('Selecciona un comprobante primero.', true);
      return;
    }
    try {
      await AlumnoRepository.pagarPorTransferencia(comprobante);
      showToast('¡Cuenta activada! Ya puedes agendar tus clases.');
      router.replace('/alumno/dashboard');
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const matricula = datos.matricula as Record<string, unknown>;
        const requierePago = datos.requiere_pago === true;

        if (!requierePago) {
          return (
            <View style={styles.centerContainer}>
              <Ionicons name="checkmark-circle" size={56} color={AppColors.success} />
              <Text style={styles.centerText}>Tu cuenta ya está activa. ¡No tienes pagos pendientes!</Text>
            </View>
          );
        }

        return (
          <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
            <Card>
              <InfoRow label="Curso" value={matricula.curso_nombre as string} />
              <InfoRow label="Total a pagar" value={formatCLP(matricula.precio_final)} />
              <InfoRow label="Forma de pago" value={(matricula.forma_pago as string) ?? 'Contado'} />
            </Card>

            <SectionHeader title="Opción 1 · Pagar con Webpay" />
            <Button
              label="Pagar ahora con tarjeta"
              onPress={() => router.push('/alumno/pagos/webpay')}
              icon={<Ionicons name="card-outline" size={18} color="#FFFFFF" />}
            />

            <SectionHeader title="Opción 2 · Transferencia bancaria" />
            <Text style={styles.descripcion}>
              Realiza la transferencia y sube tu comprobante. Tu cuenta se activará una vez que administración lo confirme.
            </Text>
            <View style={styles.attachButtonWrap}>
              <Button
                label={comprobante?.name ?? 'Adjuntar comprobante'}
                variant="outline"
                onPress={elegirComprobante}
                icon={<Ionicons name="attach-outline" size={18} color={AppColors.primary} />}
              />
            </View>
            <Button
              label="Enviar comprobante"
              variant="outline"
              onPress={enviarComprobante}
              icon={<Ionicons name="send-outline" size={18} color={AppColors.primary} />}
            />
          </ScrollView>
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { textAlign: 'center', marginTop: 12, color: AppColors.textPrimary },
  descripcion: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 12 },
  attachButtonWrap: { marginBottom: 12 },
});
