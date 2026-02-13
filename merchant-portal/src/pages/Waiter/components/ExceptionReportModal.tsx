/**
 * 📡 ExceptionReportModal — Waiter Exception Reporting
 * 
 * Modal for waiters to report problems to TPV Central.
 * Emits order.exception events via the event bus.
 */

import { useState } from 'react';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { radius } from '../../../ui/design-system/tokens/radius';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/Button';
import { tpvEventBus, createEvent, type OrderExceptionPayload } from '../../../core/tpv/TPVCentralEvents';

// Exception types matching TPVCentralEvents
type ExceptionType = 'item_unavailable' | 'customer_complaint' | 'delayed' | 'payment_issue' | 'other';

const EXCEPTION_OPTIONS: { value: ExceptionType; label: string; icon: string }[] = [
    { value: 'item_unavailable', label: 'Item Indisponível', icon: '🚫' },
    { value: 'customer_complaint', label: 'Reclamação Cliente', icon: '😤' },
    { value: 'delayed', label: 'Pedido Atrasado', icon: '⏰' },
    { value: 'payment_issue', label: 'Problema Pagamento', icon: '💳' },
    { value: 'other', label: 'Outro', icon: '❓' },
];

interface ExceptionReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    tableNumber: number;
    waiterId?: string;
    waiterName?: string;
    items?: { id: string; name: string }[];
}

export function ExceptionReportModal({
    isOpen,
    onClose,
    orderId,
    tableNumber,
    waiterId = 'waiter-1',
    waiterName = 'Garçom',
    items = []
}: ExceptionReportModalProps) {
    const [selectedType, setSelectedType] = useState<ExceptionType | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedType) return;

        setSending(true);

        try {
            const payload: OrderExceptionPayload = {
                orderId,
                tableNumber,
                waiterId,
                waiterName,
                exceptionType: selectedType,
                description: description.trim() || EXCEPTION_OPTIONS.find(o => o.value === selectedType)?.label || '',
                itemId: selectedItemId || undefined,
                itemName: items.find(i => i.id === selectedItemId)?.name,
                timestamp: new Date()
            };

            // Emit event to TPV Central
            tpvEventBus.emit(createEvent('order.exception', payload));

            console.log('[ExceptionModal] Exception reported:', payload);

            // Vibrate feedback
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

            // Reset and close
            setSelectedType(null);
            setSelectedItemId(null);
            setDescription('');
            onClose();

        } catch (error) {
            console.error('[ExceptionModal] Failed to report exception:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.8)',
                padding: spacing[4],
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: colors.surface.layer1,
                    borderRadius: radius.xl,
                    width: '100%',
                    maxWidth: 400,
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: spacing[4],
                        borderBottom: `1px solid ${colors.border.subtle}`,
                        background: colors.destructive.base,
                    }}
                >
                    <Text size="lg" weight="bold" style={{ color: 'white' }}>
                        ⚠️ Reportar Problema
                    </Text>
                    <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                        Mesa {tableNumber}
                    </Text>
                </div>

                {/* Body */}
                <div style={{ padding: spacing[4] }}>
                    {/* Exception Type Selection */}
                    <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                        Tipo de Problema
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[4] }}>
                        {EXCEPTION_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedType(option.value)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[3],
                                    padding: spacing[3],
                                    borderRadius: radius.md,
                                    border: `2px solid ${selectedType === option.value ? colors.destructive.base : colors.border.subtle}`,
                                    background: selectedType === option.value ? `${colors.destructive.base}20` : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ fontSize: 24 }}>{option.icon}</span>
                                <Text size="md" weight={selectedType === option.value ? 'bold' : 'regular'} color="primary">
                                    {option.label}
                                </Text>
                            </button>
                        ))}
                    </div>

                </div>

                {/* Item Selection (if Item Unavailable) */}
                {selectedType === 'item_unavailable' && (
                    <div style={{ marginBottom: spacing[4] }}>
                        {items.length > 0 ? (
                            <>
                                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                                    Qual item?
                                </Text>
                                <div style={{
                                    maxHeight: 150,
                                    overflowY: 'auto',
                                    background: colors.surface.layer2,
                                    borderRadius: radius.md,
                                    border: `1px solid ${colors.border.subtle}`
                                }}>
                                    {items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItemId(item.id)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: spacing[3],
                                                background: selectedItemId === item.id ? `${colors.action.base}20` : 'transparent',
                                                borderBottom: `1px solid ${colors.border.subtle}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text size="sm" color={selectedItemId === item.id ? 'primary' : 'secondary'}>
                                                {item.name}
                                            </Text>
                                            {selectedItemId === item.id && <span>✅</span>}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <Text size="sm" color="destructive">
                                Nenhum item neste pedido para selecionar.
                            </Text>
                        )}
                    </div>
                )}

                {/* Description */}
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                    Descrição (opcional)
                </Text>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Detalhes adicionais..."
                    style={{
                        width: '100%',
                        minHeight: 80,
                        padding: spacing[3],
                        borderRadius: radius.md,
                        border: `1px solid ${colors.border.subtle}`,
                        background: colors.surface.layer2,
                        color: colors.text.primary,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        marginBottom: spacing[4]
                    }}
                />

                {/* Footer */}
                <div
                    style={{
                        padding: spacing[4],
                        borderTop: `1px solid ${colors.border.subtle}`,
                        display: 'flex',
                        gap: spacing[3],
                    }}
                >
                    <Button
                        tone="neutral"
                        onClick={onClose}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        tone="destructive"
                        onClick={handleSubmit}
                        disabled={!selectedType || sending || (selectedType === 'item_unavailable' && items.length > 0 && !selectedItemId)}
                        style={{ flex: 1 }}
                    >
                        {sending ? 'Enviando...' : 'Enviar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
