import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { formatCLP, formatFecha } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar, SectionHeader } from '../../shared/components/CommonWidgets';

import { AdminRepository } from './adminRepository';

export function AdminCursosScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.cursos());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(datos) => {
        const cursos = (datos.cursos as Record<string, unknown>[]) ?? [];
        const matriculas = (datos.matriculas_recientes as Record<string, unknown>[]) ?? [];
        return (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          >
            <SectionHeader title={`Catálogo de cursos (${cursos.length})`} />
            {cursos.map((c, i) => (
              <Card key={i} style={styles.itemCard}>
                <View style={styles.badgeCircle}>
                  <Text style={styles.badgeText}>{String(c.clase_licencia ?? '-')}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>{String(c.nombre)}</Text>
                  <Text style={styles.itemSubtitle}>
                    {String(c.codigo ?? '')} · {String(c.tipo_curso ?? '')}
                  </Text>
                </View>
                <Text style={styles.precio}>{formatCLP(c.precio)}</Text>
              </Card>
            ))}

            <SectionHeader title="Matrículas recientes" />
            {matriculas.map((m, i) => (
              <Card key={i} style={styles.itemCard}>
                <AppAvatar nombre={String(m.alumno_nombre ?? '?')} radius={18} />
                <View style={styles.flex1}>
                  <Text style={styles.itemTitleSmall}>
                    {m.alumno_nombre as string} {(m.alumno_apellido as string) ?? ''}
                  </Text>
                  <Text style={styles.itemSubtitle}>{String(m.curso_nombre ?? '')}</Text>
                </View>
                <Text style={styles.fecha}>{formatFecha(m.fecha_matricula as string)}</Text>
              </Card>
            ))}
          </ScrollView>
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badgeCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '800', fontSize: 12, color: AppColors.textPrimary },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemTitleSmall: { fontWeight: '600', fontSize: 13, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  precio: { fontWeight: '700', color: AppColors.textPrimary },
  fecha: { fontSize: 11, color: AppColors.textSecondary },
});
