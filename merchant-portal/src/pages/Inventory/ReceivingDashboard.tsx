import React, { useState } from 'react';
import type { IngestionSession } from '../../core/inventory/ReceivingTypes';
import { Colors, Typography } from '../../ui/design-system/tokens';
import { Card } from '../../ui/design-system/Card';
import { Button } from '../../ui/design-system/Button';
import { Badge } from '../../ui/design-system/Badge';
import { InlineAlert } from '../../ui/design-system/InlineAlert';
import { Spacing as SpacingToken } from '../../ui/design-system/tokens';

// ------------------------------------------------------------------
// 📦 RECEIVING DASHBOARD (THE TRUTH GATEWAY)
// ------------------------------------------------------------------
// "Onde a nota fiscal encontra a realidade física."
// ------------------------------------------------------------------

// MOCK DATA FOR PROTOTYPE
const MOCK_SESSION: IngestionSession = {
    id: 'session-123',
    startedAt: Date.now(),
    witnessId: 'manager-ana',
    provider: 'Makro Atacadista',
    status: 'reconciling',
    items: [
        {
            itemId: 'keg-super-bock',
            quantityReceived: 5,
            unit: 'un',
            unitPriceCents: 9500, // €95.00
            totalPriceCents: 47500,
            qualityStatus: 'ok',
            divergence: {
                type: 'price_change', // Inflation!
                severity: 'high',
                deltaValue: 500 // +€5.00
            }
        },
        {
            itemId: 'moz-cheese-bulk',
            quantityReceived: 10, // Ordered 12
            unit: 'kg',
            unitPriceCents: 850,
            totalPriceCents: 8500,
            qualityStatus: 'ok',
            divergence: {
                type: 'quantity_mismatch',
                severity: 'medium',
                deltaValue: -2
            }
        },
        {
            itemId: 'napkins-premium',
            quantityReceived: 20,
            unit: 'pack',
            unitPriceCents: 150,
            totalPriceCents: 3000,
            qualityStatus: 'ok' // Perfect match
        }
    ]
};

