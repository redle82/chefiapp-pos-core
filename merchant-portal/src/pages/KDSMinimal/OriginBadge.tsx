/**
 * ORIGIN BADGE — FASE 3
 * 
 * Componente visual para exibir origem do pedido.
 * 
 * REGRAS:
 * - Mapear origens: TPV, WEB, GARÇOM, QR_MESA
 * - Exibir cor e ícone distintos
 * - Sem estilo complexo (apenas cores básicas)
 */

import type { OrderOrigin } from '../../core/contracts';

interface OriginBadgeProps {
  origin: OrderOrigin | string | null | undefined;
}

export function OriginBadge({ origin }: OriginBadgeProps) {
  // Normalizar origem (pode vir do sync_metadata)
  const normalizedOrigin = origin?.toUpperCase() || 'CAIXA';

  // Mapeamento de origem para cor e ícone
  const originMap: Record<string, { color: string; icon: string; label: string }> = {
    'CAIXA': { color: '#22c55e', icon: '💰', label: 'CAIXA' },
    'TPV': { color: '#22c55e', icon: '💰', label: 'CAIXA' },
    'WEB': { color: '#f97316', icon: '🌐', label: 'WEB' },
    'WEB_PUBLIC': { color: '#f97316', icon: '🌐', label: 'WEB' },
    'GARÇOM': { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    'GARCOM': { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    'MOBILE': { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    'APPSTAFF': { color: '#8b5cf6', icon: '👤', label: 'APPSTAFF' },
    'QR_MESA': { color: '#ec4899', icon: '📋', label: 'QR MESA' },
    'QRMESA': { color: '#ec4899', icon: '📋', label: 'QR MESA' },
  };

  const originInfo = originMap[normalizedOrigin] || originMap['CAIXA'];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        backgroundColor: originInfo.color,
        color: '#fff',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        marginLeft: '8px',
      }}
    >
      {originInfo.icon} {originInfo.label}
    </span>
  );
}
