import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { formatFecha } from '../../core/utils/formatters';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { FiltroChips } from '../../shared/components/FiltroChips';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { ErrorView, LoadingView } from '../../shared/components/StateViews';
import { showToast } from '../../shared/components/Toast';
import { showConfirmDialog } from '../../shared/dialogs';
import { CampanasRepository } from './campanasRepository';

const FILTROS = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'enviado', etiqueta: 'Enviados' },
  { valor: 'fallido', etiqueta: 'Fallidos' },
];

/** Detalle de una campaña: avance, contactos con su estado y el envío por lotes. */
export function AdminCampanaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campanaId = Number(id);

  const [campana, setCampana] = useState<Record<string, unknown> | null>(null);
  const [contactos, setContactos] = useState<Record<string, unknown>[]>([]);
  const [lote, setLote] = useState(20);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (mas = false) => {
      const pagina = mas ? page + 1 : 1;
      if (mas) setCargandoMas(true);
      try {
        const d = await CampanasRepository.campana(campanaId, { estado, page: pagina });
        const nuevos = (d.contactos as Record<string, unknown>[]) ?? [];
        const meta = (d.meta as Record<string, unknown>) ?? {};
        setCampana((d.campana as Record<string, unknown>) ?? {});
        setContactos((prev) => (mas ? [...prev, ...nuevos] : nuevos));
        setPage(pagina);
        setTotalPages(Number(meta.total_pages ?? 1) || 1);
        setLote(Number(d.lote ?? 20) || 20);
        setError(null);
      } catch (e) {
        if (campana) showToast(friendlyErrorMessage(e), true);
        else setError(friendlyErrorMessage(e));
      } finally {
        setCargando(false);
        setCargandoMas(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campanaId, estado, page],
  );

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanaId, estado]);

  const n = (clave: string) => Number(campana?.[clave] ?? 0);
  const pendientes = n('pendientes');
  const fallidos = n('fallidos');
  const cuantos = Math.min(pendientes, lote);

  const enviarLote = async () => {
    const ok = await showConfirmDialog({
      title: 'Enviar lote',
      message:
        `Se enviará la plantilla "${String(campana?.plantilla_meta ?? '')}" por WhatsApp a los próximos ${cuantos} contactos pendientes.\n\n` +
        'Cada mensaje de marketing tiene costo, y solo debe enviarse a personas que aceptaron recibir mensajes de Ortecap. Esta acción no se puede deshacer.',
      confirmLabel: `Enviar ${cuantos}`,
    });
    if (!ok) return;
    setEnviando(true);
    try {
      const r = await CampanasRepository.enviarLote(campanaId);
      showToast(r.mensaje, Number(r.enviados ?? 0) === 0 && Number(r.fallidos ?? 0) > 0);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    } finally {
      // Si se cortó la conexión el lote pudo enviarse igual: se refresca el avance.
      await cargar();
      setEnviando(false);
    }
  };

  const reintentar = async () => {
    const ok = await showConfirmDialog({
      title: 'Reintentar fallidos',
      message: `Los ${fallidos} contactos fallidos vuelven a quedar pendientes. Después podrás enviarlos en un nuevo lote.`,
      confirmLabel: 'Reintentar',
    });
    if (!ok) return;
    try {
      showToast(await CampanasRepository.reintentarFallidos(campanaId));
      await cargar();
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  if (cargando) return <LoadingView />;
  if (error || !campana) return <ErrorView message={error ?? 'No se pudo cargar la campaña.'} onRetry={() => cargar()} />;

  const total = n('total');
  const enviados = n('enviados');

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: String(campana.nombre ?? 'Campaña') }} />
      <FlatList
        data={contactos}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => cargar()} />}
        ListHeaderComponent={
          <>
            <Card>
              <Text style={styles.plantilla}>Plantilla: {String(campana.plantilla_meta ?? '')}</Text>
              <Text style={styles.creada}>Creada el {formatFecha(String(campana.creado_at ?? ''))}</Text>
              <View style={styles.barra}>
                <ProgressBar value={total === 0 ? 0 : enviados / total} />
              </View>
              <View style={styles.numeros}>
                <Numero valor={enviados} etiqueta="Enviados" color={AppColors.success} />
                <Numero valor={pendientes} etiqueta="Pendientes" color={AppColors.info} />
                <Numero valor={fallidos} etiqueta="Fallidos" color={AppColors.danger} />
              </View>
            </Card>

            <View style={styles.acciones}>
              {enviando ? (
                <Card style={styles.enviando}>
                  <ActivityIndicator color={AppColors.primary} />
                  <Text style={styles.enviandoTexto}>Enviando el lote… puede tardar un poco. No cierres la pantalla.</Text>
                </Card>
              ) : (
                <>
                  <Button
                    label={pendientes > 0 ? `Enviar siguiente lote (${cuantos})` : 'No quedan pendientes'}
                    onPress={enviarLote}
                    disabled={pendientes === 0}
                    icon={<Ionicons name="send" size={18} color="#FFFFFF" />}
                  />
                  {fallidos > 0 ? <Button label={`Reintentar los ${fallidos} fallidos`} variant="text" onPress={reintentar} /> : null}
                </>
              )}
            </View>

            <View style={styles.filtros}>
              <FiltroChips opciones={FILTROS} seleccionado={estado} onChange={setEstado} />
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.vacio}>No hay contactos con este filtro.</Text>}
        renderItem={({ item: c }) => <FilaContacto c={c} />}
        ListFooterComponent={
          page < totalPages ? (
            <View style={styles.mas}>
              {cargandoMas ? (
                <ActivityIndicator />
              ) : (
                <Button label="Cargar más" variant="outline" fullWidth={false} style={styles.centrado} onPress={() => cargar(true)} />
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

function Numero({ valor, etiqueta, color }: { valor: number; etiqueta: string; color: string }) {
  return (
    <View style={styles.numero}>
      <Text style={[styles.numeroValor, { color }]}>{valor}</Text>
      <Text style={styles.numeroEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function FilaContacto({ c }: { c: Record<string, unknown> }) {
  const estado = String(c.estado ?? '');
  const icono = estado === 'enviado' ? 'checkmark-circle' : estado === 'fallido' ? 'alert-circle' : 'time-outline';
  const color = estado === 'enviado' ? AppColors.success : estado === 'fallido' ? AppColors.danger : AppColors.textSecondary;
  const errorDetalle = String(c.error_detalle ?? '');
  const detalle = [String(c.telefono ?? ''), c.licencia_previa ? `Licencia ${String(c.licencia_previa)}` : null, errorDetalle || null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Card style={styles.contacto}>
      <Ionicons name={icono} size={20} color={color} />
      <View style={styles.flex1}>
        <Text style={styles.contactoNombre}>{String(c.nombres ?? '')}</Text>
        <Text style={[styles.contactoDetalle, errorDetalle ? { color: AppColors.danger } : null]} numberOfLines={3}>
          {detalle}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  content: { padding: 12, paddingBottom: 40 },
  plantilla: { fontWeight: '700', color: AppColors.textPrimary },
  creada: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  barra: { marginVertical: 12 },
  numeros: { flexDirection: 'row' },
  numero: { flex: 1, alignItems: 'center' },
  numeroValor: { fontSize: 22, fontWeight: '800' },
  numeroEtiqueta: { fontSize: 12, color: AppColors.textSecondary },
  acciones: { marginTop: 12 },
  enviando: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  enviandoTexto: { flex: 1, color: AppColors.textPrimary },
  filtros: { marginHorizontal: -12 },
  vacio: { color: AppColors.textSecondary, textAlign: 'center', padding: 24 },
  contacto: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, paddingVertical: 10 },
  contactoNombre: { fontWeight: '700', color: AppColors.textPrimary },
  contactoDetalle: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  mas: { alignItems: 'center', paddingVertical: 12 },
  centrado: { alignSelf: 'center' },
});
