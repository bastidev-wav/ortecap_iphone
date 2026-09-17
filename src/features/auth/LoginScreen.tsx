import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AppLogo } from '../../shared/components/AppLogo';
import { Button } from '../../shared/components/Button';
import { TextField } from '../../shared/components/TextField';

export function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    setErrorMessage(null);
    if (!rut.trim()) {
      setErrorMessage('Ingresa tu RUT');
      return;
    }
    if (!password) {
      setErrorMessage('Ingresa tu contraseña');
      return;
    }
    try {
      await login({ rut: rut.trim(), password });
    } catch (e) {
      setErrorMessage(friendlyErrorMessage(e));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <AppLogo size={84} />
        </View>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <TextField
          label="RUT"
          placeholder="12.345.678-9"
          value={rut}
          onChangeText={setRut}
          autoCapitalize="none"
          returnKeyType="next"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={obscure}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <TouchableOpacity onPress={() => setObscure((v) => !v)} style={styles.showPassword}>
          <Ionicons name={obscure ? 'eye-off-outline' : 'eye-outline'} size={16} color={AppColors.textSecondary} />
          <Text style={styles.showPasswordText}>{obscure ? 'Mostrar contraseña' : 'Ocultar contraseña'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotLink} onPress={() => router.push('/login/forgot-password')}>
          <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={AppColors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.submitButton}>
          <Button label="Ingresar" onPress={submit} icon={<Ionicons name="log-in-outline" size={18} color="#FFFFFF" />} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  subtitle: { textAlign: 'center', color: AppColors.textSecondary, marginBottom: 32 },
  showPassword: { flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 8 },
  showPasswordText: { color: AppColors.textSecondary, fontSize: 12, marginLeft: 6 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 4 },
  forgotLinkText: { color: AppColors.primary, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${AppColors.danger}14`,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  errorText: { color: AppColors.danger, fontSize: 13, marginLeft: 8, flex: 1 },
  submitButton: { marginTop: 20 },
});
