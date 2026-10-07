import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { InstructorRepository } from './instructorRepository';

/**
 * Corrige fecha / alumno / km de salida de una ruta en curso (por ejemplo una
 * ruta olvidada abierta desde otro día) sin tener que borrarla.
 */
export function InstructorCorregirInicioModal({
  visible,
  onClose,
  ruta,
  onGuardado,
}: {
  visible: boolean;
  onClose: () => void;
  ruta: Record<string, unknown>;
  onGuardado: () => void;
}) {
  const [fecha, setFecha] = useState(new Date());
  const [alumnoRut, setAlumnoRut] = useState('');
  const [km, setKm] = useState('');
  const [alumnos, setAlumnos] = useState<Record<string, unknown>[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const f = dayjs(String(ruta.fecha ?? '').substring(0, 10));
    setFecha(f.isValid() ? f.toDate() : new Date());
    setAlumnoRut(String(ruta.alumno_rut ?? ''));
    setKm(String(ruta.km_inicio ?? ''));
    InstructorRepository.alumnos()
      .then(setAlumnos)
      .catch(() => {});
  }, [visible, ruta]);

  const guardar = async () => {
    if (!km.trim() || Number.isNaN(Number(km))) {
      showToast('Ingresa el kilometraje de salida.', true);
      return;
    }
    try {
      const msg = await InstructorRepository.actualizarInicioRuta({
        idRuta: Number(ruta.id),
        kmInicio: Number(km),
        fecha: dayjs(fecha).format('YYYY-MM-DD'),
        alumnoRut: alumnoRut || null,
      });
      showToast(msg || 'Datos de inicio corregidos.');
      onGuardado();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const opciones = [{ label: 'Sin alumno', value: '' }];
  const vistos = new Set<string>(['']);
  if (ruta.alumno_rut && ruta.alu_nombre) {
    vistos.add(String(ruta.alumno_rut));
    opciones.push({ label: `${ruta.alu_nombre} ${ruta.alu_apellido ?? ''}`.trim(), value: String(ruta.alumno_rut) });
  }
  for (const a of alumnos) {
    const rut = String(a.alumno_rut ?? a.rut ?? '');
    if (!rut || vistos.has(rut)) continue;
    vistos.add(rut);
    opciones.push({ label: `${a.nombres ?? ''} ${a.apellidos ?? ''}`.trim(), value: rut });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Corregir datos de inicio</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.ayuda}>Úsalo si la ruta quedó abierta desde otro día o se inició con datos equivocados.</Text>

          <Text style={styles.label}>Fecha de la clase</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.dateButtonText}>{dayjs(fecha).format('DD/MM/YYYY')}</Text>
          </TouchableOpacity>
          {pickerVisible ? (
            <DateTimePicker
              value={fecha}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, d) => {
                setPickerVisible(false);
                if (d) setFecha(d);
              }}
            />
          ) : null}

          <Select label="Alumno" value={alumnoRut} options={opciones} onChange={setAlumnoRut} />
          <TextField label="Kilometraje de salida" keyboardType="number-pad" value={km} onChangeText={setKm} />
          <Button label="Guardar corrección" onPress={guardar} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 20 },
  ayuda: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 16 },
  label: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  dateButton: { borderWidth: 1, borderColor: AppColors.primary, borderRadius: Radii.md, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  dateButtonText: { color: AppColors.primary, fontWeight: '700' },
});
