import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { SegmentedControl } from '../../shared/components/SegmentedControl';
import { EmptyView } from '../../shared/components/StateViews';
import { showTextInputPrompt } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminCertificadosScreen() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.certificados());

  const emitir = async (matricula: Record<string, unknown>) => {
    const folio = await showTextInputPrompt({
      title: `Emitir certificado para ${matricula.nombres}`,
      placeholder: 'Número de folio (ej: 2026-0001)',
    });
    if (!folio) return;
    try {
      await AdminRepository.emitirCertificado({ matriculaId: matricula.id as number, numeroFolio: folio });
      showToast(`Certificado emitido con folio ${folio}.`);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <View style={styles.flex}>
      <SegmentedControl options={['Pendientes', 'Emitidos']} selectedIndex={tab} onChange={setTab} />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const pendientes = (datos.pendientes as Record<string, unknown>[]) ?? [];
          const emitidos = (datos.emitidos as Record<string, unknown>[]) ?? [];

          if (tab === 0) {
            if (pendientes.length === 0) return <EmptyView message="No hay certificados pendientes." icon="ribbon-outline" />;
            return (
              <FlatList
                data={pendientes}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item: m }) => (
                  <Card style={styles.itemCard}>
                    <AppAvatar nombre={String(m.nombres ?? '?')} />
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>
                        {m.nombres as string} {(m.apellidos as string) ?? ''}
                      </Text>
                      <Text style={styles.itemSubtitle}>{String(m.curso_nombre ?? '')}</Text>
                    </View>
                    <Button label="Emitir" onPress={() => emitir(m)} fullWidth={false} />
                  </Card>
                )}
              />
            );
          }

          if (emitidos.length === 0) return <EmptyView message="No hay certificados emitidos todavía." icon="checkmark-done-outline" />;
          return (
            <FlatList
              data={emitidos}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item: m }) => (
                <Card style={styles.itemCard}>
                  <Ionicons name="checkmark-circle" size={24} color={AppColors.success} />
                  <View style={styles.flex1}>
                    <Text style={styles.itemTitle}>
                      {m.nombres as string} {(m.apellidos as string) ?? ''}
                    </Text>
                    <Text style={styles.itemSubtitle}>Folio: {String(m.numero_folio)}</Text>
                  </View>
                </Card>
              )}
            />
          );
        }}
      </AsyncGate>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  listContent: { padding: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
