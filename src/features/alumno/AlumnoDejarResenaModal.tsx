import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoDejarResenaModal({ visible, onClose, onSent }: { visible: boolean; onClose: () => void; onSent: () => void }) {
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [obtuvoLicencia, setObtuvoLicencia] = useState(false);

  const enviar = async () => {
    try {
      await AlumnoRepository.guardarResena({ calificacion, comentario: comentario.trim(), obtuvoLicencia });
      showToast('¡Gracias por tu comentario!');
      onSent();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Cuéntanos tu experiencia</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setCalificacion(i)}>
                <Ionicons name={i <= calificacion ? 'star' : 'star-outline'} size={32} color={AppColors.accent} />
              </TouchableOpacity>
            ))}
          </View>
          <TextField
            placeholder="¿Cómo fue tu experiencia con Ortecap?"
            value={comentario}
            onChangeText={setComentario}
            multiline
            numberOfLines={3}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Ya obtuve mi licencia</Text>
            <Switch value={obtuvoLicencia} onValueChange={setObtuvoLicencia} trackColor={{ true: AppColors.primary }} />
          </View>
          <Button label="Enviar" onPress={enviar} icon={<Ionicons name="send" size={18} color="#FFFFFF" />} />
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
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  switchLabel: { color: AppColors.textPrimary },
});
