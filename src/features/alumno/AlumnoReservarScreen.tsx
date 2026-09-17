import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatFecha, formatHora } from '../../core/utils/formatters';
import { AppColors, Radii } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { showConfirmDialog } from '../../shared/dialogs';
import { showToast } from '../../shared/components/Toast';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoReservarScreen() {
  const [tipo, setTipo] = useState<'practica' | 'teorica'>('practica');
  const semana = new Date();
  const { data, loading, error, refetch } = useApiQuery(
    () => AlumnoRepository.disponibles({ tipo, fecha: dayjs(semana).format('YYYY-MM-DD') }),
    [tipo],
  );

  const reservar = async (idsBloques: number[]) => {
    try {
      const cantidad = await AlumnoRepository.reservar(idsBloques);
      showToast(`¡Clase reservada! (${cantidad})`);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const cancelar = async (idBloque: number) => {
    const confirmar = await showConfirmDialog({
      title: 'Cancelar clase',
      message: 'Recuerda que solo puedes cancelar con al menos 24 horas de anticipación, y tienes un número limitado de cancelaciones.',
    });
    if (!confirmar) return;
    try {
      await AlumnoRepository.cancelarClase(idBloque);
      showToast('Clase cancelada. El cupo fue liberado.');
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.chip, tipo === 'practica' && styles.chipSelected]} onPress={() => setTipo('practica')}>
          <Text style={[styles.chipText, tipo === 'practica' && styles.chipTextSelected]}>Prácticas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, tipo === 'teorica' && styles.chipSelected]} onPress={() => setTipo('teorica')}>
          <Text style={[styles.chipText, tipo === 'teorica' && styles.chipTextSelected]}>Teóricas</Text>
        </TouchableOpacity>
      </View>

      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const bloques = (datos.bloques as Record<string, unknown>[]) ?? [];
          const misClases = (datos.mis_clases as Record<string, unknown>[]) ?? [];

          return (
            <ScrollView contentContainerStyle={styles.content}>
              {misClases.length > 0 ? (
                <>
                  <SectionHeader title="Mis clases agendadas" />
                  {misClases.map((c, i) => (
                    <Card key={i} style={styles.itemCard}>
                      <Ionicons name="calendar-outline" size={20} color={AppColors.info} />
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>
                          {formatFecha(c.fecha as string)} · {formatHora(c.hora_inicio as string)}
                        </Text>
                        <Text style={styles.itemSubtitle}>{String(c.tipo_clase ?? '')}</Text>
                      </View>
                      <TouchableOpacity onPress={() => cancelar(c.id as number)} hitSlop={8}>
                        <Ionicons name="close-circle-outline" size={22} color={AppColors.danger} />
                      </TouchableOpacity>
                    </Card>
                  ))}
                </>
              ) : null}

              <SectionHeader title="Horarios disponibles esta semana" />
              {bloques.length === 0 ? (
                <EmptyView message="No hay horarios disponibles esta semana." icon="calendar-outline" />
              ) : (
                bloques.map((b, i) => {
                  const idsBloques = (b.ids_bloques as number[]) ?? [];
                  const diasNombres = (b.dias_nombres as string[]) ?? [];
                  return (
                    <Card key={i} style={styles.itemCard}>
                      <View style={styles.badgeCircle}>
                        <Text style={styles.badgeText}>{String(b.hora ?? '').split(' ')[0]?.substring(0, 2)}</Text>
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>{String(b.hora ?? '')}</Text>
                        <Text style={styles.itemSubtitle}>
                          {String(b.instructor_nombre ?? '')} · {diasNombres.join(', ')}
                        </Text>
                      </View>
                      <Button label="Reservar" fullWidth={false} onPress={() => reservar([idsBloques[0]])} disabled={idsBloques.length === 0} />
                    </Card>
                  );
                })
              )}
            </ScrollView>
          );
        }}
      </AsyncGate>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  filterRow: { flexDirection: 'row', gap: 8, padding: 12 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: Radii.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontWeight: '600', color: AppColors.textPrimary },
  chipTextSelected: { color: '#FFFFFF' },
  content: { paddingHorizontal: 12, paddingBottom: 40 },
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  flex1: { flex: 1, marginLeft: 12 },
  badgeCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '800', fontSize: 11, color: AppColors.primary },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
