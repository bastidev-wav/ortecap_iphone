import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { LoadingView } from '../../shared/components/StateViews';
import { AdminMantenimientoModal } from './AdminMantenimientoModal';
import { AdminRepository } from './adminRepository';

export function AdminVehiculoDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehiculoId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.vehiculoDetalle(vehiculoId), [vehiculoId]);
  const { data: historial, loading: loadingHistorial, refetch: refetchHistorial } = useApiQuery(
    () => AdminRepository.historialVehiculo(vehiculoId),
    [vehiculoId],
  );
  const [mantenimientoVisible, setMantenimientoVisible] = useState(false);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(vehiculo) => (
          <>
            <Card>
              <InfoRow label="Patente" value={vehiculo.patente as string} />
              <InfoRow label="Marca / Modelo" value={`${vehiculo.marca} ${vehiculo.modelo}`} />
              <InfoRow label="Año" value={String(vehiculo.anio ?? '')} />
              <InfoRow label="Kilometraje" value={`${vehiculo.kilometraje_actual} km`} />
              <InfoRow label="Estado" value={String(vehiculo.estado ?? '')} />
            </Card>

            <View style={styles.mantenimientoButton}>
              <Button
                label="Registrar mantención"
                onPress={() => setMantenimientoVisible(true)}
                icon={<Ionicons name="build-outline" size={18} color="#FFFFFF" />}
              />
            </View>

            <SectionHeader title="Historial de uso" />
            {loadingHistorial ? (
              <LoadingView />
            ) : !historial || historial.length === 0 ? (
              <Text style={styles.emptyText}>Sin registros de uso todavía.</Text>
            ) : (
              historial.map((h, i) => {
                const km = h.km_fin != null && h.km_inicio != null ? (h.km_fin as number) - (h.km_inicio as number) : null;
                return (
                  <TouchableOpacity key={i} onPress={() => router.push(`/admin/vehiculos/hoja-ruta/${h.id}`)}>
                    <Card style={styles.historialCard}>
                      <Ionicons name="navigate-outline" size={20} color={AppColors.textSecondary} />
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>
                          {h.nombres as string} {(h.apellidos as string) ?? ''}
                        </Text>
                        <Text style={styles.itemSubtitle}>
                          {formatFecha(h.fecha as string)} · {formatHora(h.hora_inicio as string)} - {formatHora(h.hora_fin as string)}
                        </Text>
                      </View>
                      <Text style={styles.kmText}>{km !== null ? `${km} km` : '-'}</Text>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}

            <AdminMantenimientoModal
              vehiculoId={vehiculoId}
              kilometrajeActual={vehiculo.kilometraje_actual as string}
              visible={mantenimientoVisible}
              onClose={() => setMantenimientoVisible(false)}
              onSaved={() => {
                setMantenimientoVisible(false);
                refetch();
                refetchHistorial();
              }}
            />
          </>
        )}
      </AsyncGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1, marginLeft: 12 },
  content: { padding: 16, paddingBottom: 40 },
  mantenimientoButton: { marginVertical: 16 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  historialCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  kmText: { fontSize: 12, color: AppColors.textSecondary },
});
