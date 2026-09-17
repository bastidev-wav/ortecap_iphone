import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppColors, Radii } from '../../core/theme/colors';

export interface ChatMessage {
  texto: string;
  esMio: boolean;
}

interface ChatViewProps {
  mensajes: ChatMessage[];
  onSend: (texto: string) => Promise<void>;
  emptyMessage?: string;
}

export function ChatView({ mensajes, onSend, emptyMessage = 'Aún no hay mensajes. Escribe el primero.' }: ChatViewProps) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<FlatList>(null);

  const enviar = async () => {
    const trimmed = texto.trim();
    if (!trimmed || enviando) return;
    setEnviando(true);
    setTexto('');
    try {
      await onSend(trimmed);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {mensajes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={mensajes}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.esMio ? styles.bubbleRowMio : styles.bubbleRowOtro]}>
              <View style={[styles.bubble, item.esMio ? styles.bubbleMio : styles.bubbleOtro]}>
                <Text style={item.esMio ? styles.bubbleTextMio : styles.bubbleTextOtro}>{item.texto}</Text>
              </View>
            </View>
          )}
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={AppColors.textSecondary}
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={enviar}
        />
        <TouchableOpacity style={styles.sendButton} onPress={enviar} disabled={enviando}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  flex1: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: AppColors.textSecondary, textAlign: 'center' },
  listContent: { padding: 12 },
  bubbleRow: { flexDirection: 'row', marginVertical: 4 },
  bubbleRowMio: { justifyContent: 'flex-end' },
  bubbleRowOtro: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: Radii.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMio: { backgroundColor: AppColors.primary },
  bubbleOtro: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AppColors.border },
  bubbleTextMio: { color: '#FFFFFF', fontSize: 14 },
  bubbleTextOtro: { color: AppColors.textPrimary, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: AppColors.border, backgroundColor: '#FFFFFF' },
  input: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  sendButton: { backgroundColor: AppColors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
