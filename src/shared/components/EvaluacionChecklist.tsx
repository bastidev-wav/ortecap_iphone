import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColors } from '../../core/theme/colors';
import { Card } from './Card';

const OPCIONES: { label: string; color: string }[] = [
  { label: 'B', color: AppColors.success },
  { label: 'R', color: AppColors.warning },
  { label: 'M', color: AppColors.danger },
];

/**
 * Checklist de evaluación práctica (pauta de N puntos). [items] viene del
 * backend como `{ "<id>": "Nombre del ítem", ... }`. El resultado se
 * entrega vía onChanged como `{ "<id>": "B"|"R"|"M", ... }`.
 */
export function EvaluacionChecklist({
  items,
  valoresIniciales = {},
  onChanged,
}: {
  items: Record<string, unknown>;
  valoresIniciales?: Record<string, string>;
  onChanged: (valores: Record<string, string>) => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>(valoresIniciales);

  const setValor = (itemId: string, valor: string) => {
    const nuevos = { ...valores, [itemId]: valor };
    setValores(nuevos);
    onChanged(nuevos);
  };

  return (
    <View>
      {Object.entries(items).map(([id, nombre]) => (
        <Card key={id} style={styles.row}>
          <Text style={styles.label} numberOfLines={2}>
            {String(nombre)}
          </Text>
          <View style={styles.opciones}>
            {OPCIONES.map((op) => {
              const seleccionado = valores[id] === op.label;
              return (
                <TouchableOpacity
                  key={op.label}
                  onPress={() => setValor(id, op.label)}
                  style={[styles.opcion, { backgroundColor: seleccionado ? op.color : `${op.color}1A` }]}
                >
                  <Text style={[styles.opcionLabel, { color: seleccionado ? '#FFFFFF' : op.color }]}>{op.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      ))}
    </View>
  );
}

export function porcentajeAprobacion(items: Record<string, unknown>, valores: Record<string, string>): number {
  const total = Object.keys(items).length;
  if (total === 0) return 0;
  let puntos = 0;
  for (const v of Object.values(valores)) {
    if (v === 'B') puntos += 1;
    if (v === 'R') puntos += 0.5;
  }
  return (puntos / total) * 100;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 10 },
  label: { flex: 1, fontSize: 13, color: AppColors.textPrimary, marginRight: 8 },
  opciones: { flexDirection: 'row', gap: 6 },
  opcion: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  opcionLabel: { fontWeight: '800', fontSize: 12 },
});
