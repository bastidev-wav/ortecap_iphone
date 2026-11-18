import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { useRefetchOnFocus } from '../../core/hooks/useRefetchOnFocus';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { LoadingView } from '../../shared/components/StateViews';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { MantenimientoVehiculoModal } from '../vehiculos/MantenimientoVehiculoModal';
import { DOCUMENTOS_VEHICULO, entero, fechaDeServidor } from '../vehiculos/vehiculosUtils';
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
  const [enMantencion, setEnMantencion] = useState<Record<string, unknown> | null>(null);
  useRefetchOnFocus(refetch);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            refetch();
            refetchHistorial();
          }}
        />
      }
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/admin/vehiculos/editar/${vehiculoId}`)} hitSlop={12} accessibilityLabel="Editar datos">
              <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(vehiculo) => {
          const alertas = ((vehiculo.alertas as unknown[]) ?? []).map(String);
          const observaciones = String(vehiculo.observaciones_tecnicas ?? '').trim();
          return (
            <>
              <Card>
                <View style={styles.patenteFila}>
                  <Text style={styles.patente}>{String(vehiculo.patente ?? '')}</Text>
                  <AutoStatusBadge estado={String(vehiculo.estado ?? '')} />
                </View>
                <InfoRow label="Marca / Modelo" value={`${vehiculo.marca ?? ''} ${vehiculo.modelo ?? ''}`.trim()} />
                <InfoRow label="Año" value={String(vehiculo.anio ?? '')} />
                <InfoRow label="Kilometraje" value={`${vehiculo.kilometraje_actual} km`} />
              </Card>

              {alertas.length > 0 ? (
                <Card style={styles.alertas}>
                  <View style={styles.alertasTitulo}>
                    <Ionicons name="warning-outline" size={20} color={AppColors.warning} />
                    <Text style={styles.alertasTexto}>Alertas</Text>
                  </View>
                  {alertas.map((a) => (
                    <Text key={a} style={styles.alerta}>
                      • {a}
                    </Text>
                  ))}
                </Card>
              ) : null}

              <View style={styles.mantenimientoButton}>
                <Button
                  label="Registrar mantención"
                  onPress={() => setEnMantencion(vehiculo)}
                  icon={<Ionicons name="build-outline" size={18} color="#FFFFFF" />}
                />
              </View>

              <SectionHeader title="Mantención" />
              <Card>
                <FilaPlazo etiqueta="Aceite" ultimo={vehiculo.km_ultimo_cambio_aceite} proximo={vehiculo.km_proximo_cambio_aceite} actual={vehiculo.kilometraje_actual} />
                <FilaPlazo etiqueta="Filtro de motor" ultimo={vehiculo.km_ultimo_filtro_motor} proximo={vehiculo.km_proximo_filtro_motor} actual={vehiculo.kilometraje_actual} />
                <FilaPlazo etiqueta="Filtro de polen" ultimo={vehiculo.km_ultimo_filtro_pollen} proximo={vehiculo.km_proximo_filtro_pollen} actual={vehiculo.kilometraje_actual} />
                <InfoRow label="Embrague" value={textoEmbrague(vehiculo)} />
                <InfoRow label="Próxima revisión" value={formatFecha(String(vehiculo.fecha_proxima_mantencion ?? ''))} />
              </Card>

              <SectionHeader title="Documentos y vencimientos" />
              <Card>
                {Object.entries(DOCUMENTOS_VEHICULO).map(([campo, nombre]) => (
                  <FilaDocumento key={campo} nombre={nombre} fecha={fechaDeServidor(vehiculo[campo])} />
                ))}
                <FilaDocumento nombre="Último cambio de batería" fecha={fechaDeServidor(vehiculo.fecha_ultimo_cambio_bateria)} esVencimiento={false} />
              </Card>

              {observaciones ? (
                <>
                  <SectionHeader title="Observaciones técnicas" />
                  <Text style={styles.observaciones}>{observaciones}</Text>
                </>
              ) : null}

              <SectionHeader title="Historial de uso" />
              {loadingHistorial && !historial ? (
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
            </>
          );
        }}
      </AsyncGate>

      <MantenimientoVehiculoModal
        vehiculo={enMantencion}
        onClose={() => setEnMantencion(null)}
        guardar={(datos) => AdminRepository.guardarMantenimiento(vehiculoId, datos)}
        onGuardado={() => {
          setEnMantencion(null);
          refetch();
        }}
      />
    </ScrollView>
  );
}

function textoEmbrague(v: Record<string, unknown>): string {
  const km = entero(v.km_ultimo_cambio_embrague);
  const fecha = fechaDeServidor(v.fecha_ultimo_cambio_embrague);
  if (km <= 0 && !fecha) return 'Sin registro';
  return [km > 0 ? `${km} km` : null, fecha ? dayjs(fecha).format('DD/MM/YYYY') : null].filter(Boolean).join(' · ');
}

/** "Próximo a los 130000 km (último a los 120000 km)", en rojo si ya toca (faltan 500 km o menos). */
function FilaPlazo({ etiqueta, ultimo, proximo, actual }: { etiqueta: string; ultimo: unknown; proximo: unknown; actual: unknown }) {
  const u = entero(ultimo);
  const p = entero(proximo);
  const toca = p > 0 && entero(actual) >= p - 500;
  return (
    <View style={styles.fila}>
      <Text style={styles.filaEtiqueta}>{etiqueta}</Text>
      <Text style={[styles.filaValor, toca && { color: AppColors.danger }]}>
        {p > 0 ? `Próximo a los ${p} km${u > 0 ? `\n(último a los ${u} km)` : ''}` : 'Sin plazo definido'}
      </Text>
    </View>
  );
}

/** Un documento con su fecha y un aviso si está vencido o por vencer (30 días). */
function FilaDocumento({ nombre, fecha, esVencimiento = true }: { nombre: string; fecha: Date | null; esVencimiento?: boolean }) {
  let texto = 'Sin fecha';
  let color: string = AppColors.textSecondary;
  if (fecha) {
    const f = dayjs(fecha).format('DD/MM/YYYY');
    texto = f;
    color = AppColors.textPrimary;
    if (esVencimiento) {
      const dias = dayjs(fecha).startOf('day').diff(dayjs().startOf('day'), 'day');
      if (dias < 0) {
        texto = `${f} · VENCIDO`;
        color = AppColors.danger;
      } else if (dias <= 30) {
        texto = `${f} · vence en ${dias} día${dias === 1 ? '' : 's'}`;
        color = AppColors.warning;
      } else {
        color = AppColors.success;
      }
    }
  }
  return (
    <View style={styles.docFila}>
      <Text style={styles.docNombre}>{nombre}</Text>
      <Text style={[styles.docFecha, { color }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1, marginLeft: 12 },
  content: { padding: 16, paddingBottom: 40 },
  patenteFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  patente: { fontSize: 20, fontWeight: '800', letterSpacing: 1, color: AppColors.textPrimary },
  alertas: { marginTop: 12, backgroundColor: `${AppColors.warning}1F`, borderColor: 'transparent' },
  alertasTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  alertasTexto: { fontWeight: '800', color: AppColors.textPrimary },
  alerta: { fontSize: 13, color: AppColors.textPrimary, marginTop: 2 },
  mantenimientoButton: { marginVertical: 16 },
  fila: { flexDirection: 'row', paddingVertical: 8 },
  filaEtiqueta: { width: 130, fontSize: 13, color: AppColors.textSecondary },
  filaValor: { flex: 1, fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
  docFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  docNombre: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
  docFecha: { fontSize: 13, fontWeight: '700' },
  observaciones: { color: AppColors.textPrimary, fontSize: 14 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  historialCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  kmText: { fontSize: 12, color: AppColors.textSecondary },
});
