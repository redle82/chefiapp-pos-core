import React, { memo } from 'react';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

// Define Table interface locally or import (ideally import but avoiding huge refactor, redefining for now or importing from logic layer)
// Importing from context seems cleanest but it's in pages/TPV/context.
// For UI component, let's keep it pure and define interface props.
export interface TableData {
    id: string;
    number: number;
    status: 'free' | 'occupied' | 'reserved';
    seats: number;
    x?: number;
    y?: number;
    // SEMANA 1 - Tarefa 1.1: Informações do pedido ativo
    orderInfo?: {
        id: string;
        status: 'new' | 'preparing' | 'ready' | 'served' | 'paid' | 'partially_paid' | 'cancelled';
        total: number; // em centavos
    };
}

interface TableMapPanelProps {
    tables: TableData[];
    onSelectTable: (tableId: string) => void;
    onCreateOrder?: (tableId: string) => void; // SEMANA 1 - Tarefa 1.1: Ação rápida para criar pedido
}

// FASE 5: Memoizar componente pesado para melhorar performance
export const TableMapPanel: React.FC<TableMapPanelProps> = memo(({ tables, onSelectTable, onCreateOrder }) => {



    const getStatusLabel = (status: string, orderInfo?: TableData['orderInfo']) => {
        if (orderInfo) {
            switch (orderInfo.status) {
                case 'partially_paid': return 'PAGO PARCIAL';
                case 'paid': return 'PAGO';
                case 'ready': return 'PRONTO';
                case 'preparing': return 'PREPARANDO';
                default: return 'OCUPADA';
            }
        }
        switch (status) {
            case 'free': return 'LIVRE';
            case 'occupied': return 'OCUPADA';
            case 'reserved': return 'RESERVADA';
            default: return 'DESC.';
        }
    };

    // RADAR: Enhanced Color Logic
    const getHealthAwareColor = (status: string, health: string | undefined, orderInfo?: TableData['orderInfo']) => {
        // 1. Critical Operational States (Override everything)
        if (health === 'angry') return colors.critical.base;
        if (health === 'pulsing') return colors.action.base;

        // 2. Order Status
        if (orderInfo) {
            switch (orderInfo.status) {
                case 'partially_paid': return colors.warning.base;
                case 'paid': return colors.success.base;
                case 'ready': return colors.info.base;
                case 'preparing': return colors.action.base;
                default:
                    // 3. Emotional State fallback for occupied tables
                    return health === 'bored' ? colors.warning.base : colors.success.base;
            }
        }

        // 4. Default Status Colors
        switch (status) {
            case 'free': return colors.success.base;
            // Emotional state for occupied but no order info (rare edge case)
            case 'occupied': return health === 'bored' ? colors.warning.base : colors.success.base;
            case 'reserved': return colors.info.base;
            default: return colors.text.tertiary;
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size="xl" weight="black" color="primary">Mapa de Mesas</Text>
                <Badge status="ready" label={`${tables.filter(t => t.status === 'free').length} Livres`} variant="outline" />
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: spacing[4],
                overflowY: 'auto',
                paddingBottom: spacing[4]
            }}>
                {tables.map(table => {
                    // Safe cast for augmented props
                    const health = (table as any).health;
                    const statusColor = getHealthAwareColor(table.status, health, table.orderInfo);

                    const isFree = table.status === 'free';
                    const hasOrder = !!table.orderInfo;

                    // Formatar total do pedido
                    const formatTotal = (cents: number): string => {
                        return new Intl.NumberFormat('pt-PT', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(cents / 100);
                    };

                    return (
                        <div
                            key={table.id}
                            onClick={() => onSelectTable(table.id)}
                            onDoubleClick={() => {
                                if (isFree && onCreateOrder) {
                                    onCreateOrder(table.id);
                                }
                            }}
                            style={{
                                cursor: 'pointer',
                                minHeight: hasOrder ? '140px' : '120px',
                                border: `2px solid ${isFree ? 'transparent' : statusColor}`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                backgroundColor: isFree ? `${colors.success.base}10` : undefined,
                                borderRadius: '8px',
                                position: 'relative'
                            }}
                        >
                            <Card
                                surface="layer2"
                                padding="md"
                                hoverable
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Text size="2xl" weight="black" color="primary">{table.number}</Text>
                                    {/* RADAR OPERACIONAL: Heartbeat Visualization */}
                                    <div style={{
                                        width: 12, height: 12, borderRadius: '50%',
                                        backgroundColor: statusColor,
                                        boxShadow: (table as any).health === 'pulsing' || (table as any).health === 'angry'
                                            ? `0 0 8px ${statusColor}`
                                            : 'none',
                                        animation: (table as any).health === 'pulsing'
                                            ? 'pulse-radar 1.5s infinite'
                                            : (table as any).health === 'angry' ? 'pulse-slow 3s infinite' : 'none'
                                    }} />

                                    {/* Inject Global Styles for Animation (Temporary, ideally in global CSS) */}
                                    <style>{`
                                        @keyframes pulse-radar {
                                            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--color-action-base), 0.7); }
                                            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(var(--color-action-base), 0); }
                                            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--color-action-base), 0); }
                                        }
                                        @keyframes pulse-slow {
                                            0% { opacity: 1; }
                                            50% { opacity: 0.6; }
                                            100% { opacity: 1; }
                                        }
                                    `}</style>
                                </div>

                                <div style={{ marginTop: spacing[2] }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text size="xs" weight="bold" style={{ color: statusColor }}>
                                            {getStatusLabel(table.status, table.orderInfo)}
                                        </Text>

                                        {/* RADAR: Show Wait Time if relevant */}
                                        {((table as any).waitMinutes > 15 || (table as any).health === 'pulsing') && (
                                            <Text size="xs" color="critical" weight="bold">
                                                {(table as any).health === 'pulsing' ? 'CHAMANDO' : `${Math.floor((table as any).waitMinutes)}m`}
                                            </Text>
                                        )}
                                    </div>
                                    <Text size="xs" color="tertiary">{table.seats} Lugares</Text>

                                    {/* SEMANA 1 - Tarefa 1.1: Mostrar informações do pedido */}
                                    {hasOrder && table.orderInfo && (
                                        <div style={{ marginTop: spacing[1], paddingTop: spacing[1], borderTop: `1px solid ${colors.border.subtle}` }}>
                                            <Text size="xs" color="primary" weight="semibold">
                                                {formatTotal(table.orderInfo.total)}
                                            </Text>
                                            {table.orderInfo.status === 'partially_paid' && (
                                                <Text size="xs" color="warning" style={{ display: 'block', marginTop: 2 }}>
                                                    ⚠️ Parcial
                                                </Text>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* SEMANA 1 - Tarefa 1.1: Botão de ação rápida para mesa livre */}
                                {isFree && onCreateOrder && (
                                    <div
                                        style={{
                                            marginTop: spacing[2],
                                            paddingTop: spacing[2],
                                            borderTop: `1px solid ${colors.border.subtle}`
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCreateOrder(table.id);
                                        }}
                                    >
                                        <Text
                                            size="xs"
                                            color="action"
                                            weight="bold"
                                            style={{
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                padding: spacing[1],
                                                backgroundColor: `${colors.action.base}10`,
                                                borderRadius: 4
                                            }}
                                        >
                                            + Abrir Conta
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // FASE 5: Comparação customizada para evitar re-renders desnecessários
    return (
        prevProps.tables.length === nextProps.tables.length &&
        prevProps.tables.every((table, idx) => 
            table.id === nextProps.tables[idx]?.id &&
            table.status === nextProps.tables[idx]?.status
        )
    );
});
