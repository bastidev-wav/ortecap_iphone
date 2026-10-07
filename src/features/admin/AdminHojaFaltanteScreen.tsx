import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiException } from '../../core/api/apiTypes';
import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { EvaluacionChecklist, porcentajeAprobacion } from '../../shared/components/EvaluacionChecklist';
import { Select } from '../../shared/components/Select';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

/** Registra a mano la hoja de ruta de una clase realizada que quedó sin hoja (puede cubrir varias horas seguidas). */
export function AdminHojaFaltanteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agendaId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.formularioHojaFaltante(agendaId), [agendaId]);

  const [vehiculoId, setVehiculoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [kmInicio, setKmInicio] = useState('');
  const [kmFin, setKmFin] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [evaluacion, setEvaluacion] = useState<Record<string, string>>({});

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(form) => {
          const bloque = form.bloque as Record<string, unknown>;
          const existente = form.hoja_existente_id as number | null;
          const consecutivos = (form.bloques_consecutivos as Record<string, unknown>[]) ?? [];
          const vehiculos = (form.vehiculos as Record<string, unknown>[]) ?? [];
          const items = (form.items as Record<string, unknown>) ?? {};
          const porcentaje = porcentajeAprobacion(items, evaluacion);
          const horaFin = consecutivos[cantidad - 1]?.hora_fin ?? bloque.hora_fin;

          const crear = async () => {
            // El detalle de hoja de ruta del backend exige un vehículo existente.
            if (!vehiculoId) {
              showToast('Selecciona el vehículo usado en la clase.', true);
              return;
            }
            if (!kmInicio.trim() || !kmFin.trim()) {
              showToast('Ingresa el kilometraje de inicio y de término.', true);
              return;
            }
            if (Number(kmFin) < Number(kmInicio)) {
              showToast('El kilometraje final no puede ser menor al inicial.', true);
              return;
            }
            try {
              const r = await AdminRepository.crearHojaFaltante(agendaId, {
                vehiculo_id: Number(vehiculoId),
                km_inicio: Number(kmInicio),
                km_fin: Number(kmFin),
                porcentaje_aprobacion: Math.round(porcentaje),
                observaciones: observaciones.trim() || undefined,
                evaluacion,
                cantidad_bloques: cantidad,
              });
              showToast(r.mensaje || 'Hoja de ruta creada.');
              router.replace(`/admin/vehiculos/hoja-ruta/${r.hojaRutaId}`);
            } catch (e) {
              const otra = e instanceof ApiException ? Number(e.errors?.hoja_existente_id) : NaN;
              if (otra) {
                showToast('Ya existe una hoja para ese horario; ábrela para corregirla.', true);
                router.replace(`/admin/vehiculos/hoja-ruta/${otra}`);
                return;
              }
              showToast(friendlyErrorMessage(e), true);
            }
          };

          return (
            <>
              <Card>
                <InfoRow label="Alumno" value={`${bloque.alu_nombre ?? ''} ${bloque.alu_apellido ?? ''}`} />
                <InfoRow label="Instructor" value={`${bloque.prof_nombre ?? ''} ${bloque.prof_apellido ?? ''}`} />
                <InfoRow label="Fecha" value={formatFecha(bloque.fecha as string)} />
                <InfoRow label="Horario" value={`${formatHora(bloque.hora_inicio as string)} - ${formatHora(horaFin as string)}`} />
              </Card>

              {existente ? (
                <Card style={styles.aviso}>
                  <Ionicons name="information-circle-outline" size={20} color={AppColors.info} />
                  <Text style={styles.avisoTexto}>Esta clase ya tiene una hoja de ruta. Ábrela para corregirla en vez de crear otra.</Text>
                  <Button label="Abrir" variant="text" fullWidth={false} onPress={() => router.replace(`/admin/vehiculos/hoja-ruta/${existente}`)} />
                </Card>
              ) : (
                <>
                  {consecutivos.length > 1 ? (
                    <Select
                      label="¿Cuántas horas seguidas cubre esta hoja?"
                      value={cantidad}
                      options={consecutivos.map((b, i) => ({
                        label: `${i + 1} hora${i ? 's' : ''} (hasta las ${formatHora(b.hora_fin as string)})`,
                        value: i + 1,
                      }))}
                      onChange={(v) => setCantidad(Number(v))}
                    />
                  ) : null}
                  <Select
                    label="Vehículo"
                    value={vehiculoId}
                    options={[{ label: 'Selecciona el vehículo', value: '' }, ...vehiculos.map((v) => ({ label: `${v.patente} · ${v.marca ?? ''} ${v.modelo ?? ''}`, value: String(v.id) }))]}
                    onChange={setVehiculoId}
                  />
                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <TextField label="Km inicio" keyboardType="number-pad" value={kmInicio} onChangeText={setKmInicio} />
                    </View>
                    <View style={styles.flex1}>
                      <TextField label="Km término" keyboardType="number-pad" value={kmFin} onChangeText={setKmFin} />
                    </View>
                  </View>
                  <TextField label="Observaciones (opcional)" value={observaciones} onChangeText={setObservaciones} multiline />

                  <SectionHeader title={`Evaluación (${Math.round(porcentaje)}% · ${porcentaje > 75 ? 'aprobado' : 'reprobado'})`} />
                  <EvaluacionChecklist items={items} onChanged={setEvaluacion} />

                  <View style={styles.boton}>
                    <Button label="Crear hoja de ruta" onPress={crear} />
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
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 8 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: `${AppColors.info}14`, borderColor: 'transparent' },
  avisoTexto: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
  boton: { marginTop: 20 },
});
