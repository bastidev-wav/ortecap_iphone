import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiException } from '../../core/api/apiTypes';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { formatHora } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { InstructorRepository } from './instructorRepository';

export function InstructorIniciarRutaModal({
  visible,
  onClose,
  vehiculosDisponibles,
  alumnoDetectado,
  clasesHoy = [],
  onIniciado,
}: {
  visible: boolean;
  onClose: () => void;
  vehiculosDisponibles: Record<string, unknown>[];
  alumnoDetectado: Record<string, unknown> | null;
  /** Clases reservadas de hoy: atajo para elegir al alumno (la detección es solo una sugerencia). */
  clasesHoy?: Record<string, unknown>[];
  onIniciado: () => void;
}) {
  const router = useRouter();
  const [misAlumnos, setMisAlumnos] = useState<Record<string, unknown>[]>([]);
  const [vehiculoId, setVehiculoId] = useState('');
  const [alumnoRut, setAlumnoRut] = useState(String(alumnoDetectado?.rut ?? ''));
  const [km, setKm] = useState('');
  const [luces, setLuces] = useState(false);
  const [documentos, setDocumentos] = useState(false);
  const [neumaticos, setNeumaticos] = useState(false);
  const [limpieza, setLimpieza] = useState(false);

  useEffect(() => {
    if (visible) {
      InstructorRepository.alumnos()
        .then(setMisAlumnos)
        .catch(() => {});
    }
  }, [visible]);

  const iniciar = async () => {
    if (!vehiculoId || !km.trim()) {
      showToast('Completa el vehículo y el kilometraje.', true);
      return;
    }

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch {
      // Si no hay permiso/GPS, igual permitimos iniciar sin coordenadas.
    }

    try {
      const hojaRutaId = await InstructorRepository.iniciarRuta({
        vehiculo_id: Number(vehiculoId),
        km_inicio: km.trim(),
        ...(alumnoRut ? { alumno_rut: alumnoRut } : {}),
        lat_inicio: lat,
        lng_inicio: lng,
        check_luces: luces,
        check_documentos: documentos,
        check_neumaticos: neumaticos,
        check_limpieza: limpieza,
      });
      onIniciado();
      router.push(`/instructor/vehiculos/hoja-ruta/${hojaRutaId}`);
    } catch (e) {
      // v2: no se puede abrir una ruta nueva mientras otra siga sin cerrar.
      const abierta = e instanceof ApiException && e.statusCode === 409 ? Number(e.errors?.hoja_ruta_abierta_id) : NaN;
      if (abierta) {
        Alert.alert('Tienes una ruta sin cerrar', (e as ApiException).message, [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Ir a esa ruta',
            onPress: () => {
              onIniciado();
              router.push(`/instructor/vehiculos/hoja-ruta/${abierta}`);
            },
          },
        ]);
        return;
      }
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const vehiculoOptions = [
    { label: 'Selecciona un vehículo', value: '' },
    ...vehiculosDisponibles.map((v) => ({ label: `${v.marca} ${v.modelo} · ${v.patente}`, value: String(v.id) })),
  ];
  const alumnoOptions = [{ label: 'Sin alumno', value: '' }];
  const vistos = new Set<string>(['']);
  const candidatos: Record<string, unknown>[] = [...clasesHoy, ...misAlumnos];
  for (const a of candidatos) {
    const rut = String(a.alumno_rut ?? a.rut ?? '');
    if (vistos.has(rut)) continue;
    vistos.add(rut);
    alumnoOptions.push({ label: `${a.nombres ?? ''} ${a.apellidos ?? ''}`.trim() || rut, value: rut });
  }
  const clasesConAlumno = clasesHoy.filter((c) => c.alumno_rut);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Iniciar ruta</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {alumnoDetectado ? (
            <Text style={styles.detectado}>
              Alumno detectado automáticamente: {String(alumnoDetectado.nombres)} {String(alumnoDetectado.apellidos ?? '')}
            </Text>
          ) : null}

          <Select label="Vehículo" value={vehiculoId} options={vehiculoOptions} onChange={setVehiculoId} />

          {clasesConAlumno.length > 0 ? (
            <View style={styles.clasesHoy}>
              <Text style={styles.clasesHoyLabel}>Tus clases de hoy</Text>
              <View style={styles.chips}>
                {clasesConAlumno.map((c) => {
                  const sel = alumnoRut === c.alumno_rut;
                  return (
                    <TouchableOpacity
                      key={String(c.id)}
                      style={[styles.chip, sel && styles.chipSel]}
                      onPress={() => setAlumnoRut(String(c.alumno_rut))}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                        {formatHora(c.hora_inicio as string)} · {String(c.nombres ?? '')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          <Select label="Alumno (opcional)" value={alumnoRut} options={alumnoOptions} onChange={setAlumnoRut} />
          <TextField label="Kilometraje actual" keyboardType="number-pad" value={km} onChangeText={setKm} />

          <CheckRow label="Luces OK" value={luces} onChange={setLuces} />
          <CheckRow label="Documentos al día" value={documentos} onChange={setDocumentos} />
          <CheckRow label="Neumáticos OK" value={neumaticos} onChange={setNeumaticos} />
          <CheckRow label="Vehículo limpio" value={limpieza} onChange={setLimpieza} />

          <View style={styles.submitButton}>
            <Button label="Iniciar ruta" onPress={iniciar} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function CheckRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.checkRow}>
      <Text style={styles.checkLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: AppColors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 20 },
  detectado: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 16 },
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  checkLabel: { color: AppColors.textPrimary },
  submitButton: { marginTop: 8 },
  clasesHoy: { marginBottom: 12 },
  clasesHoyLabel: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border },
  chipSel: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, color: AppColors.textPrimary },
  chipTextSel: { color: '#FFFFFF', fontWeight: '700' },
});
