import React from 'react';
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

export const TableMapPanel: React.FC<TableMapPanelProps> = ({ tables, onSelectTable, onCreateOrder }) => {



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

    const getStatusColor = (status: string, orderInfo?: TableData['orderInfo']) => {
        if (orderInfo) {
            switch (orderInfo.status) {
                case 'partially_paid': return colors.warning.base;
                case 'paid': return colors.success.base;
                case 'ready': return colors.info.base;
                case 'preparing': return colors.action.base;
                default: return colors.warning.base;
            }
        }
        switch (status) {
            case 'free': return colors.success.base;
            case 'occupied': return colors.warning.base;
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
                    const statusColor = getStatusColor(table.status, table.orderInfo);
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
                                    <div style={{
                                        width: 12, height: 12, borderRadius: '50%',
                                        backgroundColor: statusColor
                                    }} />
                                </div>

                                <div style={{ marginTop: spacing[2] }}>
                                    <Text size="xs" weight="bold" style={{ color: statusColor }}>
                                        {getStatusLabel(table.status, table.orderInfo)}
                                    </Text>
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
};
