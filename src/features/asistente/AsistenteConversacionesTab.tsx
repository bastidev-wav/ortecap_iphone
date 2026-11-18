import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { useRefetchOnFocus } from '../../core/hooks/useRefetchOnFocus';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { FiltroChips } from '../../shared/components/FiltroChips';
import { EmptyView, ErrorView, LoadingView } from '../../shared/components/StateViews';
import { AsistenteRepository } from './asistenteRepository';
import { colorCanal, cuandoCorto, iconoCanal } from './asistenteUtils';

const ESTADOS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'atencion', etiqueta: 'Por atender' },
  { valor: 'humano', etiqueta: 'Con el equipo' },
  { valor: 'alumnos', etiqueta: 'Alumnos' },
];

const CANALES = [
  { valor: '', etiqueta: 'Todos los canales' },
  { valor: 'whatsapp', etiqueta: 'WhatsApp' },
  { valor: 'messenger', etiqueta: 'Messenger' },
  { valor: 'instagram', etiqueta: 'Instagram' },
];

const FALTANTES: Record<string, string> = {
  api_key_anthropic: 'la clave de la IA (Anthropic)',
  webhook_meta: 'el webhook de Meta',
  whatsapp: 'WhatsApp',
  messenger_instagram: 'Messenger e Instagram',
};

/** Bandeja de conversaciones del bot. Mientras está visible se actualiza sola cada 30 segundos. */
export function AsistenteConversacionesTab({ activo }: { activo: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState('');
  const [canal, setCanal] = useState('');
  const [buscar, setBuscar] = useState('');
  // Solo vale la respuesta de la última consulta (si cambian los filtros mientras otra está en curso).
  const ultimaConsulta = useRef(0);
  const ocupado = useRef(false);

  const cargar = useCallback(
    async (opciones: { silencioso?: boolean; mas?: boolean } = {}) => {
      if (opciones.silencioso && ocupado.current) return;
      const consulta = ++ultimaConsulta.current;
      ocupado.current = true;
      const pagina = opciones.mas ? page + 1 : 1;
      if (opciones.mas) setCargandoMas(true);
      else if (!opciones.silencioso) setCargando(true);
      try {
        const d = await AsistenteRepository.bandeja({ canal, estado, q: buscar.trim(), page: pagina });
        if (consulta !== ultimaConsulta.current) return;
        const nuevos = (d.conversaciones as Record<string, unknown>[]) ?? [];
        const meta = (d.meta as Record<string, unknown>) ?? {};
        setItems((prev) => (opciones.mas ? [...prev, ...nuevos] : nuevos));
        setPage(pagina);
        setTotalPages(Number(meta.total_pages ?? 1) || 1);
        setStats((d.estadisticas as Record<string, unknown>) ?? {});
        setConfig((d.configuracion as Record<string, unknown>) ?? {});
        setError(null);
      } catch (e) {
        if (consulta === ultimaConsulta.current && !opciones.silencioso && !opciones.mas) setError(friendlyErrorMessage(e));
      } finally {
        if (consulta === ultimaConsulta.current) {
          setCargando(false);
          setCargandoMas(false);
          ocupado.current = false;
        }
      }
    },
    [canal, estado, buscar, page],
  );

  // Recarga al cambiar los filtros (la búsqueda se aplica al presionar "Buscar" en el teclado).
  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, estado]);

  // Al volver de una conversación se refresca sin parpadeo.
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;
  const refrescar = useCallback(() => void cargarRef.current({ silencioso: true }), []);
  useRefetchOnFocus(refrescar);

  // La bandeja se actualiza sola mientras está a la vista.
  useEffect(() => {
    if (!activo) return;
    const t = setInterval(refrescar, 30_000);
    return () => clearInterval(t);
  }, [activo, refrescar]);

  if (cargando && items.length === 0) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={() => cargar()} />;

  const porAtender = Number(stats.por_atender ?? 0);
  const faltantes = Object.keys(config).length ? Object.entries(FALTANTES).filter(([k]) => config[k] === false).map(([, v]) => v) : [];

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => cargar()} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <View style={styles.buscador}>
            <Ionicons name="search" size={18} color={AppColors.textSecondary} />
            <TextInput
              style={styles.buscadorInput}
              placeholder="Buscar por nombre, teléfono o RUT"
              placeholderTextColor={AppColors.textSecondary}
              value={buscar}
              onChangeText={setBuscar}
              returnKeyType="search"
              onSubmitEditing={() => cargar()}
              clearButtonMode="while-editing"
            />
          </View>
          <View style={styles.chips}>
            <FiltroChips
              opciones={ESTADOS.map((e) => (e.valor === 'atencion' && porAtender > 0 ? { ...e, etiqueta: `${e.etiqueta} (${porAtender})` } : e))}
              seleccionado={estado}
              onChange={setEstado}
            />
            <FiltroChips opciones={CANALES} seleccionado={canal} onChange={setCanal} />
          </View>
          {config.bot_habilitado === false ? (
            <Aviso icono="power" texto="El bot está apagado: los mensajes se guardan pero nadie les responde automáticamente." />
          ) : null}
          {faltantes.length > 0 ? <Aviso icono="settings-outline" texto={`Falta configurar en el servidor: ${faltantes.join(', ')}.`} /> : null}
          <Resumen stats={stats} />
        </>
      }
      ListEmptyComponent={<EmptyView icon="chatbubbles-outline" message="No hay conversaciones con este filtro." />}
      renderItem={({ item: c }) => <FilaConversacion c={c} onPress={() => router.push(`/admin/asistente-rrss/conversacion/${c.id}`)} />}
      ListFooterComponent={
        page < totalPages ? (
          <View style={styles.mas}>
            {cargandoMas ? (
              <ActivityIndicator />
            ) : (
              <Button label="Cargar más" variant="outline" fullWidth={false} style={styles.centrado} onPress={() => cargar({ mas: true })} />
            )}
          </View>
        ) : null
      }
    />
  );
}

