import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { useAuthStore } from '../../core/auth/authStore';

export function HeaderLogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <TouchableOpacity onPress={() => logout()} hitSlop={12} style={{ marginRight: 4 }}>
      <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );
}
