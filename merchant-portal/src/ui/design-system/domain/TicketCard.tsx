/* Use Strict Primitives */
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { colors } from '../tokens/colors';

/* Type Logic (Mirrors Backend) */
export type TicketStatus = 'new' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

interface TicketOrder {
    id: string; // "ord-123"
    tableNumber?: string | null;
    status: TicketStatus;
    items: Array<{
        name: string;
        quantity: number;
        price?: number; // In cents, optional for backward compatibility
    }>;
    total: number;
    createdAt: string; // ISO
}

interface TicketCardProps {
    order: TicketOrder;
    onAction?: (action: 'send' | 'ready' | 'close' | 'recover') => void;
    compact?: boolean;
    isActive?: boolean; // Highlight if this is the active order being edited
}

export const TicketCard: React.FC<TicketCardProps> = ({ order, onAction, compact, isActive = false }) => {

    // Resolve Semantic Status
    const getBadgeStatus = (s: TicketStatus): 'new' | 'preparing' | 'ready' | 'delivered' => {
        if (s === 'new') return 'new';
        if (s === 'preparing') return 'preparing';
        if (s === 'ready') return 'ready';
        return 'delivered'; // served/paid/cancelled
    };

    const badgeStatus = getBadgeStatus(order.status);

    // "Alive" Timer placeholder (Static for now, but UDS structure ready)
    const timeElapsed = "12:45";

    // New logic: Only show actions if relevant
    const canSend = order.status === 'new';
    const canReady = order.status === 'preparing';
    const canPay = order.status === 'ready' || order.status === 'served';

    return (
        <Card
            surface="layer2"
            padding={compact ? 'sm' : 'lg'}
            hoverable
        >
            {/* 1. HEADER: ID + Table + Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Text size="2xl" weight="black" color="primary">{order.id}</Text>
                        {order.tableNumber && (
                            <Text size="xs" weight="bold" color="info">Mesa {order.tableNumber}</Text>
                        )}
                        {isActive && (
                            <Text size="xs" weight="bold" color="action" style={{
                                backgroundColor: `${colors.action.base}20`,
                                padding: '2px 6px',
                                borderRadius: 4
                            }}>
                                ✏️ Editando
                            </Text>
                        )}
                    </div>

                    {/* Metadata Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Timer Logic */}
                        {(order.status === 'new' || order.status === 'preparing') && (
                            <Text size="xs" weight="bold" color={order.status === 'new' ? 'warning' : 'tertiary'}>
                                ⏱ {timeElapsed}
                            </Text>
                        )}
                    </div>
                </div>

                {/* Status Enforcer */}
                <Badge status={badgeStatus} variant="outline" />
            </div>

            {/* 2. BODY: Items (Only in expanded view or simplified) */}
            {!compact && (
                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {order.items.slice(0, 4).map((item, i) => {
                        const itemTotal = item.price ? (item.price * item.quantity) / 100 : null;
                        return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text size="sm" color="secondary">
                                    {item.quantity}x {item.name}
                                </Text>
                                {itemTotal !== null && (
                                    <Text size="sm" color="tertiary" weight="bold">
                                        €{itemTotal.toFixed(2)}
                                    </Text>
                                )}
                            </div>
                        );
                    })}
                    {order.items.length > 4 && <Text size="xs" color="tertiary">...mais items</Text>}
                </div>
            )}

            {/* 3. FOOTER: Total + Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>

                {/* Total Display */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 4 }}>
                    <Text size="xs" color="tertiary" weight="bold">TOTAL</Text>
                    <Text size="xl" color="primary" weight="black">€ {order.total.toFixed(2)}</Text>
                </div>

                {/* Action Button (Full Width) */}
                {onAction && (
                    <>
                        {canSend && (
                            <Button tone="warning" size="lg" onClick={() => onAction('send')}>
                                Enviar Cozinha
                            </Button>
                        )}
                        {canReady && (
                            <Button tone="info" size="lg" onClick={() => onAction('ready')}>
                                Marcar Pronto
                            </Button>
                        )}
                        {canPay && (
                            <Button tone="success" size="lg" onClick={() => onAction('pay' as any)}>
                                💲 Cobrar
                            </Button>
                        )}
                        {/* DESTRUCTIVE: Cancel Action */}
                        {order.status !== 'paid' && order.status !== 'cancelled' && (
                            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                                <Button
                                    tone="destructive"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (window.confirm('Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.')) {
                                            onAction('cancel' as any);
                                        }
                                    }}
                                >
                                    ✕ Cancelar Pedido
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
};
