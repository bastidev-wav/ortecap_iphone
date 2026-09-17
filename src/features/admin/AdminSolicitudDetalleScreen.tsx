import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatCLP, formatFecha, formatHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { Select } from '../../shared/components/Select';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { showTextInputPrompt } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminSolicitudDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const solicitudId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.solicitudDetalle(solicitudId), [solicitudId]);

  const [bloqueTeorico, setBloqueTeorico] = useState<string | number>('omitir');
  const [bloquePractico, setBloquePractico] = useState<string | number>('omitir');

  const aprobar = async () => {
    try {
      await AdminRepository.aprobarSolicitud(solicitudId, {
        bloqueTeoricoId: bloqueTeorico,
        bloquePracticoId: bloquePractico,
      });
      showToast('¡Solicitud aprobada y alumno matriculado!');
      if (router.canGoBack()) router.back();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const rechazar = async () => {
    const motivo = await showTextInputPrompt({ title: 'Motivo del rechazo', placeholder: 'Ej: Documentación incompleta' });
    if (!motivo) return;
    try {
      await AdminRepository.rechazarSolicitud(solicitudId, motivo);
      showToast('Solicitud rechazada y alumno notificado.');
      if (router.canGoBack()) router.back();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(detalle) => {
          const solicitud = detalle.solicitud as Record<string, unknown>;
          const documentos = (detalle.documentos as Record<string, unknown>[]) ?? [];
          const bloquesTeoricos = (detalle.bloques_teoricos as Record<string, unknown>[]) ?? [];
          const bloquesPracticos = (detalle.bloques_practicos as Record<string, unknown>[]) ?? [];
          const esPendiente = solicitud.estado === 'pendiente';

          const opcionesBloque = (bloques: Record<string, unknown>[]) => [
            { label: 'No asignar por ahora', value: 'omitir' as string | number },
            ...bloques.map((b) => ({
              label: `${formatFecha(b.fecha as string)} · ${formatHora(b.hora_inicio as string)} · ${b.prof_nombre} ${b.prof_apellido ?? ''}`,
              value: b.id as number,
            })),
          ];

          return (
            <>
              <View style={styles.header}>
                <View style={styles.flex1}>
                  <Text style={styles.nombre}>
                    {solicitud.nombres as string} {(solicitud.apellidos as string) ?? ''}
                  </Text>
                  <View style={styles.badgeWrap}>
                    <AutoStatusBadge estado={String(solicitud.estado ?? '')} />
                  </View>
                </View>
              </View>

              <Card>
                <InfoRow label="RUT" value={solicitud.rut as string} />
                <InfoRow label="Correo" value={solicitud.correo as string} />
                <InfoRow label="Teléfono" value={solicitud.telefono as string} />
                <InfoRow label="Dirección" value={solicitud.direccion as string} />
                <InfoRow label="Curso" value={String(solicitud.curso_nombre ?? solicitud.curso_interes ?? '')} />
                <InfoRow label="Sede" value={solicitud.sede_nombre as string} />
                <InfoRow label="Modalidad" value={solicitud.modalidad as string} />
                <InfoRow label="Precio estimado" value={formatCLP(solicitud.precio_estimado)} />
                <InfoRow label="Forma de pago" value={(solicitud.forma_pago as string) ?? 'Contado'} />
              </Card>

              {documentos.length > 0 ? (
                <>
                  <SectionHeader title={`Documentos adjuntos (${documentos.length})`} />
                  <Card>
                    {documentos.map((d, i) => (
                      <View key={i} style={styles.docRow}>
                        <Ionicons name="document-text-outline" size={18} color={AppColors.textSecondary} />
                        <Text style={styles.docLabel}>{String(d.nombre_archivo)}</Text>
                      </View>
                    ))}
                  </Card>
                </>
              ) : null}

              {esPendiente ? (
                <>
                  <SectionHeader title="Asignar horario (opcional)" />
                  <Card>
                    {bloquesTeoricos.length === 0 ? (
                      <Text style={styles.noBloques}>No hay bloques teóricos disponibles en la sede del alumno.</Text>
                    ) : (
                      <Select label="Bloque teórico" value={bloqueTeorico} options={opcionesBloque(bloquesTeoricos)} onChange={setBloqueTeorico} />
                    )}
                    {bloquesPracticos.length === 0 ? (
                      <Text style={styles.noBloques}>No hay bloques prácticos disponibles en la sede del alumno.</Text>
                    ) : (
                      <Select label="Bloque práctico" value={bloquePractico} options={opcionesBloque(bloquesPracticos)} onChange={setBloquePractico} />
                    )}
                  </Card>

                  <View style={styles.actionsRow}>
                    <View style={styles.flex1}>
                      <Button label="Rechazar" variant="outline" destructive onPress={rechazar} />
                    </View>
                    <View style={styles.flex1}>
                      <Button label="Aprobar" onPress={aprobar} />
                    </View>
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
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  nombre: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  badgeWrap: { marginTop: 6, alignSelf: 'flex-start' },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  docLabel: { fontSize: 13, color: AppColors.textPrimary },
  noBloques: { color: AppColors.textSecondary, fontSize: 12, marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
