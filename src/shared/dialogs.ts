import { ActionSheetIOS, Alert } from 'react-native';

/**
 * Menú de opciones nativo de iOS (ActionSheetIOS), usado en vez de un
 * bottom sheet propio como en la versión Flutter multiplataforma.
 * Devuelve el índice elegido, o null si se canceló.
 */
export function showOptionsActionSheet(params: { title?: string; options: string[]; destructiveIndex?: number }): Promise<number | null> {
  const { title, options, destructiveIndex } = params;
  return new Promise((resolve) => {
    const allOptions = [...options, 'Cancelar'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: allOptions,
        cancelButtonIndex: allOptions.length - 1,
        destructiveButtonIndex: destructiveIndex,
      },
      (buttonIndex) => resolve(buttonIndex === allOptions.length - 1 ? null : buttonIndex),
    );
  });
}

/**
 * Pide un texto corto (ej. "motivo de rechazo"). Usa Alert.prompt, nativo
 * de iOS — la app es exclusiva para iPhone, así que no hace falta un
 * bottom sheet propio como en la versión Flutter multiplataforma.
 */
export function showTextInputPrompt(params: { title: string; message?: string; placeholder?: string }): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.prompt(
      params.title,
      params.message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Enviar', onPress: (text?: string) => resolve(text?.trim() || null) },
      ],
      'plain-text',
      undefined,
      'default',
    );
  });
}

/** Equivalente a showConfirmDialog() de la app Flutter. */
export function showConfirmDialog(params: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}): Promise<boolean> {
  const { title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = params;
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
