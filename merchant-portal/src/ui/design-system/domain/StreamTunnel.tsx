import { Text } from '../primitives/Text';
import { TicketCard } from './TicketCard';
import { colors } from '../tokens/colors';
import { useOfflineOrder } from '../../../pages/TPV/context/OfflineOrderContext';

interface StreamTunnelProps {
    orders: any[]; // Replace 'any' with Order type in real implementation
    onAction: (orderId: string, action: string) => void;
    activeOrderId?: string | null; // Highlight active order being edited
}

export const StreamTunnel: React.FC<StreamTunnelProps> = ({ orders, onAction, activeOrderId }) => {
    const { queue } = useOfflineOrder();
    return (
        <>
            {/* Stream Header */}
            <div style={{
                padding: 24,
                paddingBottom: 16,
                borderBottom: `1px solid ${colors.border.subtle}`,
                backgroundColor: colors.surface.layer1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Pulsing Dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.success.base, boxShadow: `0 0 10px ${colors.success.base}` }} />
                    <Text size="2xl" weight="black" color="primary">Pedidos Ativos</Text>
                    {orders.length > 0 && (
                        <span style={{
                            backgroundColor: `${colors.success.base}20`,
                            color: colors.success.base,
                            fontSize: 12,
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: 4
                        }}>
                            {orders.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Stream List */}
            <div style={{ padding: 24, overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Text color="tertiary" size="lg" weight="medium" style={{ marginBottom: 8 }}>
                            Nenhum pedido ativo
                        </Text>
                        <Text color="tertiary" size="sm" style={{ opacity: 0.7 }}>
                            Abra o caixa ou crie uma nova venda para começar.
                        </Text>
                    </div>
                ) : (
                    orders.map((order: any) => {
                        // Map Order to TicketOrder format, preserving price if available
                        const ticketOrder = {
                            id: order.id,
                            tableNumber: order.tableNumber?.toString() || null,
                            status: order.status,
                            items: order.items.map((item: any) => ({
                                name: item.name,
                                quantity: item.quantity,
                                price: item.price, // Include price in cents
                            })),
                            total: order.total / 100, // Convert cents to euros for display
                            createdAt: order.createdAt instanceof Date
                                ? order.createdAt.toISOString()
                                : order.createdAt.toString(),
                        };

                        // Determine Sync Status
                        const queuedItems = queue.filter(q =>
                            q.local_id === order.id ||
                            (q.payload && q.payload.orderId === order.id)
                        );

                        let syncStatus: 'synced' | 'pending' | 'syncing' | 'error' = 'synced';
                        if (queuedItems.length > 0) {
                            if (queuedItems.some(q => q.status === 'error')) syncStatus = 'error';
                            else if (queuedItems.some(q => q.status === 'syncing')) syncStatus = 'syncing';
                            else syncStatus = 'pending';
                        }

                        return (
                            <TicketCard
                                key={order.id}
                                order={ticketOrder}
                                onAction={(act) => onAction(order.id, act)}
                                // @ts-ignore
                                compact={false}
                                isActive={activeOrderId === order.id}
                                syncStatus={syncStatus}
                            />
                        );
                    })
                )}
            </div>
        </>
    );
};
