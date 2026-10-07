import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ApiException } from '../../core/api/apiTypes';
import { useAuthStore } from '../../core/auth/authStore';
import { nombreCompleto } from '../../core/auth/types';
import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { TextField } from '../../shared/components/TextField';
import { SoporteRepository } from './soporteRepository';

/** Misma lista que PublicoController::TIPOS_SOPORTE; se usa si no se pudo descargar del servidor. */
const TIPOS_RESPALDO: Record<string, string> = {
  acceso: 'No puedo ingresar a mi cuenta',
  clases: 'Clases y agenda',
  pagos: 'Pagos',
  documentos: 'Documentos y constancias',
  app: 'Problema con la app móvil',
  datos: 'Mis datos personales / eliminar cuenta',
  otro: 'Otro',
};

export function SoporteScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: tipos } = useApiQuery(() => SoporteRepository.tipos());

  const [tipo, setTipo] = useState('');
  const [nombre, setNombre] = useState(user ? nombreCompleto(user) : '');
  const [correo, setCorreo] = useState(user?.correo ?? '');
  const [rut, setRut] = useState(user?.rut ?? '');
  const [telefono, setTelefono] = useState(user?.telefono ?? '');
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ticket, setTicket] = useState<string | null>(null);

  const enviar = async () => {
    const e: Record<string, string> = {};
    if (!tipo) e.tipo = 'Elige el tipo de consulta.';
    if (nombre.trim().length < 3) e.nombre = 'Escribe tu nombre.';
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) e.correo = 'Correo no válido.';
    if (mensaje.trim().length < 10) e.mensaje = 'Cuéntanos un poco más (mínimo 10 caracteres).';
    setErrores(e);
    if (Object.keys(e).length) return;

    try {
      const r = await SoporteRepository.enviar({
        tipo,
        nombre: nombre.trim(),
        correo: correo.trim(),
        mensaje: mensaje.trim(),
        rut: rut.trim() || undefined,
        telefono: telefono.trim() || undefined,
      });
      setTicket(r.ticket);
    } catch (err) {
      if (err instanceof ApiException && err.errors) {
        setErrores(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, String(v)])));
      } else {
        setErrores({ general: friendlyErrorMessage(err) });
      }
    }
  };

  if (ticket) {
    return (
      <View style={styles.okContainer}>
        <Ionicons name="checkmark-circle" size={64} color={AppColors.success} />
        <Text style={styles.okTitulo}>¡Recibimos tu solicitud!</Text>
        <Text style={styles.okTexto}>Tu número de solicitud es</Text>
        <Text style={styles.ticket}>{ticket}</Text>
        <Text style={styles.okTexto}>Te enviamos una confirmación a {correo.trim()} y te responderemos a ese correo.</Text>
        <View style={styles.okBoton}>
          <Button label="Volver" onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Cuéntanos qué necesitas y te responderemos por correo.</Text>

        <Text style={styles.label}>¿Sobre qué es tu consulta?</Text>
        <View style={styles.tipos}>
          {Object.entries(tipos ?? TIPOS_RESPALDO).map(([clave, etiqueta]) => {
            const sel = tipo === clave;
            return (
              <TouchableOpacity key={clave} style={[styles.tipo, sel && styles.tipoSel]} onPress={() => setTipo(clave)}>
                <Text style={[styles.tipoTexto, sel && styles.tipoTextoSel]}>{etiqueta}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errores.tipo ? <Text style={styles.error}>{errores.tipo}</Text> : null}

        <View style={styles.form}>
          <TextField label="Nombre" value={nombre} onChangeText={setNombre} error={errores.nombre} />
          <TextField label="Correo" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" error={errores.correo} />
          <TextField label="RUT (opcional)" value={rut} onChangeText={setRut} autoCapitalize="none" />
          <TextField label="Teléfono (opcional)" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <TextField
            label="Mensaje"
            value={mensaje}
            onChangeText={setMensaje}
            multiline
            style={styles.mensaje}
            maxLength={3000}
            error={errores.mensaje}
          />
        </View>

        {errores.general ? <Text style={styles.error}>{errores.general}</Text> : null}
        <Button label="Enviar solicitud" onPress={enviar} icon={<Ionicons name="send" size={18} color="#FFFFFF" />} />

        <Card style={styles.contacto}>
          <Text style={styles.contactoTitulo}>¿Prefieres hablar con nosotros?</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:+56432663533')}>
            <Text style={styles.link}>(43) 266 3533</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:contacto@ortecap.cl')}>
            <Text style={styles.link}>contacto@ortecap.cl</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingBottom: 40 },
  intro: { color: AppColors.textSecondary, marginBottom: 16 },
  label: { color: AppColors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipo: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border },
  tipoSel: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  tipoTexto: { fontSize: 13, color: AppColors.textPrimary },
  tipoTextoSel: { color: '#FFFFFF', fontWeight: '700' },
  form: { marginTop: 16 },
  mensaje: { minHeight: 120, textAlignVertical: 'top' },
  error: { color: AppColors.danger, fontSize: 12, marginTop: 6, marginBottom: 6 },
  contacto: { marginTop: 24, alignItems: 'center', gap: 6 },
  contactoTitulo: { fontWeight: '700', color: AppColors.textPrimary },
  link: { color: AppColors.primary, fontWeight: '600' },
  okContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: AppColors.background },
  okTitulo: { fontSize: 20, fontWeight: '800', color: AppColors.textPrimary, marginTop: 12 },
  okTexto: { color: AppColors.textSecondary, textAlign: 'center', marginTop: 8 },
  ticket: { fontSize: 22, fontWeight: '800', color: AppColors.primary, marginTop: 4, letterSpacing: 1 },
  okBoton: { marginTop: 24, alignSelf: 'stretch' },
});
