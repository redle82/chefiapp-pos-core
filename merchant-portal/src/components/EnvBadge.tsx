/**
 * Environment Badge Component
 * Shows current environment to prevent human error
 */

import React from 'react';

const ENV = import.meta.env.VITE_ENV || 'unknown';
const SHOW_BADGE = import.meta.env.VITE_SHOW_ENV_BADGE === 'true';

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
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        padding: '4px 8px',
        borderRadius: 4,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        zIndex: 9999,
        opacity: 0.9,
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  );
}

export default EnvBadge;
