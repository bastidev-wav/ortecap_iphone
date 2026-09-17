import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminMantenimientoModal({
  vehiculoId,
  kilometrajeActual,
  visible,
  onClose,
  onSaved,
}: {
  vehiculoId: number | null;
  kilometrajeActual?: string | number;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [km, setKm] = useState(String(kilometrajeActual ?? ''));
  const [proximoAceite, setProximoAceite] = useState('');
  const [proximoMotor, setProximoMotor] = useState('');
  const [proximoPollen, setProximoPollen] = useState('');
  const [fechaProxima, setFechaProxima] = useState<Date | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const guardar = async () => {
    if (!vehiculoId) return;
    try {
      await AdminRepository.guardarMantenimiento(vehiculoId, {
        km_actual: km.trim(),
        proximo_aceite: proximoAceite.trim(),
        proximo_motor: proximoMotor.trim(),
        proximo_pollen: proximoPollen.trim(),
        fecha_proxima: fechaProxima ? dayjs(fechaProxima).format('YYYY-MM-DD') : null,
      });
      showToast('Mantención registrada.');
      onSaved();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Registrar mantención</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <TextField label="Kilometraje actual" keyboardType="number-pad" value={km} onChangeText={setKm} />
          <TextField label="Próximo cambio de aceite (km)" keyboardType="number-pad" value={proximoAceite} onChangeText={setProximoAceite} />
          <TextField label="Próximo filtro de motor (km)" keyboardType="number-pad" value={proximoMotor} onChangeText={setProximoMotor} />
          <TextField label="Próximo filtro pollen (km)" keyboardType="number-pad" value={proximoPollen} onChangeText={setProximoPollen} />
          <TouchableOpacity style={styles.dateButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.dateButtonText}>
              {fechaProxima ? `Próxima revisión: ${dayjs(fechaProxima).format('DD/MM/YYYY')}` : 'Próxima revisión técnica'}
            </Text>
          </TouchableOpacity>
          <View style={styles.submitButton}>
            <Button label="Guardar" onPress={guardar} />
          </View>
        </ScrollView>
        {pickerVisible ? (
          <DateTimePicker
            value={fechaProxima ?? dayjs().add(90, 'day').toDate()}
            mode="date"
            display="spinner"
            minimumDate={new Date()}
            onChange={(_, selected) => {
              setPickerVisible(false);
              if (selected) setFechaProxima(selected);
            }}
          />
        ) : null}
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
  dateButton: { borderWidth: 1, borderColor: AppColors.primary, borderRadius: Radii.md, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  dateButtonText: { color: AppColors.primary, fontWeight: '600' },
  submitButton: { marginTop: 4 },
});
