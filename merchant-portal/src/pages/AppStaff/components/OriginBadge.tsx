/**
 * ORIGIN BADGE — AppStaff Local
 * 
 * FASE 3.3: Limpeza de Imports Cruzados
 * 
 * Versão local do OriginBadge para AppStaff.
 * Não depende de KDSMinimal.
 */

import type { OrderOrigin } from '../../../core/contracts';

interface OriginBadgeProps {
  origin: OrderOrigin | string | null | undefined;
}

export function OriginBadge({ origin }: OriginBadgeProps) {
  // Normalizar origem (pode vir do sync_metadata)
  const normalizedOrigin = origin?.toUpperCase() || 'CAIXA';

  // Convenção: docs/architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md — origem ≠ só garçom
  const originMap: Record<string, { color: string; icon: string; label: string }> = {
    'CAIXA': { color: '#22c55e', icon: '💰', label: 'CAIXA' },
    'TPV': { color: '#22c55e', icon: '💰', label: 'CAIXA' },
    'WEB': { color: '#f97316', icon: '🌐', label: 'WEB' },
    'WEB_PUBLIC': { color: '#f97316', icon: '🌐', label: 'WEB' },
    'GARÇOM': { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    'GARCOM': { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    'MOBILE': { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    'APPSTAFF': { color: '#3b82f6', icon: '📱', label: 'SALÃO' },
    'APPSTAFF_MANAGER': { color: '#8b5cf6', icon: '👔', label: 'GERENTE' },
    'APPSTAFF_OWNER': { color: '#a855f7', icon: '👤', label: 'DONO' },
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