export const ReceivingDashboard: React.FC = () => {
    const [session, setSession] = useState<IngestionSession>(MOCK_SESSION);
    const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());

    const formatCurrency = (cents: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    const handleAcceptDivergence = (itemId: string) => {
        setReviewedItems(prev => new Set(prev).add(itemId));
    };

    const handleCommitSession = () => {
        // Here we would call commitReality()
        console.log("Realidade Commitada! Estoque Atualizado. Preços Médios Recalculados.");
        // TODO: Use Toast when available
        setSession(prev => ({ ...prev, status: 'committed' }));
    };

    const allReviewed = session.items.every(i => !i.divergence || reviewedItems.has(i.itemId));

    return (
        <div style={{ padding: SpacingToken.xl, maxWidth: '800px', margin: '0 auto', fontFamily: Typography.fontFamily, color: Colors.text.primary }}>

            {/* HEADER */}
            <div style={{ marginBottom: SpacingToken.xl, borderBottom: `1px solid ${Colors.surface.border}`, paddingBottom: SpacingToken.xl }}>
                <div style={{
                    textTransform: Typography.uiTiny.textTransform,
                    letterSpacing: Typography.uiTiny.letterSpacing,
                    fontSize: Typography.uiTiny.fontSize,
                    fontWeight: Typography.uiTiny.fontWeight,
                    color: Colors.text.secondary,
                    marginBottom: SpacingToken.sm
                }}>
                    Ritual de Recebimento
                </div>
                <h1 style={{
                    fontSize: Typography.h1.fontSize,
                    fontWeight: Typography.h1.fontWeight,
                    margin: 0,
                    color: Colors.text.primary
                }}>
                    Validação de Realidade
                </h1>
                <p style={{ opacity: 0.7, marginTop: SpacingToken.sm, color: Colors.text.secondary }}>
                    Conferência da Nota Fiscal de <strong>{session.provider}</strong>
                </p>
                <div style={{ fontSize: Typography.uiSmall.fontSize, marginTop: SpacingToken.sm, color: Colors.text.tertiary }}>
                    Testemunha: {session.witnessId} • {new Date(session.startedAt).toLocaleTimeString()}
                </div>
            </div>

            {/* SESSION STATUS */}
            {session.status === 'committed' ? (
                <div style={{
                    padding: SpacingToken['3xl'],
                    textAlign: 'center',
                    background: Colors.status.success.bg,
                    borderRadius: '16px',
                    color: Colors.status.success.text,
                    border: `1px solid ${Colors.status.success.border}`
                }}>
                    <div style={{ fontSize: '48px', marginBottom: SpacingToken.lg }}>✅</div>
                    <h2 style={{ margin: 0, fontSize: Typography.h2.fontSize, fontWeight: Typography.h2.fontWeight }}>Realidade Integrada</h2>
                    <p style={{ marginTop: SpacingToken.sm }}>O estoque foi atualizado com sucesso.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: SpacingToken.lg }}>

                    {/* ITEMS LIST */}
                    {session.items.map((item, idx) => {
                        const isReviewed = !item.divergence || reviewedItems.has(item.itemId);
                        const isProblem = !!item.divergence;

                        let alertMessage = '';
                        if (item.divergence?.type === 'price_change') {
                            alertMessage = `O preço unitário subiu ${formatCurrency(item.divergence.deltaValue)} (+${((item.divergence.deltaValue / (item.unitPriceCents - item.divergence.deltaValue)) * 100).toFixed(1)}%).`;
                        } else if (item.divergence?.type === 'quantity_mismatch') {
                            alertMessage = `Esperado: ${item.quantityReceived - item.divergence.deltaValue} | Recebido: ${item.quantityReceived} (Dif: ${item.divergence.deltaValue})`;
                        }

                        return (
                            <Card key={idx} padding="lg" style={{
                                border: isProblem && !isReviewed ? `1px solid ${Colors.error}` : `1px solid ${Colors.surface.border}`,
                                opacity: isReviewed ? 0.6 : 1
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                                    {/* LEFT: Item Info */}
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: Typography.uiLarge.fontSize, color: Colors.text.primary }}>{item.itemId}</div>
                                        <div style={{ fontSize: Typography.uiSmall.fontSize, color: Colors.text.secondary, marginTop: '4px' }}>
                                            Recebido: {item.quantityReceived} {item.unit} x {formatCurrency(item.unitPriceCents)}
                                        </div>
                                    </div>

                                    {/* RIGHT: Status Badge */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, color: Colors.text.primary }}>{formatCurrency(item.totalPriceCents)}</div>
                                        {isProblem && !isReviewed && (
                                            <div style={{ marginTop: SpacingToken.xs }}>
                                                <Badge label="Divergência" variant="error" icon="⚠️" />
                                            </div>
                                        )}
                                        {!isProblem && (
                                            <div style={{ marginTop: SpacingToken.xs, fontSize: Typography.uiSmall.fontSize, color: Colors.success }}>
                                                Match Perfeito ✅
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DIVERGENCE DETAILS UI */}
                                {isProblem && !isReviewed && (
                                    <div style={{ marginTop: SpacingToken.lg }}>
                                        <InlineAlert
                                            type="error"
                                            title={item.divergence?.type === 'price_change' ? 'Inflação Detectada' :
                                                item.divergence?.type === 'quantity_mismatch' ? 'Quantidade Incorreta' : 'Item Não Pedido'}
                                            message={alertMessage}
                                            action={{
                                                label: 'Aceitar Nova Realidade',
                                                onClick: () => handleAcceptDivergence(item.itemId)
                                            }}
                                        />
                                    </div>
                                )}
                            </Card>
                        );
                    })}

                    {/* FOOTER ACTION */}
                    <div style={{
                        marginTop: SpacingToken.xl,
                        padding: SpacingToken.xl,
                        background: Colors.surface.elevated,
                        borderRadius: '16px',
                        textAlign: 'center',
                        border: `1px solid ${Colors.surface.border}`
                    }}>
                        <div style={{ marginBottom: SpacingToken.lg, fontSize: Typography.uiSmall.fontSize, color: Colors.text.secondary }}>
                            {allReviewed ? 'Todas as divergências resolvidas.' : 'Resolva as pendências acima antes de integrar.'}
                        </div>
                        <Button
                            disabled={!allReviewed}
                            onClick={handleCommitSession}
                            fullWidth
                            variant={allReviewed ? 'primary' : 'ghost'}
                            size="lg"
                        >
                            INTEGRAR AO ESTOQUE
                        </Button>
                    </div>

                </div>
            )}
        </div>
    );
};
