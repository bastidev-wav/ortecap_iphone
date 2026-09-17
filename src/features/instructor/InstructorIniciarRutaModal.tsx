import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
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
  onIniciado,
}: {
  visible: boolean;
  onClose: () => void;
  vehiculosDisponibles: Record<string, unknown>[];
  alumnoDetectado: Record<string, unknown> | null;
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
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const vehiculoOptions = [
    { label: 'Selecciona un vehículo', value: '' },
    ...vehiculosDisponibles.map((v) => ({ label: `${v.marca} ${v.modelo} · ${v.patente}`, value: String(v.id) })),
  ];
  const alumnoOptions = [
    { label: 'Sin alumno', value: '' },
    ...misAlumnos.map((a) => ({
      label: `${a.nombres} ${a.apellidos ?? ''}`,
      value: String(a.alumno_rut ?? a.rut ?? ''),
    })),
  ];

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
});
