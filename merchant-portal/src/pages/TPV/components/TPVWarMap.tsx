import React, { useMemo, memo } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { TPVExceptionPanel } from './TPVExceptionPanel';

/**
 * 🗺️ TPV War Map — Situational Awareness Panel
 * 
 * The main view after operator authentication. Shows STATES, not details.
 * 
 * Sectors:
 * - Mesas: Status (ocupada/livre/alerta) — NOT items in order
 * - Cozinha: Pressure level (low/med/high) — NOT recipes
 * - Delivery: Queue count — NOT order details
 * - Alertas: Exceptions only — NOT routine ops
 * 
 * Philosophy:
 * - Operator ALMOST NEVER touches
 * - Operator DECIDES WHEN to touch
 * - Voice commands for quick queries
 */

interface TableSummary {
    id: string;
    number: number;
    status: 'free' | 'occupied' | 'reserved' | 'alert';
}

interface OrderSummary {
    id: string;
    status: string;
    tableNumber?: number;
    isDelayed?: boolean;
    createdAt?: Date;
}

interface TPVWarMapProps {
    tables: TableSummary[];
    orders: OrderSummary[];
    kitchenPressure?: 'low' | 'medium' | 'high';
    deliveryQueueCount?: number;
    onSectorClick?: (sector: 'mesas' | 'cozinha' | 'delivery' | 'alertas') => void;
    operatorId?: string;
    operatorName?: string;
}

// Sector Card component
const SectorCard: React.FC<{
    title: string;
    icon: string;
    value: string | number;
    subtitle?: string;
    status?: 'normal' | 'warning' | 'critical';
    onClick?: () => void;
}> = ({ title, icon, value, subtitle, status = 'normal', onClick }) => {
    const statusColors = {
        normal: colors.success.base,
        warning: colors.warning.base,
        critical: colors.destructive.base,
    };

    return (
        <Card
            surface="layer1"
            padding="lg"
            hoverable={!!onClick}
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                border: `1px solid ${status !== 'normal' ? statusColors[status] : colors.border.subtle}`,
                transition: 'all 0.2s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                <div style={{
                    fontSize: '32px',
                    width: 56, height: 56,
                    borderRadius: '50%',
                    backgroundColor: colors.surface.layer2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <Text size="sm" color="tertiary" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {title}
                    </Text>
                    <Text size="2xl" weight="black" color={status !== 'normal' ? 'action' : 'primary'} style={{
                        color: status !== 'normal' ? statusColors[status] : undefined,
                    }}>
                        {value}
                    </Text>
                    {subtitle && (
                        <Text size="xs" color="tertiary">{subtitle}</Text>
                    )}
                </div>
                {status !== 'normal' && (
                    <div style={{
                        width: 12, height: 12,
                        borderRadius: '50%',
                        backgroundColor: statusColors[status],
                        animation: status === 'critical' ? 'pulse-alert 1s infinite' : undefined,
                    }} />
                )}
            </div>
        </Card>
    );
};

