import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '../../core/theme/colors';

export function InstructorHistorialRutasModal({
  visible,
  onClose,
  historial,
}: {
  visible: boolean;
  onClose: () => void;
  historial: Record<string, unknown>[];
}) {
  const router = useRouter();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Historial de rutas</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={historial}
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: h }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                onClose();
                router.push(`/instructor/vehiculos/hoja-ruta/${h.id}`);
              }}
            >
              <Ionicons name="navigate-outline" size={20} color={AppColors.textSecondary} />
              <View style={styles.flex1}>
                <Text style={styles.itemTitle}>
                  {String(h.patente)} · {String(h.fecha)}
                </Text>
                <Text style={styles.itemSubtitle}>{h.nombres ? `${h.nombres} ${h.apellidos ?? ''}` : 'Sin alumno'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  listContent: { padding: 12 },
  separator: { height: 1, backgroundColor: AppColors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  flex1: { flex: 1 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
