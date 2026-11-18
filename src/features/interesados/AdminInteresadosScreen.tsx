import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { useRefetchOnFocus } from '../../core/hooks/useRefetchOnFocus';
import { AppColors } from '../../core/theme/colors';
import { formatFecha } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { FiltroChips } from '../../shared/components/FiltroChips';
import { Select } from '../../shared/components/Select';
import { EmptyView } from '../../shared/components/StateViews';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { catalogo, colorEstadoInteresado, ESTADOS_INTERESADO } from './interesadosConstantes';
import { InteresadoFormModal } from './InteresadoFormModal';
import { InteresadosRepository } from './interesadosRepository';

const FILTROS_ESTADO = [{ valor: '', etiqueta: 'Abiertos' }, ...Object.entries(ESTADOS_INTERESADO).map(([valor, etiqueta]) => ({ valor, etiqueta }))];

/**
 * Interesados: personas que preguntan por un curso y todavía no se matriculan, con su
 * seguimiento. Los que tienen un seguimiento vencido o para hoy aparecen primero.
 */
export function AdminInteresadosScreen() {
  const router = useRouter();
  const [estado, setEstado] = useState('');
  const [cursoId, setCursoId] = useState(0);
  const [localidadId, setLocalidadId] = useState(0);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const [nuevoVisible, setNuevoVisible] = useState(false);

  const { data, loading, error, refetch } = useApiQuery(
    () => InteresadosRepository.listar({ estado, cursoId, localidadId }),
    [estado, cursoId, localidadId],
  );
  useRefetchOnFocus(refetch);

  const cursos = catalogo(data?.cursos);
  const localidades = catalogo(data?.localidades);
  const hayFiltro = cursoId > 0 || localidadId > 0;

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerAcciones}>
              <TouchableOpacity onPress={() => setFiltroVisible(true)} hitSlop={10} accessibilityLabel="Filtrar por curso y comuna">
                <Ionicons name={hayFiltro ? 'funnel' : 'funnel-outline'} size={21} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNuevoVisible(true)} hitSlop={10} accessibilityLabel="Nuevo interesado">
                <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <FiltroChips opciones={FILTROS_ESTADO} seleccionado={estado} onChange={setEstado} />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(d) => {
          const items = (d.interesados as Record<string, unknown>[]) ?? [];
          const pendientesHoy = Number(d.pendientes_hoy ?? 0);
          return (
            <FlatList
              data={items}
              keyExtractor={(i) => String(i.id)}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
              ListHeaderComponent={
                pendientesHoy > 0 ? (
                  <Card style={styles.pendientes}>
                    <Ionicons name="call" size={20} color={AppColors.danger} />
                    <Text style={styles.pendientesTexto}>
                      {pendientesHoy} persona{pendientesHoy === 1 ? '' : 's'} para llamar hoy o con seguimiento atrasado.
                    </Text>
                  </Card>
                ) : null
              }
              ListEmptyComponent={<EmptyView icon="person-outline" message="No hay interesados con este filtro." />}
              renderItem={({ item: i }) => <FilaInteresado i={i} onPress={() => router.push(`/admin/interesados/${i.id}`)} />}
            />
          );
        }}
      </AsyncGate>

      <FiltroModal
        visible={filtroVisible}
        cursos={cursos}
        localidades={localidades}
        curso={cursoId}
        localidad={localidadId}
        onClose={() => setFiltroVisible(false)}
        onAplicar={(c, l) => {
          setCursoId(c);
          setLocalidadId(l);
          setFiltroVisible(false);
        }}
      />
      <InteresadoFormModal
        visible={nuevoVisible}
        interesado={null}
        cursos={cursos}
        localidades={localidades}
        onClose={() => setNuevoVisible(false)}
        onGuardado={(id) => {
          setNuevoVisible(false);
          router.push(`/admin/interesados/${id}`);
        }}
      />
    </View>
  );
}

function FilaInteresado({ i, onPress }: { i: Record<string, unknown>; onPress: () => void }) {
  const estado = String(i.estado ?? '');
  const vencido = i.seguimiento_vencido === true;
  const proximo = String(i.proximo_seguimiento ?? '');
  const detalle = [i.curso_nombre, i.comuna_nombre].filter((x) => x).map(String).join(' · ');
  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.fila, vencido && styles.filaVencida]}>
        <View style={styles.flex1}>
          <Text style={styles.nombre}>{String(i.nombres ?? '')}</Text>
          {detalle ? <Text style={styles.detalle}>{detalle}</Text> : null}
          {proximo ? (
            <Text style={[styles.proximo, vencido && { color: AppColors.danger }]}>
              {vencido ? 'Llamar: ' : 'Próximo contacto: '}
              {formatFecha(proximo)}
            </Text>
          ) : null}
        </View>
        <StatusBadge label={ESTADOS_INTERESADO[estado] ?? estado} color={colorEstadoInteresado(estado)} />
      </Card>
    </TouchableOpacity>
  );
}

function FiltroModal({
  visible,
  cursos,
  localidades,
  curso,
  localidad,
  onClose,
  onAplicar,
}: {
  visible: boolean;
  cursos: { id: number; nombre: string }[];
  localidades: { id: number; nombre: string }[];
  curso: number;
  localidad: number;
  onClose: () => void;
  onAplicar: (curso: number, localidad: number) => void;
}) {
  const [c, setC] = useState(curso);
  const [l, setL] = useState(localidad);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => {
        setC(curso);
        setL(localidad);
      }}
    >
      <SafeAreaView style={styles.flexModal} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Filtrar interesados</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <Select
            label="Curso de interés"
            value={c}
            options={[{ value: 0, label: 'Todos los cursos' }, ...cursos.map((x) => ({ value: x.id, label: x.nombre }))]}
            onChange={setC}
          />
          <Select
            label="Comuna"
            value={l}
            options={[{ value: 0, label: 'Todas las comunas' }, ...localidades.map((x) => ({ value: x.id, label: x.nombre }))]}
            onChange={setL}
          />
          <Button label="Aplicar" onPress={() => onAplicar(c, l)} />
          <Button label="Quitar filtros" variant="text" onPress={() => onAplicar(0, 0)} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  headerAcciones: { flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 4 },
  listContent: { padding: 12, paddingTop: 0, gap: 8, flexGrow: 1 },
  pendientes: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${AppColors.danger}14`, borderColor: 'transparent' },
  pendientesTexto: { flex: 1, fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaVencida: { borderColor: AppColors.danger },
  nombre: { fontWeight: '700', fontSize: 15, color: AppColors.textPrimary },
  detalle: { fontSize: 12.5, color: AppColors.textSecondary, marginTop: 2 },
  proximo: { fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginTop: 2 },
  flexModal: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  modalContent: { padding: 16, gap: 4 },
});
