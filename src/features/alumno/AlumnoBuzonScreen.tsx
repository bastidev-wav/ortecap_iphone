import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFechaHora } from '../../core/utils/formatters';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AlumnoAsyncGate } from './AlumnoAsyncGate';
import { AlumnoRepository } from './alumnoRepository';

type TipoBuzon = 'felicitacion' | 'reclamo' | 'sugerencia' | 'mejora';

export const TIPOS_BUZON: { valor: TipoBuzon; etiqueta: string; icono: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
  { valor: 'felicitacion', etiqueta: 'Felicitación', icono: 'happy-outline', color: AppColors.success },
  { valor: 'sugerencia', etiqueta: 'Sugerencia', icono: 'bulb-outline', color: AppColors.info },
  { valor: 'mejora', etiqueta: 'Idea de mejora', icono: 'construct-outline', color: AppColors.primary },
  { valor: 'reclamo', etiqueta: 'Reclamo', icono: 'alert-circle-outline', color: AppColors.danger },
];

export function etiquetaTipoBuzon(tipo: unknown) {
  return TIPOS_BUZON.find((t) => t.valor === tipo) ?? { valor: 'sugerencia', etiqueta: String(tipo ?? ''), icono: 'chatbox-outline', color: AppColors.textSecondary };
}

export function AlumnoBuzonScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.retroalimentaciones());
  const [tipo, setTipo] = useState<TipoBuzon | null>(null);
  const [mensaje, setMensaje] = useState('');

  const enviar = async () => {
    if (!tipo) {
      showToast('Elige el tipo de mensaje.', true);
      return;
    }
    if (!mensaje.trim()) {
      showToast('Escribe tu mensaje antes de enviar.', true);
      return;
    }
    try {
      const msg = await AlumnoRepository.enviarRetroalimentacion({ tipo, mensaje: mensaje.trim() });
      showToast(msg || '¡Gracias por tu comentario!');
      setMensaje('');
      setTipo(null);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refetch} />}
      >
        <Text style={styles.intro}>Cuéntanos qué te gustó o qué podemos mejorar. El equipo de Ortecap lee todos los mensajes.</Text>

        <View style={styles.tipos}>
          {TIPOS_BUZON.map((t) => {
            const sel = tipo === t.valor;
            return (
              <TouchableOpacity
                key={t.valor}
                style={[styles.tipo, sel && { backgroundColor: t.color, borderColor: t.color }]}
                onPress={() => setTipo(t.valor)}
              >
                <Ionicons name={t.icono} size={18} color={sel ? '#FFFFFF' : t.color} />
                <Text style={[styles.tipoTexto, sel && styles.tipoTextoSel]}>{t.etiqueta}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextField placeholder="Escribe tu mensaje..." value={mensaje} onChangeText={setMensaje} multiline maxLength={3000} style={styles.mensaje} />
        <Button label="Enviar" onPress={enviar} icon={<Ionicons name="send" size={18} color="#FFFFFF" />} />

        <SectionHeader title="Mis mensajes" />
        <AlumnoAsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
          {(items) =>
            items.length === 0 ? (
              <Text style={styles.emptyText}>Todavía no nos has escrito.</Text>
            ) : (
              <>
                {items.map((r) => {
                  const t = etiquetaTipoBuzon(r.tipo);
                  return (
                    <Card key={String(r.id)} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <StatusBadge label={t.etiqueta} color={t.color} />
                        <Text style={styles.fecha}>{formatFechaHora(r.created_at as string)}</Text>
                      </View>
                      <Text style={styles.itemMensaje}>{String(r.mensaje ?? '')}</Text>
                      {r.respuesta ? (
                        <View style={styles.respuesta}>
                          <Text style={styles.respuestaTitulo}>Respuesta de Ortecap</Text>
                          <Text style={styles.respuestaTexto}>{String(r.respuesta)}</Text>
                        </View>
                      ) : (
                        <Text style={styles.sinRespuesta}>{Number(r.leido) === 1 ? 'Leído por el equipo' : 'Enviado'}</Text>
                      )}
                    </Card>
                  );
                })}
              </>
            )
          }
        </AlumnoAsyncGate>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  intro: { color: AppColors.textSecondary, marginBottom: 16 },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  tipoTexto: { fontSize: 13, color: AppColors.textPrimary, fontWeight: '600' },
  tipoTextoSel: { color: '#FFFFFF' },
  mensaje: { minHeight: 110, textAlignVertical: 'top' },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 8 },
  itemCard: { marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontSize: 11, color: AppColors.textSecondary },
  itemMensaje: { color: AppColors.textPrimary, marginTop: 8 },
  respuesta: { marginTop: 10, padding: 10, borderRadius: Radii.md, backgroundColor: `${AppColors.primary}0F`, borderLeftWidth: 3, borderLeftColor: AppColors.primary },
  respuestaTitulo: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  respuestaTexto: { color: AppColors.textPrimary, marginTop: 4, fontSize: 13 },
  sinRespuesta: { fontSize: 12, color: AppColors.textSecondary, marginTop: 8 },
});
