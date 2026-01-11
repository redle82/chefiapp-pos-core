/**
 * OrderItemEditor - Editor de Itens do Pedido Ativo
 * 
 * Permite editar itens do pedido ativo:
 * - Incrementar/decrementar quantidade
 * - Remover item
 * - Ver total atualizado em tempo real
 */

import React from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import type { Order, OrderItem } from '../context/OrderTypes';

interface OrderItemEditorProps {
    order: Order | null;
    onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
    onRemoveItem: (itemId: string) => Promise<void>;
    onBackToMenu?: () => void;
    loading?: boolean;
}

export const OrderItemEditor: React.FC<OrderItemEditorProps> = ({
    order,
    onUpdateQuantity,
    onRemoveItem,
    onBackToMenu,
    loading = false
}) => {
    if (!order) {
        return (
            <div style={{ padding: spacing[6], textAlign: 'center' }}>
                <Text size="sm" color="tertiary">
                    Nenhum pedido ativo. Adicione itens do menu para começar.
                </Text>
            </div>
        );
    }

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.subtle}`,
                backgroundColor: colors.surface.layer1
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                    <Text size="lg" weight="bold" color="primary">
                        Pedido {order.id.substring(0, 8)}
                    </Text>
                    {order.tableNumber && (
                        <Text size="sm" color="secondary">
                            Mesa {order.tableNumber}
                        </Text>
                    )}
                </div>
                {onBackToMenu && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBackToMenu}
                        style={{ width: '100%' }}
                    >
                        ← Voltar ao Menu
                    </Button>
                )}
            </div>

            {/* Items List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: spacing[4],
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[3]
            }}>
                {order.items.length === 0 ? (
                    <div style={{ padding: spacing[6], textAlign: 'center' }}>
                        <Text size="sm" color="tertiary">
                            Nenhum item no pedido. Adicione itens do menu.
                        </Text>
                    </div>
                ) : (
                    order.items.map((item) => (
                        <Card key={item.id} surface="layer2" padding="md">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[3] }}>
                                {/* Item Info */}
                                <div style={{ flex: 1 }}>
                                    <Text size="sm" weight="bold" color="primary" style={{ marginBottom: spacing[1] }}>
                                        {item.name}
                                    </Text>
                                    <Text size="xs" color="secondary">
                                        {formatPrice(item.price)} cada
                                    </Text>
                                </div>

                                {/* Quantity Controls */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing[2] }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing[2],
                                        backgroundColor: colors.surface.base,
                                        borderRadius: 8,
                                        padding: spacing[1]
                                    }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (item.quantity > 1) {
                                                    onUpdateQuantity(item.id, item.quantity - 1);
                                                } else {
                                                    onRemoveItem(item.id);
                                                }
                                            }}
                                            disabled={loading}
                                            style={{ minWidth: 32, padding: spacing[1] }}
                                        >
                                            −
                                        </Button>
                                        <Text size="sm" weight="bold" color="primary" style={{ minWidth: 24, textAlign: 'center' }}>
                                            {item.quantity}
                                        </Text>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            disabled={loading}
                                            style={{ minWidth: 32, padding: spacing[1] }}
                                        >
                                            +
                                        </Button>
                                    </div>
                                    <Text size="xs" color="tertiary" weight="bold">
                                        {formatPrice(item.price * item.quantity)}
                                    </Text>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        tone="destructive"
                                        onClick={() => onRemoveItem(item.id)}
                                        disabled={loading}
                                        style={{ padding: spacing[1] }}
                                    >
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Footer - Total */}
            {order.items.length > 0 && (
                <div style={{
                    padding: spacing[4],
                    borderTop: `1px solid ${colors.border.subtle}`,
                    backgroundColor: colors.surface.layer1
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing[2] }}>
                        <Text size="sm" color="tertiary" weight="bold">
                            SUBTOTAL
                        </Text>
                        <Text size="xl" weight="black" color="primary">
                            {formatPrice(order.total)}
                        </Text>
                    </div>
                    <Text size="xs" color="secondary" style={{ textAlign: 'right' }}>
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </Text>
                </div>
            )}
        </div>
    );
};

