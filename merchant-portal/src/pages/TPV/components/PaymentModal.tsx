/**
 * PaymentModal - Modal de Pagamento Real
 * 
 * HARD RULE: Pagar = Fechar pedido
 * 
 * Suporta:
 * - Cash: Pagamento em dinheiro (mock)
 * - Card: Pagamento via Stripe (real)
 * - PIX: Pagamento via PIX (mock, futuro)
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { StripePaymentModal } from '../../../components/payment/StripePaymentModal';
import { PaymentBroker, type PaymentIntentResult } from '../../../core/payment/PaymentBroker';
import { useConsumptionGroups } from '../hooks/useConsumptionGroups';
import { FiscalPrintButton } from './FiscalPrintButton';
import { LoadingState } from '../../../ui/design-system/components/LoadingState';
import { useLoyalty } from '../../../core/loyalty/LoyaltyContext';
import { useOfflineOrder } from '../context/OfflineOrderContext';

export type PaymentMethod = 'cash' | 'card' | 'pix' | 'loyalty';

interface PaymentModalProps {
    orderId: string;
    restaurantId: string;
    orderTotal: number; // em centavos
    onPay: (method: PaymentMethod, intentId?: string) => Promise<void>;
    onCancel: () => void;
    isDemoMode?: boolean; // FASE 2: Modo demo
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ orderId, restaurantId, orderTotal, onPay, onCancel, isDemoMode = false }) => {
    const { isOffline } = useOfflineOrder();
    const { activeCustomer } = useLoyalty();
    const { groups } = useConsumptionGroups(orderId);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const [lastClickTime, setLastClickTime] = useState<number>(0);
    const [amountGiven, setAmountGiven] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<'full' | 'by-group'>('full');
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

    // Stripe Payment Intent state
    const [stripeIntent, setStripeIntent] = useState<PaymentIntentResult | null>(null);
    const [loadingStripeIntent, setLoadingStripeIntent] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);

    // Auto-switch to cash if offline
    useEffect(() => {
        if (isOffline && selectedMethod !== 'cash') {
            setSelectedMethod('cash');
            setStripeIntent(null);
        }
    }, [isOffline, selectedMethod]);

    const totalFormatted = new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(orderTotal / 100);

    // Criar Payment Intent quando método for 'card'
    useEffect(() => {
        if (selectedMethod === 'card' && !stripeIntent && !loadingStripeIntent) {
            setLoadingStripeIntent(true);
            setStripeError(null);

            PaymentBroker.createPaymentIntent({
                orderId,
                restaurantId,
                amount: orderTotal, // PaymentBroker expects amount (checking index.ts, it passes directly)
                currency: 'EUR',
            })
                .then((intent) => {
                    setStripeIntent(intent);
                    setLoadingStripeIntent(false);
                })
                .catch((err) => {
                    console.error('[PaymentModal] Failed to create Stripe intent:', err);
                    setStripeError(err.message || 'Erro ao criar pagamento');
                    setLoadingStripeIntent(false);
                });
        } else if (selectedMethod !== 'card') {
            // Limpar Stripe intent quando mudar de método
            setStripeIntent(null);
            setStripeError(null);
        }
    }, [selectedMethod, orderId, restaurantId, orderTotal, stripeIntent, loadingStripeIntent]);

    const handlePay = async () => {
        // DOUBLE-CLICK PROTECTION: Debounce de 500ms
        const now = Date.now();
        if (now - lastClickTime < 500) {
            console.warn('[PaymentModal] Double-click prevented');
            return;
        }
        setLastClickTime(now);

        setProcessing(true);
        setResult(null);
        try {
            // FASE 2: Modo Demo - Simular pagamento
            if (isDemoMode) {
                // Simular delay de processamento
                await new Promise(resolve => setTimeout(resolve, 1000));
                await onPay(selectedMethod);
                setResult('success');
                setTimeout(() => {
                    onCancel();
                }, 2000);
                return;
            }

            // Para card, o pagamento é processado via StripePaymentModal
            // Este handler só é chamado para cash/pix
            await onPay(selectedMethod);
            setResult('success');
            // Auto-close após 2 segundos em caso de sucesso
            setTimeout(() => {
                onCancel();
            }, 2000);
        } catch (err) {
            console.error('Payment failed:', err);
            setResult('error');
            // Limpar erro após 3 segundos
            setTimeout(() => {
                setResult(null);
            }, 3000);
            // Não relançar erro - já foi tratado visualmente via setResult('error')
        } finally {
            setProcessing(false);
        }
    };

    const handleStripeSuccess = async (paymentIntentId: string) => {
        try {
            await onPay('card', paymentIntentId);
            setResult('success');
            setTimeout(() => {
                onCancel();
            }, 2000);
        } catch (err) {
            console.error('[PaymentModal] Stripe payment processing failed:', err);
            setResult('error');
            setTimeout(() => {
                setResult(null);
            }, 3000);
        }
    };

    // Se método for 'card' e temos client_secret, mostrar StripePaymentModal
    if (selectedMethod === 'card' && stripeIntent?.client_secret) {
        return (
            <StripePaymentModal
                clientSecret={stripeIntent.client_secret}
                total={orderTotal / 100}
                onSuccess={handleStripeSuccess}
                onCancel={onCancel}
            />
        );
    }

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
            <Card surface="layer1" padding="xl" style={{ maxWidth: 500, width: '90%' }}>
                <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
                    Cobrar Pedido
                </Text>

                {/* Consumption Groups (Divisão de Conta) */}
                {groups.length > 0 && (
                    <div style={{ marginBottom: spacing[6] }}>
                        <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                            Modo de pagamento
                        </Text>
                        <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[3] }}>
                            <Button
                                variant={paymentMode === 'full' ? 'solid' : 'outline'}
                                tone={paymentMode === 'full' ? 'action' : 'neutral'}
                                size="sm"
                                onClick={() => {
                                    setPaymentMode('full');
                                    setSelectedGroups(new Set());
                                }}
                            >
                                Pagar Tudo
                            </Button>
                            <Button
                                variant={paymentMode === 'by-group' ? 'solid' : 'outline'}
                                tone={paymentMode === 'by-group' ? 'action' : 'neutral'}
                                size="sm"
                                onClick={() => setPaymentMode('by-group')}
                            >
                                Pagar por Grupo
                            </Button>
                        </div>

                        {paymentMode === 'by-group' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                {groups.filter(g => g.status === 'active').map(group => {
                                    const groupTotal = group.total_amount || 0;
                                    const groupTotalFormatted = new Intl.NumberFormat('pt-PT', {
                                        style: 'currency',
                                        currency: 'EUR'
                                    }).format(groupTotal);
                                    const isSelected = selectedGroups.has(group.id);
                                    const isPaid = group.status === 'paid';

                                    return (
                                        <div
                                            key={group.id}
                                            style={{
                                                padding: spacing[3],
                                                backgroundColor: isSelected ? `${group.color}20` : '#222',
                                                border: `2px solid ${isSelected ? group.color : 'transparent'}`,
                                                borderRadius: 8,
                                                cursor: isPaid ? 'not-allowed' : 'pointer',
                                                opacity: isPaid ? 0.5 : 1,
                                            }}
                                            onClick={() => {
                                                if (isPaid) return;
                                                const newSelected = new Set(selectedGroups);
                                                if (isSelected) {
                                                    newSelected.delete(group.id);
                                                } else {
                                                    newSelected.add(group.id);
                                                }
                                                setSelectedGroups(newSelected);
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    backgroundColor: group.color,
                                                }} />
                                                <Text size="sm" weight="bold" color="primary" style={{ flex: 1 }}>
                                                    {group.label}
                                                </Text>
                                                <Text size="sm" weight="bold" color="primary">
                                                    {groupTotalFormatted}
                                                </Text>
                                                {isPaid && (
                                                    <Text size="xs" color="success">✓ Pago</Text>
                                                )}
                                            </div>
                                            {group.items_count !== undefined && (
                                                <Text size="xs" color="tertiary" style={{ marginTop: spacing[1] }}>
                                                    {group.items_count} {group.items_count === 1 ? 'item' : 'itens'}
                                                </Text>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginBottom: spacing[6] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                        Total a pagar
                    </Text>
                    <Text size="3xl" weight="black" color="primary">
                        {paymentMode === 'by-group' && selectedGroups.size > 0
                            ? new Intl.NumberFormat('pt-PT', {
                                style: 'currency',
                                currency: 'EUR'
                            }).format(
                                groups
                                    .filter(g => selectedGroups.has(g.id))
                                    .reduce((sum, g) => sum + (g.total_amount || 0), 0)
                            )
                            : totalFormatted}
                    </Text>
                </div>

                <div style={{ marginBottom: spacing[6] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[3] }}>
                        Método de pagamento
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                        {(['cash', 'card', 'pix', 'loyalty'] as PaymentMethod[]).map(method => {
                            const isOfflineDisabled = isOffline && method !== 'cash';

                            // Loyalty specific checks
                            let isLoyaltyDisabled = false;
                            let loyaltySubtitle = '';

                            if (method === 'loyalty') {
                                const pointsNeeded = Math.ceil(orderTotal / 10); // 10 Cents = 1 Point
                                if (!activeCustomer) {
                                    isLoyaltyDisabled = true;
                                    loyaltySubtitle = '(Identifique o cliente)';
                                } else {
                                    const balance = activeCustomer.points_balance || 0;
                                    if (balance < pointsNeeded) {
                                        isLoyaltyDisabled = true;
                                        loyaltySubtitle = `(Saldo: ${balance} pts. Necessário: ${pointsNeeded})`;
                                    } else {
                                        loyaltySubtitle = `Use ${pointsNeeded} pts (Saldo: ${balance})`;
                                    }
                                }
                            }

                            return (
                                <Button
                                    key={method}
                                    variant={selectedMethod === method ? 'solid' : 'outline'}
                                    tone={selectedMethod === method ? 'action' : 'neutral'}
                                    size="lg"
                                    onClick={() => {
                                        if (isOfflineDisabled || isLoyaltyDisabled) return;
                                        setSelectedMethod(method);
                                        setAmountGiven('');
                                        setStripeIntent(null);
                                        setStripeError(null);
                                    }}
                                    style={{ justifyContent: 'flex-start', opacity: (isOfflineDisabled || isLoyaltyDisabled) ? 0.5 : 1 }}
                                    disabled={(method === 'card' && loadingStripeIntent) || isOfflineDisabled || isLoyaltyDisabled}
                                >
                                    {method === 'cash' && '💵 Dinheiro'}
                                    {method === 'card' && (loadingStripeIntent ? (
                                        <>
                                            <LoadingState variant="spinner" spinnerSize="sm" style={{ display: 'inline-flex', marginRight: 8 }} />
                                            💳 Cartão
                                        </>
                                    ) : (
                                        <>
                                            💳 Cartão {isOfflineDisabled && <Text size="xs" color="destructive" style={{ marginLeft: 8 }}>(Offline)</Text>}
                                        </>
                                    ))}
                                    {method === 'pix' && (
                                        <>
                                            📱 PIX {isOfflineDisabled && <Text size="xs" color="destructive" style={{ marginLeft: 8 }}>(Offline)</Text>}
                                        </>
                                    )}
                                    {method === 'loyalty' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span>💎 Pontos Fidelidade</span>
                                            <span style={{ fontSize: '0.7em', opacity: 0.8 }}>{loyaltySubtitle}</span>
                                        </div>
                                    )}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Erro ao criar Stripe Intent */}
                    {selectedMethod === 'card' && stripeError && (
                        <div style={{
                            marginTop: spacing[3],
                            padding: spacing[2],
                            backgroundColor: `${colors.destructive.base}15`,
                            borderRadius: 8
                        }}>
                            <Text size="xs" color="destructive">
                                {stripeError}
                            </Text>
                        </div>
                    )}
                </div>

                {/* Change Calculator for Cash */}
                {
                    selectedMethod === 'cash' && (
                        <div style={{ marginBottom: spacing[6], padding: spacing[3], backgroundColor: '#222', borderRadius: 8 }}>
                            <div style={{ marginBottom: spacing[3] }}>
                                <Text size="xs" color="tertiary" style={{ marginBottom: spacing[1] }}>Valor Recebido (€)</Text>
                                <input
                                    type="number"
                                    value={amountGiven}
                                    onChange={(e) => setAmountGiven(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: `1px solid ${colors.border.subtle}`,
                                        borderRadius: 6,
                                        padding: spacing[3],
                                        color: 'white',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {amountGiven && !isNaN(parseFloat(amountGiven)) && (
                                <div style={{
                                    opacity: (parseFloat(amountGiven) - orderTotal / 100) >= 0 ? 1 : 0.5,
                                    transition: 'all 0.3s'
                                }}>
                                    <Text size="xs" color="tertiary" style={{ marginBottom: spacing[1] }}>Troco</Text>
                                    <Text size="2xl" weight="bold" color={(parseFloat(amountGiven) - orderTotal / 100) >= 0 ? 'success' : 'warning'}>
                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
                                            .format(Math.max(0, parseFloat(amountGiven) - orderTotal / 100))}
                                    </Text>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Feedback Visual */}
                {
                    result === 'success' && (
                        <div style={{
                            marginBottom: spacing[4],
                            padding: spacing[3],
                            backgroundColor: `${colors.success.base}15`,
                            borderRadius: 8
                        }}>
                            <Text size="sm" weight="bold" color="success" style={{ marginBottom: spacing[2] }}>
                                ✓ Pagamento registrado com sucesso!
                            </Text>
                            <FiscalPrintButton
                                orderId={orderId}
                                restaurantId={restaurantId}
                                orderTotal={orderTotal}
                                paymentMethod={selectedMethod}
                                onPrintComplete={() => {
                                    // Opcional: fechar modal após impressão
                                }}
                            />
                        </div>
                    )
                }

                {
                    result === 'error' && (
                        <div style={{
                            marginBottom: spacing[4],
                            padding: spacing[3],
                            backgroundColor: `${colors.destructive.base}15`,
                            borderRadius: 8
                        }}>
                            <Text size="sm" weight="bold" color="destructive">
                                ✗ Erro ao processar pagamento. Tente novamente.
                            </Text>
                        </div>
                    )
                }

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
                        onClick={handlePay}
                        disabled={processing || result === 'success' || (selectedMethod === 'cash' && (!amountGiven || parseFloat(amountGiven) < orderTotal / 100))}
                        style={{ flex: 1 }}
                    >
                        {processing ? 'Processando...' : 'Cobrar'}
                    </Button>
                </div>
            </Card >
        </div >
    );
};

