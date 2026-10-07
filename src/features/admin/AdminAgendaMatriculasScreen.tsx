import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { Select } from '../../shared/components/Select';
import { EmptyView } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

/** Jornadas de matrícula presencial por comuna, con horarios que el equipo va llenando. */
export function AdminAgendaMatriculasScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [nuevaVisible, setNuevaVisible] = useState(false);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.jornadasMatricula({ q: busqueda || undefined }), [busqueda]);

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => setNuevaVisible(true)} hitSlop={12} accessibilityLabel="Nueva jornada">
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={AppColors.textSecondary} />
        <TextInput
          style={styles.search}
          placeholder="Buscar persona por nombre o RUT"
          placeholderTextColor={AppColors.textSecondary}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={() => setBusqueda(q.trim())}
          autoCapitalize="none"
        />
        {busqueda ? (
          <TouchableOpacity
            onPress={() => {
              setQ('');
              setBusqueda('');
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={AppColors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const jornadas = (datos.jornadas as Record<string, unknown>[]) ?? [];
          return (
            <FlatList
              data={jornadas}
              keyExtractor={(j) => String(j.id)}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
              ListEmptyComponent={
                <EmptyView
                  message={busqueda ? 'Nadie con ese nombre o RUT en las jornadas.' : 'No hay jornadas de matrícula próximas.'}
                  icon="calendar-outline"
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item: j }) => {
                const total = Number(j.total_cupos ?? 0);
                const ocupados = Number(j.ocupados ?? 0);
                const matriculados = Number(j.matriculados ?? 0);
                const pasada = dayjs(String(j.fecha)).isBefore(dayjs(), 'day');
                return (
                  <TouchableOpacity onPress={() => router.push(`/admin/agenda-matriculas/${j.id}`)}>
                    <Card style={pasada ? styles.pasada : undefined}>
                      <View style={styles.row}>
                        <View style={styles.flex1}>
                          <Text style={styles.titulo}>
                            {dayjs(String(j.fecha)).format('ddd')} {formatFecha(j.fecha as string)} · {String(j.comuna ?? '')}
                          </Text>
                          <Text style={styles.sub}>
                            {formatHora(j.hora_inicio as string)} - {formatHora(j.hora_fin as string)}
                            {j.lugar ? ` · ${j.lugar}` : ''}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
                      </View>
                      <View style={styles.progreso}>
                        <ProgressBar value={total ? ocupados / total : 0} color={AppColors.info} />
                      </View>
                      <Text style={styles.contadores}>
                        {ocupados}/{total} horarios ocupados · {matriculados} matriculado{matriculados === 1 ? '' : 's'}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                );
              }}
            />
          );
        }}
      </AsyncGate>

      <NuevaJornadaModal
        visible={nuevaVisible}
        onClose={() => setNuevaVisible(false)}
        onCreada={(id) => {
          setNuevaVisible(false);
          refetch();
          router.push(`/admin/agenda-matriculas/${id}`);
        }}
      />
    </View>
  );
}

const INTERVALOS = [15, 20, 30, 45, 60];

