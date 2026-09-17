import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useAuthStore } from '../../core/auth/authStore';
import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { ChatView } from '../../shared/components/ChatView';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminChatScreen() {
  const { rut } = useLocalSearchParams<{ rut: string }>();
  const miRut = useAuthStore((s) => s.user?.rut);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.chat(rut), [rut]);

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(chat) => {
        const mensajes = (chat.mensajes as Record<string, unknown>[]) ?? [];
        return (
          <ChatView
            mensajes={mensajes.map((m) => ({
              texto: String(m.mensaje ?? ''),
              esMio: m.remitente_id === miRut || m.remitente_tipo === 'admin',
            }))}
            onSend={async (texto) => {
              try {
                await AdminRepository.enviarMensaje({ destinatarioId: rut, mensaje: texto });
                refetch();
              } catch (e) {
                showToast(friendlyErrorMessage(e), true);
              }
            }}
          />
        );
      }}
    </AsyncGate>
  );
}
