import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { AuthRepository } from '../../core/auth/authRepository';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { TextField } from '../../shared/components/TextField';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [valor, setValor] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = valor.trim();
    if (!trimmed) {
      setErrorMessage('Ingresa tu RUT o correo.');
      return;
    }
    setErrorMessage(null);
    try {
      const resultado = await AuthRepository.forgotPassword(trimmed);
      router.push({
        pathname: '/login/reset-password',
        params: {
          otpSession: resultado.otpSession,
          identificador: trimmed,
          ...(resultado.debugOtpCode ? { debugOtpCode: resultado.debugOtpCode } : {}),
        },
      });
    } catch (e) {
      setErrorMessage(friendlyErrorMessage(e));
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Ionicons name="lock-open-outline" size={56} color={AppColors.primary} style={styles.icon} />
      <Text style={styles.description}>
        Ingresa tu RUT o correo y te enviaremos un código de verificación para crear una nueva contraseña.
      </Text>
      <TextField
        label="RUT o correo"
        value={valor}
        onChangeText={setValor}
        autoFocus
        autoCapitalize="none"
        onSubmitEditing={submit}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button label="Enviar código" onPress={submit} icon={<Ionicons name="send-outline" size={18} color="#FFFFFF" />} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: 24 },
  icon: { alignSelf: 'center', marginBottom: 16 },
  description: { textAlign: 'center', color: AppColors.textSecondary, marginBottom: 24 },
  error: { color: AppColors.danger, fontSize: 13, marginBottom: 12 },
});
