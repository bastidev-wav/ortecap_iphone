import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { AppColors, Radii } from '../../core/theme/colors';

interface ToastState {
  message: string | null;
  isError: boolean;
  show: (message: string, isError?: boolean) => void;
  hide: () => void;
}

let hideTimeout: ReturnType<typeof setTimeout> | null = null;

const useToastStore = create<ToastState>((set) => ({
  message: null,
  isError: false,
  show: (message, isError = false) => {
    if (hideTimeout) clearTimeout(hideTimeout);
    set({ message, isError });
    hideTimeout = setTimeout(() => set({ message: null }), 3000);
  },
  hide: () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    set({ message: null });
  },
}));

/** Equivalente a showAppSnackBar() de la app Flutter. */
export function showToast(message: string, isError = false) {
  useToastStore.getState().show(message, isError);
}

/** Se monta una sola vez en el layout raíz. */
export function ToastHost() {
  const { message, isError } = useToastStore();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: message ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [message, opacity]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          bottom: insets.bottom + 24,
          backgroundColor: isError ? AppColors.danger : AppColors.slate,
          opacity,
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
