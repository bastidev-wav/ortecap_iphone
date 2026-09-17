import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { showConfirmDialog } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoSimuladorExamenScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.iniciarExamen());
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});

  const mostrarResultado = (resultado: Record<string, unknown>) => {
    const aprobado = resultado.aprobado === true;
    Alert.alert(
      aprobado ? '¡Aprobado! 🎉' : 'No alcanzaste el puntaje',
      `Puntaje: ${resultado.puntaje} / ${resultado.total_preguntas}\n\n${resultado.consejo ?? ''}`,
      [{ text: 'Aceptar', onPress: () => router.canGoBack() && router.back() }],
    );
  };

  const finalizar = async (totalPreguntas: number) => {
    if (Object.keys(respuestas).length < totalPreguntas) {
      const continuar = await showConfirmDialog({
        title: 'Preguntas sin responder',
        message: `Respondiste ${Object.keys(respuestas).length} de ${totalPreguntas} preguntas. ¿Quieres finalizar de todas formas?`,
      });
      if (!continuar) return;
    }
    try {
      const resultado = await AlumnoRepository.finalizarExamen(respuestas);
      mostrarResultado(resultado);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(examen) => {
        const preguntas = (examen.preguntas as Record<string, unknown>[]) ?? [];

        return (
          <View style={styles.flex}>
            <FlatList
              data={preguntas}
              keyExtractor={(item, i) => String(item.id ?? i)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: p, index: i }) => {
                const respuestasOpciones = (p.respuestas as Record<string, unknown>[]) ?? [];
                const preguntaId = String(p.id);
                return (
                  <Card style={styles.preguntaCard}>
                    <Text style={styles.preguntaTexto}>
                      {i + 1}. {String(p.pregunta)}
                    </Text>
                    {respuestasOpciones.map((r) => {
                      const seleccionado = respuestas[preguntaId] === r.id;
                      return (
                        <TouchableOpacity
                          key={String(r.id)}
                          style={styles.opcionRow}
                          onPress={() => setRespuestas((prev) => ({ ...prev, [preguntaId]: r.id as number }))}
                        >
                          <View style={[styles.radio, seleccionado && styles.radioSelected]} />
                          <Text style={styles.opcionTexto}>{String(r.texto)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Card>
                );
              }}
            />
            <View style={styles.footer}>
              <Text style={styles.contador}>
                {Object.keys(respuestas).length} / {preguntas.length} respondidas
              </Text>
              <Button label="Finalizar examen" fullWidth={false} onPress={() => finalizar(preguntas.length)} />
            </View>
          </View>
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  listContent: { padding: 16 },
  preguntaCard: { marginBottom: 12 },
  preguntaTexto: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary, marginBottom: 8 },
  opcionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: AppColors.textSecondary },
  radioSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.primary },
  opcionTexto: { fontSize: 13, color: AppColors.textPrimary, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    backgroundColor: '#FFFFFF',
  },
  contador: { color: AppColors.textSecondary, fontSize: 13 },
});
