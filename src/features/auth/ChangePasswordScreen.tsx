import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { AuthRepository } from '../../core/auth/authRepository';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { showToast } from '../../shared/components/Toast';
import { TextField } from '../../shared/components/TextField';

export function ChangePasswordScreen() {
  const router = useRouter();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    setErrorMessage(null);
    if (!actual) {
      setErrorMessage('Requerido');
      return;
    }
    if (nueva.length < 6) {
      setErrorMessage('Mínimo 6 caracteres');
      return;
    }
    if (confirmar !== nueva) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }
    try {
      await AuthRepository.changePassword({ currentPassword: actual, newPassword: nueva });
      showToast('Contraseña actualizada correctamente.');
      if (router.canGoBack()) router.back();
    } catch (e) {
      setErrorMessage(friendlyErrorMessage(e));
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <TextField label="Contraseña actual" secureTextEntry value={actual} onChangeText={setActual} />
      <TextField label="Nueva contraseña" secureTextEntry value={nueva} onChangeText={setNueva} />
      <TextField label="Confirmar nueva contraseña" secureTextEntry value={confirmar} onChangeText={setConfirmar} />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button label="Guardar" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: 24 },
  error: { color: AppColors.danger, fontSize: 13, marginBottom: 12 },
});
