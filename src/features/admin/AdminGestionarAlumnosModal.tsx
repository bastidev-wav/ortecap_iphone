import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminGestionarAlumnosModal({
  agendaClaseId,
  visible,
  onClose,
}: {
  agendaClaseId: number | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [rut, setRut] = useState('');
  const [roster, setRoster] = useState<Record<string, unknown> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    if (!agendaClaseId) return;
    setCargando(true);
    try {
      const data = await AdminRepository.alumnosClase(agendaClaseId);
      setRoster(data);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (visible) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, agendaClaseId]);

  const agregar = async () => {
    if (!rut.trim() || !agendaClaseId) return;
    setGuardando(true);
    try {
      const data = await AdminRepository.agregarAlumnoClase({ agendaClaseId, alumnoRut: rut.trim() });
      setRoster(data);
      setRut('');
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (alumnoRut: string) => {
    if (!agendaClaseId) return;
    setGuardando(true);
    try {
      const data = await AdminRepository.quitarAlumnoClase({ agendaClaseId, alumnoRut });
      setRoster(data);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      setGuardando(false);
    }
  };

  const inscritos = (roster?.inscritos as Record<string, unknown>[]) ?? [];
  const cupo = roster?.cupo ?? '-';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Alumnos de la clase ({inscritos.length}/{String(cupo)})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <View style={styles.addRow}>
            <View style={styles.flex1}>
              <TextField placeholder="RUT del alumno" value={rut} onChangeText={setRut} onSubmitEditing={agregar} autoCapitalize="none" />
            </View>
            <Button label="Agregar" onPress={agregar} disabled={guardando} fullWidth={false} />
          </View>

          {cargando ? (
            <ActivityIndicator color={AppColors.primary} style={{ marginTop: 20 }} />
          ) : inscritos.length === 0 ? (
            <Text style={styles.emptyText}>Sin alumnos inscritos todavía.</Text>
          ) : (
            <FlatList
              data={inscritos}
              keyExtractor={(item) => String(item.alumno_rut)}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item: a }) => (
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.itemTitle}>
                      {a.nombres as string} {(a.apellidos as string) ?? ''}
                    </Text>
                    <Text style={styles.itemSubtitle}>{String(a.alumno_rut)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => quitar(String(a.alumno_rut))} disabled={guardando} hitSlop={8}>
                    <Ionicons name="person-remove-outline" size={22} color={AppColors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
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
  title: { fontSize: 16, fontWeight: '800', color: AppColors.textPrimary, flex: 1 },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 16, flex: 1 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  flex1: { flex: 1 },
  emptyText: { color: AppColors.textSecondary, textAlign: 'center', marginTop: 24 },
  separator: { height: 1, backgroundColor: AppColors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  itemTitle: { fontWeight: '700', color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
