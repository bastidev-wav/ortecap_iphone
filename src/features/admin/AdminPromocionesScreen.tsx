import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { formatCLP, formatFecha } from '../../core/utils/formatters';
import { AppColors } from '../../core/theme/colors';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

export function AdminPromocionesScreen() {
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.promociones());

  const toggle = async (id: number) => {
    try {
      await AdminRepository.togglePromocion(id);
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
      {(promos) => {
        if (promos.length === 0) return <EmptyView message="No hay promociones creadas." icon="pricetag-outline" />;
        return (
          <FlatList
            data={promos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item: p }) => {
              const vigente = p.vigente === true;
              const precios = (p.precios as Record<string, unknown>[]) ?? [];
              const activa = p.activa === 1 || p.activa === true;
              return (
                <Card>
                  <View style={styles.headerRow}>
                    <Text style={styles.nombre}>{String(p.nombre)}</Text>
                    <Switch value={activa} onValueChange={() => toggle(p.id as number)} trackColor={{ true: AppColors.primary }} />
                  </View>
                  <Text style={[styles.fechas, vigente && styles.fechasVigente]}>
                    {formatFecha(p.fecha_inicio as string)} — {formatFecha(p.fecha_fin as string)}
                    {vigente ? ' · Vigente' : ''}
                  </Text>
                  {precios.length > 0 ? (
                    <View style={styles.preciosBlock}>
                      {precios.map((precio, i) => (
                        <View key={i} style={styles.precioRow}>
                          <Text style={styles.cursoNombre} numberOfLines={1}>
                            {String(precio.curso_nombre)}
                          </Text>
                          <Text style={styles.precioBase}>{formatCLP(precio.curso_precio_base)}</Text>
                          <Text style={styles.precioPromo}>{formatCLP(precio.precio_promocional)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              );
            }}
          />
        );
      }}
    </AsyncGate>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 12, backgroundColor: AppColors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nombre: { fontWeight: '800', fontSize: 15, color: AppColors.textPrimary, flex: 1 },
  fechas: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
  fechasVigente: { color: AppColors.success, fontWeight: '700' },
  preciosBlock: { borderTopWidth: 1, borderTopColor: AppColors.border, marginTop: 12, paddingTop: 12, gap: 6 },
  precioRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cursoNombre: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
  precioBase: { fontSize: 12, color: AppColors.textSecondary, textDecorationLine: 'line-through' },
  precioPromo: { fontSize: 13, fontWeight: '800', color: AppColors.success },
});
