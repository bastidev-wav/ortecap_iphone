import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '../../core/theme/colors';
import { Button } from './Button';

export function LoadingView({ message }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={AppColors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color={AppColors.danger} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.retryButton}>
          <Button label="Reintentar" variant="outline" onPress={onRetry} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyView({
  message,
  icon = 'file-tray-outline',
  action,
}: {
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={AppColors.textSecondary} />
      <Text style={styles.message}>{message}</Text>
      {action ? <View style={styles.retryButton}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: AppColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
  },
});
