import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFechaHora } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Card } from '../../shared/components/Card';
import { EmptyView } from '../../shared/components/StateViews';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { showToast } from '../../shared/components/Toast';
import { showOptionsActionSheet, showTextInputPrompt } from '../../shared/dialogs';
import { etiquetaTipoBuzon, TIPOS_BUZON } from '../alumno/AlumnoBuzonScreen';
import { AdminRepository } from './adminRepository';

export function AdminBuzonScreen() {
  const [tipo, setTipo] = useState<string>('');
  const { data, loading, error, refetch } = useApiQuery(() => AdminRepository.retroalimentaciones(tipo || undefined), [tipo]);

  const acciones = async (r: Record<string, unknown>) => {
    const leido = Number(r.leido) === 1;
    const opciones = [r.respuesta ? 'Editar respuesta' : 'Responder', ...(leido ? [] : ['Marcar como leído'])];
    const sel = await showOptionsActionSheet({ title: `${r.nombres ?? ''} ${r.apellidos ?? ''}`.trim(), options: opciones });
    if (sel === null) return;
    try {
      if (opciones[sel] === 'Marcar como leído') {
        await AdminRepository.marcarRetroalimentacionLeida(r.id as number);
        refetch();
        return;
      }
      const respuesta = await showTextInputPrompt({
        title: 'Respuesta para el alumno',
        message: 'La verá en su Buzón de sugerencias dentro de la app.',
      });
      if (!respuesta) return;
      await AdminRepository.responderRetroalimentacion(r.id as number, respuesta);
      showToast('Respuesta guardada. El alumno la verá en su buzón.');
      refetch();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const filtros = [{ valor: '', etiqueta: 'Todos' }, ...TIPOS_BUZON.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))];

  return (
    <View style={styles.flex}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros} style={styles.filtrosScroll}>
        {filtros.map((f) => {
          const sel = tipo === f.valor;
          return (
            <TouchableOpacity key={f.valor || 'todos'} onPress={() => setTipo(f.valor)} style={[styles.chip, sel && styles.chipSel]}>
              <Text style={[styles.chipText, sel && styles.chipTextSel]}>{f.etiqueta}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(datos) => {
          const items = (datos.items as Record<string, unknown>[]) ?? [];
          const noLeidos = Number(datos.no_leidos ?? 0);
          return (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
              ListHeaderComponent={noLeidos > 0 ? <Text style={styles.noLeidos}>{noLeidos} sin leer</Text> : null}
              ListEmptyComponent={<EmptyView message="No hay mensajes en el buzón." icon="chatbox-ellipses-outline" />}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item: r }) => {
                const t = etiquetaTipoBuzon(r.tipo);
                const leido = Number(r.leido) === 1;
                return (
                  <TouchableOpacity onPress={() => acciones(r)}>
                    <Card style={!leido ? styles.cardNoLeida : undefined}>
                      <View style={styles.row}>
                        <StatusBadge label={t.etiqueta} color={t.color} />
                        {!leido ? <View style={styles.punto} /> : null}
                        <Text style={styles.fecha}>{formatFechaHora(r.created_at as string)}</Text>
                      </View>
                      <Text style={styles.autor}>
                        {String(r.nombres ?? '')} {String(r.apellidos ?? '')}
                        {r.correo ? <Text style={styles.correo}> · {String(r.correo)}</Text> : null}
                      </Text>
                      <Text style={styles.mensaje}>{String(r.mensaje ?? '')}</Text>
                      {r.respuesta ? (
                        <View style={styles.respuesta}>
                          <Ionicons name="return-down-forward-outline" size={14} color={AppColors.primary} />
                          <Text style={styles.respuestaTexto}>{String(r.respuesta)}</Text>
                        </View>
                      ) : null}
                    </Card>
                  </TouchableOpacity>
                );
              }}
            />
          );
        }}
      </AsyncGate>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  filtrosScroll: { flexGrow: 0 },
  filtros: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border },
  chipSel: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  chipTextSel: { color: '#FFFFFF' },
  listContent: { padding: 12, flexGrow: 1 },
  noLeidos: { color: AppColors.danger, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  cardNoLeida: { borderColor: AppColors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.danger },
  fecha: { marginLeft: 'auto', fontSize: 11, color: AppColors.textSecondary },
  autor: { fontWeight: '700', color: AppColors.textPrimary, marginTop: 8 },
  correo: { fontWeight: '400', color: AppColors.textSecondary, fontSize: 12 },
  mensaje: { color: AppColors.textPrimary, marginTop: 4 },
  respuesta: { flexDirection: 'row', gap: 6, marginTop: 8, padding: 8, borderRadius: Radii.sm, backgroundColor: `${AppColors.primary}0F` },
  respuestaTexto: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
});
