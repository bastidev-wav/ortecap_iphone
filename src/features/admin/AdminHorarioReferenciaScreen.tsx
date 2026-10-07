import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { Select } from '../../shared/components/Select';
import { EmptyView } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { AdminRepository } from './adminRepository';

const DIAS: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };

/** Horario semanal de referencia de los cursos que no reservan clases (A2-A5, OS10). */
export function AdminHorarioReferenciaScreen() {
  const [cursoId, setCursoId] = useState<number | undefined>(undefined);
  const [nuevoVisible, setNuevoVisible] = useState(false);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.horarioReferencia(cursoId), [cursoId]);

  const eliminar = async (id: number) => {
    const ok = await showConfirmDialog({ title: 'Eliminar bloque', message: '¿Quitar este bloque del horario de referencia?' });
    if (!ok) return;
    try {
      await AdminRepository.eliminarBloqueHorario(id);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const cursos = (datos.cursos as Record<string, unknown>[]) ?? [];
        const actual = (datos.curso_id as number | null) ?? undefined;
        const horario = (datos.horario as Record<string, unknown>[]) ?? [];
        const porDia = new Map<number, Record<string, unknown>[]>();
        for (const b of horario) {
          const d = Number(b.dia_semana);
          if (!porDia.has(d)) porDia.set(d, []);
          porDia.get(d)!.push(b);
        }

        if (cursos.length === 0) {
          return <EmptyView message="No hay cursos que usen horario de referencia (A2 a A5 u OS10)." icon="calendar-outline" />;
        }

        return (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          >
            <Text style={styles.intro}>
              Estos cursos no reservan clases individuales: sus alumnos ven este horario semanal en la app.
            </Text>
            <Select
              label="Curso"
              value={actual ?? 0}
              options={cursos.map((c) => ({ label: String(c.nombre), value: Number(c.id) }))}
              onChange={(v) => setCursoId(Number(v))}
            />
            <Button label="Agregar bloque" variant="outline" onPress={() => setNuevoVisible(true)} icon={<Ionicons name="add" size={18} color={AppColors.primary} />} />

            {horario.length === 0 ? (
              <Text style={styles.empty}>Este curso aún no tiene horario publicado.</Text>
            ) : (
              Array.from(porDia.keys())
                .sort((a, b) => a - b)
                .map((dia) => (
                  <View key={dia}>
                    <SectionHeader title={DIAS[dia] ?? `Día ${dia}`} />
                    {porDia.get(dia)!.map((b) => (
                      <Card key={String(b.id)} style={styles.bloque}>
                        <Ionicons name="time-outline" size={20} color={AppColors.primary} />
                        <View style={styles.flex1}>
                          <Text style={styles.bloqueHora}>
                            {formatHora(b.hora_inicio as string)} - {formatHora(b.hora_fin as string)}
                          </Text>
                          <Text style={styles.bloqueDetalle}>{[b.modulo, b.responsable].filter(Boolean).join(' · ') || 'Sin detalle'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => eliminar(Number(b.id))} hitSlop={8}>
                          <Ionicons name="trash-outline" size={20} color={AppColors.danger} />
                        </TouchableOpacity>
                      </Card>
                    ))}
                  </View>
                ))
            )}

            {actual ? (
              <NuevoBloqueModal
                visible={nuevoVisible}
                cursoId={actual}
                onClose={() => setNuevoVisible(false)}
                onCreado={() => {
                  setNuevoVisible(false);
                  refetch();
                }}
              />
            ) : null}
          </ScrollView>
        );
      }}
    </AsyncGate>
  );
}

function NuevoBloqueModal({ visible, cursoId, onClose, onCreado }: { visible: boolean; cursoId: number; onClose: () => void; onCreado: () => void }) {
  const [dia, setDia] = useState(1);
  const [inicio, setInicio] = useState(dayjs().hour(9).minute(0).toDate());
  const [fin, setFin] = useState(dayjs().hour(13).minute(0).toDate());
  const [modulo, setModulo] = useState('');
  const [responsable, setResponsable] = useState('');
  const [picker, setPicker] = useState<null | 'inicio' | 'fin'>(null);

  const guardar = async () => {
    if (!dayjs(fin).isAfter(dayjs(inicio))) {
      showToast('La hora de término debe ser posterior a la de inicio.', true);
      return;
    }
    try {
      await AdminRepository.agregarBloqueHorario({
        curso_id: cursoId,
        dia_semana: dia,
        hora_inicio: dayjs(inicio).format('HH:mm'),
        hora_fin: dayjs(fin).format('HH:mm'),
        modulo: modulo.trim() || undefined,
        responsable: responsable.trim() || undefined,
      });
      showToast('Bloque agregado.');
      onCreado();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo bloque</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Select label="Día" value={dia} options={Object.entries(DIAS).map(([k, v]) => ({ label: v, value: Number(k) }))} onChange={(v) => setDia(Number(v))} />
          <View style={styles.horas}>
            <TouchableOpacity style={styles.horaBtn} onPress={() => setPicker('inicio')}>
              <Text style={styles.horaText}>Inicio: {dayjs(inicio).format('HH:mm')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.horaBtn} onPress={() => setPicker('fin')}>
              <Text style={styles.horaText}>Término: {dayjs(fin).format('HH:mm')}</Text>
            </TouchableOpacity>
          </View>
          {picker ? (
            <DateTimePicker
              value={picker === 'inicio' ? inicio : fin}
              mode="time"
              display="spinner"
              minuteInterval={5}
              onChange={(_, d) => {
                const cual = picker;
                setPicker(null);
                if (!d) return;
                if (cual === 'inicio') setInicio(d);
                else setFin(d);
              }}
            />
          ) : null}
          <TextField label="Módulo (opcional)" value={modulo} onChangeText={setModulo} />
          <TextField label="Responsable (opcional)" value={responsable} onChangeText={setResponsable} />
          <Button label="Guardar bloque" onPress={guardar} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  intro: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 12 },
  empty: { color: AppColors.textSecondary, marginTop: 16 },
  bloque: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  bloqueHora: { fontWeight: '700', color: AppColors.textPrimary },
  bloqueDetalle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  modalTitle: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  horas: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  horaBtn: { flex: 1, borderWidth: 1, borderColor: AppColors.primary, borderRadius: Radii.md, paddingVertical: 12, alignItems: 'center' },
  horaText: { color: AppColors.primary, fontWeight: '600' },
});