function Aviso({ icono, texto }: { icono: React.ComponentProps<typeof Ionicons>['name']; texto: string }) {
  return (
    <Card style={styles.aviso}>
      <Ionicons name={icono} size={20} color={AppColors.warning} />
      <Text style={styles.avisoTexto}>{texto}</Text>
    </Card>
  );
}

/** Resumen del día y del mes (conversaciones, respuestas, interesados y costo estimado). */
function Resumen({ stats }: { stats: Record<string, unknown> }) {
  if (!Object.keys(stats).length) return null;
  const costo = Number(stats.costo_mes_usd ?? 0);
  return (
    <View style={styles.resumen}>
      <Dato valor={String(stats.conversaciones_hoy ?? 0)} etiqueta="Chats hoy" color={AppColors.primary} />
      <Dato valor={String(stats.respuestas_hoy ?? 0)} etiqueta="Respuestas del bot hoy" color={AppColors.info} />
      <Dato valor={String(stats.leads_mes ?? 0)} etiqueta="Interesados del mes" color={AppColors.success} />
      <Dato valor={String(stats.comentarios_por_aprobar ?? 0)} etiqueta="Comentarios por aprobar" color={AppColors.warning} />
      <Dato valor={`US$ ${costo.toFixed(2)}`} etiqueta="Costo estimado del mes" color={AppColors.slate} />
    </View>
  );
}

function Dato({ valor, etiqueta, color }: { valor: string; etiqueta: string; color: string }) {
  return (
    <View style={[styles.dato, { backgroundColor: `${color}14` }]}>
      <Text style={[styles.datoValor, { color }]}>{valor}</Text>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function FilaConversacion({ c, onPress }: { c: Record<string, unknown>; onPress: () => void }) {
  const atencion = c.requiere_atencion === true;
  const enHumano = c.en_humano === true;
  const canal = String(c.canal ?? '');
  const nombre = String(c.nombre ?? '').trim();
  const titulo = nombre || String(c.telefono ?? '') || 'Sin nombre';
  const autor = String(c.ultimo_autor ?? '');
  const prefijo = autor === 'bot' ? 'Bot: ' : autor === 'humano' ? 'Equipo: ' : '';

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.fila, atencion && styles.filaAtencion]}>
        <View style={[styles.canal, { backgroundColor: `${colorCanal(canal)}1F` }]}>
          <Ionicons name={iconoCanal(canal)} size={20} color={colorCanal(canal)} />
        </View>
        <View style={styles.flex1}>
          <View style={styles.tituloFila}>
            <Text style={styles.titulo} numberOfLines={1}>
              {titulo}
            </Text>
            {c.verificada === true ? <Ionicons name="checkmark-circle" size={15} color={AppColors.success} /> : null}
          </View>
          <Text style={styles.ultimo} numberOfLines={2}>
            {prefijo}
            {String(c.ultimo_texto ?? '')}
          </Text>
        </View>
        <View style={styles.derecha}>
          <Text style={styles.cuando}>{cuandoCorto(String(c.ultimo_mensaje_at ?? ''))}</Text>
          {atencion ? (
            <View style={styles.punto} />
          ) : enHumano ? (
            <Ionicons name="headset-outline" size={16} color={AppColors.info} />
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  lista: { padding: 12, paddingTop: 0, gap: 8, flexGrow: 1 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  buscadorInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: AppColors.textPrimary },
  chips: { marginHorizontal: -12, marginBottom: 4 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${AppColors.warning}1F`, borderColor: 'transparent', marginBottom: 8 },
  avisoTexto: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
  resumen: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  dato: { width: '31%', borderRadius: Radii.md, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center' },
  datoValor: { fontSize: 16, fontWeight: '800' },
  datoEtiqueta: { fontSize: 10.5, color: AppColors.textSecondary, textAlign: 'center', marginTop: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaAtencion: { borderColor: AppColors.danger },
  canal: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tituloFila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  titulo: { fontWeight: '700', fontSize: 14, color: AppColors.textPrimary, flexShrink: 1 },
  ultimo: { fontSize: 13, color: AppColors.textSecondary, marginTop: 2 },
  derecha: { alignItems: 'flex-end', gap: 6 },
  cuando: { fontSize: 11, color: AppColors.textSecondary },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: AppColors.danger },
  mas: { alignItems: 'center', paddingVertical: 12 },
  centrado: { alignSelf: 'center' },
});
