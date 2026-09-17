import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

const DIAS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
  { id: 7, label: 'Dom' },
];

export function AdminCrearBloquesModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const { data: instructores } = useApiQuery(() => AdminRepository.instructores());

  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(dayjs().add(30, 'day').toDate());
  const [horaInicio, setHoraInicio] = useState(dayjs().hour(9).minute(0).toDate());
  const [horaFin, setHoraFin] = useState(dayjs().hour(13).minute(0).toDate());
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([1, 2, 3, 4, 5]);
  const [instructorRut, setInstructorRut] = useState<string>('');
  const [tipoClase, setTipoClase] = useState<'practica' | 'teorica'>('practica');
  const [duracion, setDuracion] = useState('60');
  const [localidad, setLocalidad] = useState('');
  const [modulo, setModulo] = useState('');
  const [cupoMaximo, setCupoMaximo] = useState('30');
  const [pickerAbierto, setPickerAbierto] = useState<null | 'fechaInicio' | 'fechaFin' | 'horaInicio' | 'horaFin'>(null);

  const toggleDia = (id: number) => {
    setDiasSeleccionados((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const crear = async () => {
    if (!instructorRut) {
      showToast('Selecciona un instructor.', true);
      return;
    }
    if (diasSeleccionados.length === 0) {
      showToast('Selecciona al menos un día de la semana.', true);
      return;
    }
    const esTeorica = tipoClase === 'teorica';
    try {
      const creados = await AdminRepository.crearBloquesAgenda({
        fecha_inicio: dayjs(fechaInicio).format('YYYY-MM-DD'),
        fecha_fin: dayjs(fechaFin).format('YYYY-MM-DD'),
        dias: diasSeleccionados,
        hora_inicio: dayjs(horaInicio).format('HH:mm'),
        hora_fin: dayjs(horaFin).format('HH:mm'),
        instructor_rut: instructorRut,
        localidad_id: localidad.trim() || undefined,
        tipo_clase: tipoClase,
        ...(!esTeorica ? { duracion_minutos: Number(duracion) || 60 } : {}),
        ...(esTeorica ? { modulo: modulo.trim() || undefined, cupo_maximo: Number(cupoMaximo) || 30 } : {}),
      });
      showToast(`Se crearon ${creados} bloques.`);
      onCreated();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const instructorOptions = [
    { label: 'Selecciona un instructor', value: '' },
    ...((instructores ?? []) as Record<string, unknown>[]).map((ins) => ({
      label: `${ins.nombres} ${ins.apellidos ?? ''}`,
      value: String(ins.rut),
    })),
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear bloques de agenda</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Select label="Instructor" value={instructorRut} options={instructorOptions} onChange={setInstructorRut} />

          <View style={styles.row}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setPickerAbierto('fechaInicio')}>
              <Text style={styles.dateButtonText}>Desde: {dayjs(fechaInicio).format('DD/MM/YYYY')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => setPickerAbierto('fechaFin')}>
              <Text style={styles.dateButtonText}>Hasta: {dayjs(fechaFin).format('DD/MM/YYYY')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.diasRow}>
            {DIAS.map((d) => {
              const selected = diasSeleccionados.includes(d.id);
              return (
                <TouchableOpacity key={d.id} onPress={() => toggleDia(d.id)} style={[styles.diaChip, selected && styles.diaChipSelected]}>
                  <Text style={[styles.diaChipText, selected && styles.diaChipTextSelected]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setPickerAbierto('horaInicio')}>
              <Text style={styles.dateButtonText}>Inicio: {dayjs(horaInicio).format('HH:mm')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => setPickerAbierto('horaFin')}>
              <Text style={styles.dateButtonText}>Fin: {dayjs(horaFin).format('HH:mm')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            {tipoClase !== 'teorica' ? (
              <View style={styles.flex1}>
                <TextField label="Duración (min)" keyboardType="number-pad" value={duracion} onChangeText={setDuracion} />
              </View>
            ) : null}
            <View style={styles.flex1}>
              <TextField label="ID sede (opcional)" keyboardType="number-pad" value={localidad} onChangeText={setLocalidad} />
            </View>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.radioRow} onPress={() => setTipoClase('practica')}>
              <View style={[styles.radioCircle, tipoClase === 'practica' && styles.radioCircleSelected]} />
              <Text>Práctica</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioRow} onPress={() => setTipoClase('teorica')}>
              <View style={[styles.radioCircle, tipoClase === 'teorica' && styles.radioCircleSelected]} />
              <Text>Teórica</Text>
            </TouchableOpacity>
          </View>

          {tipoClase === 'teorica' ? (
            <View style={styles.row}>
              <View style={styles.flex1}>
                <TextField label="Módulo (opcional)" value={modulo} onChangeText={setModulo} />
              </View>
              <View style={styles.flex1}>
                <TextField label="Cupo máximo" keyboardType="number-pad" value={cupoMaximo} onChangeText={setCupoMaximo} />
              </View>
            </View>
          ) : null}

          <Button label="Crear bloques" onPress={crear} />
        </ScrollView>

        {pickerAbierto ? (
          <DateTimePicker
            value={
              pickerAbierto === 'fechaInicio' ? fechaInicio : pickerAbierto === 'fechaFin' ? fechaFin : pickerAbierto === 'horaInicio' ? horaInicio : horaFin
            }
            mode={pickerAbierto === 'horaInicio' || pickerAbierto === 'horaFin' ? 'time' : 'date'}
            display="spinner"
            onChange={(_, selected) => {
              if (!selected) {
                setPickerAbierto(null);
                return;
              }
              if (pickerAbierto === 'fechaInicio') setFechaInicio(selected);
              if (pickerAbierto === 'fechaFin') setFechaFin(selected);
              if (pickerAbierto === 'horaInicio') setHoraInicio(selected);
              if (pickerAbierto === 'horaFin') setHoraFin(selected);
              setPickerAbierto(null);
            }}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 20 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  flex1: { flex: 1 },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateButtonText: { color: AppColors.primary, fontWeight: '600', fontSize: 13 },
  diasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  diaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  diaChipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  diaChipText: { fontSize: 13, color: AppColors.textPrimary },
  diaChipTextSelected: { color: '#FFFFFF' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: AppColors.textSecondary,
  },
  radioCircleSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.primary },
});
