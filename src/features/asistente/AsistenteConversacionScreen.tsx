import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatRut } from '../../core/utils/formatters';
import { Card } from '../../shared/components/Card';
import { ErrorView, LoadingView } from '../../shared/components/StateViews';
import { showToast } from '../../shared/components/Toast';
import { showOptionsActionSheet } from '../../shared/dialogs';
import { AsistenteRepository } from './asistenteRepository';
import { Burbuja } from './Burbuja';

/**
 * Una conversación del Asistente RRSS: lo que escribió la persona, lo que respondió el bot y lo
 * que responde el equipo desde aquí. Al responder, el bot queda en pausa en ese chat.
 */
export function AsistenteConversacionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const convId = Number(id);

  const [conv, setConv] = useState<Record<string, unknown>>({});
  const [alumno, setAlumno] = useState<Record<string, unknown> | null>(null);
  const [interesado, setInteresado] = useState<Record<string, unknown> | null>(null);
  const [mensajes, setMensajes] = useState<Record<string, unknown>[]>([]);
  const [horasHumano, setHorasHumano] = useState(24);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const lista = useRef<FlatList>(null);
  const ultimoId = useRef(0);

  const aplicar = (d: Record<string, unknown>, reemplazar: boolean) => {
    setConv((d.conversacion as Record<string, unknown>) ?? {});
    setAlumno((d.alumno as Record<string, unknown> | null) ?? null);
    setInteresado((d.interesado as Record<string, unknown> | null) ?? null);
    setHorasHumano(Number(d.horas_humano ?? 24) || 24);
    const nuevos = (d.mensajes as Record<string, unknown>[]) ?? [];
    setMensajes((prev) => {
      const conocidos = new Set(prev.map((m) => m.id));
      const lista2 = reemplazar ? nuevos : [...prev, ...nuevos.filter((m) => !conocidos.has(m.id))];
      if (lista2.length) ultimoId.current = Number(lista2[lista2.length - 1].id) || ultimoId.current;
      return lista2;
    });
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      aplicar(await AsistenteRepository.conversacion(convId), true);
      setError(null);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setCargando(false);
    }
  }, [convId]);

  /** Trae solo lo nuevo y mantiene el estado de la conversación al día. */
  const actualizar = useCallback(async () => {
    try {
      aplicar(await AsistenteRepository.conversacion(convId, ultimoId.current), false);
    } catch {
      // Un corte momentáneo no debe sacar al usuario de la conversación.
    }
  }, [convId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Mensajes nuevos cada pocos segundos mientras la conversación está abierta.
  const ocupado = useRef(false);
  useEffect(() => {
    const t = setInterval(async () => {
      if (ocupado.current) return;
      ocupado.current = true;
      await actualizar();
      ocupado.current = false;
    }, 6000);
    return () => clearInterval(t);
  }, [actualizar]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    try {
      const msg = await AsistenteRepository.responder(convId, t);
      setTexto('');
      showToast(msg);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      await actualizar();
      setEnviando(false);
    }
  };

  const enHumano = conv.en_humano === true;
  const atencion = conv.requiere_atencion === true;
  const ventana = conv.dentro_ventana === true;
  const esPrueba = conv.canal === 'prueba';

  const menu = async () => {
    const opciones: { etiqueta: string; accion: 'bot' | 'humano' | 'atendida' }[] = [];
    if (!enHumano) opciones.push({ etiqueta: 'Tomar la conversación', accion: 'humano' });
    if (enHumano || conv.modo === 'humano') opciones.push({ etiqueta: 'Devolver al bot', accion: 'bot' });
    if (atencion) opciones.push({ etiqueta: 'Marcar como atendida', accion: 'atendida' });
    const sel = await showOptionsActionSheet({ options: opciones.map((o) => o.etiqueta) });
    if (sel === null) return;
    try {
      showToast(await AsistenteRepository.cambiarModo(convId, opciones[sel].accion));
      await actualizar();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const nombre = String(conv.nombre ?? '').trim();
  const titulo = nombre || String(conv.telefono ?? '') || 'Conversación';

  if (cargando && !mensajes.length) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={cargar} />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          title: titulo,
          headerRight: () => (
            <TouchableOpacity onPress={menu} hitSlop={12} accessibilityLabel="Opciones de la conversación">
              <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        ref={lista}
        data={mensajes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <Encabezado
            conv={conv}
            alumno={alumno}
            interesado={interesado}
            onInteresado={() => interesado && router.push(`/admin/interesados/${interesado.id}`)}
          />
        }
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no hay mensajes.</Text>}
        renderItem={({ item }) => <Burbuja m={item} />}
      />

      {!ventana && !esPrueba ? (
        <Text style={styles.fueraVentana}>
          Pasaron más de 24 horas desde el último mensaje de la persona: Meta no permite responder por este medio hasta que vuelva a escribir.
        </Text>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={enHumano ? 'Escribe tu respuesta…' : `Responder (el bot quedará en pausa ${horasHumano} h)`}
            placeholderTextColor={AppColors.textSecondary}
            value={texto}
            onChangeText={setTexto}
            multiline
          />
          {enviando ? (
            <ActivityIndicator style={styles.enviar} color="#FFFFFF" />
          ) : (
            <TouchableOpacity style={styles.enviar} onPress={enviar}>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Encabezado({
  conv,
  alumno,
  interesado,
  onInteresado,
}: {
  conv: Record<string, unknown>;
  alumno: Record<string, unknown> | null;
  interesado: Record<string, unknown> | null;
  onInteresado: () => void;
}) {
  const lineas: React.ReactNode[] = [];
  const canal = String(conv.canal_nombre ?? '');
  const telefono = String(conv.telefono ?? '');
  if (canal || telefono) lineas.push(<Linea key="canal" icono="call-outline" texto={[canal, telefono].filter(Boolean).join(' · ')} />);

  if (alumno) {
    const verificada = conv.verificada === true;
    lineas.push(
      <Linea
        key="alumno"
        icono={verificada ? 'checkmark-circle' : 'school-outline'}
        color={verificada ? AppColors.success : undefined}
        texto={`Alumno: ${`${alumno.nombres ?? ''} ${alumno.apellidos ?? ''}`.trim()} (${formatRut(String(alumno.rut ?? ''))})${verificada ? ' · identidad verificada' : ''}`}
      />,
    );
  }
  if (interesado) {
    lineas.push(
      <TouchableOpacity key="interesado" onPress={onInteresado}>
        <Linea icono="person-outline" color={AppColors.primary} texto={`Registrado como interesado: ${String(interesado.nombres ?? '')} · ver ficha`} />
      </TouchableOpacity>,
    );
  }
  if (conv.requiere_atencion === true) {
    const motivo = String(conv.motivo_derivacion ?? '');
    lineas.push(<Linea key="atencion" icono="alert-circle" color={AppColors.danger} texto={`Necesita a una persona${motivo ? `: ${motivo}` : ''}`} />);
  }
  if (conv.en_humano === true) {
    const hasta = conv.humano_hasta ? dayjs(String(conv.humano_hasta)) : null;
    lineas.push(
      <Linea
        key="humano"
        icono="headset-outline"
        color={AppColors.info}
        texto={`El equipo tiene la conversación: el bot está en pausa${hasta?.isValid() ? ` hasta el ${hasta.format('DD/MM HH:mm')}` : ''}.`}
      />,
    );
  }
  if (!lineas.length) return null;
  return <Card style={styles.encabezado}>{lineas}</Card>;
}

function Linea({ icono, texto, color }: { icono: React.ComponentProps<typeof Ionicons>['name']; texto: string; color?: string }) {
  return (
    <View style={styles.linea}>
      <Ionicons name={icono} size={16} color={color ?? AppColors.textSecondary} />
      <Text style={[styles.lineaTexto, color ? { color } : null]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  lista: { padding: 12 },
  vacio: { color: AppColors.textSecondary, textAlign: 'center', padding: 24 },
  encabezado: { marginBottom: 8, gap: 2 },
  linea: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 3 },
  lineaTexto: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
  fueraVentana: { backgroundColor: `${AppColors.warning}26`, padding: 12, fontSize: 12.5, color: AppColors.textPrimary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: AppColors.border, backgroundColor: '#FFFFFF' },
  input: {
    flex: 1,
    maxHeight: 120,
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
});
