import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { InfoRow, SectionHeader } from '../../shared/components/CommonWidgets';
import { Select } from '../../shared/components/Select';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog, showOptionsActionSheet, showTextInputPrompt } from '../../shared/dialogs';
import { AdminRepository } from './adminRepository';

const COLOR_ESTADO: Record<string, string> = {
  libre: AppColors.textSecondary,
  agendado: AppColors.info,
  asistio: AppColors.warning,
  no_asistio: AppColors.danger,
  matriculado: AppColors.success,
};

type Fila = Record<string, unknown>;

export function AdminJornadaMatriculaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jornadaId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.jornadaMatricula(jornadaId), [jornadaId]);
  const [editando, setEditando] = useState<Fila | null>(null);

  const jornada = (data?.jornada as Fila) ?? null;
  const estados = (data?.estados as Record<string, string>) ?? {};

  /** El PUT reemplaza los datos de la jornada, así que siempre se reenvían los actuales. */
  const guardarCupo = async (cupoId: number, cambios: Fila) => {
    if (!jornada) return;
    await AdminRepository.actualizarJornadaMatricula(jornadaId, {
      localidad_id: jornada.localidad_id,
      fecha: String(jornada.fecha ?? '').substring(0, 10),
      lugar: jornada.lugar ?? '',
      fecha_teorico: jornada.fecha_teorico ?? '',
      fecha_practico: jornada.fecha_practico ?? '',
      notas: jornada.notas ?? '',
      cupos: { [cupoId]: cambios },
    });
  };

  const datosCupo = (c: Fila): Fila => ({
    nombre: c.nombre ?? '',
    rut: c.rut ?? '',
    telefono: c.telefono ?? '',
    correo: c.correo ?? '',
    curso_id: c.curso_id ?? '',
    estado: c.estado ?? 'libre',
    observaciones: c.observaciones ?? '',
  });

  const matricular = async (c: Fila) => {
    try {
      const p = await AdminRepository.prellenadoCupo(Number(c.id));
      const params: Record<string, string> = { desde_cupo: String(c.id) };
      for (const k of ['rut', 'nombres', 'apellidos', 'telefono', 'correo', 'curso_id', 'localidad_id']) {
        if (p[k] != null && p[k] !== '') params[k] = String(p[k]);
      }
      router.push({ pathname: '/admin/alumnos/nuevo', params });
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const accionesCupo = async (c: Fila) => {
    const hora = formatHora(c.hora as string);
    try {
      if (c.estado === 'libre' && !c.nombre) {
        const sel = await showOptionsActionSheet({ title: `Horario ${hora}`, options: ['Agendar persona', 'Eliminar horario'], destructiveIndex: 1 });
        if (sel === 0) setEditando({ ...c, _nuevo: true });
        if (sel === 1 && (await showConfirmDialog({ title: 'Eliminar horario', message: `¿Quitar el horario de las ${hora}?` }))) {
          await AdminRepository.eliminarCupoMatricula(Number(c.id));
          refetch();
        }
        return;
      }

      const opciones = ['Cambiar estado', 'Editar datos'];
      if (c.estado !== 'matriculado') opciones.push('Matricular alumno');
      if (c.telefono) opciones.push('Llamar');
      opciones.push('Liberar horario');
      const sel = await showOptionsActionSheet({ title: `${hora} · ${c.nombre}`, options: opciones, destructiveIndex: opciones.length - 1 });
      if (sel === null) return;
      const opcion = opciones[sel];

      if (opcion === 'Cambiar estado') {
        const claves = Object.keys(estados).filter((k) => k !== 'libre');
        const e = await showOptionsActionSheet({ title: 'Nuevo estado', options: claves.map((k) => estados[k]) });
        if (e === null) return;
        await guardarCupo(Number(c.id), { ...datosCupo(c), estado: claves[e] });
        refetch();
      } else if (opcion === 'Editar datos') {
        setEditando(c);
      } else if (opcion === 'Matricular alumno') {
        await matricular(c);
      } else if (opcion === 'Llamar') {
        await Linking.openURL(`tel:${String(c.telefono).replace(/\s/g, '')}`);
      } else if (opcion === 'Liberar horario') {
        if (!(await showConfirmDialog({ title: 'Liberar horario', message: `Se borrarán los datos de ${c.nombre} de este horario.` }))) return;
        await guardarCupo(Number(c.id), { nombre: '', rut: '', telefono: '', correo: '', curso_id: '', estado: 'libre', observaciones: '' });
        refetch();
      }
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const agregarHorario = async () => {
    const hora = await showTextInputPrompt({ title: 'Nuevo horario', message: 'Hora en formato HH:MM (ej. 12:30)' });
    if (!hora) return;
    if (!/^\d{1,2}:\d{2}$/.test(hora)) {
      showToast('Usa el formato HH:MM, por ejemplo 12:30.', true);
      return;
    }
    try {
      await AdminRepository.agregarCupoMatricula(jornadaId, hora.padStart(5, '0'));
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const eliminarJornada = async () => {
    const ok = await showConfirmDialog({ title: 'Eliminar jornada', message: 'Se eliminarán la jornada y todos sus horarios agendados.' });
    if (!ok) return;
    try {
      await AdminRepository.eliminarJornadaMatricula(jornadaId);
      showToast('Jornada eliminada.');
      if (router.canGoBack()) router.back();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              hitSlop={12}
              accessibilityLabel="Opciones de la jornada"
              onPress={async () => {
                const sel = await showOptionsActionSheet({ options: ['Agregar horario', 'Eliminar jornada'], destructiveIndex: 1 });
                if (sel === 0) agregarHorario();
                if (sel === 1) eliminarJornada();
              }}
            >
              <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={refetch} />}>
        <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
          {(d) => {
            const j = d.jornada as Fila;
            const cupos = (d.cupos as Fila[]) ?? [];
            return (
              <>
                <Card>
                  <Text style={styles.titulo}>
                    {dayjs(String(j.fecha)).format('dddd')} {formatFecha(j.fecha as string)} · {String(j.comuna ?? '')}
                  </Text>
                  <InfoRow label="Horario" value={`${formatHora(j.hora_inicio as string)} - ${formatHora(j.hora_fin as string)}`} />
                  {j.lugar ? <InfoRow label="Lugar" value={String(j.lugar)} /> : null}
                  {j.fecha_teorico ? <InfoRow label="Inicio teórico" value={formatFecha(j.fecha_teorico as string)} /> : null}
                  {j.fecha_practico ? <InfoRow label="Inicio práctico" value={formatFecha(j.fecha_practico as string)} /> : null}
                  {j.notas ? <Text style={styles.notas}>{String(j.notas)}</Text> : null}
                </Card>

                <SectionHeader title={`Horarios (${cupos.filter((c) => c.estado !== 'libre').length}/${cupos.length} ocupados)`} />
                {cupos.map((c) => {
                  const estado = String(c.estado ?? 'libre');
                  return (
                    <TouchableOpacity key={String(c.id)} onPress={() => accionesCupo(c)}>
                      <Card style={styles.cupo}>
                        <Text style={styles.hora}>{formatHora(c.hora as string)}</Text>
                        <View style={styles.flex1}>
                          <Text style={[styles.cupoNombre, !c.nombre && styles.libre]}>{c.nombre ? String(c.nombre) : 'Disponible'}</Text>
                          {c.nombre ? (
                            <Text style={styles.cupoDetalle}>{[c.rut, c.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</Text>
                          ) : null}
                        </View>
                        <StatusBadge label={estados[estado] ?? estado} color={COLOR_ESTADO[estado] ?? AppColors.textSecondary} />
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </>
            );
          }}
        </AsyncGate>
      </ScrollView>

      <CupoModal
        cupo={editando}
        cursos={(data?.cursos as Fila[]) ?? []}
        onClose={() => setEditando(null)}
        onGuardar={async (valores) => {
          if (!editando) return;
          try {
            if (editando._nuevo) {
              await AdminRepository.agendarCupoMatricula(Number(editando.id), {
                nombre: valores.nombre,
                telefono: valores.telefono || undefined,
                rut: valores.rut || undefined,
                correo: valores.correo || undefined,
              });
            } else {
              await guardarCupo(Number(editando.id), { ...datosCupo(editando), ...valores });
            }
            setEditando(null);
            refetch();
          } catch (e) {
            showToast(friendlyErrorMessage(e), true);
          }
        }}
      />
    </View>
  );
}

function CupoModal({
  cupo,
  cursos,
  onClose,
  onGuardar,
}: {
  cupo: Fila | null;
  cursos: Fila[];
  onClose: () => void;
  onGuardar: (valores: { nombre: string; rut: string; telefono: string; correo: string; curso_id: string; observaciones: string }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cupoActual, setCupoActual] = useState<Fila | null>(null);

  if (cupo !== cupoActual) {
    setCupoActual(cupo);
    setNombre(String(cupo?.nombre ?? ''));
    setRut(String(cupo?.rut ?? ''));
    setTelefono(String(cupo?.telefono ?? ''));
    setCorreo(String(cupo?.correo ?? ''));
    setCursoId(cupo?.curso_id ? String(cupo.curso_id) : '');
    setObservaciones(String(cupo?.observaciones ?? ''));
  }

  const nuevo = !!cupo?._nuevo;

  return (
    <Modal visible={cupo !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {nuevo ? 'Agendar' : 'Editar'} · {formatHora(cupo?.hora as string)}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <TextField label="Nombre completo" value={nombre} onChangeText={setNombre} />
          <TextField label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <TextField label="RUT (opcional)" value={rut} onChangeText={setRut} autoCapitalize="none" />
          <TextField label="Correo (opcional)" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
          {!nuevo ? (
            <>
              <Select
                label="Curso de interés"
                value={cursoId}
                options={[{ label: 'Sin definir', value: '' }, ...cursos.map((c) => ({ label: String(c.nombre), value: String(c.id) }))]}
                onChange={setCursoId}
              />
              <TextField label="Observaciones" value={observaciones} onChangeText={setObservaciones} multiline />
            </>
          ) : null}
          <Button
            label="Guardar"
            onPress={async () => {
              if (!nombre.trim()) {
                showToast('Escribe el nombre de la persona.', true);
                return;
              }
              await onGuardar({
                nombre: nombre.trim(),
                rut: rut.trim(),
                telefono: telefono.trim(),
                correo: correo.trim(),
                curso_id: cursoId,
                observaciones: observaciones.trim(),
              });
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  titulo: { fontWeight: '800', fontSize: 16, color: AppColors.textPrimary, marginBottom: 6, textTransform: 'capitalize' },
  notas: { marginTop: 8, color: AppColors.textSecondary, fontSize: 13 },
  cupo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 12 },
  hora: { width: 48, fontWeight: '800', color: AppColors.primary },
  cupoNombre: { fontWeight: '700', color: AppColors.textPrimary },
  libre: { color: AppColors.textSecondary, fontWeight: '400' },
  cupoDetalle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  modalTitle: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  modalContent: { padding: 20 },
});
