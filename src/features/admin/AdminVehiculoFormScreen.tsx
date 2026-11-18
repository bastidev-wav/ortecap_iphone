import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiException } from '../../core/api/apiTypes';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Select } from '../../shared/components/Select';
import { ErrorView, LoadingView } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

const ESTADOS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'mantenimiento', label: 'En taller / mantención' },
  { value: 'baja', label: 'De baja' },
];

/**
 * Crea un vehículo nuevo o edita sus datos básicos (patente, marca, modelo, año, kilometraje
 * y estado). La mantención y los documentos se registran desde el detalle del vehículo.
 */
export function AdminVehiculoFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const vehiculoId = id ? Number(id) : undefined;
  const esEdicion = vehiculoId !== undefined;

  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [km, setKm] = useState('');
  const [estado, setEstado] = useState('disponible');
  const [enRuta, setEnRuta] = useState(false);
  const [cargando, setCargando] = useState(esEdicion);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Al editar se cargan los datos actuales antes de mostrar el formulario.
  const cargar = async () => {
    if (!vehiculoId) return;
    setCargando(true);
    setErrorCarga(null);
    try {
      const v = await AdminRepository.vehiculoDetalle(vehiculoId);
      setPatente(String(v.patente ?? ''));
      setMarca(String(v.marca ?? ''));
      setModelo(String(v.modelo ?? ''));
      setAnio(v.anio ? String(v.anio) : '');
      setKm(String(v.kilometraje_actual ?? ''));
      const e = String(v.estado ?? '');
      setEnRuta(e === 'en_ruta');
      setEstado(ESTADOS.some((x) => x.value === e) ? e : 'disponible');
    } catch (e) {
      setErrorCarga(friendlyErrorMessage(e));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculoId]);

  const guardar = async () => {
    const e: Record<string, string> = {};
    if (!patente.trim()) e.patente = 'Requerida';
    const anioNum = Number(anio.trim());
    if (anio.trim() && (!/^\d+$/.test(anio.trim()) || anioNum < 1980 || anioNum > new Date().getFullYear() + 1)) e.anio = 'Año no válido';
    if (km.trim() && !/^\d+$/.test(km.trim())) e.km = 'Solo números';
    setErrores(e);
    if (Object.keys(e).length) return;

    try {
      await AdminRepository.guardarVehiculo({
        id: vehiculoId,
        datos: {
          patente: patente.trim().toUpperCase(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          anio: anio.trim(),
          kilometraje_actual: km.trim() || '0',
          // Un vehículo en ruta no cambia de estado hasta que termine el recorrido.
          ...(enRuta ? {} : { estado }),
        },
      });
      showToast(esEdicion ? 'Unidad actualizada.' : 'Vehículo registrado.');
      router.back();
    } catch (err) {
      showToast(err instanceof ApiException ? err.firstFieldError() : friendlyErrorMessage(err), true);
    }
  };

  const titulo = esEdicion ? 'Editar vehículo' : 'Nuevo vehículo';

  if (cargando || errorCarga) {
    return (
      <View style={styles.flex}>
        <Stack.Screen options={{ title: titulo }} />
        {cargando ? <LoadingView /> : <ErrorView message={errorCarga!} onRetry={cargar} />}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: titulo }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Patente" placeholder="Ej: PC-HY-79" autoCapitalize="characters" value={patente} onChangeText={setPatente} error={errores.patente} />
        <TextField label="Marca" autoCapitalize="words" value={marca} onChangeText={setMarca} />
        <TextField label="Modelo" autoCapitalize="words" value={modelo} onChangeText={setModelo} />
        <View style={styles.fila}>
          <View style={styles.flex1}>
            <TextField label="Año" keyboardType="number-pad" value={anio} onChangeText={setAnio} error={errores.anio} />
          </View>
          <View style={styles.flex1}>
            <TextField label="Kilometraje" keyboardType="number-pad" value={km} onChangeText={setKm} error={errores.km} />
          </View>
        </View>

        {enRuta ? (
          <Card style={styles.aviso}>
            <Ionicons name="navigate" size={20} color={AppColors.info} />
            <Text style={styles.avisoTexto}>Este vehículo está en una ruta en curso: su estado no se puede cambiar hasta que termine.</Text>
          </Card>
        ) : (
          <Select label="Estado actual" value={estado} options={ESTADOS} onChange={setEstado} />
        )}

        <Button label={esEdicion ? 'Guardar cambios' : 'Registrar vehículo'} onPress={guardar} icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  fila: { flexDirection: 'row', gap: 12 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avisoTexto: { flex: 1, fontSize: 13, color: AppColors.textPrimary },
});
