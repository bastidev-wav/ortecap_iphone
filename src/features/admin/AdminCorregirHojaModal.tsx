import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { EvaluacionChecklist, porcentajeAprobacion } from '../../shared/components/EvaluacionChecklist';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

function aHora(fecha: string, hora: unknown): Date {
  const d = dayjs(`${fecha} ${String(hora ?? '00:00').substring(0, 5)}`);
  return d.isValid() ? d.toDate() : new Date();
}

/** Corrección administrativa de una hoja de ruta: fecha, horario, km, observaciones y pauta. */
export function AdminCorregirHojaModal({
  visible,
  onClose,
  ruta,
  items,
  evaluacionActual,
  onGuardado,
}: {
  visible: boolean;
  onClose: () => void;
  ruta: Record<string, unknown>;
  items: Record<string, unknown>;
  evaluacionActual: Record<string, string>;
  onGuardado: () => void;
}) {
  const fechaRuta = String(ruta.fecha ?? '').substring(0, 10);
  const [fecha, setFecha] = useState(new Date());
  const [inicio, setInicio] = useState(new Date());
  const [fin, setFin] = useState(new Date());
  const [kmInicio, setKmInicio] = useState('');
  const [kmFin, setKmFin] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [evaluacion, setEvaluacion] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState<null | 'fecha' | 'inicio' | 'fin'>(null);

  useEffect(() => {
    if (!visible) return;
    setFecha(dayjs(fechaRuta).isValid() ? dayjs(fechaRuta).toDate() : new Date());
    setInicio(aHora(fechaRuta, ruta.hora_inicio));
    setFin(aHora(fechaRuta, ruta.hora_fin ?? ruta.hora_inicio));
    setKmInicio(String(ruta.km_inicio ?? ''));
    setKmFin(String(ruta.km_fin ?? ''));
    setObservaciones(String(ruta.observaciones ?? ''));
    setEvaluacion(evaluacionActual);
  }, [visible, ruta, fechaRuta, evaluacionActual]);

  const usaPauta = Object.keys(evaluacion).length > 0;
  const porcentaje = usaPauta ? porcentajeAprobacion(items, evaluacion) : Number(ruta.porcentaje_aprobacion ?? 0);

  const guardar = async () => {
    if (Number(kmFin) < Number(kmInicio)) {
      showToast('El kilometraje final no puede ser menor al inicial.', true);
      return;
    }
    if (!dayjs(fin).isAfter(dayjs(inicio))) {
      showToast('La hora de término debe ser posterior a la de inicio.', true);
      return;
    }
    try {
      await AdminRepository.corregirHojaRuta(Number(ruta.id), {
        fecha: dayjs(fecha).format('YYYY-MM-DD'),
        hora_inicio: dayjs(inicio).format('HH:mm'),
        hora_fin: dayjs(fin).format('HH:mm'),
        km_inicio: Number(kmInicio),
        km_fin: Number(kmFin),
        observaciones: observaciones.trim(),
        porcentaje_aprobacion: Math.round(porcentaje),
        ...(usaPauta ? { evaluacion } : {}),
      });
      showToast('Hoja de ruta corregida.');
      onGuardado();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Corregir hoja de ruta</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.campoBtn} onPress={() => setPicker('fecha')}>
            <Text style={styles.campoText}>Fecha: {dayjs(fecha).format('DD/MM/YYYY')}</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.campoBtn, styles.flex1]} onPress={() => setPicker('inicio')}>
              <Text style={styles.campoText}>Inicio: {dayjs(inicio).format('HH:mm')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.campoBtn, styles.flex1]} onPress={() => setPicker('fin')}>
              <Text style={styles.campoText}>Término: {dayjs(fin).format('HH:mm')}</Text>
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
          <View style={styles.row}>
            <View style={styles.flex1}>
              <TextField label="Km inicio" keyboardType="number-pad" value={kmInicio} onChangeText={setKmInicio} />
            </View>
            <View style={styles.flex1}>
              <TextField label="Km término" keyboardType="number-pad" value={kmFin} onChangeText={setKmFin} />
            </View>
          </View>
          <TextField label="Observaciones" value={observaciones} onChangeText={setObservaciones} multiline />

          {Object.keys(items).length > 0 ? (
            <>
              <SectionHeader title={`Pauta (${Math.round(porcentaje)}% · ${porcentaje > 75 ? 'aprobado' : 'reprobado'})`} />
              {visible ? <EvaluacionChecklist items={items} valoresIniciales={evaluacionActual} onChanged={setEvaluacion} /> : null}
            </>
          ) : null}

          <View style={styles.boton}>
            <Button label="Guardar corrección" onPress={guardar} />
          </View>
        </ScrollView>
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
  content: { padding: 20 },
  row: { flexDirection: 'row', gap: 8 },
  campoBtn: { borderWidth: 1, borderColor: AppColors.primary, borderRadius: Radii.md, paddingVertical: 12, alignItems: 'center', marginBottom: 12, backgroundColor: '#FFFFFF' },
  campoText: { color: AppColors.primary, fontWeight: '600' },
  boton: { marginTop: 16 },
});
