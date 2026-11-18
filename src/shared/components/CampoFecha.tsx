import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

/**
 * Campo de fecha tocable: abre el calendario de iOS y, si [limpiable], permite quitar la fecha.
 * Equivalente a CampoFecha de la app Flutter.
 */
export function CampoFecha({
  etiqueta,
  valor,
  onChange,
  limpiable = true,
  minimo,
  maximo,
}: {
  etiqueta: string;
  valor: Date | null;
  onChange: (fecha: Date | null) => void;
  limpiable?: boolean;
  minimo?: Date;
  maximo?: Date;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<Date>(valor ?? new Date());

  const abrir = () => {
    setBorrador(valor ?? new Date());
    setAbierto(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{etiqueta}</Text>
      <TouchableOpacity style={styles.campo} onPress={abrir} activeOpacity={0.7}>
        <Text style={[styles.valor, !valor && styles.vacio]}>{valor ? dayjs(valor).format('DD/MM/YYYY') : 'Sin fecha'}</Text>
        {valor && limpiable ? (
          <TouchableOpacity onPress={() => onChange(null)} hitSlop={10} accessibilityLabel="Quitar fecha">
            <Ionicons name="close-circle" size={20} color={AppColors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="calendar-outline" size={18} color={AppColors.textSecondary} />
        )}
      </TouchableOpacity>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={styles.fondo} onPress={() => setAbierto(false)}>
          <Pressable style={styles.hoja} onPress={() => undefined}>
            <Text style={styles.hojaTitulo}>{etiqueta}</Text>
            <DateTimePicker
              value={borrador}
              mode="date"
              display="inline"
              locale="es-CL"
              minimumDate={minimo}
              maximumDate={maximo}
              onChange={(_, f) => f && setBorrador(f)}
            />
            <View style={styles.acciones}>
              <TouchableOpacity onPress={() => setAbierto(false)} style={styles.accion}>
                <Text style={styles.accionTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onChange(borrador);
                  setAbierto(false);
                }}
                style={styles.accion}
              >
                <Text style={[styles.accionTexto, styles.accionPrincipal]}>Listo</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  valor: { fontSize: 15, color: AppColors.textPrimary },
  vacio: { color: AppColors.textSecondary },
  fondo: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  hoja: { backgroundColor: '#FFFFFF', borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: 16, paddingBottom: 32 },
  hojaTitulo: { fontSize: 16, fontWeight: '800', color: AppColors.textPrimary, marginBottom: 4 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  accion: { paddingVertical: 10, paddingHorizontal: 16 },
  accionTexto: { fontSize: 16, color: AppColors.primary, fontWeight: '600' },
  accionPrincipal: { fontWeight: '800' },
});
