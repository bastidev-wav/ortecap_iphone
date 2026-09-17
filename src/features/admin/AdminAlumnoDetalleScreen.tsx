import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatCLP, formatFecha, formatRut } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar, InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { showConfirmDialog, showOptionsActionSheet } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

const OPCIONES_ESTADO = ['pendiente', 'aprobado', 'reprobado'];

export function AdminAlumnoDetalleScreen() {
  const router = useRouter();
  const { rut } = useLocalSearchParams<{ rut: string }>();
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.alumnoDetalle(rut), [rut]);

  const resetearPassword = async () => {
    const confirmar = await showConfirmDialog({
      title: 'Resetear contraseña',
      message: '¿Restablecer la contraseña de este alumno a los primeros 4 dígitos de su RUT?',
    });
    if (!confirmar) return;
    try {
      const resultado = await AdminRepository.resetearPasswordAlumno(rut);
      showToast(`Nueva contraseña: ${resultado.password_nueva}`);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const cambiarEstado = async (matriculaId: number, campo: string, actual: string) => {
    const seleccion = await showOptionsActionSheet({ title: 'Cambiar estado', options: OPCIONES_ESTADO.map(capitalizar) });
    if (seleccion === null) return;
    const nuevoEstado = OPCIONES_ESTADO[seleccion];
    if (nuevoEstado === actual) return;
    try {
      await AdminRepository.actualizarEstadoMatricula(matriculaId, campo, nuevoEstado);
      refetch();
      showToast('Estado actualizado.');
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/admin/alumnos/${rut}/editar`)} hitSlop={12}>
              <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(detalle) => {
          const alumno = detalle.alumno as Record<string, unknown>;
          const matricula = detalle.matricula as Record<string, unknown> | null;
          const documentos = (detalle.documentos as Record<string, unknown>[]) ?? [];
          const recibos = (detalle.recibos_pago as Record<string, unknown>[]) ?? [];
          const statsSimulador = detalle.stats_simulador as Record<string, unknown> | null;

          return (
            <>
              <View style={styles.header}>
                <AppAvatar nombre={String(alumno.nombres ?? '?')} radius={30} />
                <View style={styles.flex1}>
                  <Text style={styles.nombre}>
                    {alumno.nombres as string} {(alumno.apellidos as string) ?? ''}
                  </Text>
                  <Text style={styles.rut}>{formatRut(alumno.rut as string)}</Text>
                </View>
                <TouchableOpacity onPress={resetearPassword} hitSlop={10}>
                  <Ionicons name="key-outline" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Card>
                <InfoRow label="Correo" value={alumno.correo as string} />
                <InfoRow label="Teléfono" value={alumno.telefono as string} />
                <InfoRow label="Dirección" value={alumno.direccion as string} />
              </Card>

              {matricula ? (
                <>
                  <SectionHeader title="Matrícula" trailing={<AutoStatusBadge estado={String(matricula.estado ?? '')} />} />
                  <Card>
                    <InfoRow label="Curso" value={matricula.curso_nombre as string} />
                    <InfoRow label="Precio" value={formatCLP(matricula.precio_final)} />
                    <InfoRow label="Forma de pago" value={matricula.forma_pago as string} />
                    <View style={styles.divider} />
                    <EstadoTile
                      label="Teórico"
                      estado={String(matricula.teorico_estado ?? '')}
                      onPress={() => cambiarEstado(matricula.id as number, 'teorico_estado', String(matricula.teorico_estado))}
                    />
                    <EstadoTile
                      label="Práctico"
                      estado={String(matricula.practico_estado ?? '')}
                      onPress={() => cambiarEstado(matricula.id as number, 'practico_estado', String(matricula.practico_estado))}
                    />
                    <EstadoTile
                      label="Psicotécnico"
                      estado={String(matricula.psicotecnico_estado ?? '')}
                      onPress={() => cambiarEstado(matricula.id as number, 'psicotecnico_estado', String(matricula.psicotecnico_estado))}
                    />
                  </Card>
                </>
              ) : null}

              {statsSimulador ? (
                <>
                  <SectionHeader title="Simulador teórico" />
                  <Card style={styles.miniStatsRow}>
                    <MiniStat label="Intentos" value={String(statsSimulador.total_intentos ?? 0)} />
                    <MiniStat label="Mejor puntaje" value={String(statsSimulador.mejor_puntaje ?? 0)} />
                    <MiniStat label="Aprobado" value={statsSimulador.aprobado === true ? 'Sí' : 'No'} />
                  </Card>
                </>
              ) : null}

              {documentos.length > 0 ? (
                <>
                  <SectionHeader title={`Documentos (${documentos.length})`} />
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

              {recibos.length > 0 ? (
                <>
                  <SectionHeader title="Recibos de pago" />
                  <Card>
                    {recibos.map((r, i) => (
                      <View key={i} style={styles.docRow}>
                        <Ionicons name="receipt-outline" size={18} color={AppColors.textSecondary} />
                        <View>
                          <Text style={styles.docLabel}>{formatCLP(r.monto)}</Text>
                          <Text style={styles.reciboSubtitle}>
                            {String(r.concepto)} · {formatFecha(r.fecha_pago as string)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </Card>
                </>
              ) : null}
            </>
          );
        }}
      </AsyncGate>
    </ScrollView>
  );
}

function EstadoTile({ label, estado, onPress }: { label: string; estado: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.estadoTile}>
      <Text style={styles.estadoLabel}>{label}</Text>
      <AutoStatusBadge estado={estado} />
      <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
    </TouchableOpacity>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function capitalizar(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1, marginLeft: 14 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  nombre: { fontSize: 18, fontWeight: '800', color: AppColors.textPrimary },
  rut: { color: AppColors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 12 },
  estadoTile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  estadoLabel: { flex: 1, fontWeight: '600', color: AppColors.textPrimary },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '800', color: AppColors.primary },
  miniStatLabel: { fontSize: 11, color: AppColors.textSecondary, marginTop: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  docLabel: { fontSize: 13, color: AppColors.textPrimary },
  reciboSubtitle: { fontSize: 11, color: AppColors.textSecondary, marginTop: 2 },
});
