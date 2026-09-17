import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';

import { AppColors, Radii } from '../../core/theme/colors';

export interface SignatureCaptureHandle {
  /** Devuelve la firma como data URI PNG base64, o null si está vacía. */
  obtenerFirmaBase64: () => Promise<string | null>;
}

interface SignatureCaptureFieldProps {
  label: string;
}

/**
 * Campo de firma digital: un recuadro donde la persona dibuja su firma con
 * el dedo. Expone obtenerFirmaBase64() vía ref, igual que
 * SignatureCaptureField de la app Flutter.
 */
export const SignatureCaptureField = forwardRef<SignatureCaptureHandle, SignatureCaptureFieldProps>(({ label }, ref) => {
  const sigRef = useRef<SignatureViewRef>(null);
  const resolverRef = useRef<((value: string | null) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    obtenerFirmaBase64: () =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        sigRef.current?.readSignature();
      }),
  }));

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity onPress={() => sigRef.current?.clearSignature()}>
          <Text style={styles.clear}>Limpiar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.canvas}>
        <SignatureScreen
          ref={sigRef}
          onOK={(signature) => {
            resolverRef.current?.(signature);
            resolverRef.current = null;
          }}
          onEmpty={() => {
            resolverRef.current?.(null);
            resolverRef.current = null;
          }}
          autoClear={false}
          descriptionText=""
          webStyle=".m-signature-pad--footer { display: none; margin: 0; } .m-signature-pad { box-shadow: none; border: none; }"
        />
      </View>
    </View>
  );
});

SignatureCaptureField.displayName = 'SignatureCaptureField';

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontWeight: '700', fontSize: 13, color: AppColors.textPrimary },
  clear: { color: AppColors.primary, fontWeight: '600', fontSize: 13 },
  canvas: { height: 160, borderWidth: 1, borderColor: AppColors.border, borderRadius: Radii.md, overflow: 'hidden', backgroundColor: '#FFFFFF' },
});
