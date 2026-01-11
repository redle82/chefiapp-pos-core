/**
 * CloseCashRegisterModal - Modal de Fechamento de Caixa
 * 
 * Permite fechar caixa com saldo final e ver resumo do dia.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { supabase } from '../../../core/supabase';

interface CloseCashRegisterModalProps {
    dailyTotalCents: number;
    openingBalanceCents: number;
    restaurantId: string | null;
    onClose: (closingBalanceCents: number) => Promise<void>;
    onCancel: () => void;
}

export const CloseCashRegisterModal: React.FC<CloseCashRegisterModalProps> = ({
    dailyTotalCents,
    openingBalanceCents,
    restaurantId,
    onClose,
    onCancel
}) => {
    const [closingBalance, setClosingBalance] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openOrdersCount, setOpenOrdersCount] = useState<number | null>(null);
    const [checkingOrders, setCheckingOrders] = useState(true);

    // VALIDAÇÃO CRÍTICA: Verificar orders abertos antes de fechar caixa
    useEffect(() => {
        if (!restaurantId) {
            setCheckingOrders(false);
            return;
        }

        const checkOpenOrders = async () => {
            try {
                const { data: openOrders, error: ordersError } = await supabase
                    .from('gm_orders')
                    .select('id, table_number')
                    .eq('restaurant_id', restaurantId)
                    .in('status', ['OPEN', 'IN_PREP', 'READY'])
                    .neq('payment_status', 'PAID');

                if (ordersError) {
                    console.error('[CloseCashRegisterModal] Error checking orders:', ordersError);
                    setCheckingOrders(false);
                    return;
                }

                setOpenOrdersCount(openOrders?.length || 0);
            } catch (err) {
                console.error('[CloseCashRegisterModal] Failed to check orders:', err);
            } finally {
                setCheckingOrders(false);
            }
        };

        checkOpenOrders();
    }, [restaurantId]);

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    };

    const expectedBalance = openingBalanceCents + dailyTotalCents;
    const differenceCents = closingBalance ?
        (parseFloat(closingBalance.replace(',', '.')) * 100) - expectedBalance : 0;

    const handleClose = async () => {
        setError(null);

        // VALIDAÇÃO CRÍTICA: Não pode fechar caixa com orders abertos
        if (openOrdersCount !== null && openOrdersCount > 0) {
            setError(`Não pode fechar caixa com ${openOrdersCount} pedido(s) aberto(s). Feche ou cancele os pedidos primeiro.`);
            return;
        }

        // Validar valor
        const balance = parseFloat(closingBalance.replace(',', '.'));
        if (isNaN(balance) || balance < 0) {
            setError('Valor inválido');
            return;
        }

        setProcessing(true);
        try {
            const balanceCents = Math.round(balance * 100);
            await onClose(balanceCents);
        } catch (err: any) {
            setError(err.message || 'Erro ao fechar caixa');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <Card surface="layer1" padding="xl" style={{ maxWidth: 450, width: '90%' }} data-testid="close-cash-modal">
                <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
                    Fechar Caixa
                </Text>

                {/* Validação de Orders Abertos */}
                {checkingOrders ? (
                    <div style={{ marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.surface.base, borderRadius: 8 }}>
                        <Text size="sm" color="secondary">Verificando pedidos abertos...</Text>
                    </div>
                ) : openOrdersCount !== null && openOrdersCount > 0 && (
                    <div style={{
                        marginBottom: spacing[4],
                        padding: spacing[3],
                        backgroundColor: `${colors.warning.base}15`,
                        borderRadius: 8
                    }}>
                        <Text size="sm" weight="bold" color="warning">
                            ⚠️ {openOrdersCount} pedido(s) aberto(s)
                        </Text>
                        <Text size="xs" color="secondary" style={{ marginTop: spacing[1] }}>
                            Feche ou cancele os pedidos antes de fechar o caixa.
                        </Text>
                    </div>
                )}

                {/* Resumo do Dia */}
                <div style={{
                    marginBottom: spacing[6],
                    padding: spacing[4],
                    backgroundColor: colors.surface.base,
                    borderRadius: 8
                }}>
                    <Text size="sm" weight="bold" color="tertiary" style={{ marginBottom: spacing[3] }}>
                        RESUMO DO DIA
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text size="sm" color="secondary">Saldo inicial</Text>
                            <Text size="sm" weight="bold" color="primary">{formatPrice(openingBalanceCents)}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text size="sm" color="secondary">Vendas do dia</Text>
                            <Text size="sm" weight="bold" color="primary">{formatPrice(dailyTotalCents)}</Text>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: spacing[2],
                            borderTop: `1px solid ${colors.border.subtle}`
                        }}>
                            <Text size="sm" weight="bold" color="primary">Saldo esperado</Text>
                            <Text size="lg" weight="bold" color="primary">{formatPrice(expectedBalance)}</Text>
                        </div>
                    </div>
                </div>

                {/* Input Saldo Final */}
                <div style={{ marginBottom: spacing[6] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                        Saldo final em caixa
                    </Text>
                    <input
                        type="text"
                        value={closingBalance}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9,.]/g, '');
                            setClosingBalance(value);
                        }}
                        placeholder="0.00"
                        style={{
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            padding: spacing[3],
                            backgroundColor: colors.surface.base,
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: 8,
                            color: colors.text.primary,
                            outline: 'none',
                            width: '100%'
                        }}
                        autoFocus
                    />
                    <Text size="xs" color="secondary" style={{ marginTop: spacing[1] }}>
                        Digite o valor em dinheiro que está no caixa agora
                    </Text>

                    {/* Diferença */}
                    {closingBalance && !isNaN(parseFloat(closingBalance.replace(',', '.'))) && (
                        <div style={{
                            marginTop: spacing[3],
                            padding: spacing[3],
                            backgroundColor: differenceCents === 0
                                ? `${colors.success.base}15`
                                : `${colors.warning.base}15`,
                            borderRadius: 8
                        }}>
                            <Text size="xs" color="tertiary" style={{ marginBottom: 4 }}>
                                Diferença
                            </Text>
                            <Text
                                size="sm"
                                weight="bold"
                                color={differenceCents === 0 ? 'success' : 'warning'}
                            >
                                {differenceCents >= 0 ? '+' : ''}{formatPrice(differenceCents)}
                            </Text>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{
                        padding: spacing[3],
                        backgroundColor: `${colors.destructive.base}15`,
                        borderRadius: 8,
                        marginBottom: spacing[4]
                    }}>
                        <Text size="sm" color="destructive">{error}</Text>
                    </div>
                )}

                <div style={{ display: 'flex', gap: spacing[3] }}>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onCancel}
                        disabled={processing}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        tone="action"
                        size="lg"
                        onClick={handleClose}
                        disabled={processing || checkingOrders || (openOrdersCount !== null && openOrdersCount > 0)}
                        style={{ flex: 1 }}
                    >
                        {processing ? 'Fechando...' : 'Fechar Caixa'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

