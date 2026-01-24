/**
 * Environment Badge Component
 * Shows current environment to prevent human error
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ENV = process.env.EXPO_PUBLIC_ENV || 'unknown';
const SHOW_BADGE = process.env.EXPO_PUBLIC_SHOW_ENV_BADGE === 'true';

const ENV_COLORS: Record<string, { bg: string; text: string }> = {
  'stress-local': { bg: '#FFA500', text: '#000' },
  'development': { bg: '#4CAF50', text: '#FFF' },
  'staging': { bg: '#2196F3', text: '#FFF' },
  'production': { bg: '#F44336', text: '#FFF' },
  'unknown': { bg: '#9E9E9E', text: '#FFF' },
};

const ENV_LABELS: Record<string, string> = {
  'stress-local': '🧪 STRESS LOCAL',
  'development': '🔧 DEV',
  'staging': '🚧 STAGING',
  'production': '🔴 PROD',
  'unknown': '❓ UNKNOWN',
};

export function EnvBadge() {
  if (!SHOW_BADGE && ENV === 'production') {
    return null;
  }

  const colors = ENV_COLORS[ENV] || ENV_COLORS.unknown;
  const label = ENV_LABELS[ENV] || ENV;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 9999,
    opacity: 0.9,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});

export default EnvBadge;
