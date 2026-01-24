/**
 * 🚨 TPV Exception Panel — Exception Decision Flow
 * 
 * Displays incoming exceptions from Mini-TPV (waiters) and allows
 * the TPV Central operator to make decisions.
 * 
 * Flow: Waiter flags issue → Central receives alert → Operator decides → Resolution sent back
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { useToast } from '../../../ui/design-system';
import tpvEventBus, { createEvent } from '../../../core/tpv/TPVCentralEvents';
import { useOrders } from '../context/OrderContext';

// Inline types to avoid Vite export resolution issues
interface OrderExceptionPayload {
    orderId: string;
    tableNumber: number;
    waiterId: string;
    waiterName: string;
    exceptionType: 'item_unavailable' | 'customer_complaint' | 'delayed' | 'payment_issue' | 'other';
    description: string;
    itemId?: string;
    itemName?: string;
    timestamp: Date;
}

interface DecisionMadePayload {
    orderId: string;
    tableNumber: number;
    decisionId: string;
    action: string;
    operatorId: string;
    operatorName: string;
    message?: string;
    timestamp: Date;
}

// ============================================================================
// TYPES
// ============================================================================

interface PendingException extends OrderExceptionPayload {
    eventId: string;
}

interface ExceptionPanelProps {
    operatorId: string;
    operatorName: string;
    onExceptionResolved?: (exception: PendingException) => void;
}

// ============================================================================
// DECISION OPTIONS BY EXCEPTION TYPE
// ============================================================================

const DECISION_OPTIONS: Record<OrderExceptionPayload['exceptionType'], { id: string; label: string; action: string; tone: 'action' | 'neutral' | 'destructive'; variant: 'solid' | 'outline' }[]> = {
    item_unavailable: [
        { id: 'substitute', label: '🔄 Substituir', action: 'substitute', tone: 'action', variant: 'solid' },
        { id: 'remove', label: '❌ Remover item', action: 'remove', tone: 'neutral', variant: 'outline' },
        { id: 'cancel_order', label: '🛑 Cancelar pedido', action: 'cancel', tone: 'destructive', variant: 'solid' },
    ],
    customer_complaint: [
        { id: 'redo', label: '🔄 Refazer', action: 'redo', tone: 'action', variant: 'solid' },
        { id: 'discount', label: '💰 Desconto', action: 'discount', tone: 'neutral', variant: 'outline' },
        { id: 'comp', label: '🎁 Oferecer', action: 'comp', tone: 'neutral', variant: 'outline' },
        { id: 'deny', label: '✋ Recusar', action: 'deny', tone: 'destructive', variant: 'solid' },
    ],
    delayed: [
        { id: 'prioritize', label: '⚡ Priorizar', action: 'prioritize', tone: 'action', variant: 'solid' },
        { id: 'notify_table', label: '📢 Avisar mesa', action: 'notify', tone: 'neutral', variant: 'outline' },
        { id: 'discount', label: '💰 Desconto', action: 'discount', tone: 'neutral', variant: 'outline' },
    ],
    payment_issue: [
        { id: 'retry', label: '🔄 Tentar novamente', action: 'retry', tone: 'action', variant: 'solid' },
        { id: 'cash', label: '💵 Pagar em dinheiro', action: 'cash', tone: 'neutral', variant: 'outline' },
        { id: 'split', label: '➗ Dividir conta', action: 'split', tone: 'neutral', variant: 'outline' },
    ],
    other: [
        { id: 'acknowledge', label: '✅ Entendido', action: 'acknowledge', tone: 'action', variant: 'solid' },
        { id: 'investigate', label: '🔍 Investigar', action: 'investigate', tone: 'neutral', variant: 'outline' },
        { id: 'escalate', label: '📞 Escalar', action: 'escalate', tone: 'destructive', variant: 'solid' },
    ],
};

// ============================================================================
// SEVERITY COLORS
// ============================================================================

const EXCEPTION_TYPE_LABELS: Record<OrderExceptionPayload['exceptionType'], { label: string; color: string }> = {
    item_unavailable: { label: 'Item Indisponível', color: colors.warning.base },
    customer_complaint: { label: 'Reclamação', color: colors.destructive.base },
    delayed: { label: 'Atraso', color: colors.warning.base },
    payment_issue: { label: 'Pagamento', color: colors.destructive.base },
    other: { label: 'Outro', color: colors.text.tertiary },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function TPVExceptionPanel({ operatorId, operatorName, onExceptionResolved }: ExceptionPanelProps) {
    const { cancelOrder, removeItemFromOrder, pendingExceptions } = useOrders();
    // Local state removed in favor of persistent context state
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { warning, success, error } = useToast();

    // Subscribe to exception events
    useEffect(() => {
        const unsubscribe = tpvEventBus.on<OrderExceptionPayload>('order.exception', (event) => {
            console.log('[TPVExceptionPanel] Received exception (notification only):', event);

            // State is handled by OrderContext now.
            // We only handle Side Effects here (Toast + Sound).

            // Audio + toast notification
            warning(`⚠️ Exceção: Mesa ${event.payload.tableNumber} - ${event.payload.waiterName}: ${event.payload.description}`);

            // Play alert sound (if available)
            try {
                const audio = new Audio('/sounds/alert.mp3');
                audio.play().catch(() => { }); // Ignore if audio fails
            } catch { }
        });

        return unsubscribe;
    }, []);

    // Handle operator decision
    const handleDecision = useCallback(async (exception: PendingException, decisionId: string, action: string) => {
        setProcessingId(exception.eventId);

        try {
            // BACKEND ACTIONS
            if (action === 'cancel') {
                await cancelOrder(exception.orderId, `Exception: ${exception.exceptionType} - ${exception.description}`);
                success(`✅ Pedido da Mesa ${exception.tableNumber} cancelado.`);
            } else if (action === 'remove') {
                if (exception.itemId) {
                    await removeItemFromOrder(exception.orderId, exception.itemId);
                    success(`✅ Item "${exception.itemName || 'Item'}" removido da mesa ${exception.tableNumber}`);
                } else {
                    warning(`⚠️ Remoção manual necessária: Item não identificado automaticamente.`);
                }
            }

            // Create decision event
            const decisionPayload: DecisionMadePayload = {
                orderId: exception.orderId,
                tableNumber: exception.tableNumber,
                decisionId,
                action,
                operatorId,
                operatorName,
                message: action === 'cancel' ? 'Pedido Cancelado' : undefined,
                timestamp: new Date(),
            };

            // Emit decision
            tpvEventBus.emit(createEvent('order.decision_made', decisionPayload, 'central', operatorId));

            // Remove from pending is handled by OrderContext listening to decision_made
            setProcessingId(null);

            // Callback
            onExceptionResolved?.(exception);

            success(`✅ Decisão enviada para mesa ${exception.tableNumber}`);
        } catch (err: any) {
            error(`Erro ao processar: ${err.message}`);
            setProcessingId(null);
        }
    }, [operatorId, operatorName, onExceptionResolved, warning, success, error, cancelOrder]);

    // Listen for Voice Commands (Decoupled)
    useEffect(() => {
        const unsubscribe = tpvEventBus.on<{ command: string, tableNumber: number }>('ui.voice_command', (event) => {
            if (event.payload.command === 'resolve_exception') {
                const tableNum = event.payload.tableNumber;
                const exception = pendingExceptions.find(e => e.tableNumber === tableNum);

                if (exception) {
                    // AUTO-RESOLVE: Pick the first option (Safe Default)
                    // Usually 'substitute', 'redo', 'prioritize', etc.
                    const options = DECISION_OPTIONS[exception.exceptionType];
                    if (options && options.length > 0) {
                        const defaultOption = options[0];
                        handleDecision(exception, defaultOption.id, defaultOption.action);
                        success(`✅ Voz: Exceção mesa ${tableNum} resolvida (${defaultOption.label})`);
                    }
                } else {
                    // Optional: Feedback if no exception found?
                }
            }
        });

        return unsubscribe;
    }, [pendingExceptions, handleDecision, success]);

    // No exceptions
    if (pendingExceptions.length === 0) {
        return (
            <Card style={{ padding: spacing[6], textAlign: 'center', background: colors.surface.layer2 }}>
                <Text as="h3" size="xl" style={{ marginBottom: spacing[2], color: colors.success.base }}>
                    ✅ Sem Exceções
                </Text>
                <Text as="p" size="base" style={{ color: colors.text.tertiary }}>
                    Nenhuma decisão pendente dos empregados
                </Text>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <Text as="h3" size="lg" style={{ color: colors.warning.base }}>
                🚨 {pendingExceptions.length} Exceção(ões) Pendente(s)
            </Text>

            {pendingExceptions.map((exception) => {
                const typeInfo = EXCEPTION_TYPE_LABELS[exception.exceptionType];
                const options = DECISION_OPTIONS[exception.exceptionType];
                const isProcessing = processingId === exception.eventId;

                return (
                    <Card
                        key={exception.eventId}
                        style={{
                            padding: spacing[4],
                            background: colors.surface.layer1,
                            borderLeft: `4px solid ${typeInfo.color}`,
                            opacity: isProcessing ? 0.6 : 1,
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
                            <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                                <span
                                    style={{
                                        background: typeInfo.color,
                                        color: 'white',
                                        padding: `${spacing[1]} ${spacing[2]}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }}
                                >
                                    {typeInfo.label}
                                </span>
                                <Text as="h4" size="base" style={{ margin: 0 }}>
                                    Mesa {exception.tableNumber}
                                </Text>
                            </div>
                            <Text as="span" size="sm" style={{ color: colors.text.tertiary }}>
                                {new Date(exception.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </div>

                        {/* Details */}
                        <div style={{ marginBottom: spacing[3] }}>
                            <Text as="p" size="sm" style={{ fontWeight: 500, marginBottom: spacing[1] }}>
                                👤 {exception.waiterName}
                            </Text>
                            <Text as="p" size="sm" style={{ color: colors.text.secondary }}>
                                {exception.description}
                            </Text>
                        </div>

                        {/* Decision buttons */}
                        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                            {options.map((option) => (
                                <Button
                                    key={option.id}
                                    tone={option.tone}
                                    variant={option.variant}
                                    size="sm"
                                    disabled={isProcessing}
                                    onClick={() => handleDecision(exception, option.id, option.action)}
                                    style={{ flex: '1 1 auto', minWidth: 100 }}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

export default TPVExceptionPanel;
