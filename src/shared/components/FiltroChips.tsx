import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

export interface OpcionChip {
  valor: string;
  etiqueta: string;
}

/** Fila horizontal de filtros tipo "chip" (uno seleccionado a la vez). */
export function FiltroChips({
  opciones,
  seleccionado,
  onChange,
}: {
  opciones: OpcionChip[];
  seleccionado: string;
  onChange: (valor: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila} style={styles.scroll}>
      {opciones.map((o) => {
        const sel = o.valor === seleccionado;
        return (
          <TouchableOpacity key={o.valor || 'todos'} onPress={() => onChange(o.valor)} style={[styles.chip, sel && styles.chipSel]}>
            <Text style={[styles.texto, sel && styles.textoSel]}>{o.etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  fila: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border },
  chipSel: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  texto: { fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  textoSel: { color: '#FFFFFF' },
});
