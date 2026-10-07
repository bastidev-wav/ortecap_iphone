import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { useAuthStore } from '../../core/auth/authStore';
import { friendlyErrorMessage } from '../../core/hooks/useApiQuery';
import { AppColors, Radii } from '../../core/theme/colors';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { SectionHeader } from '../../shared/components/CommonWidgets';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { SegmentedControl } from '../../shared/components/SegmentedControl';
import { Select } from '../../shared/components/Select';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { showTextInputPrompt } from '../../shared/dialogs';
import { AdminRepository } from './adminRepository';

type Modo = 'todos' | 'sin_ingresar' | 'uno';
const MODOS: Modo[] = ['todos', 'sin_ingresar', 'uno'];
const TAMANO_LOTE = 10;

type Fila = Record<string, unknown>;

/** Texto plano → HTML simple (párrafos y saltos de línea), escapando lo que escriba el usuario. */
function textoAHtml(texto: string): string {
  const esc = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function AdminCorreosScreen() {
  const miCorreo = useAuthStore((s) => s.user?.correo ?? '');
  const [modo, setModo] = useState<Modo>('todos');
  const [cursos, setCursos] = useState<Fila[]>([]);
  const [localidades, setLocalidades] = useState<Fila[]>([]);
  const [cursoId, setCursoId] = useState('');
  const [localidadId, setLocalidadId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Fila[]>([]);
  const [alumnoUno, setAlumnoUno] = useState<Fila | null>(null);
  const [destinatarios, setDestinatarios] = useState<Fila[] | null>(null);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<{ enviados: number; fallidos: number; total: number } | null>(null);
  const detener = useRef(false);

  useEffect(() => {
    AdminRepository.matrizPrecios()
      .then((d) => {
        setCursos((d.cursos as Fila[]) ?? []);
        setLocalidades((d.localidades as Fila[]) ?? []);
      })
      .catch(() => {});
  }, []);

  // Recalcula la lista de destinatarios cada vez que cambian los filtros.
  useEffect(() => {
    setDestinatarios(null);
    if (modo === 'uno' && !alumnoUno) return;
    let cancelado = false;
    AdminRepository.destinatariosCorreo({
      modo,
      rut: modo === 'uno' ? String(alumnoUno?.rut ?? '') : undefined,
      cursoId: modo !== 'uno' ? cursoId : undefined,
      localidadId: modo !== 'uno' ? localidadId : undefined,
    })
      .then((d) => {
        if (!cancelado) setDestinatarios((d.destinatarios as Fila[]) ?? []);
      })
      .catch((e) => !cancelado && showToast(friendlyErrorMessage(e), true));
    return () => {
      cancelado = true;
    };
  }, [modo, cursoId, localidadId, alumnoUno]);

  useEffect(() => {
    if (modo !== 'uno' || busqueda.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(() => {
      AdminRepository.buscarAlumnoCorreo(busqueda.trim())
        .then(setResultados)
        .catch(() => setResultados([]));
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda, modo]);

  const validar = () => {
    if (!asunto.trim() || !mensaje.trim()) {
      showToast('Escribe el asunto y el mensaje.', true);
      return false;
    }
    return true;
  };

  const verPrevia = async () => {
    if (!validar()) return;
    try {
      setPreview(await AdminRepository.previsualizarCorreo(asunto.trim(), textoAHtml(mensaje.trim())));
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const enviarPrueba = async () => {
    if (!validar()) return;
    const destino = miCorreo || (await showTextInputPrompt({ title: 'Correo de prueba', message: '¿A qué correo envío la prueba?' }));
    if (!destino) return;
    try {
      const r = await AdminRepository.enviarLoteCorreo({ asunto: asunto.trim(), cuerpoHtml: textoAHtml(mensaje.trim()), pruebaA: destino });
      showToast(Number(r.enviados) > 0 ? `Prueba enviada a ${destino}.` : 'El servidor de correo rechazó la prueba.', Number(r.enviados) === 0);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  const enviarTodos = () => {
    if (!validar() || !destinatarios?.length) return;
    Alert.alert(
      'Enviar correo',
      `Se enviará un correo individual a ${destinatarios.length} alumno${destinatarios.length === 1 ? '' : 's'}. Nadie verá las direcciones de los demás.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => void ejecutarEnvio(destinatarios) },
      ],
    );
  };

  const ejecutarEnvio = async (lista: Fila[]) => {
    detener.current = false;
    const ruts = lista.map((d) => String(d.rut));
    let enviados = 0;
    let fallidos = 0;
    setProgreso({ enviados, fallidos, total: ruts.length });
    for (let i = 0; i < ruts.length; i += TAMANO_LOTE) {
      if (detener.current) break;
      try {
        const r = await AdminRepository.enviarLoteCorreo({
          asunto: asunto.trim(),
          cuerpoHtml: textoAHtml(mensaje.trim()),
          ruts: ruts.slice(i, i + TAMANO_LOTE),
        });
        enviados += Number(r.enviados ?? 0);
        fallidos += Number(r.fallidos ?? 0);
      } catch {
        fallidos += Math.min(TAMANO_LOTE, ruts.length - i);
      }
      setProgreso({ enviados, fallidos, total: ruts.length });
    }
    Alert.alert(
      detener.current ? 'Envío detenido' : 'Envío terminado',
      `Enviados: ${enviados}${fallidos ? `\nNo enviados: ${fallidos}` : ''}`,
      [{ text: 'OK', onPress: () => setProgreso(null) }],
    );
  };

  const enviando = progreso !== null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionHeader title="Destinatarios" />
        <SegmentedControl
          options={['Todos', 'Nunca ingresaron', 'Un alumno']}
          selectedIndex={MODOS.indexOf(modo)}
          onChange={(i) => {
            setModo(MODOS[i]);
            setAlumnoUno(null);
          }}
        />

        {modo === 'uno' ? (
          <>
            {alumnoUno ? (
              <Card style={styles.elegido}>
                <Ionicons name="person-circle-outline" size={24} color={AppColors.primary} />
                <View style={styles.flex1}>
                  <Text style={styles.elegidoNombre}>
                    {String(alumnoUno.nombres ?? '')} {String(alumnoUno.apellidos ?? '')}
                  </Text>
                  <Text style={styles.elegidoCorreo}>{String(alumnoUno.correo ?? 'Sin correo')}</Text>
                </View>
                <TouchableOpacity onPress={() => setAlumnoUno(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </Card>
            ) : (
              <>
                <TextInput
                  style={styles.buscar}
                  placeholder="Buscar por nombre, RUT o correo"
                  placeholderTextColor={AppColors.textSecondary}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  autoCapitalize="none"
                />
                {resultados.map((a) => (
                  <TouchableOpacity
                    key={String(a.rut)}
                    style={styles.resultado}
                    onPress={() => {
                      setAlumnoUno(a);
                      setBusqueda('');
                    }}
                  >
                    <Text style={styles.resultadoNombre}>
                      {String(a.nombres ?? '')} {String(a.apellidos ?? '')}
                    </Text>
                    <Text style={styles.resultadoCorreo}>{String(a.correo ?? 'Sin correo')}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        ) : (
          <View style={styles.filtros}>
            <View style={styles.flex1}>
              <Select
                label="Curso"
                value={cursoId}
                options={[{ label: 'Todos los cursos', value: '' }, ...cursos.map((c) => ({ label: String(c.nombre), value: String(c.id) }))]}
                onChange={setCursoId}
              />
            </View>
            <View style={styles.flex1}>
              <Select
                label="Comuna"
                value={localidadId}
                options={[{ label: 'Todas', value: '' }, ...localidades.map((l) => ({ label: String(l.nombre), value: String(l.id) }))]}
                onChange={setLocalidadId}
              />
            </View>
          </View>
        )}

        <Text style={styles.contador}>
          {destinatarios === null
            ? modo === 'uno' && !alumnoUno
              ? 'Busca y elige un alumno.'
              : 'Calculando destinatarios…'
            : `${destinatarios.length} destinatario${destinatarios.length === 1 ? '' : 's'} con correo válido`}
        </Text>

        <SectionHeader title="Mensaje" />
        <TextField label="Asunto" value={asunto} onChangeText={setAsunto} />
        <TextField label="Mensaje" value={mensaje} onChangeText={setMensaje} multiline style={styles.mensaje} />
        <Text style={styles.ayuda}>
          Escribe {'{{nombre}}'} para el primer nombre del alumno o {'{{nombre_completo}}'} para su nombre completo.
        </Text>

        {enviando ? (
          <Card style={styles.progresoCard}>
            <Text style={styles.progresoTexto}>
              Enviando… {progreso.enviados + progreso.fallidos} de {progreso.total}
              {progreso.fallidos ? ` (${progreso.fallidos} con error)` : ''}
            </Text>
            <ProgressBar value={(progreso.enviados + progreso.fallidos) / Math.max(1, progreso.total)} color={AppColors.primary} />
            <Button
              label="Detener"
              variant="text"
              destructive
              onPress={() => {
                detener.current = true;
              }}
            />
          </Card>
        ) : (
          <View style={styles.botones}>
            <Button
              label={`Enviar a ${destinatarios?.length ?? 0} alumno${destinatarios?.length === 1 ? '' : 's'}`}
              onPress={enviarTodos}
              disabled={!destinatarios?.length}
              icon={<Ionicons name="send" size={18} color="#FFFFFF" />}
            />
            <Button label="Vista previa" variant="outline" onPress={verPrevia} icon={<Ionicons name="eye-outline" size={18} color={AppColors.primary} />} />
            <Button label={miCorreo ? `Enviarme una prueba (${miCorreo})` : 'Enviarme una prueba'} variant="text" onPress={enviarPrueba} />
          </View>
        )}
      </ScrollView>

      <Modal visible={preview !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPreview(null)}>
        <SafeAreaView style={styles.flex} edges={['bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vista previa</Text>
            <TouchableOpacity onPress={() => setPreview(null)}>
              <Text style={styles.close}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          {preview ? <WebView originWhitelist={['*']} source={{ html: preview, baseUrl: 'https://ortecap.cl/' }} /> : null}
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  filtros: { flexDirection: 'row', gap: 8 },
  contador: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600' },
  buscar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  resultado: { paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  resultadoNombre: { fontWeight: '700', color: AppColors.textPrimary },
  resultadoCorreo: { fontSize: 12, color: AppColors.textSecondary },
  elegido: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  elegidoNombre: { fontWeight: '700', color: AppColors.textPrimary },
  elegidoCorreo: { fontSize: 12, color: AppColors.textSecondary },
  mensaje: { minHeight: 160, textAlignVertical: 'top' },
  ayuda: { color: AppColors.textSecondary, fontSize: 12, marginTop: -8, marginBottom: 16 },
  botones: { gap: 10 },
  progresoCard: { gap: 10 },
  progresoTexto: { fontWeight: '700', color: AppColors.textPrimary },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  modalTitle: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
});
