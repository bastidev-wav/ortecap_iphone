import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiException } from '../../core/api/apiTypes';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { CampoFecha } from '../../shared/components/CampoFecha';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { DOCUMENTOS_VEHICULO, entero, fechaDeServidor, fechaParaServidor } from './vehiculosUtils';

/**
 * Registro de mantención de un vehículo, el mismo para el administrador y el instructor
 * (igual que el formulario del panel web). [guardar] recibe los datos listos para enviar a
 * `/vehiculos/{id}/mantenimiento`. Un plazo vacío no se envía: el servidor conserva el que tenía.
 */
export function MantenimientoVehiculoModal({
  vehiculo,
  onClose,
  guardar,
  onGuardado,
}: {
  /** null = cerrado */
  vehiculo: Record<string, unknown> | null;
  onClose: () => void;
  guardar: (datos: Record<string, unknown>) => Promise<void>;
  onGuardado: () => void;
}) {
  const [km, setKm] = useState('');
  const [proxAceite, setProxAceite] = useState('');
  const [proxMotor, setProxMotor] = useState('');
  const [proxPolen, setProxPolen] = useState('');
  const [realizadoAceite, setRealizadoAceite] = useState(false);
  const [realizadoMotor, setRealizadoMotor] = useState(false);
  const [realizadoPolen, setRealizadoPolen] = useState(false);
  const [kmEmbrague, setKmEmbrague] = useState('');
  const [fechaEmbrague, setFechaEmbrague] = useState<Date | null>(null);
  const [proximaRevision, setProximaRevision] = useState<Date | null>(null);
  const [bateria, setBateria] = useState<Date | null>(null);
  const [documentos, setDocumentos] = useState<Record<string, Date | null>>({});
  const [observaciones, setObservaciones] = useState('');

  // Cada vez que se abre, el formulario parte de lo ya guardado (o de los plazos sugeridos de la web).
  useEffect(() => {
    if (!vehiculo) return;
    const v = vehiculo;
    const kmActual = entero(v.kilometraje_actual);
    const plazo = (campo: string, sumar: number) => {
      const actual = entero(v[campo]);
      return String(actual > 0 ? actual : kmActual + sumar);
    };
    setKm(String(kmActual));
    setProxAceite(plazo('km_proximo_cambio_aceite', 10000));
    setProxMotor(plazo('km_proximo_filtro_motor', 10000));
    setProxPolen(plazo('km_proximo_filtro_pollen', 15000));
    setRealizadoAceite(false);
    setRealizadoMotor(false);
    setRealizadoPolen(false);
    const kmEmb = entero(v.km_ultimo_cambio_embrague);
    setKmEmbrague(kmEmb > 0 ? String(kmEmb) : '');
    setFechaEmbrague(fechaDeServidor(v.fecha_ultimo_cambio_embrague));
    setProximaRevision(fechaDeServidor(v.fecha_proxima_mantencion) ?? dayjs().add(180, 'day').toDate());
    setBateria(fechaDeServidor(v.fecha_ultimo_cambio_bateria));
    setDocumentos(Object.fromEntries(Object.keys(DOCUMENTOS_VEHICULO).map((c) => [c, fechaDeServidor(v[c])])));
    setObservaciones(String(v.observaciones_tecnicas ?? ''));
  }, [vehiculo]);

  const enviar = async () => {
    const kmNum = parseInt(km.trim(), 10);
    if (!/^\d+$/.test(km.trim()) || Number.isNaN(kmNum)) {
      showToast('Ingresa el kilometraje actual (solo números).', true);
      return;
    }
    const datos: Record<string, unknown> = {
      km_actual: kmNum,
      ...(proxAceite.trim() ? { proximo_aceite: proxAceite.trim() } : {}),
      ...(proxMotor.trim() ? { proximo_motor: proxMotor.trim() } : {}),
      ...(proxPolen.trim() ? { proximo_pollen: proxPolen.trim() } : {}),
      realizado_aceite: realizadoAceite,
      realizado_motor: realizadoMotor,
      realizado_pollen: realizadoPolen,
      ...(kmEmbrague.trim() ? { km_ultimo_cambio_embrague: kmEmbrague.trim() } : {}),
      ...(fechaEmbrague ? { fecha_ultimo_cambio_embrague: fechaParaServidor(fechaEmbrague) } : {}),
      ...(proximaRevision ? { fecha_proxima: fechaParaServidor(proximaRevision) } : {}),
      // Documentos y batería: vacío = quitar la fecha.
      ...Object.fromEntries(Object.entries(documentos).map(([c, f]) => [c, fechaParaServidor(f)])),
      fecha_ultimo_cambio_bateria: fechaParaServidor(bateria),
      observaciones_tecnicas: observaciones.trim(),
    };
    try {
      await guardar(datos);
      showToast('Mantención registrada.');
      onGuardado();
    } catch (e) {
      showToast(e instanceof ApiException ? e.firstFieldError() : friendlyErrorMessage(e), true);
    }
  };

  const v = vehiculo ?? {};

  return (
    <Modal visible={vehiculo !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.flex1}>
            <Text style={styles.title}>Registrar mantención</Text>
            <Text style={styles.subtitle}>{`${v.patente ?? ''} · ${v.marca ?? ''} ${v.modelo ?? ''}`.trim()}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={styles.flex1} behavior="padding">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TextField label="Kilometraje actual" keyboardType="number-pad" value={km} onChangeText={setKm} />

            <Bloque titulo="Aceite de motor" icono="water-outline" color="#C2410C">
              <Plazo valor={proxAceite} onChange={setProxAceite} realizado={realizadoAceite} onRealizado={setRealizadoAceite} />
            </Bloque>
            <Bloque titulo="Filtro de aire del motor" icono="settings-outline" color="#1D4ED8">
              <Plazo valor={proxMotor} onChange={setProxMotor} realizado={realizadoMotor} onRealizado={setRealizadoMotor} />
            </Bloque>
            <Bloque titulo="Filtro de polen (cabina)" icono="leaf-outline" color="#7E22CE">
              <Plazo valor={proxPolen} onChange={setProxPolen} realizado={realizadoPolen} onRealizado={setRealizadoPolen} />
            </Bloque>
            <Bloque titulo="Cambio de embrague" icono="disc-outline" color="#B91C1C">
              <Text style={styles.ayuda}>Solo registro informativo: no genera alertas.</Text>
              <TextField label="Kilometraje del cambio" placeholder="Ej: 180000" keyboardType="number-pad" value={kmEmbrague} onChangeText={setKmEmbrague} />
              <CampoFecha etiqueta="Fecha del cambio" valor={fechaEmbrague} onChange={setFechaEmbrague} />
            </Bloque>
            <Bloque titulo="Próxima revisión general" icono="calendar-outline" color="#15803D">
              <CampoFecha etiqueta="Fecha" valor={proximaRevision} onChange={setProximaRevision} limpiable={false} />
            </Bloque>
            <Bloque titulo="Documentos y vencimientos" icono="document-text-outline" color={AppColors.slate}>
              {Object.entries(DOCUMENTOS_VEHICULO).map(([campo, nombre]) => (
                <CampoFecha
                  key={campo}
                  etiqueta={nombre}
                  valor={documentos[campo] ?? null}
                  onChange={(f) => setDocumentos((d) => ({ ...d, [campo]: f }))}
                />
              ))}
              <CampoFecha etiqueta="Último cambio de batería" valor={bateria} onChange={setBateria} />
            </Bloque>

            <TextField
              label="Observaciones"
              placeholder="Detalles técnicos, reparaciones pendientes, notas para la próxima mantención…"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              style={styles.multilinea}
            />
            <Button label="Guardar" onPress={enviar} icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Bloque({
  titulo,
  icono,
  color,
  children,
}: {
  titulo: string;
  icono: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.bloque, { backgroundColor: `${color}0F`, borderColor: `${color}40` }]}>
      <View style={styles.bloqueTitulo}>
        <Ionicons name={icono} size={18} color={color} />
        <Text style={[styles.bloqueTexto, { color }]}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

function Plazo({
  valor,
  onChange,
  realizado,
  onRealizado,
}: {
  valor: string;
  onChange: (v: string) => void;
  realizado: boolean;
  onRealizado: (v: boolean) => void;
}) {
  return (
    <>
      <TextField label="Próximo cambio (km)" keyboardType="number-pad" value={valor} onChangeText={onChange} />
      <View style={styles.realizado}>
        <Text style={styles.realizadoTexto}>Se realizó el cambio ahora</Text>
        <Switch value={realizado} onValueChange={onRealizado} trackColor={{ true: AppColors.primary }} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border, gap: 12 },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  subtitle: { fontSize: 13, color: AppColors.textSecondary, marginTop: 2 },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  ayuda: { fontSize: 12, color: AppColors.textSecondary, marginBottom: 10 },
  bloque: { borderWidth: 1, borderRadius: Radii.lg, padding: 14, paddingBottom: 2, marginBottom: 14 },
  bloqueTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bloqueTexto: { fontWeight: '800', fontSize: 14 },
  realizado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -6, marginBottom: 12 },
  realizadoTexto: { fontSize: 13, color: AppColors.textPrimary },
  multilinea: { minHeight: 90, textAlignVertical: 'top' },
});
