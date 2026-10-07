import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';
import {
  AvisoProgramado,
  avisosProgramados,
  enviarPrueba,
  permisoNotificaciones,
  useRecordatoriosPrefs,
} from '../../core/notifications/recordatorios';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { showToast } from '../../shared/components/Toast';
import { sincronizarRecordatoriosDesdeServidor } from './sincronizar';

export function RecordatoriosScreen() {
  const rol = useAuthStore((s) => s.user?.rol);
  const { prefs, cargar, guardar } = useRecordatoriosPrefs();
  const [permiso, setPermiso] = useState<boolean | null>(null);
  const [avisos, setAvisos] = useState<AvisoProgramado[]>([]);
  const [actualizando, setActualizando] = useState(false);

  const refrescarEstado = useCallback(async () => {
    setPermiso(await permisoNotificaciones(false));
    setAvisos(await avisosProgramados());
  }, []);

  const actualizarDesdeServidor = useCallback(async () => {
    if (!rol) return;
    setActualizando(true);
    try {
      await sincronizarRecordatoriosDesdeServidor(rol);
      await refrescarEstado();
    } finally {
      setActualizando(false);
    }
  }, [rol, refrescarEstado]);

  useEffect(() => {
    void cargar().then(refrescarEstado);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refrescarEstado();
    });
    return () => sub.remove();
  }, [cargar, refrescarEstado]);

  const cambiar = async (cambios: Parameters<typeof guardar>[0]) => {
    await guardar(cambios);
    await refrescarEstado();
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={actualizando} onRefresh={actualizarDesdeServidor} />}
    >
      <Text style={styles.intro}>
        Te avisamos en el iPhone antes de cada clase agendada. Los avisos quedan guardados en el teléfono, así que llegan aunque no
        tengas internet en ese momento.
      </Text>

      {permiso === false ? (
        <Card style={styles.warningCard}>
          <Ionicons name="notifications-off-outline" size={20} color={AppColors.warning} />
          <Text style={styles.warningText}>Las notificaciones de Ortecap están desactivadas en el iPhone.</Text>
          <Button label="Activar" variant="text" fullWidth={false} onPress={() => Linking.openSettings()} />
        </Card>
      ) : null}

      <Card>
        <Fila
          titulo="Recordatorios de clases"
          subtitulo="Activa o desactiva todos los avisos"
          valor={prefs.activos}
          onChange={(v) => cambiar({ activos: v })}
        />
        <View style={styles.divider} />
        <Fila
          titulo="Un día antes"
          subtitulo="“Tu clase es mañana”"
          valor={prefs.aviso24h}
          deshabilitado={!prefs.activos}
          onChange={(v) => cambiar({ aviso24h: v })}
        />
        <View style={styles.divider} />
        <Fila
          titulo="Una hora antes"
          subtitulo="“Tu clase empieza en 1 hora”"
          valor={prefs.aviso1h}
          deshabilitado={!prefs.activos}
          onChange={(v) => cambiar({ aviso1h: v })}
        />
      </Card>

      <SectionHeader title={`Próximos avisos (${avisos.length})`} />
      {avisos.length === 0 ? (
        <Text style={styles.emptyText}>
          {prefs.activos ? 'No hay avisos programados. Aparecerán aquí cuando tengas clases agendadas.' : 'Los recordatorios están desactivados.'}
        </Text>
      ) : (
        avisos.slice(0, 10).map((a) => (
          <Card key={a.id} style={styles.avisoCard}>
            <Ionicons name="alarm-outline" size={20} color={AppColors.primary} />
            <View style={styles.flex1}>
              <Text style={styles.avisoTitulo}>{a.titulo}</Text>
              <Text style={styles.avisoCuerpo}>{a.cuerpo}</Text>
            </View>
            <Text style={styles.avisoFecha}>{a.fecha ? dayjs(a.fecha).format('DD/MM HH:mm') : ''}</Text>
          </Card>
        ))
      )}

      <View style={styles.botones}>
        <Button label="Actualizar mis clases" variant="outline" onPress={actualizarDesdeServidor} />
        <Button
          label="Enviar un aviso de prueba"
          variant="text"
          onPress={async () => {
            const ok = await enviarPrueba();
            showToast(ok ? 'Llegará en 5 segundos. Puedes salir de la app para verlo.' : 'Activa las notificaciones para recibir avisos.', !ok);
          }}
        />
      </View>
    </ScrollView>
  );
}

function Fila({
  titulo,
  subtitulo,
  valor,
  deshabilitado,
  onChange,
}: {
  titulo: string;
  subtitulo: string;
  valor: boolean;
  deshabilitado?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={[styles.fila, deshabilitado && styles.filaDeshabilitada]}>
      <View style={styles.flex1}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        <Text style={styles.filaSubtitulo}>{subtitulo}</Text>
      </View>
      <Switch value={valor} disabled={deshabilitado} onValueChange={onChange} trackColor={{ true: AppColors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  intro: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 16 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${AppColors.warning}1F`,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  warningText: { flex: 1, fontSize: 13, fontWeight: '600', color: AppColors.textPrimary },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  filaDeshabilitada: { opacity: 0.45 },
  filaTitulo: { fontWeight: '700', color: AppColors.textPrimary },
  filaSubtitulo: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  emptyText: { color: AppColors.textSecondary, paddingVertical: 8 },
  avisoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avisoTitulo: { fontWeight: '700', fontSize: 13, color: AppColors.textPrimary },
  avisoCuerpo: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  avisoFecha: { fontSize: 12, fontWeight: '700', color: AppColors.primary },
  botones: { marginTop: 20, gap: 8 },
});
