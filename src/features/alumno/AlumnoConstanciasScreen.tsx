import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { formatFecha } from '../../core/utils/formatters';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { AlumnoAsyncGate } from './AlumnoAsyncGate';
import { AlumnoRepository } from './alumnoRepository';

export function AlumnoConstanciasScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => AlumnoRepository.constancias());

  return (
    <AlumnoAsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(items) => (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          ListHeaderComponent={
            <Text style={styles.intro}>
              Comprobantes de que asististe a una clase o evaluación. Sirven, por ejemplo, para justificar una ausencia en el trabajo
              o la universidad. Cada uno tiene un código que cualquiera puede verificar en ortecap.cl.
            </Text>
          }
          ListEmptyComponent={<EmptyView message="Aún no tienes clases realizadas." icon="document-text-outline" />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item: c }) => (
            <TouchableOpacity onPress={() => router.push(`/alumno/constancias/${c.id}`)}>
              <Card style={styles.itemCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name={c.tipo === 'teorica' ? 'book-outline' : 'car-outline'} size={20} color={AppColors.primary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.itemTitle}>
                    {formatFecha(c.fecha as string)} · {String(c.hora_inicio ?? '')} - {String(c.hora_fin ?? '')}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {c.tipo === 'teorica' ? 'Clase teórica' : 'Clase práctica'}
                    {c.modulo ? ` · ${c.modulo}` : ''} · {String(c.sede ?? '')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={AppColors.textSecondary} />
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </AlumnoAsyncGate>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 12, backgroundColor: AppColors.background, flexGrow: 1 },
  intro: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 12, paddingHorizontal: 4 },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1, marginLeft: 12 },
  itemTitle: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary },
  itemSubtitle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
});
