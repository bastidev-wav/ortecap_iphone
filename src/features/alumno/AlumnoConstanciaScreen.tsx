import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFecha } from '../../core/utils/formatters';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow } from '../../shared/components/CommonWidgets';
import { showToast } from '../../shared/components/Toast';
import { AlumnoAsyncGate } from './AlumnoAsyncGate';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoConstanciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const agendaId = Number(id);
  const [conFirma, setConFirma] = useState(true);
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.constancia(agendaId, conFirma), [agendaId, conFirma]);
  const [html, setHtml] = useState<string | null>(null);

  const cargarDocumento = () => AlumnoRepository.constanciaDocumento(agendaId, conFirma);

  const verDocumento = async () => {
    try {
      setHtml(await cargarDocumento());
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const compartirPdf = async () => {
    try {
      const documento = await cargarDocumento();
      const { uri } = await Print.printToFileAsync({ html: documento });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Constancia de asistencia' });
      } else {
        showToast('Este dispositivo no permite compartir archivos.', true);
      }
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const imprimir = async () => {
    try {
      await Print.printAsync({ html: await cargarDocumento() });
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AlumnoAsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(c) => {
          const alumno = (c.alumno as Record<string, unknown>) ?? {};
          const act = (c.actividad as Record<string, unknown>) ?? {};
          return (
            <>
              <View style={styles.header}>
                <Ionicons name="ribbon-outline" size={40} color={AppColors.primary} />
                <Text style={styles.titulo}>Constancia de asistencia</Text>
                <Text style={styles.subtitulo}>{String(act.tipo ?? '')}</Text>
              </View>

              <Card>
                <InfoRow label="Alumno" value={String(alumno.nombre ?? '')} />
                <InfoRow label="RUT" value={String(alumno.rut ?? '')} />
                <InfoRow label="Curso" value={String(act.curso ?? '')} />
                {act.modulo ? <InfoRow label="Módulo" value={String(act.modulo)} /> : null}
                <InfoRow label="Fecha" value={formatFecha(act.fecha as string)} />
                <InfoRow label="Horario" value={`${act.hora_inicio ?? ''} - ${act.hora_fin ?? ''}`} />
                <InfoRow label="Sede" value={String(act.sede ?? '')} />
                <InfoRow label="Instructor" value={String(act.instructor ?? '')} />
              </Card>

              <Card style={styles.codigoCard}>
                <Text style={styles.codigoLabel}>Código de verificación</Text>
                <Text style={styles.codigo}>{String(c.codigo ?? '')}</Text>
                <Text style={styles.codigoAyuda}>Quien reciba la constancia puede verificarla en ortecap.cl con este código.</Text>
              </Card>

              <View style={styles.firmaRow}>
                <View style={styles.flex1}>
                  <Text style={styles.firmaTitulo}>Incluir firma de Ortecap</Text>
                  <Text style={styles.firmaAyuda}>Recomendado si la presentarás en una institución.</Text>
                </View>
                <Switch value={conFirma} onValueChange={setConFirma} trackColor={{ true: AppColors.primary }} />
              </View>

              <View style={styles.botones}>
                <Button label="Compartir PDF" onPress={compartirPdf} icon={<Ionicons name="share-outline" size={18} color="#FFFFFF" />} />
                <Button
                  label="Ver documento"
                  variant="outline"
                  onPress={verDocumento}
                  icon={<Ionicons name="eye-outline" size={18} color={AppColors.primary} />}
                />
                <Button label="Imprimir" variant="text" onPress={imprimir} />
              </View>
            </>
          );
        }}
      </AlumnoAsyncGate>

      <Modal visible={html !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHtml(null)}>
        <SafeAreaView style={styles.flex} edges={['bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Constancia</Text>
            <TouchableOpacity onPress={() => setHtml(null)}>
              <Text style={styles.cerrar}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          {html ? <WebView originWhitelist={['*']} source={{ html, baseUrl: 'https://ortecap.cl/' }} /> : null}
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 18, fontWeight: '800', color: AppColors.textPrimary, marginTop: 8 },
  subtitulo: { color: AppColors.textSecondary, marginTop: 2 },
  codigoCard: { alignItems: 'center', marginTop: 12 },
  codigoLabel: { fontSize: 12, color: AppColors.textSecondary, fontWeight: '600' },
  codigo: { fontSize: 22, fontWeight: '800', letterSpacing: 2, color: AppColors.primary, marginVertical: 4 },
  codigoAyuda: { fontSize: 12, color: AppColors.textSecondary, textAlign: 'center' },
  firmaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  firmaTitulo: { fontWeight: '700', color: AppColors.textPrimary },
  firmaAyuda: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  botones: { marginTop: 20, gap: 10 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radii.lg,
  },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  cerrar: { color: AppColors.primary, fontWeight: '600' },
});