// FASE 5: Memoizar componente pesado para melhorar performance
export const TPVWarMap: React.FC<TPVWarMapProps> = memo(({
    tables,
    orders,
    kitchenPressure = 'low',
    deliveryQueueCount = 0,
    onSectorClick,
    operatorId,
    operatorName,
}) => {
    // Calculate aggregated states
    const mesasSummary = useMemo(() => {
        const occupied = tables.filter(t => t.status === 'occupied').length;
        const free = tables.filter(t => t.status === 'free').length;
        const alert = tables.filter(t => t.status === 'alert').length;
        return { occupied, free, alert, total: tables.length };
    }, [tables]);

    const cozinhaSummary = useMemo(() => {
        // Kitchen pressure based on active orders in 'new' or 'preparing' status
        const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'preparing');
        const delayed = orders.filter(o => o.isDelayed);
        return { active: activeOrders.length, delayed: delayed.length };
    }, [orders]);

    const alertasSummary = useMemo(() => {
        // Count exceptions: delayed orders, alert tables
        const delayedOrders = orders.filter(o => o.isDelayed).length;
        const alertTables = tables.filter(t => t.status === 'alert').length;
        return { total: delayedOrders + alertTables, delayedOrders, alertTables };
    }, [orders, tables]);

    // Determine status for each sector
    const mesasStatus: 'normal' | 'warning' | 'critical' =
        mesasSummary.alert > 0 ? 'critical' :
            mesasSummary.occupied > mesasSummary.total * 0.8 ? 'warning' : 'normal';

    const cozinhaStatus: 'normal' | 'warning' | 'critical' =
        kitchenPressure === 'high' ? 'critical' :
            kitchenPressure === 'medium' ? 'warning' : 'normal';

    const deliveryStatus: 'normal' | 'warning' | 'critical' =
        deliveryQueueCount > 10 ? 'critical' :
            deliveryQueueCount > 5 ? 'warning' : 'normal';

    const alertasStatus: 'normal' | 'warning' | 'critical' =
        alertasSummary.total > 3 ? 'critical' :
            alertasSummary.total > 0 ? 'warning' : 'normal';

    return (
        <div style={{ padding: spacing[6] }}>
            {/* Header */}
            <div style={{ marginBottom: spacing[6], textAlign: 'center' }}>
                <Text size="xl" weight="bold" color="primary">Painel de Situação</Text>
                <Text size="sm" color="tertiary" style={{ marginTop: spacing[1] }}>
                    Visão operacional em tempo real
                </Text>
            </div>

            {/* Sector Grid - 2x2 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: spacing[4],
                maxWidth: '800px',
                margin: '0 auto',
            }}>
                {/* MESAS Sector */}
                <SectorCard
                    title="Mesas"
                    icon="🪑"
                    value={`${mesasSummary.occupied}/${mesasSummary.total}`}
                    subtitle={`${mesasSummary.free} livres ${mesasSummary.alert > 0 ? `• ${mesasSummary.alert} alertas` : ''}`}
                    status={mesasStatus}
                    onClick={() => onSectorClick?.('mesas')}
                />

                {/* COZINHA Sector */}
                <SectorCard
                    title="Cozinha"
                    icon="👨‍🍳"
                    value={kitchenPressure === 'high' ? 'PRESSÃO ALTA' : kitchenPressure === 'medium' ? 'MÉDIA' : 'TRANQUILA'}
                    subtitle={`${cozinhaSummary.active} pedidos ativos ${cozinhaSummary.delayed > 0 ? `• ${cozinhaSummary.delayed} atrasados` : ''}`}
                    status={cozinhaStatus}
                    onClick={() => onSectorClick?.('cozinha')}
                />

                {/* DELIVERY Sector */}
                <SectorCard
                    title="Delivery"
                    icon="🛵"
                    value={deliveryQueueCount}
                    subtitle="na fila"
                    status={deliveryStatus}
                    onClick={() => onSectorClick?.('delivery')}
                />

                {/* ALERTAS Sector */}
                <SectorCard
                    title="Alertas"
                    icon="⚠️"
                    value={alertasSummary.total === 0 ? 'TUDO OK' : alertasSummary.total}
                    subtitle={alertasSummary.total > 0 ? `${alertasSummary.delayedOrders} pedidos • ${alertasSummary.alertTables} mesas` : 'Sem exceções'}
                    status={alertasStatus}
                    onClick={() => onSectorClick?.('alertas')}
                />
            </div>

            {/* Exception Panel - Incoming decisions from waiters */}
            <div style={{ marginTop: spacing[6], maxWidth: '800px', margin: `${spacing[6]} auto 0` }}>
                <TPVExceptionPanel
                    operatorId={operatorId || 'dev-operator'}
                    operatorName={operatorName || 'Operador'}
                />
            </div>

            {/* Footer - Quick Voice Command Hint */}
            <div style={{ marginTop: spacing[8], textAlign: 'center', opacity: 0.6 }}>
                <Text size="xs" color="tertiary">
                    💡 Diga "Computer, estado da cozinha" para mais detalhes
                </Text>
            </div>

            <style>{`
                @keyframes pulse-alert {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}, (prevProps, nextProps) => {
    // FASE 5: Comparação customizada para evitar re-renders desnecessários
    return (
        prevProps.tables.length === nextProps.tables.length &&
        prevProps.orders.length === nextProps.orders.length &&
        prevProps.kitchenPressure === nextProps.kitchenPressure &&
        prevProps.deliveryQueueCount === nextProps.deliveryQueueCount
    );
});

export default TPVWarMap;
