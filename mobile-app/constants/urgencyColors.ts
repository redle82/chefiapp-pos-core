/**
 * Urgency Colors - Paleta de cores operacional
 * 
 * ERRO-008 Fix: Identidade visual operacional consistente
 * 
 * Sistema de cores baseado em urgência:
 * - Critical: Vermelho (#ff3b30) - Ação imediata necessária
 * - Warning: Amarelo (#ffd60a) - Atenção necessária
 * - Normal: Verde (#32d74b) - Tudo OK
 * - Info: Azul (#0a84ff) - Informativo
 */

export const UrgencyColors = {
  // Cores principais
  critical: {
    primary: '#ff3b30',
    background: '#2a1010',
    border: '#ff3b30',
    text: '#ff8888',
    icon: '#ff4444',
  },
  warning: {
    primary: '#ffd60a',
    background: '#2a2510',
    border: '#ffd60a',
    text: '#ffdd44',
    icon: '#ffcc00',
  },
  normal: {
    primary: '#32d74b',
    background: '#1a1a1a',
    border: '#333',
    text: '#888',
    icon: '#32d74b',
  },
  info: {
    primary: '#0a84ff',
    background: '#1a1a1a',
    border: '#0a84ff',
    text: '#4da6ff',
    icon: '#0a84ff',
  },
  // Cores de status
  status: {
    free: '#32d74b',
    occupied: '#5856d6',
    waiting: '#ffd60a',
    ready: '#ff9f0a',
    paid: '#32d74b',
  },
} as const;

export type UrgencyLevel = 'critical' | 'warning' | 'normal' | 'info';

/**
 * Função helper para obter cor baseada em urgência
 */
export function getUrgencyColor(level: UrgencyLevel) {
  return UrgencyColors[level];
}

/**
 * Função helper para determinar urgência baseada em tempo
 */
export function getUrgencyByTime(minutes: number): UrgencyLevel {
  if (minutes > 20) return 'critical';
  if (minutes > 10) return 'warning';
  return 'normal';
}
