import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { ApiException } from '../../core/api/apiTypes';
import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

interface FormState {
  rut: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  esEncargado: boolean;
  activo: boolean;
  cursosSeleccionados: number[];
}

const initialState: FormState = {
  rut: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  esEncargado: false,
  activo: true,
  cursosSeleccionados: [],
};

export function AdminInstructorFormScreen() {
  const router = useRouter();
  const { rut: rutExistente } = useLocalSearchParams<{ rut?: string }>();
  const esEdicion = !!rutExistente;

  const [form, setForm] = useState<FormState>(initialState);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const guardar = async () => {
    if ((!esEdicion && !form.rut.trim()) || !form.nombres.trim() || !form.correo.includes('@')) {
      showToast('Revisa los campos requeridos.', true);
      return;
    }
    const datos = {
      ...(!esEdicion ? { rut: form.rut.trim() } : {}),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      es_encargado: form.esEncargado,
      activo: form.activo,
      cursos: form.cursosSeleccionados,
    };
    try {
      await AdminRepository.guardarInstructor({ rutExistente, datos });
      showToast(esEdicion ? 'Instructor actualizado.' : 'Instructor creado.');
      if (router.canGoBack()) router.back();
    } catch (e) {
      const message = e instanceof ApiException ? e.firstFieldError() : 'Ocurrió un error inesperado.';
      showToast(message, true);
    }
  };

  if (!esEdicion) {
    return <Formulario form={form} set={set} cursosDisponibles={[]} onSubmit={guardar} esEdicion={false} />;
  }

  return <FormularioConDatos rut={rutExistente} form={form} setForm={setForm} onSubmit={guardar} />;
}

function FormularioConDatos({
  rut,
  form,
  setForm,
  onSubmit,
}: {
  rut: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
}) {
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.instructorDetalle(rut), [rut]);
  const [precargado, setPrecargado] = useState(false);

  useEffect(() => {
    if (data && !precargado) {
      const instructor = data.instructor as Record<string, unknown>;
      setForm({
        rut: String(instructor.rut ?? ''),
        nombres: String(instructor.nombres ?? ''),
        apellidos: String(instructor.apellidos ?? ''),
        correo: String(instructor.correo ?? ''),
        telefono: String(instructor.telefono ?? '').replace('+569', ''),
        esEncargado: instructor.es_encargado === true || instructor.es_encargado === 1,
        activo: instructor.activo === true || instructor.activo === 1,
        cursosSeleccionados: (data.cursos_asignados as number[]) ?? [],
      });
      setPrecargado(true);
    }
  }, [data, precargado, setForm]);

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(detalle) => (
        <Formulario
          form={form}
          set={(key, value) => setForm((f) => ({ ...f, [key]: value }))}
          cursosDisponibles={(detalle.cursos_disponibles as Record<string, unknown>[]) ?? []}
          onSubmit={onSubmit}
          esEdicion
        />
      )}
    </AsyncGate>
  );
}

function Formulario({
  form,
  set,
  cursosDisponibles,
  onSubmit,
  esEdicion,
}: {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  cursosDisponibles: Record<string, unknown>[];
  onSubmit: () => void;
  esEdicion: boolean;
}) {
  const toggleCurso = (id: number) => {
    const seleccionados = form.cursosSeleccionados.includes(id)
      ? form.cursosSeleccionados.filter((c) => c !== id)
      : [...form.cursosSeleccionados, id];
    set('cursosSeleccionados', seleccionados);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {!esEdicion ? <TextField label="RUT" value={form.rut} onChangeText={(v) => set('rut', v)} autoCapitalize="none" /> : null}
      <TextField label="Nombres" value={form.nombres} onChangeText={(v) => set('nombres', v)} />
      <TextField label="Apellidos" value={form.apellidos} onChangeText={(v) => set('apellidos', v)} />
      <TextField label="Correo" keyboardType="email-address" autoCapitalize="none" value={form.correo} onChangeText={(v) => set('correo', v)} />
      <TextField
        label="Teléfono (9 dígitos, sin +569)"
        keyboardType="phone-pad"
        value={form.telefono}
        onChangeText={(v) => set('telefono', v)}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Es encargado de sede</Text>
        <Switch value={form.esEncargado} onValueChange={(v) => set('esEncargado', v)} trackColor={{ true: AppColors.primary }} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Cuenta activa</Text>
        <Switch value={form.activo} onValueChange={(v) => set('activo', v)} trackColor={{ true: AppColors.primary }} />
      </View>

      {cursosDisponibles.length > 0 ? (
        <>
          <SectionHeader title="Cursos que dicta" />
          <View style={styles.chipsWrap}>
            {cursosDisponibles.map((c) => {
              const selected = form.cursosSeleccionados.includes(c.id as number);
              return (
                <TouchableOpacity key={String(c.id)} onPress={() => toggleCurso(c.id as number)} style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{String(c.nombre)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.submitButton}>
        <Button label={esEdicion ? 'Guardar cambios' : 'Crear instructor'} onPress={onSubmit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { color: AppColors.textPrimary },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, color: AppColors.textPrimary },
  chipTextSelected: { color: '#FFFFFF' },
  submitButton: { marginTop: 12 },
});
