import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { AlumnoDejarResenaModal } from './AlumnoDejarResenaModal';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoDocumentosScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.documentos());
  const [resenaVisible, setResenaVisible] = useState(false);

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const necesitaFirma = datos.necesita_firma === true;
        const certEmitido = datos.cert_emitido === true;
        const certFolio = (datos.cert_folio as string) ?? '';
        const yaComento = datos.ya_comento === true;

        return (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          >
            <TouchableOpacity onPress={() => router.push('/alumno/documentos/contrato')}>
              <Card style={styles.itemCard}>
                <Ionicons name="document-text-outline" size={24} color={necesitaFirma ? AppColors.warning : AppColors.success} />
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>Contrato de matrícula</Text>
                  <Text style={styles.itemSubtitle}>{necesitaFirma ? 'Pendiente de tu firma' : 'Firmado'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
              </Card>
            </TouchableOpacity>

            <Card style={styles.itemCard}>
              <Ionicons name="ribbon-outline" size={24} color={certEmitido ? AppColors.success : AppColors.textSecondary} />
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>Certificado de aprobación</Text>
                <Text style={styles.itemSubtitle}>{certEmitido ? `Emitido · Folio ${certFolio}` : 'Aún no emitido'}</Text>
              </View>
              {certEmitido ? <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} /> : null}
            </Card>

            {!yaComento ? (
              <View style={styles.resenaButton}>
                <Button
                  label="Dejar una reseña"
                  variant="outline"
                  onPress={() => setResenaVisible(true)}
                  icon={<Ionicons name="star-outline" size={18} color={AppColors.primary} />}
                />
              </View>
            ) : null}

            <AlumnoDejarResenaModal
              visible={resenaVisible}
              onClose={() => setResenaVisible(false)}
              onSent={() => {
                setResenaVisible(false);
                refetch();
              }}
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
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  resenaButton: { marginTop: 12 },
});
