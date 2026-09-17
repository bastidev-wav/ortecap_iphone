import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { AppAvatar } from '../../shared/components/CommonWidgets';
import { EmptyView } from '../../shared/components/StateViews';
import { AutoStatusBadge } from '../../shared/components/StatusBadge';
import { AdminRepository } from './adminRepository';

export function AdminAlumnosScreen() {
  const router = useRouter();
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string | null>(null);

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: cursoSeleccionado ? 'Alumnos del curso' : 'Alumnos',
          headerLeft: cursoSeleccionado
            ? () => (
                <TouchableOpacity onPress={() => setCursoSeleccionado(null)} hitSlop={12}>
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )
            : undefined,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/admin/alumnos/nuevo')} hitSlop={12}>
              <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      {cursoSeleccionado === null ? (
        <ResumenView onSelectCurso={setCursoSeleccionado} />
      ) : (
        <ListadoPorCursoView cursoId={cursoSeleccionado} />
      )}
    </View>
  );
}

function ResumenView({ onSelectCurso }: { onSelectCurso: (id: string) => void }) {
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.alumnosResumen());

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(resumen) => {
        const cursos = (resumen.resumen_cursos as Record<string, unknown>[]) ?? [];
        const sinCurso = Number(resumen.sin_curso ?? 0);
        return (
          <FlatList
            data={cursos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListFooterComponent={
              sinCurso > 0 ? (
                <TouchableOpacity onPress={() => onSelectCurso('sin_curso')} style={{ marginTop: 10 }}>
                  <Card style={styles.itemCard}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="help-outline" size={20} color={AppColors.textSecondary} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.itemTitle}>Sin curso asignado</Text>
                      <Text style={styles.itemSubtitle}>{sinCurso} alumnos</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
                  </Card>
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item: curso }) => (
              <TouchableOpacity onPress={() => onSelectCurso(String(curso.id))}>
                <Card style={styles.itemCard}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="book-outline" size={20} color={AppColors.primary} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.itemTitle}>{String(curso.nombre)}</Text>
                    <Text style={styles.itemSubtitle}>{String(curso.total_alumnos)} alumnos</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
                </Card>
              </TouchableOpacity>
            )}
          />
        );
      }}
    </AsyncGate>
  );
}

function ListadoPorCursoView({ cursoId }: { cursoId: string }) {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.alumnosPorCurso(cursoId), [cursoId]);

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(result) => {
        const alumnos = (result.data as Record<string, unknown>).alumnos as Record<string, unknown>[];
        if (alumnos.length === 0) return <EmptyView message="No hay alumnos en este curso." icon="school-outline" />;
        return (
          <FlatList
            data={alumnos}
            keyExtractor={(item) => String(item.rut)}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: a }) => (
              <TouchableOpacity onPress={() => router.push(`/admin/alumnos/${a.rut}`)}>
                <Card style={styles.itemCard}>
                  <AppAvatar nombre={String(a.nombres ?? '?')} />
                  <View style={styles.flex1}>
                    <Text style={styles.itemTitle}>
                      {a.nombres as string} {(a.apellidos as string) ?? ''}
                    </Text>
                    <Text style={styles.itemSubtitle}>{String(a.correo ?? '')}</Text>
                  </View>
                  {a.matricula_estado ? <AutoStatusBadge estado={String(a.matricula_estado)} /> : null}
                </Card>
              </TouchableOpacity>
            )}
          />
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  listContent: { padding: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
