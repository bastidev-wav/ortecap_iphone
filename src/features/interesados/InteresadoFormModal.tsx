import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiException } from '../../core/api/apiTypes';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { CampoFecha } from '../../shared/components/CampoFecha';
import { Select } from '../../shared/components/Select';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { InteresadosRepository } from './interesadosRepository';
import { OpcionCatalogo, ORIGENES_INTERESADO } from './interesadosConstantes';

/** Formulario de un interesado (nuevo o edición). Llama a [onGuardado] con el id guardado. */
export function InteresadoFormModal({
  visible,
  interesado,
  cursos,
  localidades,
  onClose,
  onGuardado,
}: {
  visible: boolean;
  /** null = nuevo */
  interesado: Record<string, unknown> | null;
  cursos: OpcionCatalogo[];
  localidades: OpcionCatalogo[];
  onClose: () => void;
  onGuardado: (id: number) => void;
}) {
  const esEdicion = interesado !== null;
  const [nombres, setNombres] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [cursoId, setCursoId] = useState(0);
  const [localidadId, setLocalidadId] = useState(0);
  const [origen, setOrigen] = useState('llamada');
  const [detalle, setDetalle] = useState('');
  const [notas, setNotas] = useState('');
  const [proximo, setProximo] = useState<Date | null>(null);

  useEffect(() => {
    if (!visible) return;
    const i = interesado ?? {};
    setNombres(String(i.nombres ?? ''));
    setTelefono(String(i.telefono ?? ''));
    setCorreo(String(i.correo ?? ''));
    setCursoId(Number(i.curso_id ?? 0) || 0);
    setLocalidadId(Number(i.localidad_id ?? 0) || 0);
    setOrigen(ORIGENES_INTERESADO[String(i.origen)] ? String(i.origen) : 'llamada');
    setDetalle(String(i.interes_detalle ?? ''));
    setNotas(String(i.notas ?? ''));
    setProximo(null);
  }, [visible, interesado]);

  const guardar = async () => {
    if (!nombres.trim()) {
      showToast('El nombre del interesado es obligatorio.', true);
      return;
    }
    try {
      const id = await InteresadosRepository.guardar({
        id: esEdicion ? Number(interesado!.id) : undefined,
        datos: {
          nombres: nombres.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          curso_id: cursoId || '',
          localidad_id: localidadId || '',
          interes_detalle: detalle.trim(),
          origen,
          notas: notas.trim(),
          ...(!esEdicion && proximo ? { proximo_seguimiento: dayjs(proximo).format('YYYY-MM-DD') } : {}),
        },
      });
      showToast(esEdicion ? 'Datos actualizados.' : 'Interesado registrado.');
      onGuardado(id);
    } catch (e) {
      showToast(e instanceof ApiException ? e.firstFieldError() : friendlyErrorMessage(e), true);
    }
  };

  // Si el curso o la comuna guardados ya no están en la lista, se muestran como "Sin definir".
  const cursoValido = cursos.some((c) => c.id === cursoId) ? cursoId : 0;
  const localidadValida = localidades.some((l) => l.id === localidadId) ? localidadId : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{esEdicion ? 'Editar interesado' : 'Nuevo interesado'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={styles.flex1} behavior="padding">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TextField label="Nombre" autoCapitalize="words" value={nombres} onChangeText={setNombres} />
            <TextField label="Teléfono" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
            <TextField label="Correo (opcional)" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={correo} onChangeText={setCorreo} />
            <Select
              label="Curso de interés"
              value={cursoValido}
              options={[{ value: 0, label: 'Sin definir' }, ...cursos.map((c) => ({ value: c.id, label: c.nombre }))]}
              onChange={setCursoId}
            />
            <Select
              label="Comuna"
              value={localidadValida}
              options={[{ value: 0, label: 'Sin definir' }, ...localidades.map((l) => ({ value: l.id, label: l.nombre }))]}
              onChange={setLocalidadId}
            />
            <Select
              label="Cómo llegó"
              value={origen}
              options={Object.entries(ORIGENES_INTERESADO).map(([value, label]) => ({ value, label }))}
              onChange={setOrigen}
            />
            <TextField label="Qué busca (opcional)" value={detalle} onChangeText={setDetalle} />
            <TextField label="Notas (opcional)" value={notas} onChangeText={setNotas} multiline style={styles.multilinea} />
            {!esEdicion ? (
              <CampoFecha
                etiqueta="Próximo contacto (opcional)"
                valor={proximo}
                onChange={setProximo}
                minimo={new Date()}
                maximo={dayjs().add(365, 'day').toDate()}
              />
            ) : null}
            <Button label="Guardar" onPress={guardar} icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  multilinea: { minHeight: 80, textAlignVertical: 'top' },
});
