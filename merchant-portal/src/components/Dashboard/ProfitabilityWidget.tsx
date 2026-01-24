import React from 'react';

import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { colors } from '../../ui/design-system/tokens/colors';
import { type DailyMetrics } from '../../core/services/DashboardService';

interface ProfitabilityWidgetProps {
    metrics: DailyMetrics | null;
    loading: boolean;
}

export const ProfitabilityWidget: React.FC<ProfitabilityWidgetProps> = ({ metrics, loading }) => {
    // 1. Calculate Margin
    const sales = metrics?.totalSalesCents || 0;
    const cost = metrics?.totalCostCents || 0;
    const profit = sales - cost;

    // Protection against division by zero
    const marginPercent = sales > 0 ? ((profit / sales) * 100) : 0;

    // 2. Status Determination
    let statusColor = colors.success.base; // Healthy (>50%)
    let statusMessage = "Saudável";

    if (sales === 0) {
        statusColor = colors.text.tertiary;
        statusMessage = "Sem vendas";
    } else if (cost === 0) {
        statusColor = colors.info.base; // Blue (Info)
        statusMessage = "Custo n/d"; // Likely unconfigured
    } else if (marginPercent < 30) {
        statusColor = colors.destructive.base; // Danger zone
        statusMessage = "Crítico";
    } else if (marginPercent < 50) {
        statusColor = colors.warning.base; // Watch out
        statusMessage = "Atenção";
    }

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    };

    if (loading) {
        return (
            <Card style={{ padding: 24, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text size="sm" color="tertiary">Calculando rentabilidade...</Text>
            </Card>
        );
    }

    return (
        <Card style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Text size="sm" weight="bold" color="tertiary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Rentabilidade (Hoje)
                    </Text>

                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <Text size="4xl" weight="black" style={{ color: statusColor }}>
                            {marginPercent.toFixed(1)}%
                        </Text>
                        <Text size="sm" color="secondary" weight="bold">
                            Margem Bruta
                        </Text>
                    </div>

                    <div style={{ marginTop: 8 }}>
                        <Text size="md" color="action">
                            {formatCurrency(profit)} <Text as="span" size="sm" color="tertiary">lucro estimado</Text>
                        </Text>
                    </div>
                </div>

                {/* Status Badge */}
                <div style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    backgroundColor: `${statusColor}20`, // 20% opacity
                    border: `1px solid ${statusColor}`
                }}>
                    <Text size="xs" weight="bold" style={{ color: statusColor }}>
                        {statusMessage}
                    </Text>
                </div>
            </div>

            {/* Micro-Insight */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.surface.layer2}` }}>
                {cost === 0 && sales > 0 ? (
                    <Text size="xs" color="warning">
                        ⚠️ Custos dos produtos não configurados. A margem é imprecisa.
                    </Text>
                ) : (
                    <Text size="xs" color="tertiary">
                        Baseado em {metrics?.totalOrders} pedidos hoje.
                    </Text>
                )}
            </div>

        </Card>
    );
};
