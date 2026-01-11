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
}

interface TableMapPanelProps {
    tables: TableData[];
    onSelectTable: (tableId: string) => void;
}

export const TableMapPanel: React.FC<TableMapPanelProps> = ({ tables, onSelectTable }) => {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'free': return colors.success.base;
            case 'occupied': return colors.warning.base;
            case 'reserved': return colors.info.base;
            default: return colors.text.tertiary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'free': return 'LIVRE';
            case 'occupied': return 'OCUPADA';
            case 'reserved': return 'RESERVADA';
            default: return 'DESC.';
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
                    const statusColor = getStatusColor(table.status);
                    const isFree = table.status === 'free';

                    return (
                        <div
                            key={table.id}
                            onClick={() => onSelectTable(table.id)}
                            style={{
                                cursor: 'pointer',
                                height: '120px',
                                border: `2px solid ${isFree ? 'transparent' : statusColor}`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                backgroundColor: isFree ? `${colors.success.base}10` : undefined,
                                borderRadius: '8px'
                            }}
                        >
                            <Card
                                surface="layer2"
                                padding="md"
                                hoverable
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text size="2xl" weight="black" color="primary">{table.number}</Text>
                                    <div style={{
                                        width: 12, height: 12, borderRadius: '50%',
                                        backgroundColor: statusColor
                                    }} />
                                </div>

                                <div>
                                    <Text size="xs" weight="bold" style={{ color: statusColor }}>
                                        {getStatusLabel(table.status)}
                                    </Text>
                                    <Text size="xs" color="tertiary">{table.seats} Lugares</Text>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
