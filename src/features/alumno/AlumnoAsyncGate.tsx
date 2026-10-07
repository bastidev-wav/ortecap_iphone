import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiException } from '../../core/api/apiTypes';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';

/**
 * Igual que AsyncGate, pero si el backend responde 402 (matrícula con pago
 * pendiente, lo que hacen casi todos los endpoints de Alumno) muestra una
 * invitación a activar la cuenta en vez del error genérico.
 */
export function AlumnoAsyncGate<T>(props: React.ComponentProps<typeof AsyncGate<T>>) {
  return <AsyncGate<T> {...props} renderError={(e) => (e instanceof ApiException && e.isPaymentRequired ? <PagoPendiente mensaje={e.message} /> : null)} />;
}

function PagoPendiente({ mensaje }: { mensaje: string }) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={56} color={AppColors.warning} />
      <Text style={styles.titulo}>Tu cuenta está pendiente de activación</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      <View style={styles.boton}>
        <Button
          label="Activar mi cuenta"
          onPress={() => router.push('/alumno/pagos')}
          icon={<Ionicons name="card-outline" size={18} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 16, fontWeight: '800', color: AppColors.textPrimary, textAlign: 'center', marginTop: 16 },
  mensaje: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8 },
  boton: { marginTop: 20, alignSelf: 'stretch' },
});
