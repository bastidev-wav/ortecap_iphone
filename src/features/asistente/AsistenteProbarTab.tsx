import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { AsistenteRepository } from './asistenteRepository';
import { Burbuja } from './Burbuja';

/**
 * Chat de prueba: se conversa con el bot sin pasar por Meta, para ver cómo responde con la
 * base de conocimiento actual. Cada respuesta consulta a la IA y tiene un costo pequeño.
 */
export function AsistenteProbarTab() {
  const [mensajes, setMensajes] = useState<Record<string, unknown>[]>([]);
  const [configOk, setConfigOk] = useState(true);
  const [modelo, setModelo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificado, setVerificado] = useState<string | null>(null);
  const [derivada, setDerivada] = useState(false);
  const [texto, setTexto] = useState('');
  const lista = useRef<FlatList>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const d = await AsistenteRepository.probar();
      setMensajes((d.mensajes as Record<string, unknown>[]) ?? []);
      setConfigOk(d.config_ok === true);
      setModelo(String(d.modelo ?? ''));
      setError(null);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setTexto('');
    // Se muestra de inmediato lo que escribió la persona de prueba.
    setMensajes((m) => [...m, { id: `local-${Date.now()}`, autor: 'usuario', texto: t, hora: 'ahora', estado: 'procesado' }]);
    try {
      const r = await AsistenteRepository.probarEnviar(t);
      const msg = r.mensaje as Record<string, unknown> | null;
      if (msg) setMensajes((m) => [...m, msg]);
      setDerivada(r.derivada === true);
      setVerificado((r.verificado as string | null) ?? null);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = async () => {
    const ok = await showConfirmDialog({
      title: 'Reiniciar la prueba',
      message: 'Se borra esta conversación de prueba y el bot la olvida (incluida la verificación de alumno).',
      confirmLabel: 'Reiniciar',
    });
    if (!ok) return;
    try {
      await AsistenteRepository.probarReiniciar();
      setMensajes([]);
      setDerivada(false);
      setVerificado(null);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  if (cargando) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={cargar} />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={150}>
      {!configOk ? (
        <Text style={styles.aviso}>Falta la clave de la IA (ANTHROPIC_API_KEY) en el servidor: el bot no puede responder todavía.</Text>
      ) : null}
      <View style={styles.barra}>
        <Text style={styles.barraTexto} numberOfLines={2}>
          Modelo: {modelo}
          {verificado ? ` · alumno verificado: ${verificado}` : ''}
          {derivada ? ' · derivó al equipo' : ''}
        </Text>
        <TouchableOpacity onPress={reiniciar} style={styles.reiniciar} hitSlop={8}>
          <Ionicons name="refresh" size={16} color={AppColors.primary} />
          <Text style={styles.reiniciarTexto}>Reiniciar</Text>
        </TouchableOpacity>
      </View>

      {mensajes.length === 0 ? (
        <EmptyView icon="chatbubble-ellipses-outline" message="Escríbele al bot como lo haría un interesado o un alumno, y mira cómo responde." />
      ) : (
        <FlatList
          ref={lista}
          data={mensajes}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <Burbuja m={item} />}
        />
      )}

      {enviando ? <Text style={styles.escribiendo}>El asistente está escribiendo…</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje de prueba…"
          placeholderTextColor={AppColors.textSecondary}
          value={texto}
          onChangeText={setTexto}
          editable={!enviando}
          multiline
        />
        <TouchableOpacity style={[styles.enviar, enviando && styles.enviarOff]} onPress={enviar} disabled={enviando}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  aviso: { backgroundColor: `${AppColors.warning}26`, padding: 12, fontSize: 12.5, color: AppColors.textPrimary },
  barra: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6 },
  barraTexto: { flex: 1, fontSize: 12, color: AppColors.textSecondary },
  reiniciar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reiniciarTexto: { color: AppColors.primary, fontWeight: '600', fontSize: 13 },
  lista: { padding: 12 },
  escribiendo: { fontSize: 12, color: AppColors.textSecondary, textAlign: 'center', paddingBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: AppColors.border, backgroundColor: '#FFFFFF' },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  enviar: { backgroundColor: AppColors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  enviarOff: { opacity: 0.5 },
});
