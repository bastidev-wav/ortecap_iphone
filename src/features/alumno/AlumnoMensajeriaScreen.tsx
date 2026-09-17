import React from 'react';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { ChatView } from '../../shared/components/ChatView';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoMensajeriaScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.mensajeria());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(mensajes) => (
        <ChatView
          mensajes={mensajes.map((m) => ({ texto: String(m.mensaje ?? ''), esMio: m.remitente_tipo === 'alumno' }))}
          emptyMessage="Escríbenos si tienes dudas sobre tu curso, tus clases o cualquier trámite."
          onSend={async (texto) => {
            try {
              await AlumnoRepository.enviarMensaje(texto);
              refetch();
            } catch (e) {
              showToast(friendlyErrorMessage(e), true);
            }
          }}
        />
      )}
    </AsyncGate>
  );
}
