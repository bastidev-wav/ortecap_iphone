import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFechaHora } from '../../core/utils/formatters';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { FiltroChips } from '../../shared/components/FiltroChips';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { AsistenteRepository } from './asistenteRepository';
import { colorCanal, iconoCanal } from './asistenteUtils';

const FILTROS = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'borrador', etiqueta: 'Por aprobar' },
  { valor: 'derivado', etiqueta: 'Reclamos' },
  { valor: 'error', etiqueta: 'Con error' },
  { valor: 'publicado', etiqueta: 'Publicados' },
  { valor: 'ignorado', etiqueta: 'Ignorados' },
];

function etiquetaEstado(estado: string): string {
  switch (estado) {
    case 'borrador':
      return 'Por aprobar';
    case 'derivado':
      return 'Reclamo';
    case 'error':
      return 'Con error';
    case 'publicado':
      return 'Publicado';
    case 'ignorado':
      return 'Ignorado';
    case 'pendiente':
    case 'procesando':
      return 'Procesando';
    default:
      return estado;
  }
}

function colorEstado(estado: string): string {
  if (estado === 'borrador') return AppColors.warning;
  if (estado === 'derivado' || estado === 'error') return AppColors.danger;
  if (estado === 'publicado') return AppColors.success;
  return AppColors.textSecondary;
}

const CATEGORIAS: Record<string, string> = {
  pregunta: 'Pregunta',
  interes: 'Interesado',
  agradecimiento: 'Agradecimiento',
  reclamo: 'Reclamo',
  spam: 'Spam',
  otro: 'Otro',
};

/**
 * Comentarios de las publicaciones de Facebook e Instagram: la IA los clasifica y redacta una
 * respuesta pública y un mensaje privado. Por defecto cada respuesta la aprueba el equipo.
 */
export function AsistenteComentariosTab() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [conteo, setConteo] = useState<Record<string, unknown>>({});
  const [modo, setModo] = useState('aprobacion');
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revisando, setRevisando] = useState<Record<string, unknown> | null>(null);

  const cargar = useCallback(async () => {
    try {
      const d = await AsistenteRepository.comentarios(estado);
      setItems((d.comentarios as Record<string, unknown>[]) ?? []);
      setConteo((d.conteo as Record<string, unknown>) ?? {});
      setModo(String(d.modo ?? 'aprobacion'));
      setError(null);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setCargando(false);
    }
  }, [estado]);

  useEffect(() => {
    setCargando(true);
    void cargar();
  }, [cargar]);

  if (cargando) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={cargar} />;

  const textoModo =
    modo === 'automatico'
      ? 'Modo automático: las respuestas se publican solas. Los reclamos siempre quedan para el equipo.'
      : modo === 'apagado'
        ? 'Los comentarios están apagados: no se guardan ni se responden.'
        : 'Cada respuesta debe aprobarse aquí antes de publicarse. Los reclamos nunca se responden solos.';

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}
        ListHeaderComponent={
          <>
            <View style={styles.chips}>
              <FiltroChips
                opciones={FILTROS.map((f) => {
                  const n = Number(conteo[f.valor] ?? 0);
                  return f.valor && n > 0 ? { ...f, etiqueta: `${f.etiqueta} (${n})` } : f;
                })}
                seleccionado={estado}
                onChange={setEstado}
              />
            </View>
            <Text style={styles.modo}>{textoModo}</Text>
          </>
        }
        ListEmptyComponent={<EmptyView icon="chatbox-ellipses-outline" message="No hay comentarios con este filtro." />}
        renderItem={({ item: c }) => <TarjetaComentario c={c} onPress={() => setRevisando(c)} />}
      />
      <RevisionComentarioModal
        comentario={revisando}
        onClose={() => setRevisando(null)}
        onCambio={() => {
          setRevisando(null);
          void cargar();
        }}
      />
    </>
  );
}