function NuevaJornadaModal({ visible, onClose, onCreada }: { visible: boolean; onClose: () => void; onCreada: (id: number) => void }) {
  const [localidades, setLocalidades] = useState<Record<string, unknown>[]>([]);
  const [localidadId, setLocalidadId] = useState('');
  const [fecha, setFecha] = useState(dayjs().add(1, 'day').toDate());
  const [inicio, setInicio] = useState(dayjs().hour(10).minute(0).toDate());
  const [fin, setFin] = useState(dayjs().hour(12).minute(0).toDate());
  const [intervalo, setIntervalo] = useState(30);
  const [lugar, setLugar] = useState('');
  const [notas, setNotas] = useState('');
  const [picker, setPicker] = useState<null | 'fecha' | 'inicio' | 'fin'>(null);

  useEffect(() => {
    if (!visible || localidades.length) return;
    AdminRepository.matrizPrecios()
      .then((d) => setLocalidades((d.localidades as Record<string, unknown>[]) ?? []))
      .catch(() => {});
  }, [visible, localidades.length]);

  const horarios = Math.max(0, Math.ceil(dayjs(fin).diff(dayjs(inicio), 'minute') / intervalo));

  const crear = async () => {
    if (!localidadId) {
      showToast('Elige la comuna.', true);
      return;
    }
    if (!dayjs(fin).isAfter(dayjs(inicio))) {
      showToast('La hora de término debe ser posterior a la de inicio.', true);
      return;
    }
    try {
      const r = await AdminRepository.crearJornadaMatricula({
        localidad_id: Number(localidadId),
        fecha: dayjs(fecha).format('YYYY-MM-DD'),
        hora_inicio: dayjs(inicio).format('HH:mm'),
        hora_fin: dayjs(fin).format('HH:mm'),
        intervalo_min: intervalo,
        lugar: lugar.trim() || undefined,
        notas: notas.trim() || undefined,
      });
      showToast(`Jornada creada con ${r.horarios} horarios.`);
      onCreada(r.id);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nueva jornada de matrícula</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Select
            label="Comuna"
            value={localidadId}
            options={[{ label: 'Elige la comuna', value: '' }, ...localidades.map((l) => ({ label: String(l.nombre), value: String(l.id) }))]}
            onChange={setLocalidadId}
          />
          <TouchableOpacity style={styles.campoBtn} onPress={() => setPicker('fecha')}>
            <Text style={styles.campoText}>Día: {dayjs(fecha).format('DD/MM/YYYY')}</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.campoBtn, styles.flex1]} onPress={() => setPicker('inicio')}>
              <Text style={styles.campoText}>Desde {dayjs(inicio).format('HH:mm')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.campoBtn, styles.flex1]} onPress={() => setPicker('fin')}>
              <Text style={styles.campoText}>Hasta {dayjs(fin).format('HH:mm')}</Text>
            </TouchableOpacity>
          </View>
          {picker ? (
            <DateTimePicker
              value={picker === 'fecha' ? fecha : picker === 'inicio' ? inicio : fin}
              mode={picker === 'fecha' ? 'date' : 'time'}
              display="spinner"
              minuteInterval={5}
              onChange={(_, d) => {
                const cual = picker;
                setPicker(null);
                if (!d) return;
                if (cual === 'fecha') setFecha(d);
                if (cual === 'inicio') setInicio(d);
                if (cual === 'fin') setFin(d);
              }}
            />
          ) : null}
          <Select
            label="Cada cuánto"
            value={intervalo}
            options={INTERVALOS.map((m) => ({ label: `${m} minutos`, value: m }))}
            onChange={(v) => setIntervalo(Number(v))}
          />
          <Text style={styles.ayuda}>Se crearán {horarios} horarios.</Text>
          <TextField label="Lugar (opcional)" value={lugar} onChangeText={setLugar} placeholder="Ej: Sede municipal, sala 2" />
          <TextField label="Notas (opcional)" value={notas} onChangeText={setNotas} multiline />
          <Button label="Crear jornada" onPress={crear} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    marginBottom: 0,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  search: { flex: 1, paddingVertical: 10, fontSize: 14, color: AppColors.textPrimary },
  listContent: { padding: 12, flexGrow: 1 },
  pasada: { opacity: 0.6 },
  titulo: { fontWeight: '700', color: AppColors.textPrimary, textTransform: 'capitalize' },
  sub: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  progreso: { marginTop: 10 },
  contadores: { fontSize: 12, color: AppColors.textSecondary, marginTop: 6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  modalTitle: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  modalContent: { padding: 20 },
  campoBtn: { borderWidth: 1, borderColor: AppColors.primary, borderRadius: Radii.md, paddingVertical: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#FFFFFF' },
  campoText: { color: AppColors.primary, fontWeight: '600' },
  ayuda: { color: AppColors.textSecondary, fontSize: 12, marginTop: -8, marginBottom: 12 },
});
