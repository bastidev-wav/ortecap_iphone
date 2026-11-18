import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

/** Un mensaje del Asistente RRSS: la persona a la izquierda, el bot y el equipo a la derecha. */
export function Burbuja({ m }: { m: Record<string, unknown> }) {
  const autor = String(m.autor ?? '');
  const texto = String(m.texto ?? '');
  const hora = String(m.hora ?? '');

  if (autor === 'sistema') {
    return <Text style={styles.sistema}>{texto}</Text>;
  }

  const propio = autor !== 'usuario';
  const esBot = autor === 'bot';
  const equipo = propio && !esBot;
  const fallido = m.estado === 'fallido' || m.estado === 'error';
  const herramientas = ((m.herramientas as unknown[]) ?? []).map(String);
  const etiqueta = esBot ? 'Asistente' : autor === 'humano' ? String(m.autor_nombre || 'Equipo') : '';

  return (
    <View style={[styles.fila, propio ? styles.filaPropia : styles.filaOtra]}>
      <View
        style={[
          styles.burbuja,
          !propio && styles.burbujaPersona,
          esBot && styles.burbujaBot,
          equipo && styles.burbujaEquipo,
          fallido && styles.burbujaFallida,
        ]}
      >
        {etiqueta ? <Text style={[styles.etiqueta, equipo && styles.textoClaro]}>{etiqueta}</Text> : null}
        <Text selectable style={[styles.texto, equipo && styles.textoBlanco]}>
          {texto}
        </Text>
        <View style={styles.pie}>
          <Text style={[styles.hora, equipo && styles.textoClaro]}>{hora}</Text>
          {fallido ? <Text style={styles.fallido}>No se pudo enviar</Text> : null}
        </View>
        {herramientas.length > 0 ? <Text style={styles.herramientas}>Usó: {herramientas.join(', ')}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sistema: { textAlign: 'center', fontSize: 12, fontStyle: 'italic', color: AppColors.textSecondary, marginVertical: 6, paddingHorizontal: 16 },
  fila: { flexDirection: 'row', marginVertical: 4 },
  filaPropia: { justifyContent: 'flex-end' },
  filaOtra: { justifyContent: 'flex-start' },
  burbuja: { maxWidth: '82%', borderRadius: Radii.lg, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: AppColors.border },
  burbujaPersona: { backgroundColor: '#FFFFFF' },
  burbujaBot: { backgroundColor: '#E8EEF9' },
  burbujaEquipo: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  burbujaFallida: { borderColor: AppColors.danger },
  etiqueta: { fontSize: 11, fontWeight: '700', color: AppColors.primary, marginBottom: 2 },
  texto: { fontSize: 14, color: AppColors.textPrimary },
  textoBlanco: { color: '#FFFFFF' },
  textoClaro: { color: 'rgba(255,255,255,0.75)' },
  pie: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  hora: { fontSize: 10.5, color: AppColors.textSecondary },
  fallido: { fontSize: 10.5, color: AppColors.danger, fontWeight: '700' },
  herramientas: { fontSize: 10.5, color: AppColors.textSecondary, marginTop: 2 },
});
