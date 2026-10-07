import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog, showOptionsActionSheet } from '../../shared/dialogs';
import { AdminRepository } from './adminRepository';

/** Hojas de ruta que siguen "en curso" (las más antiguas, probablemente olvidadas, primero). */
export function AdminSesionesAbiertasScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.sesionesAbiertas());

  const acciones = async (s: Record<string, unknown>) => {
    const sel = await showOptionsActionSheet({
      title: `${s.prof_nombre ?? ''} ${s.prof_apellido ?? ''} · ${s.patente ?? ''}`,
      options: ['Ver hoja de ruta', 'Forzar cierre'],
      destructiveIndex: 1,
    });
    if (sel === 0) router.push(`/admin/vehiculos/hoja-ruta/${s.id}`);
    if (sel !== 1) return;

    const ok = await showConfirmDialog({
      title: 'Forzar cierre',
      message: 'Se eliminará la hoja de ruta incompleta, el vehículo quedará disponible y la clase volverá a quedar pendiente.',
      confirmLabel: 'Cerrar sesión',
    });
    if (!ok) return;
    try {
      const msg = await AdminRepository.forzarCierreSesion(Number(s.id));
      showToast(msg || 'Sesión cerrada.');
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(sesiones) => (
        <FlatList
          data={sesiones}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyView message="No hay rutas abiertas. Todo en orden." icon="checkmark-circle-outline" />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item: s }) => {
            const dias = Number(s.dias_abierta ?? 0);
            return (
              <TouchableOpacity onPress={() => acciones(s)}>
                <Card style={styles.card}>
                  <Ionicons name="navigate-outline" size={22} color={dias >= 1 ? AppColors.danger : AppColors.primary} />
                  <View style={styles.flex1}>
                    <Text style={styles.titulo}>
                      {String(s.prof_nombre ?? '')} {String(s.prof_apellido ?? '')}
                    </Text>
                    <Text style={styles.subtitulo}>
                      {String(s.patente ?? '')} · {s.alu_nombre ? `${s.alu_nombre} ${s.alu_apellido ?? ''}` : 'Sin alumno'}
                    </Text>
                    <Text style={styles.subtitulo}>
                      Desde {formatFecha(s.fecha as string)} {formatHora(s.hora_inicio as string)}
                    </Text>
                  </View>
                  <StatusBadge
                    label={dias === 0 ? 'Hoy' : dias === 1 ? '1 día' : `${dias} días`}
                    color={dias >= 1 ? AppColors.danger : AppColors.info}
                  />
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 12, backgroundColor: AppColors.background, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex1: { flex: 1 },
  titulo: { fontWeight: '700', color: AppColors.textPrimary },
  subtitulo: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
