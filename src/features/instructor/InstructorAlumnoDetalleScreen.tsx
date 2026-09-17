import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFechaHora } from '../../core/utils/formatters';
import { AppColors, Radii } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar, SectionHeader } from '../../shared/components/CommonWidgets';
import { showOptionsActionSheet } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { InstructorRepository } from './instructorRepository';

const OPCIONES_ESTADO = ['pendiente', 'aprobado', 'reprobado'];

export function InstructorAlumnoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matriculaId = Number(id);
  const { data, loading, error, refetch } = useApiQuery(() => InstructorRepository.alumnoDetalle(matriculaId), [matriculaId]);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const agregarComentario = async (alumnoRut: string) => {
    const texto = comentario.trim();
    if (!texto) return;
    setEnviando(true);
    try {
      await InstructorRepository.guardarComentario({ alumnoRut, comentario: texto });
      setComentario('');
      refetch();
      showToast('Nota agregada.');
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (alumnoId: number, campo: string, actual: string) => {
    const seleccion = await showOptionsActionSheet({ title: 'Cambiar estado', options: OPCIONES_ESTADO.map(capitalizar) });
    if (seleccion === null) return;
    const nuevoEstado = OPCIONES_ESTADO[seleccion];
    if (nuevoEstado === actual) return;
    try {
      await InstructorRepository.actualizarEstado(alumnoId, campo, nuevoEstado);
      refetch();
      showToast('Progreso actualizado.');
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(detalle) => {
          const alumno = detalle.alumno as Record<string, unknown>;
          const comentarios = (detalle.comentarios as Record<string, unknown>[]) ?? [];

          return (
            <>
              <View style={styles.header}>
                <AppAvatar nombre={String(alumno.nombres ?? '?')} radius={28} />
                <View style={styles.flex1}>
                  <Text style={styles.nombre}>
                    {alumno.nombres as string} {(alumno.apellidos as string) ?? ''}
                  </Text>
                  <Text style={styles.curso}>{String(alumno.curso_nombre ?? '')}</Text>
                </View>
              </View>

              <Card>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={16} color={AppColors.textSecondary} />
                  <Text style={styles.infoText}>{String(alumno.correo ?? '-')}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color={AppColors.textSecondary} />
                  <Text style={styles.infoText}>{String(alumno.telefono ?? '-')}</Text>
                </View>
              </Card>

              <SectionHeader title="Progreso académico" />
              <Card>
                <EstadoTile
                  label="Teórico"
                  estado={String(alumno.teorico_estado ?? '')}
                  onPress={() => cambiarEstado(alumno.id as number, 'teorico_estado', String(alumno.teorico_estado))}
                />
                <EstadoTile
                  label="Práctico"
                  estado={String(alumno.practico_estado ?? '')}
                  onPress={() => cambiarEstado(alumno.id as number, 'practico_estado', String(alumno.practico_estado))}
                />
                <EstadoTile
                  label="Psicotécnico"
                  estado={String(alumno.psicotecnico_estado ?? '')}
                  onPress={() => cambiarEstado(alumno.id as number, 'psicotecnico_estado', String(alumno.psicotecnico_estado))}
                />
              </Card>

              <SectionHeader title="Notas pedagógicas" />
              <View style={styles.notaRow}>
                <TextInput
                  style={styles.notaInput}
                  placeholder="Escribe una observación de la clase..."
                  placeholderTextColor={AppColors.textSecondary}
                  value={comentario}
                  onChangeText={setComentario}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => agregarComentario(alumno.rut as string)}
                  disabled={enviando}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {comentarios.length === 0 ? (
                <Text style={styles.emptyText}>Sin notas registradas todavía.</Text>
              ) : (
                comentarios.map((c, i) => (
                  <Card key={i} style={styles.comentarioCard}>
                    <Text style={styles.comentarioTexto}>{String(c.comentario ?? '')}</Text>
                    <Text style={styles.comentarioFecha}>{formatFechaHora(c.created_at as string)}</Text>
                  </Card>
                ))
              )}
            </>
          );
        }}
      </AsyncGate>
    </ScrollView>
  );
}

function EstadoTile({ label, estado, onPress }: { label: string; estado: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.estadoTile}>
      <Text style={styles.estadoLabel}>{label}</Text>
      <Text style={styles.estadoValor}>{estado}</Text>
      <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
    </TouchableOpacity>
  );
}

function capitalizar(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1, marginLeft: 12 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  nombre: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  curso: { color: AppColors.textSecondary, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  infoText: { color: AppColors.textPrimary, fontSize: 13 },
  estadoTile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  estadoLabel: { flex: 1, fontWeight: '600', color: AppColors.textPrimary },
  estadoValor: { color: AppColors.textSecondary },
  notaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  notaInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  sendButton: { backgroundColor: AppColors.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 12 },
  comentarioCard: { marginTop: 8 },
  comentarioTexto: { fontSize: 13, color: AppColors.textPrimary },
  comentarioFecha: { fontSize: 11, color: AppColors.textSecondary, marginTop: 4 },
});
