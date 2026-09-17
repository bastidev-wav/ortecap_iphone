import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { showTextInputPrompt } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminMensajeriaScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.mensajeriaContactos());

  const enviarMasivo = async () => {
    const mensaje = await showTextInputPrompt({
      title: 'Mensaje a todos los alumnos',
      placeholder: 'Puedes usar {alumnos.nombres} para personalizar',
    });
    if (!mensaje) return;
    try {
      await AdminRepository.enviarMensaje({ destinatarioId: 'todos', mensaje });
      showToast('Mensaje masivo enviado.');
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={enviarMasivo} hitSlop={12}>
              <Ionicons name="megaphone-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const contactos = (datos.contactos as Record<string, unknown>[]) ?? [];
          if (contactos.length === 0) return <EmptyView message="No hay conversaciones todavía." icon="chatbubble-outline" />;
          return (
            <FlatList
              data={contactos}
              keyExtractor={(item) => String(item.rut)}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item: c }) => {
                const noLeidos = Number(c.no_leidos ?? 0);
                return (
                  <TouchableOpacity onPress={() => router.push(`/admin/mensajeria/${c.rut}`)} style={styles.row}>
                    <AppAvatar nombre={String(c.nombres ?? '?')} />
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>
                        {c.nombres as string} {(c.apellidos as string) ?? ''}
                      </Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {String(c.ultimo_mensaje ?? '')}
                      </Text>
                    </View>
                    {noLeidos > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{noLeidos}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          );
        }}
      </AsyncGate>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  separator: { height: 1, backgroundColor: AppColors.border },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#FFFFFF' },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: AppColors.danger, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
