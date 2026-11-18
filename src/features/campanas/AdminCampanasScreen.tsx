import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { friendlyErrorMessage, useApiQuery } from '../../core/hooks/useApiQuery';
import { useRefetchOnFocus } from '../../core/hooks/useRefetchOnFocus';
import { AppColors, Radii } from '../../core/theme/colors';
import { formatFecha } from '../../core/utils/formatters';
import { AsyncGate } from '../../shared/components/AsyncGate';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { EmptyView } from '../../shared/components/StateViews';
import { TextField } from '../../shared/components/TextField';
import { showToast } from '../../shared/components/Toast';
import { CampanasRepository } from './campanasRepository';

/**
 * Campañas de marketing por WhatsApp: se importa una lista de contactos (CSV) y se les envía
 * una plantilla aprobada por Meta, de a lotes pequeños.
 */
export function AdminCampanasScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(() => CampanasRepository.campanas());
  const [nuevaVisible, setNuevaVisible] = useState(false);
  useRefetchOnFocus(refetch);

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => setNuevaVisible(true)} hitSlop={12} accessibilityLabel="Nueva campaña">
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <AsyncGate loading={loading} error={error} data={data} onRetry={refetch}>
        {(campanas) => (
          <FlatList
            data={campanas}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            ListEmptyComponent={
              <EmptyView
                icon="megaphone-outline"
                message="Todavía no hay campañas. Crea una con una lista de contactos en CSV."
                action={<Button label="Nueva campaña" fullWidth={false} onPress={() => setNuevaVisible(true)} />}
              />
            }
            renderItem={({ item: c }) => {
              const total = Number(c.total ?? 0);
              const enviados = Number(c.enviados ?? 0);
              const pendientes = Number(c.pendientes ?? 0);
              const fallidos = Number(c.fallidos ?? 0);
              return (
                <TouchableOpacity onPress={() => router.push(`/admin/campanas-whatsapp/${c.id}`)}>
                  <Card>
                    <Text style={styles.nombre}>{String(c.nombre ?? '')}</Text>
                    <Text style={styles.plantilla}>
                      Plantilla: {String(c.plantilla_meta ?? '')} · {formatFecha(String(c.creado_at ?? ''))}
                    </Text>
                    <View style={styles.barra}>
                      <ProgressBar value={total === 0 ? 0 : enviados / total} />
                    </View>
                    <Text style={[styles.conteo, fallidos > 0 && { color: AppColors.danger }]}>
                      {enviados} enviados · {pendientes} pendientes{fallidos > 0 ? ` · ${fallidos} fallidos` : ''} (de {total})
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </AsyncGate>

      <NuevaCampanaModal
        visible={nuevaVisible}
        onClose={() => setNuevaVisible(false)}
        onCreada={(id) => {
          setNuevaVisible(false);
          router.push(`/admin/campanas-whatsapp/${id}`);
        }}
      />
    </View>
  );
}

function NuevaCampanaModal({ visible, onClose, onCreada }: { visible: boolean; onClose: () => void; onCreada: (id: number) => void }) {
  const [nombre, setNombre] = useState('');
  const [plantilla, setPlantilla] = useState('');
  const [archivo, setArchivo] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);

  const elegirArchivo = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain'], copyToCacheDirectory: true });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    if (!a.name.toLowerCase().endsWith('.csv')) {
      showToast('Elige un archivo .csv (en Excel: Guardar como > CSV UTF-8).', true);
      return;
    }
    setArchivo({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'text/csv' });
  };

  const crear = async () => {
    if (!nombre.trim() || !plantilla.trim()) {
      showToast('Escribe el nombre de la campaña y el nombre exacto de la plantilla.', true);
      return;
    }
    if (!archivo) {
      showToast('Elige el archivo .csv con los contactos.', true);
      return;
    }
    try {
      const r = await CampanasRepository.importar({ nombre: nombre.trim(), plantilla: plantilla.trim(), csv: archivo });
      showToast(r.mensaje);
      setNombre('');
      setPlantilla('');
      setArchivo(null);
      onCreada(r.id);
    } catch (e) {
      showToast(friendlyErrorMessage(e), true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Nueva campaña</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TextField label="Nombre de la campaña" value={nombre} onChangeText={setNombre} />
            <TextField label="Plantilla de Meta" autoCapitalize="none" autoCorrect={false} value={plantilla} onChangeText={setPlantilla} />
            <Text style={styles.ayuda}>El nombre exacto de la plantilla aprobada en Meta.</Text>

            <TouchableOpacity style={styles.archivo} onPress={elegirArchivo}>
              <Ionicons name={archivo ? 'document-text' : 'cloud-upload-outline'} size={20} color={AppColors.primary} />
              <Text style={styles.archivoTexto} numberOfLines={1}>
                {archivo?.name ?? 'Elegir archivo CSV de contactos'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.ayuda}>
              El archivo debe traer columnas "Nombre" y "Teléfono" (opcional "Licencia previa"). En Excel: Guardar como &gt; CSV UTF-8. Crear la
              campaña no envía nada: los mensajes se envían después, de a lotes. Cada mensaje de marketing tiene costo y solo debe enviarse a
              personas que aceptaron recibir mensajes de Ortecap.
            </Text>

            <Button label="Crear campaña" onPress={crear} icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  listContent: { padding: 12, gap: 8, flexGrow: 1 },
  nombre: { fontWeight: '800', fontSize: 15, color: AppColors.textPrimary },
  plantilla: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  barra: { marginTop: 10, marginBottom: 6 },
  conteo: { fontSize: 12.5, color: AppColors.textSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  title: { fontSize: 17, fontWeight: '800', color: AppColors.textPrimary },
  close: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  ayuda: { fontSize: 12, color: AppColors.textSecondary, marginTop: -8, marginBottom: 16 },
  archivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderStyle: 'dashed',
    borderRadius: Radii.md,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  archivoTexto: { flex: 1, color: AppColors.primary, fontWeight: '600' },
});
