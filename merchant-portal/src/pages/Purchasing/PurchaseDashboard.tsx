import React, { useMemo } from 'react';
import { useInventory } from '../Inventory/context/InventoryContext';
// import { useStaff } from '../AppStaff/context/StaffContext';
import { generatePurchaseDraft } from '../../core/inventory/PurchaseReflex';
// import type { PurchaseOrder } from '../../core/inventory/PurchaseTypes';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/Card';
import { Colors, Spacing, Typography, BorderRadius } from '../../ui/design-system/tokens';

// ------------------------------------------------------------------
// 🛒 PURCHASE DASHBOARD (THE ANTI-ANXIETY INTERFACE)
// ------------------------------------------------------------------
// "O sistema decide. O humano justifica."
// ------------------------------------------------------------------

export const PurchaseDashboard: React.FC = () => {
    const { hungerSignals } = useInventory();
    // const { activeShift } = useStaff(); // Get from StaffContext

    // 1. AUTO-GENERATE DRAFT (The System's Opinion)
    const draftOrder = useMemo(() => {
        // Staff ID mocked as 'current-user'
        return generatePurchaseDraft('current-user', hungerSignals, []);
    }, [hungerSignals]);

    const formatCurrency = (cents: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    return (
        <div style={{ padding: Spacing.lg, maxWidth: '800px', margin: '0 auto', fontFamily: Typography.fontFamily, color: Colors.text.primary }}>

            {/* HEADER */}
            <div style={{ marginBottom: Spacing['2xl'] }}>
                <div style={{
                    fontSize: Typography.uiSmall.fontSize,
                    fontWeight: 'bold',
                    color: Colors.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginBottom: Spacing.xs
                }}>
                    Ritual de Compras
                </div>
                <h1 style={{
                    fontSize: Typography.displayMedium.fontSize,
                    fontWeight: 'bold',
                    color: Colors.text.primary,
                    margin: 0
                }}>
                    Sugestão do Metabolismo
                </h1>
                <p style={{
                    fontSize: Typography.uiSmall.fontSize,
                    color: Colors.text.secondary,
                    marginTop: Spacing.xs
                }}>
                    O sistema recomenda apenas o necessário para manter o nível metabólico ideal.
                </p>
            </div>

            {/* THE DRAFT CARD */}
            <Card padding="none" style={{ overflow: 'hidden', background: Colors.surface.elevated, border: `1px solid ${Colors.surface.border}` }}>

                {/* STATUS BAR */}
                <div style={{
                    padding: `${Spacing.md} ${Spacing.lg}`,
                    background: draftOrder.requiresWitness ? `${Colors.risk.high}1a` : `${Colors.success}1a`,
                    borderBottom: `1px solid ${Colors.surface.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.xs }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: BorderRadius.full,
                            background: draftOrder.requiresWitness ? Colors.risk.high : Colors.success
                        }} />
                        <span style={{
                            fontSize: Typography.uiSmall.fontSize,
                            fontWeight: 'bold',
                            color: draftOrder.requiresWitness ? Colors.risk.high : Colors.success
                        }}>
                            {draftOrder.requiresWitness ? 'APROVAÇÃO NECESSÁRIA (WITNESS)' : 'COMPRA SAUDÁVEL'}
                        </span>
                    </div>
                    {draftOrder.requiresWitness && (
                        <span style={{ fontSize: Typography.uiTiny.fontSize, color: Colors.text.secondary }}>
                            Detectado Pânico ou Alto Valor
                        </span>
                    )}
                </div>

                {/* ITEMS LIST */}
                <div style={{ padding: '0' }}>
                    {draftOrder.items.length === 0 ? (
                        <div style={{ padding: Spacing['3xl'], textAlign: 'center', color: Colors.text.tertiary }}>
                            🥗 Metabolismo saciado. Nenhuma compra necessária agora.
                        </div>
                    ) : (
                        draftOrder.items.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: `${Spacing.lg} ${Spacing.xl}`,
                                borderBottom: `1px solid ${Colors.surface.border}`
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: Typography.uiMedium.fontSize, color: Colors.text.primary }}>
                                        {item.itemId} {/* Ideally replace with name map */}
                                    </div>
                                    <div style={{ fontSize: Typography.uiSmall.fontSize, marginTop: Spacing.xs, display: 'flex', gap: Spacing.sm }}>
                                        {/* REASON BADGE */}
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: BorderRadius.sm,
                                            textTransform: 'uppercase',
                                            fontSize: '10px',
                                            background: item.reason === 'impulse_panic' ? Colors.risk.high :
                                                item.reason === 'calendar_ritual' ? Colors.info : Colors.success,
                                            color: '#fff' // Text always white on colored badges
                                        }}>
                                            {item.reason === 'metabolic_hunger' ? 'FOME DE ESTOQUE' :
                                                item.reason === 'calendar_ritual' ? 'RITUAL DE QUARTA' :
                                                    item.reason === 'impulse_panic' ? 'IMPULSO / PÂNICO' : item.reason}
                                        </span>
                                        {/* META EXPLANATION */}
                                        {item.meta?.overriddenBy === 'maxSafeStock' && (
                                            <span style={{
                                                fontSize: '10px',
                                                color: Colors.risk.high,
                                                background: `${Colors.risk.high}1a`,
                                                padding: '2px 6px',
                                                borderRadius: BorderRadius.sm,
                                                border: `1px solid ${Colors.risk.high}4d`
                                            }}>
                                                🛡️ Bloqueado por Teto Físico
                                            </span>
                                        )}
                                        <span style={{ color: Colors.text.tertiary }}>Qtd: {item.quantity} {item.unit}</span>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 600, color: Colors.text.primary }}>
                                    {formatCurrency(item.estimatedCostEur)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* FOOTER TOTALS */}
                <div style={{
                    background: Colors.surface.base,
                    padding: Spacing.xl,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: `1px solid ${Colors.surface.border}`
                }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: Typography.uiSmall.fontSize, color: Colors.text.tertiary, textTransform: 'uppercase' }}>Potencial de Desperdício (Pânico)</div>
                        <div style={{ fontSize: Typography.uiMedium.fontSize, fontWeight: 600, color: draftOrder.panicWastePotentialEur > 0 ? Colors.risk.high : Colors.text.tertiary }}>
                            {formatCurrency(draftOrder.panicWastePotentialEur)}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: Typography.uiSmall.fontSize, color: Colors.text.tertiary, textTransform: 'uppercase' }}>Total Estimado</div>
                        <div style={{ fontSize: Typography.displaySmall.fontSize, fontWeight: 700, color: Colors.text.primary }}>
                            {formatCurrency(draftOrder.totalEstimatedEur)}
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div style={{
                    padding: `${Spacing.lg} ${Spacing.xl}`,
                    borderTop: `1px solid ${Colors.surface.border}`,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: Spacing.md,
                    background: Colors.surface.elevated
                }}>
                    <Button variant="secondary" size="md">
                        Adicionar Item Manual...
                    </Button>
                    <Button
                        variant={draftOrder.requiresWitness ? 'secondary' : 'primary'}
                        size="md"
                        disabled={draftOrder.items.length === 0}
                        style={{
                            background: draftOrder.requiresWitness ? Colors.surface.border : undefined,
                            color: draftOrder.requiresWitness ? Colors.text.disabled : undefined,
                        }}
                    >
                        {draftOrder.requiresWitness ? 'Requer Aprovação' : 'Gerar Pedido'}
                    </Button>
                    {draftOrder.requiresWitness && (
                        <Button
                            size="md"
                            style={{ background: Colors.risk.high, color: '#fff', border: 'none' }}
                        >
                            Assinar como Gerente
                        </Button>
                    )}
                </div>

            </Card>

            {/* EDUCATION: WHY? */}
            <div style={{
                marginTop: Spacing.xl,
                padding: Spacing.lg,
                background: `${Colors.info}1a`,
                borderRadius: BorderRadius.md,
                fontSize: Typography.uiSmall.fontSize,
                color: Colors.info,
                display: 'flex',
                gap: Spacing.md
            }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <div>
                    <strong>Por que seguir o sistema?</strong>
                    <br />
                    Compras manuais fora do sinal "Metabolic Hunger" aumentam o estoque sem necessidade (Ansiedade).
                    O sistema bloqueia pedidos de pânico para proteger o fluxo de caixa.
                </div>
            </div>

        </div>
    );
};
