import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiException } from '../../core/api/apiTypes';
import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFecha, formatFechaHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { CampoFecha } from '../../shared/components/CampoFecha';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { Select } from '../../shared/components/Select';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog, showOptionsActionSheet } from '../../shared/dialogs';
import { catalogo, colorEstadoInteresado, ESTADOS_ABIERTOS, ESTADOS_INTERESADO, ORIGENES_INTERESADO } from './interesadosConstantes';
import { InteresadoFormModal } from './InteresadoFormModal';
import { InteresadosRepository } from './interesadosRepository';

/** Ficha de un interesado: sus datos, cómo contactarlo, su estado y el historial de seguimiento. */
export function AdminInteresadoDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const interesadoId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => InteresadosRepository.detalle(interesadoId), [interesadoId]);
  const [editarVisible, setEditarVisible] = useState(false);
  const [seguimientoVisible, setSeguimientoVisible] = useState(false);

  const i = (data?.interesado as Record<string, unknown> | undefined) ?? {};

  const abrir = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showToast('No se pudo abrir la aplicación.', true);
    }
  };

  /** Número en formato internacional para wa.me (móvil chileno sin código de país → +56). */
  const numeroWhatsapp = () => {
    let t = String(i.telefono ?? '').replace(/\D/g, '');
    if (t.length === 9 && t.startsWith('9')) t = `56${t}`;
    return t;
  };

  const cambiarEstado = async (estado: string) => {
    if (estado === String(i.estado)) return;
    try {
      await InteresadosRepository.cambiarEstado(interesadoId, estado);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const menu = async () => {
    const sel = await showOptionsActionSheet({ options: ['Editar datos', 'Eliminar registro'], destructiveIndex: 1 });
    if (sel === 0) setEditarVisible(true);
    if (sel === 1) {
      const ok = await showConfirmDialog({
        title: 'Eliminar interesado',
        message: `Se eliminará el registro de "${String(i.nombres ?? '')}" con todo su seguimiento.`,
        confirmLabel: 'Eliminar',
      });
      if (!ok) return;
      try {
        await InteresadosRepository.eliminar(interesadoId);
        showToast('Registro eliminado.');
        router.back();
      } catch (e) {
        showToast(friendlyErrorMessage(e), true);
      }
    }
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () =>
            data ? (
              <TouchableOpacity onPress={menu} hitSlop={12} accessibilityLabel="Opciones">
                <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(d) => {
          const estado = String(i.estado ?? '');
          const telefono = String(i.telefono ?? '').trim();
          const correo = String(i.correo ?? '').trim();
          const proximo = String(i.proximo_seguimiento ?? '');
          const vencido = !!proximo && proximo.substring(0, 10) <= dayjs().format('YYYY-MM-DD') && ESTADOS_ABIERTOS.includes(estado);
          const seguimientos = (d.seguimientos as Record<string, unknown>[]) ?? [];

          return (
            <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
              <View style={styles.titulo}>
                <Text style={styles.nombre}>{String(i.nombres ?? '')}</Text>
                <StatusBadge label={ESTADOS_INTERESADO[estado] ?? estado} color={colorEstadoInteresado(estado)} />
              </View>

              {telefono || correo ? (
                <View style={styles.contacto}>
                  {telefono ? (
                    <>
                      <BotonContacto icono="call-outline" texto="Llamar" onPress={() => abrir(`tel:${telefono.replace(/\s/g, '')}`)} />
                      <BotonContacto icono="logo-whatsapp" texto="WhatsApp" onPress={() => abrir(`https://wa.me/${numeroWhatsapp()}`)} />
                    </>
                  ) : null}
                  {correo ? <BotonContacto icono="mail-outline" texto="Correo" onPress={() => abrir(`mailto:${correo}`)} /> : null}
                </View>
              ) : null}

              <Card>
                <InfoRow label="Teléfono" value={telefono} />
                <InfoRow label="Correo" value={correo} />
                <InfoRow label="Curso" value={String(i.curso_nombre ?? '')} />
                <InfoRow label="Comuna" value={String(i.comuna_nombre ?? '')} />
                <InfoRow label="Cómo llegó" value={ORIGENES_INTERESADO[String(i.origen)] ?? String(i.origen ?? '')} />
                {i.interes_detalle ? <InfoRow label="Qué busca" value={String(i.interes_detalle)} /> : null}
                {i.notas ? <InfoRow label="Notas" value={String(i.notas)} /> : null}
                {proximo ? (
                  <View style={styles.proximoFila}>
                    <Ionicons name="calendar" size={18} color={vencido ? AppColors.danger : AppColors.textSecondary} />
                    <Text style={[styles.proximo, vencido && { color: AppColors.danger }]}>
                      {vencido ? 'Llamar: ' : 'Próximo contacto: '}
                      {formatFecha(proximo)}
                    </Text>
                  </View>
                ) : null}
              </Card>

              <SectionHeader title="Estado" />
              <View style={styles.estados}>
                {Object.entries(ESTADOS_INTERESADO).map(([clave, etiqueta]) => {
                  const sel = estado === clave;
                  const color = colorEstadoInteresado(clave);
                  return (
                    <TouchableOpacity
                      key={clave}
                      onPress={() => cambiarEstado(clave)}
                      style={[styles.estadoChip, sel && { backgroundColor: color, borderColor: color }]}
                    >
                      <Text style={[styles.estadoTexto, sel && styles.estadoTextoSel]}>{etiqueta}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <SectionHeader title={`Seguimiento (${seguimientos.length})`} />
              <Button
                label="Registrar seguimiento"
                variant="outline"
                onPress={() => setSeguimientoVisible(true)}
                icon={<Ionicons name="create-outline" size={18} color={AppColors.primary} />}
                style={styles.registrar}
              />
              {seguimientos.length === 0 ? (
                <Text style={styles.vacio}>Todavía no hay notas de seguimiento.</Text>
              ) : (
                seguimientos.map((s) => {
                  const pasoA = s.estado_resultante ? `Pasó a: ${ESTADOS_INTERESADO[String(s.estado_resultante)] ?? String(s.estado_resultante)}` : null;
                  const prox = s.proximo_seguimiento ? `Próximo contacto: ${formatFecha(String(s.proximo_seguimiento))}` : null;
                  return (
                    <Card key={String(s.id)} style={styles.seguimiento}>
                      <View style={styles.seguimientoCabecera}>
                        <Text style={styles.seguimientoAutor}>{String(s.creado_por_nombre ?? 'Equipo')}</Text>
                        <Text style={styles.seguimientoFecha}>{formatFechaHora(String(s.created_at ?? ''))}</Text>
                      </View>
                      <Text style={styles.seguimientoNota}>{String(s.nota ?? '')}</Text>
                      {pasoA || prox ? <Text style={styles.seguimientoExtra}>{[pasoA, prox].filter(Boolean).join(' · ')}</Text> : null}
                    </Card>
                  );
                })
              )}
            </ScrollView>
          );
        }}
      </AsyncGate>

      <InteresadoFormModal
        visible={editarVisible}
        interesado={data ? i : null}
        cursos={catalogo(data?.cursos)}
        localidades={catalogo(data?.localidades)}
        onClose={() => setEditarVisible(false)}
        onGuardado={() => {
          setEditarVisible(false);
          refetch();
        }}
      />
      <SeguimientoModal
        visible={seguimientoVisible}
        interesadoId={interesadoId}
        onClose={() => setSeguimientoVisible(false)}
        onGuardado={() => {
          setSeguimientoVisible(false);
          refetch();
        }}
      />
    </View>
  );
}

function BotonContacto({ icono, texto, onPress }: { icono: React.ComponentProps<typeof Ionicons>['name']; texto: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.botonContacto} onPress={onPress}>
      <Ionicons name={icono} size={18} color={AppColors.primary} />
      <Text style={styles.botonContactoTexto}>{texto}</Text>
    </TouchableOpacity>
  );
}

function SeguimientoModal({
  visible,
  interesadoId,
  onClose,
  onGuardado,
}: {
  visible: boolean;
  interesadoId: number;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [nota, setNota] = useState('');
  const [estado, setEstado] = useState('');
  const [proximo, setProximo] = useState<Date | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNota('');
    setEstado('');
    setProximo(null);
  }, [visible]);

  const guardar = async () => {
    if (!nota.trim()) {
      showToast('Escribe una nota sobre el contacto (qué se conversó, resultado, etc).', true);
      return;
    }
    try {
      await InteresadosRepository.agregarSeguimiento(interesadoId, {
        nota: nota.trim(),
        estado: estado || null,
        proximoSeguimiento: proximo ? dayjs(proximo).format('YYYY-MM-DD') : null,
      });
      showToast('Seguimiento registrado.');
      onGuardado();
    } catch (e) {
      showToast(e instanceof ApiException ? e.firstFieldError() : friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Registrar seguimiento</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TextField label="Nota" placeholder="Qué se conversó, resultado…" value={nota} onChangeText={setNota} multiline style={styles.multilinea} />
            <Select
              label="Cambiar estado (opcional)"
              value={estado}
              options={[{ value: '', label: 'Mantener el estado actual' }, ...Object.entries(ESTADOS_INTERESADO).map(([value, label]) => ({ value, label }))]}
              onChange={setEstado}
            />
            <CampoFecha etiqueta="Próximo contacto" valor={proximo} onChange={setProximo} minimo={new Date()} maximo={dayjs().add(365, 'day').toDate()} />
            <Button label="Guardar" onPress={guardar} icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  nombre: { flex: 1, fontSize: 20, fontWeight: '800', color: AppColors.textPrimary },
  contacto: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  botonContacto: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: Radii.md,
    paddingVertical: 10,
  },
  botonContactoTexto: { color: AppColors.primary, fontWeight: '700', fontSize: 13 },
  proximoFila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  proximo: { fontWeight: '700', color: AppColors.textPrimary },
  estados: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border },
  estadoTexto: { fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  estadoTextoSel: { color: '#FFFFFF' },
  registrar: { marginBottom: 12 },
  vacio: { color: AppColors.textSecondary },
  seguimiento: { marginBottom: 8 },
  seguimientoCabecera: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  seguimientoAutor: { fontWeight: '700', fontSize: 13, color: AppColors.textPrimary, flex: 1 },
  seguimientoFecha: { fontSize: 11, color: AppColors.textSecondary },
  seguimientoNota: { marginTop: 6, color: AppColors.textPrimary },
  seguimientoExtra: { marginTop: 6, fontSize: 12, fontWeight: '600', color: AppColors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  multilinea: { minHeight: 100, textAlignVertical: 'top' },
});