function TarjetaComentario({ c, onPress }: { c: Record<string, unknown>; onPress: () => void }) {
  const estado = String(c.estado ?? '');
  const canal = String(c.canal ?? '');
  const categoria = CATEGORIAS[String(c.categoria)] ?? '';
  return (
    <TouchableOpacity onPress={onPress}>
      <Card>
        <View style={styles.cabecera}>
          <Ionicons name={iconoCanal(canal)} size={18} color={colorCanal(canal)} />
          <Text style={styles.autor} numberOfLines={1}>
            {String(c.autor_nombre || 'Alguien')}
          </Text>
          <StatusBadge label={etiquetaEstado(estado)} color={colorEstado(estado)} />
        </View>
        <Text style={styles.texto} numberOfLines={4}>
          {String(c.texto ?? '')}
        </Text>
        <View style={styles.pie}>
          {categoria ? <Text style={styles.categoria}>{categoria}</Text> : null}
          <Text style={styles.fecha}>{formatFechaHora(String(c.created_at ?? ''))}</Text>
        </View>
        {estado === 'borrador' && c.respuesta_publica ? (
          <Text style={styles.borrador} numberOfLines={2}>
            Borrador: {String(c.respuesta_publica)}
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

/** Revisión de un comentario: se puede corregir el texto antes de publicar, pedirle otro borrador a la IA o descartarlo. */
function RevisionComentarioModal({
  comentario,
  onClose,
  onCambio,
}: {
  comentario: Record<string, unknown> | null;
  onClose: () => void;
  onCambio: () => void;
}) {
  const [publica, setPublica] = useState('');
  const [privada, setPrivada] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!comentario) return;
    setPublica(String(comentario.respuesta_publica ?? ''));
    setPrivada(String(comentario.mensaje_privado ?? ''));
  }, [comentario]);

  const c = comentario ?? {};
  const id = Number(c.id);
  const estado = String(c.estado ?? '');
  const editable = estado !== 'publicado';
  const canal = String(c.canal ?? '');
  const categoria = CATEGORIAS[String(c.categoria)] ?? '';
  const enlace = String(c.enlace ?? '');
  const detalle = String(c.detalle ?? '');

  const ejecutar = async (accion: () => Promise<void>) => {
    setOcupado(true);
    try {
      await accion();
      onCambio();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      setOcupado(false);
    }
  };

  const publicar = async () => {
    if (!publica.trim() && !privada.trim()) {
      showToast('Escribe al menos la respuesta pública o el mensaje privado.', true);
      return;
    }
    const ok = await showConfirmDialog({
      title: 'Publicar respuesta',
      message: `La respuesta se publicará ahora en ${canal === 'instagram' ? 'Instagram' : 'Facebook'} y el mensaje privado se enviará a la persona.`,
      confirmLabel: 'Publicar',
    });
    if (!ok) return;
    await ejecutar(async () => {
      showToast(await AsistenteRepository.publicarComentario(id, { respuestaPublica: publica.trim(), mensajePrivado: privada.trim() }));
    });
  };

  const descartar = async () => {
    const ok = await showConfirmDialog({ title: 'Descartar comentario', message: 'No se le responderá a este comentario.', confirmLabel: 'Descartar' });
    if (!ok) return;
    await ejecutar(async () => {
      await AsistenteRepository.descartarComentario(id);
      showToast('Comentario descartado.');
    });
  };

  const regenerar = () =>
    ejecutar(async () => {
      await AsistenteRepository.regenerarComentario(id);
      showToast('La IA volvió a redactar la respuesta.');
    });

  return (
    <Modal visible={comentario !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Ionicons name={iconoCanal(canal)} size={20} color={colorCanal(canal)} />
          <Text style={styles.title} numberOfLines={1}>
            {String(c.autor_nombre || 'Alguien')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.estadoFila}>
              <StatusBadge label={etiquetaEstado(estado)} color={colorEstado(estado)} />
              {categoria ? <Text style={styles.clasificado}>Clasificado como: {categoria}</Text> : null}
            </View>
            <View style={styles.original}>
              <Text selectable style={styles.texto}>
                {String(c.texto ?? '')}
              </Text>
            </View>
            {enlace ? (
              <TouchableOpacity onPress={() => Linking.openURL(enlace).catch(() => showToast('No se pudo abrir el enlace.', true))}>
                <Text style={styles.enlace}>Ver la publicación</Text>
              </TouchableOpacity>
            ) : null}
            {detalle ? <Text style={[styles.detalle, estado === 'error' && { color: AppColors.danger }]}>{detalle}</Text> : null}
            <View style={styles.separador} />

            <TextField
              label="Respuesta pública (en la publicación)"
              value={publica}
              onChangeText={setPublica}
              editable={editable}
              multiline
              style={styles.multilinea}
            />
            <TextField
              label="Mensaje privado (por Messenger o Instagram Direct)"
              value={privada}
              onChangeText={setPrivada}
              editable={editable}
              multiline
              style={styles.multilineaAlta}
            />

            {editable ? (
              <>
                <Text style={styles.ayuda}>
                  Meta permite un solo mensaje privado por comentario y solo dentro de los 7 días siguientes. Pasado ese plazo solo se puede publicar
                  la respuesta pública.
                </Text>
                {ocupado ? (
                  <ActivityIndicator style={styles.spinner} color={AppColors.primary} />
                ) : (
                  <View style={styles.acciones}>
                    <Button label="Publicar" onPress={publicar} icon={<Ionicons name="send" size={18} color="#FFFFFF" />} />
                    <Button
                      label="Volver a redactar con la IA"
                      variant="outline"
                      onPress={regenerar}
                      icon={<Ionicons name="sparkles-outline" size={18} color={AppColors.primary} />}
                    />
                    <Button label="Descartar" variant="text" destructive onPress={descartar} />
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  lista: { padding: 12, paddingTop: 0, gap: 8, flexGrow: 1 },
  chips: { marginHorizontal: -12 },
  modo: { fontSize: 12.5, color: AppColors.textSecondary, marginBottom: 4 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autor: { flex: 1, fontWeight: '700', color: AppColors.textPrimary },
  texto: { fontSize: 14, color: AppColors.textPrimary, marginTop: 8 },
  pie: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  categoria: { fontSize: 12, fontWeight: '700', color: AppColors.primary, flex: 1 },
  fecha: { fontSize: 11, color: AppColors.textSecondary, marginLeft: 'auto' },
  borrador: { marginTop: 8, padding: 8, borderRadius: Radii.sm, backgroundColor: `${AppColors.primary}0F`, fontSize: 13, color: AppColors.textPrimary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  estadoFila: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  clasificado: { fontSize: 12.5, color: AppColors.textSecondary },
  original: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border, borderRadius: Radii.md, padding: 12, paddingTop: 4, marginTop: 10 },
  enlace: { color: AppColors.info, fontSize: 13, marginTop: 8, fontWeight: '600' },
  detalle: { fontSize: 12.5, color: AppColors.textSecondary, marginTop: 8 },
  separador: { height: 16 },
  multilinea: { minHeight: 80, textAlignVertical: 'top' },
  multilineaAlta: { minHeight: 110, textAlignVertical: 'top' },
  ayuda: { fontSize: 12, color: AppColors.textSecondary, marginTop: -6, marginBottom: 16 },
  spinner: { padding: 16 },
  acciones: { gap: 8 },
});
