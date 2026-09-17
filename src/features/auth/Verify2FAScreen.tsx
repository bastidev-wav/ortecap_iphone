import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { TextField } from '../../shared/components/TextField';

export function Verify2FAScreen() {
  const router = useRouter();
  const verifyTwoFactor = useAuthStore((s) => s.verifyTwoFactor);
  const cancelTwoFactor = useAuthStore((s) => s.cancelTwoFactor);
  const debugCode = useAuthStore((s) => s.lastDebugOtpCode);

  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setErrorMessage('Ingresa el código de 6 dígitos.');
      return;
    }
    setErrorMessage(null);
    try {
      await verifyTwoFactor({ otpCode: trimmed, rememberDevice });
      // El guard del layout raíz redirige al home del rol automáticamente.
    } catch (e) {
      setErrorMessage(friendlyErrorMessage(e));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Verificación de seguridad',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                cancelTwoFactor();
                router.replace('/login');
              }}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <Ionicons name="mail-open-outline" size={56} color={AppColors.primary} style={styles.icon} />
        <Text style={styles.description}>
          Te enviamos un código de 6 dígitos a tu correo institucional. Ingrésalo para continuar.
        </Text>

        {debugCode ? (
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>Modo desarrollo — código: {debugCode}</Text>
          </View>
        ) : null}

        <TextField
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          autoFocus
          textAlign="center"
          style={styles.codeInput}
          onSubmitEditing={submit}
        />

        <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberDevice((v) => !v)}>
          <Ionicons
            name={rememberDevice ? 'checkbox' : 'square-outline'}
            size={22}
            color={rememberDevice ? AppColors.primary : AppColors.textSecondary}
          />
          <Text style={styles.rememberLabel}>Recordar este dispositivo por 30 días</Text>
        </TouchableOpacity>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <View style={styles.submitButton}>
          <Button label="Verificar" onPress={submit} icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  scroll: { padding: 24 },
  icon: { alignSelf: 'center', marginBottom: 16 },
  description: { textAlign: 'center', color: AppColors.textSecondary },
  debugBox: {
    marginTop: 16,
    backgroundColor: `${AppColors.warning}1A`,
    borderRadius: 10,
    padding: 12,
  },
  debugText: { textAlign: 'center', color: AppColors.warning, fontWeight: '700' },
  codeInput: { marginTop: 24, fontSize: 28, letterSpacing: 10, fontWeight: '700' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rememberLabel: { marginLeft: 10, color: AppColors.textPrimary, flex: 1 },
  error: { color: AppColors.danger, fontSize: 13, marginTop: 8 },
  submitButton: { marginTop: 16 },
});
