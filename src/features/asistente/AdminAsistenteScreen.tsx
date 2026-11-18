import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppColors } from '../../core/theme/colors';
import { FiltroChips } from '../../shared/components/FiltroChips';
import { AsistenteComentariosTab } from './AsistenteComentariosTab';
import { AsistenteConocimientoTab } from './AsistenteConocimientoTab';
import { AsistenteConversacionesTab } from './AsistenteConversacionesTab';
import { AsistenteProbarTab } from './AsistenteProbarTab';

const PESTANAS = [
  { valor: 'conversaciones', etiqueta: 'Conversaciones' },
  { valor: 'comentarios', etiqueta: 'Comentarios' },
  { valor: 'conocimiento', etiqueta: 'Conocimiento' },
  { valor: 'probar', etiqueta: 'Probar el bot' },
];

/**
 * Asistente RRSS: el bot con IA que responde por WhatsApp, Messenger e Instagram.
 * Cuatro pestañas, igual que el panel web. Cada pestaña se carga la primera vez que se abre y
 * después se mantiene (así el chat de prueba no se pierde al cambiar de pestaña).
 */
export function AdminAsistenteScreen() {
  const [pestana, setPestana] = useState('conversaciones');
  const [abiertas, setAbiertas] = useState<string[]>(['conversaciones']);

  const cambiar = (p: string) => {
    setPestana(p);
    setAbiertas((a) => (a.includes(p) ? a : [...a, p]));
  };

  const panel = (clave: string, contenido: React.ReactNode) =>
    abiertas.includes(clave) ? (
      <View key={clave} style={[styles.flex, pestana !== clave && styles.oculto]}>
        {contenido}
      </View>
    ) : null;

  return (
    <View style={styles.flex}>
      <View style={styles.pestanas}>
        <FiltroChips opciones={PESTANAS} seleccionado={pestana} onChange={cambiar} />
      </View>
      {panel('conversaciones', <AsistenteConversacionesTab activo={pestana === 'conversaciones'} />)}
      {panel('comentarios', <AsistenteComentariosTab />)}
      {panel('conocimiento', <AsistenteConocimientoTab />)}
      {panel('probar', <AsistenteProbarTab />)}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  oculto: { display: 'none' },
  pestanas: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: AppColors.border },
});
