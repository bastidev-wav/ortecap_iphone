import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { AuthRepository } from '../../core/auth/authRepository';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { showToast } from '../../shared/components/Toast';
import { TextField } from '../../shared/components/TextField';

export function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ otpSession?: string; identificador?: string; debugOtpCode?: string }>();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    setErrorMessage(null);
    if (code.trim().length < 6) {
      setErrorMessage('Código inválido');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mínimo 6 caracteres');
      return;
    }
    if (confirm !== password) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }
    if (!params.otpSession) {
      setErrorMessage('Sesión de recuperación inválida. Vuelve a solicitar el código.');
      return;
    }

    try {
      await AuthRepository.resetPassword({ otpSession: params.otpSession, otpCode: code.trim(), newPassword: password });
      showToast('Contraseña actualizada. Ya puedes iniciar sesión.');
      router.replace('/login');
    } catch (e) {
      setErrorMessage(friendlyErrorMessage(e));
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      {params.identificador ? <Text style={styles.description}>Código enviado a: {params.identificador}</Text> : null}
      {params.debugOtpCode ? (
        <Text style={styles.debugText}>Modo desarrollo — código: {params.debugOtpCode}</Text>
      ) : null}

      <TextField
        label="Código de 6 dígitos"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <TextField label="Nueva contraseña" secureTextEntry value={password} onChangeText={setPassword} />
      <TextField label="Confirmar contraseña" secureTextEntry value={confirm} onChangeText={setConfirm} />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Button label="Actualizar contraseña" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: 24 },
  description: { textAlign: 'center', color: AppColors.textSecondary, marginBottom: 8 },
  debugText: {
    textAlign: 'center',
    color: AppColors.warning,
    fontWeight: '700',
    backgroundColor: `${AppColors.warning}1A`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  error: { color: AppColors.danger, fontSize: 13, marginBottom: 12 },
});
