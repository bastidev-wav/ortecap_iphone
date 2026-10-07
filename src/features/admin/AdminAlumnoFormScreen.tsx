import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { ApiClient } from '../../core/api/apiClient';
import { ApiException } from '../../core/api/apiTypes';
import { useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Select } from '../../shared/components/Select';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { LoadingView } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { AdminRepository } from './adminRepository';

type Documento = { uri: string; name: string; mimeType?: string };

export function AdminAlumnoFormScreen() {
  const router = useRouter();
  // Cuando se abre desde la Agenda de matrículas llegan los datos de la persona agendada.
  const p = useLocalSearchParams<{
    rut?: string;
    desde_cupo?: string;
    nombres?: string;
    apellidos?: string;
    telefono?: string;
    correo?: string;
    curso_id?: string;
    localidad_id?: string;
  }>();
  const desdeCupo = p.desde_cupo;
  const rutExistente = desdeCupo ? undefined : p.rut;
  const esEdicion = !!rutExistente;

  const { data: cursosData } = useApiQuery(() => AdminRepository.cursos());

  const [rut, setRut] = useState(desdeCupo ? p.rut ?? '' : '');
  const [nombres, setNombres] = useState(p.nombres ?? '');
  const [apellidos, setApellidos] = useState(p.apellidos ?? '');
  const [correo, setCorreo] = useState(p.correo ?? '');
  const [telefono, setTelefono] = useState(p.telefono ?? '');
  const [direccion, setDireccion] = useState('');
  const [localidadId, setLocalidadId] = useState(p.localidad_id ?? '');
  const [declaracionSalud, setDeclaracionSalud] = useState(false);
  const [enfermedades, setEnfermedades] = useState('');
  const [cursoSeleccionado, setCursoSeleccionado] = useState(p.curso_id ?? '');
  const [precio, setPrecio] = useState('');
  const [formaPago, setFormaPago] = useState<'contado' | 'cuotas'>('contado');
  const [voucher, setVoucher] = useState('');
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [comprobante, setComprobante] = useState<Documento | null>(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(esEdicion);

  // Al editar se cargan los datos actuales: el PUT reemplaza todos los campos,
  // así que guardar con el formulario vacío borraría el expediente.
  useEffect(() => {
    if (!rutExistente) return;
    AdminRepository.alumnoDetalle(rutExistente)
      .then((d) => {
        const a = (d.alumno as Record<string, unknown>) ?? {};
        setNombres(String(a.nombres ?? ''));
        setApellidos(String(a.apellidos ?? ''));
        setCorreo(String(a.correo ?? ''));
        setTelefono(String(a.telefono ?? ''));
        setDireccion(String(a.direccion ?? ''));
        setLocalidadId(a.localidad_id != null ? String(a.localidad_id) : '');
        setDeclaracionSalud(Number(a.declaracion_salud) === 1 || a.declaracion_salud === true);
        const enf = String(a.enfermedades_declaradas ?? '');
        setEnfermedades(enf === 'Ninguna' ? '' : enf);
      })
      .catch((e) => showToast(e instanceof ApiException ? e.message : 'No se pudo cargar el expediente.', true))
      .finally(() => setCargandoExpediente(false));
  }, [rutExistente]);

  const elegirDocumentos = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ['application/pdf', 'image/jpeg', 'image/png'],
    });
    if (!result.canceled) {
      setDocumentos(result.assets.map((a) => ({ uri: a.uri, name: a.name, mimeType: a.mimeType })));
    }
  };

  const elegirComprobante = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'] });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setComprobante({ uri: a.uri, name: a.name, mimeType: a.mimeType });
    }
  };

  const guardar = async () => {
    if ((!esEdicion && !rut.trim()) || !nombres.trim() || !correo.includes('@')) {
      showToast('Revisa los campos requeridos.', true);
      return;
    }

    const fields: Record<string, unknown> = {
      ...(!esEdicion ? { rut: rut.trim() } : {}),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      localidad_id: localidadId.trim(),
      declaracion_salud: declaracionSalud,
      enfermedades_declaradas: enfermedades.trim() || 'Ninguna',
    };

    if (!esEdicion) {
      Object.assign(fields, {
        curso_id: cursoSeleccionado,
        precio_final: precio.trim(),
        forma_pago: formaPago,
        numero_voucher: voucher.trim(),
        // El backend deja ese horario de la Agenda de matrículas como "Matriculado".
        ...(desdeCupo ? { desde_cupo: desdeCupo } : {}),
      });
    }

    const files = [
      ...documentos.map((d) => ({ fieldName: 'documentos[]', uri: d.uri, fileName: d.name, mimeType: d.mimeType })),
      ...(!esEdicion && comprobante
        ? [{ fieldName: 'comprobante_pago', uri: comprobante.uri, fileName: comprobante.name, mimeType: comprobante.mimeType }]
        : []),
    ];

    try {
      const path = esEdicion ? `/admin/alumnos/${rutExistente}` : '/admin/alumnos';
      await ApiClient.uploadMultipart(path, { fields, files, isPut: esEdicion });
      showToast(esEdicion ? 'Expediente actualizado.' : 'Alumno matriculado exitosamente.');
      if (router.canGoBack()) router.back();
    } catch (e) {
      const message = e instanceof ApiException ? e.firstFieldError() : 'Ocurrió un error inesperado.';
      showToast(message, true);
    }
  };

  const cursoOptions = [
    { label: 'Selecciona un curso', value: '' },
    ...(((cursosData?.cursos as Record<string, unknown>[]) ?? []).map((c) => ({ label: String(c.nombre), value: String(c.id) }))),
  ];

  if (cargandoExpediente) return <LoadingView message="Cargando expediente..." />;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {desdeCupo ? (
        <Text style={styles.desdeCupo}>Datos tomados de la Agenda de matrículas. Revísalos antes de matricular.</Text>
      ) : null}
      {!esEdicion ? <TextField label="RUT" value={rut} onChangeText={setRut} autoCapitalize="none" /> : null}
      <TextField label="Nombres" value={nombres} onChangeText={setNombres} />
      <TextField label="Apellidos" value={apellidos} onChangeText={setApellidos} />
      <TextField label="Correo" keyboardType="email-address" autoCapitalize="none" value={correo} onChangeText={setCorreo} />
      <TextField label="Teléfono" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      <TextField label="Dirección" value={direccion} onChangeText={setDireccion} />
      <TextField
        label="ID de localidad/sede"
        keyboardType="number-pad"
        value={localidadId}
        onChangeText={setLocalidadId}
        placeholder="Consulta el ID en Cursos → Precios por sede"
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Declara alguna condición de salud</Text>
        <Switch value={declaracionSalud} onValueChange={setDeclaracionSalud} trackColor={{ true: AppColors.primary }} />
      </View>
      {declaracionSalud ? (
        <TextField label="Detalle de la condición" value={enfermedades} onChangeText={setEnfermedades} />
      ) : null}

      {!esEdicion ? (
        <>
          <SectionHeader title="Matrícula" />
          <Select label="Curso" value={cursoSeleccionado} options={cursoOptions} onChange={setCursoSeleccionado} />
          <TextField label="Precio final ($)" keyboardType="number-pad" value={precio} onChangeText={setPrecio} />

          <View style={styles.row}>
            <TouchableOpacity style={styles.radioRow} onPress={() => setFormaPago('contado')}>
              <View style={[styles.radioCircle, formaPago === 'contado' && styles.radioCircleSelected]} />
              <Text>Contado</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioRow} onPress={() => setFormaPago('cuotas')}>
              <View style={[styles.radioCircle, formaPago === 'cuotas' && styles.radioCircleSelected]} />
              <Text>Cuotas</Text>
            </TouchableOpacity>
          </View>
          <TextField label="N° de voucher/transferencia (opcional)" value={voucher} onChangeText={setVoucher} />

          <TouchableOpacity style={styles.attachButton} onPress={elegirComprobante}>
            <Ionicons name="attach-outline" size={18} color={AppColors.primary} />
            <Text style={styles.attachLabel}>{comprobante?.name ?? 'Adjuntar comprobante de pago'}</Text>
          </TouchableOpacity>
        </>
      ) : null}

      <TouchableOpacity style={styles.attachButton} onPress={elegirDocumentos}>
        <Ionicons name="document-attach-outline" size={18} color={AppColors.primary} />
        <Text style={styles.attachLabel}>
          {documentos.length === 0 ? 'Adjuntar documentos (cédula, licencia, etc.)' : `${documentos.length} documento(s) seleccionado(s)`}
        </Text>
      </TouchableOpacity>

      <View style={styles.submitButton}>
        <Button label={esEdicion ? 'Guardar cambios' : 'Matricular alumno'} onPress={guardar} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  desdeCupo: { color: AppColors.info, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switchLabel: { flex: 1, color: AppColors.textPrimary },
  row: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: AppColors.textSecondary },
  radioCircleSelected: { borderColor: AppColors.primary, backgroundColor: AppColors.primary },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  attachLabel: { color: AppColors.primary, fontWeight: '600', flexShrink: 1 },
  submitButton: { marginTop: 12 },
});
