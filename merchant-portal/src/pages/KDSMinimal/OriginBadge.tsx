/**
 * ORIGIN BADGE — FASE 3
 *
 * Componente visual para exibir origem do pedido e quem fez (garçom, gerente, dono).
 * Contrato: docs/contracts/KDS_LAYOUT_UX_CONTRACT.md §7 — manter createdByRole e tableNumber; não remover mapeamento GERENTE/DONO/COZINHA.
 *
 * REGRAS:
 * - Mapear origens: TPV, WEB, GARÇOM, GERENTE, DONO, QR_MESA
 * - Exibir cor e ícone distintos; opcionalmente Mesa ou role para distinguir garçons
 */

import type { OrderOrigin } from '../../core/contracts';

interface OriginBadgeProps {
  origin: OrderOrigin | string | null | undefined;
  /** Role de quem criou (waiter, manager, owner, kitchen) — para distinguir "Garçom 1", "Gerente", etc. */
  createdByRole?: string | null;
  /** Número da mesa — usado para distinguir garçons (ex.: "GARÇOM · M3") */
  tableNumber?: number | string | null;
}

export function OriginBadge({
  origin,
  createdByRole,
  tableNumber,
}: OriginBadgeProps) {
  const normalizedOrigin = (origin ?? createdByRole ?? 'CAIXA')
    .toString()
    .toUpperCase()
    .replace(/\s/g, '');

  // Convenção: docs/architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md
  // APPSTAFF = salão/equipe (waiter); APPSTAFF_MANAGER = gerente; APPSTAFF_OWNER = dono
  const originMap: Record<string, { color: string; icon: string; label: string }> = {
    CAIXA: { color: '#22c55e', icon: '💰', label: 'CAIXA' },
    TPV: { color: '#22c55e', icon: '💰', label: 'CAIXA' },
    WEB: { color: '#f97316', icon: '🌐', label: 'WEB' },
    WEB_PUBLIC: { color: '#f97316', icon: '🌐', label: 'WEB' },
    GARÇOM: { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    GARCOM: { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    WAITER: { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    MOBILE: { color: '#3b82f6', icon: '📱', label: 'GARÇOM' },
    GERENTE: { color: '#8b5cf6', icon: '👔', label: 'GERENTE' },
    MANAGER: { color: '#8b5cf6', icon: '👔', label: 'GERENTE' },
    DONO: { color: '#a855f7', icon: '👤', label: 'DONO' },
    OWNER: { color: '#a855f7', icon: '👤', label: 'DONO' },
    COZINHA: { color: '#eab308', icon: '🍳', label: 'COZINHA' },
    KITCHEN: { color: '#eab308', icon: '🍳', label: 'COZINHA' },
    APPSTAFF: { color: '#3b82f6', icon: '📱', label: 'SALÃO' },
    APPSTAFF_MANAGER: { color: '#8b5cf6', icon: '👔', label: 'GERENTE' },
    APPSTAFF_OWNER: { color: '#a855f7', icon: '👤', label: 'DONO' },
    QR_MESA: { color: '#ec4899', icon: '📋', label: 'QR MESA' },
    QRMESA: { color: '#ec4899', icon: '📋', label: 'QR MESA' },
  };

  const originInfo = originMap[normalizedOrigin] || originMap['CAIXA'];

  const tableSuffix =
    tableNumber != null && String(tableNumber).trim() !== ''
      ? ` · M${tableNumber}`
      : '';

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
      {tableSuffix}
    </span>
  );
}
