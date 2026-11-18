import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, RefreshControl, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiException } from '../../core/api/apiTypes';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { AsistenteRepository } from './asistenteRepository';

/**
 * Base de conocimiento: los textos que el bot usa como fuente de verdad (horarios, requisitos,
 * políticas). Los precios y promociones NO van aquí: el bot los lee en vivo de Cursos y Promociones.
 */
export function AsistenteConocimientoTab() {
  const [entradas, setEntradas] = useState<Record<string, unknown>[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** undefined = cerrado, null = nueva */
  const [editando, setEditando] = useState<Record<string, unknown> | null | undefined>(undefined);

  const cargar = useCallback(async () => {
    try {
      setEntradas(await AsistenteRepository.conocimiento());
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

  const alternar = async (e: Record<string, unknown>, activo: boolean) => {
    try {
      await AsistenteRepository.guardarConocimiento({
        id: Number(e.id),
        titulo: String(e.titulo ?? ''),
        contenido: String(e.contenido ?? ''),
        activo,
        orden: Number(e.orden ?? 0),
      });
      await cargar();
    } catch (ex) {
      showToast(ex instanceof ApiException ? ex.firstFieldError() : friendlyErrorMessage(ex), true);
    }
  };

  if (cargando) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={cargar} />;

  return (
    <>
      <FlatList
        data={entradas}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}
        ListHeaderComponent={
          <>
            <Text style={styles.ayuda}>
              Escribe en frases simples y concretas. Si cambia un horario, un requisito o una política, actualízalo aquí: el bot lo usa desde su
              siguiente respuesta.
            </Text>
            <Button label="Nueva entrada" variant="outline" onPress={() => setEditando(null)} icon={<Ionicons name="add" size={18} color={AppColors.primary} />} />
          </>
        }
        ListEmptyComponent={<EmptyView icon="book-outline" message="Todavía no hay entradas de conocimiento." />}
        renderItem={({ item: e }) => {
          const activo = e.activo === true;
          return (
            <TouchableOpacity onPress={() => setEditando(e)}>
              <Card style={styles.entrada}>
                <View style={styles.flex1}>
                  <Text style={[styles.titulo, !activo && { color: AppColors.textSecondary }]}>{String(e.titulo ?? '')}</Text>
                  <Text style={styles.contenido} numberOfLines={3}>
                    {String(e.contenido ?? '')}
                  </Text>
                  {!activo ? <Text style={styles.inactiva}>Inactiva: el bot no la usa</Text> : null}
                </View>
                <Switch value={activo} onValueChange={(v) => alternar(e, v)} trackColor={{ true: AppColors.primary }} />
              </Card>
            </TouchableOpacity>
          );
        }}
      />
      <EditarEntradaModal
        entrada={editando}
        siguienteOrden={entradas.length + 1}
        onClose={() => setEditando(undefined)}
        onCambio={() => {
          setEditando(undefined);
          void cargar();
        }}
      />
    </>
  );
}

function EditarEntradaModal({
  entrada,
  siguienteOrden,
  onClose,
  onCambio,
}: {
  entrada: Record<string, unknown> | null | undefined;
  siguienteOrden: number;
  onClose: () => void;
  onCambio: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [orden, setOrden] = useState('');
  const [activo, setActivo] = useState(true);
  const esNueva = entrada === null;

  useEffect(() => {
    if (entrada === undefined) return;
    setTitulo(String(entrada?.titulo ?? ''));
    setContenido(String(entrada?.contenido ?? ''));
    setOrden(String(entrada?.orden ?? siguienteOrden));
    setActivo(entrada ? entrada.activo === true : true);
  }, [entrada, siguienteOrden]);

  const guardar = async () => {
    if (!titulo.trim() || contenido.trim().length < 5) {
      showToast('Escribe un título y el contenido.', true);
      return;
    }
    try {
      await AsistenteRepository.guardarConocimiento({
        id: entrada ? Number(entrada.id) : undefined,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        activo,
        orden: parseInt(orden.trim(), 10) || 0,
      });
      showToast('Guardado. El bot usa esta información desde su próxima respuesta.');
      onCambio();
    } catch (e) {
      showToast(e instanceof ApiException ? e.firstFieldError() : friendlyErrorMessage(e), true);
    }
  };

  const eliminar = async () => {
    if (!entrada) return;
    const ok = await showConfirmDialog({ title: 'Eliminar entrada', message: `El bot dejará de usar "${String(entrada.titulo ?? '')}".`, confirmLabel: 'Eliminar' });
    if (!ok) return;
    try {
      await AsistenteRepository.eliminarConocimiento(Number(entrada.id));
      showToast('Entrada eliminada.');
      onCambio();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={entrada !== undefined} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>{esNueva ? 'Nueva entrada' : 'Editar entrada'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={styles.flex1} behavior="padding">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TextField label="Título" value={titulo} onChangeText={setTitulo} />
            <TextField label="Contenido" value={contenido} onChangeText={setContenido} multiline style={styles.multilinea} />
            <View style={styles.fila}>
              <View style={styles.flex1}>
                <TextField label="Orden" keyboardType="number-pad" value={orden} onChangeText={setOrden} />
              </View>
              <View style={styles.activa}>
                <Text style={styles.activaTexto}>Activa</Text>
                <Switch value={activo} onValueChange={setActivo} trackColor={{ true: AppColors.primary }} />
              </View>
            </View>
            <Button label="Guardar" onPress={guardar} icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />} />
            {!esNueva ? <Button label="Eliminar entrada" variant="text" destructive onPress={eliminar} style={styles.eliminar} /> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  lista: { padding: 12, gap: 8, flexGrow: 1 },
  ayuda: { fontSize: 12.5, color: AppColors.textSecondary, marginBottom: 10 },
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titulo: { fontWeight: '800', color: AppColors.textPrimary },
  contenido: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4 },
  inactiva: { fontSize: 12, color: AppColors.warning, fontWeight: '700', marginTop: 4 },
  modal: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  headerTitulo: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  multilinea: { minHeight: 160, textAlignVertical: 'top' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  activa: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  activaTexto: { fontSize: 15, color: AppColors.textPrimary },
  eliminar: { marginTop: 8, alignSelf: 'center' },
});
