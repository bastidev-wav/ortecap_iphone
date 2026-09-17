import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { AlumnoRepository } from './alumnoRepository';

const NOMBRES_DIAS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

function soloHora(hora?: string | null) {
  return !hora || hora.length < 5 ? '--:--' : hora.substring(0, 5);
}

export function AlumnoHorarioReferenciaScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.horarioReferencia());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const matricula = datos.matricula as Record<string, unknown> | null;
        const horario = (datos.horario as Record<string, unknown>[]) ?? [];

        const porDia = new Map<number, Record<string, unknown>[]>();
        for (const bloque of horario) {
          const dia = bloque.dia_semana as number;
          if (!porDia.has(dia)) porDia.set(dia, []);
          porDia.get(dia)!.push(bloque);
        }
        const dias = Array.from(porDia.keys()).sort((a, b) => a - b);

        return (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          >
            {matricula ? (
              <>
                <Text style={styles.cursoNombre}>{String(matricula.curso_nombre ?? '')}</Text>
                <Text style={styles.descripcion}>
                  Este curso no reserva clases individuales: sigue el horario de referencia que definió el equipo académico.
                </Text>
              </>
            ) : null}

            {horario.length === 0 ? (
              <EmptyView
                message="Aún no se ha publicado un horario para tu curso. Consulta con administración."
                icon="calendar-outline"
              />
            ) : (
              dias.map((dia) => (
                <View key={dia} style={styles.diaBlock}>
                  <SectionHeader title={NOMBRES_DIAS[dia] ?? `Día ${dia}`} />
                  {porDia.get(dia)!.map((bloque, i) => (
                    <Card key={i} style={styles.itemCard}>
                      <Ionicons name="time-outline" size={20} color={AppColors.primary} />
                      <View style={styles.flex1}>
                        <Text style={styles.itemTitle}>
                          {soloHora(bloque.hora_inicio as string)} - {soloHora(bloque.hora_fin as string)}
                        </Text>
                        <Text style={styles.itemSubtitle}>
                          {[bloque.modulo, bloque.responsable].filter((v) => !!v).join(' · ')}
                        </Text>
                      </View>
                    </Card>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  cursoNombre: { fontSize: 18, fontWeight: '800', color: AppColors.textPrimary },
  descripcion: { color: AppColors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 16 },
  diaBlock: { marginBottom: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
