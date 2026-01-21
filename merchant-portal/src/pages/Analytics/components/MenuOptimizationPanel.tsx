
import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ReferenceLine, Label, Cell } from 'recharts';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import type { ProductPerformance } from '../hooks/useRealAnalytics';

interface MenuOptimizationPanelProps {
    products: ProductPerformance[];
}

interface PlotPoint {
    name: string;
    popularity: number; // Volume Sold
    profitability: number; // Unit Margin €
    totalMargin: number; // Total Margin (for bubble size logic if needed)
    type: 'star' | 'plowhorse' | 'puzzle' | 'dog';
}

const COLORS: Record<PlotPoint['type'], string> = {
    star: '#10B981',      // Green - High Profit, High Pop
    plowhorse: '#F59E0B', // Yellow - Low Profit, High Pop
    puzzle: '#8B5CF6',    // Purple - High Profit, Low Pop
    dog: '#EF4444'        // Red - Low Profit, Low Pop
};

export const MenuOptimizationPanel: React.FC<MenuOptimizationPanelProps> = ({ products }) => {

    // 1. Calculate Averages for Quadrants
    const { processedData, avgPopularity, avgProfitability } = useMemo(() => {
        if (!products || products.length === 0) {
            return { processedData: [], avgPopularity: 0, avgProfitability: 0 };
        }

        const totalItems = products.length;
        const totalVolume = products.reduce((acc, p) => acc + p.totalQuantity, 0);

        // Avg Popularity = TotalVolume / CountItems (Average volume per item on menu)
        // Or sometimes strictly "Average Popularity Share", but raw volume is easier to read
        const avgPop = totalVolume / totalItems;

        // Avg Profitability = Average Unit Margin across menu
        // First calculate unit margin for each, then avg
        const totalUnitMargin = products.reduce((acc, p) => {
            const unitMargin = p.totalQuantity > 0 ? (p.grossMargin / p.totalQuantity) : 0;
            return acc + unitMargin;
        }, 0);
        const avgProf = totalUnitMargin / totalItems;

        const data: PlotPoint[] = products.map(p => {
            const unitMargin = p.totalQuantity > 0 ? (p.grossMargin / p.totalQuantity) : 0;
            let type: PlotPoint['type'] = 'dog';

            if (p.totalQuantity >= avgPop && unitMargin >= avgProf) type = 'star';
            else if (p.totalQuantity >= avgPop && unitMargin < avgProf) type = 'plowhorse';
            else if (p.totalQuantity < avgPop && unitMargin >= avgProf) type = 'puzzle';
            else type = 'dog';

            return {
                name: p.name,
                popularity: p.totalQuantity,
                profitability: unitMargin,
                totalMargin: p.grossMargin,
                type
            };
        });

        return {
            processedData: data,
            avgPopularity: avgPop,
            avgProfitability: avgProf
        };
    }, [products]);

    // Custom Tooltip
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as PlotPoint;
            return (
                <div style={{ backgroundColor: '#1E293B', padding: '10px', borderRadius: '8px', border: '1px solid #334155', color: '#FFF' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{data.name}</p>
                    <p style={{ fontSize: '12px' }}>📊 Vendas: {data.popularity}</p>
                    <p style={{ fontSize: '12px' }}>💰 Margem Unit: €{data.profitability.toFixed(2)}</p>
                    <p style={{ fontSize: '12px', textTransform: 'capitalize', color: COLORS[data.type] }}>Type: {data.type}</p>
                </div>
            );
        }
        return null;
    };

    if (products.length === 0) {
        return null;
    }

    return (
        <Card surface="layer1" padding="lg">
            <div style={{ marginBottom: 20 }}>
                <Text size="lg" weight="bold">🦁 Engenharia de Menu (Menu Engineering)</Text>
                <Text size="sm" color="secondary">Matriz de Lucratividade vs. Popularidade</Text>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        type="number"
                        dataKey="popularity"
                        name="Popularidade (Qtd)"
                        unit=" un"
                        stroke="#94A3B8"
                        tick={{ fontSize: 12 }}
                    >
                        <Label value="Popularidade (Volume de Vendas)" offset={-10} position="insideBottom" fill="#94A3B8" fontSize={12} />
                    </XAxis>
                    <YAxis
                        type="number"
                        dataKey="profitability"
                        name="Lucratividade (€)"
                        unit="€"
                        stroke="#94A3B8"
                        tick={{ fontSize: 12 }}
                    >
                        <Label value="Lucratividade (Margem Unitária)" angle={-90} position="insideLeft" fill="#94A3B8" fontSize={12} />
                    </YAxis>
                    <ZAxis range={[60, 400]} /> {/* Bubble size range */}
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

                    {/* Quadrant Lines */}
                    <ReferenceLine x={avgPopularity} stroke="#CBD5E1" strokeDasharray="3 3" strokeOpacity={0.5}>
                        <Label value="Média Vol" position="insideTopRight" fill="#CBD5E1" fontSize={10} />
                    </ReferenceLine>
                    <ReferenceLine y={avgProfitability} stroke="#CBD5E1" strokeDasharray="3 3" strokeOpacity={0.5}>
                        <Label value="Média Margem" position="insideTopRight" fill="#CBD5E1" fontSize={10} />
                    </ReferenceLine>

                    <Scatter name="Menu Items" data={processedData}>
                        {processedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.type]} />
                        ))}
                    </Scatter>

                    {/* Quadrant Labels (Approximate positions) */}
                    <ReferenceLine y={avgProfitability * 1.5} stroke="none">
                        <Label value="PUZZLES (Alta Margem, Baixa Venda)" position="insideLeft" fill={COLORS.puzzle} fontSize={10} opacity={0.8} />
                    </ReferenceLine>
                    <ReferenceLine y={avgProfitability * 1.5} stroke="none">
                        <Label value="STARS (Alta Margem, Alta Venda)" position="insideRight" fill={COLORS.star} fontSize={10} opacity={0.8} />
                    </ReferenceLine>
                </ScatterChart>
            </ResponsiveContainer>

            {/* Legend / Metrics */}
            <div style={{ display: 'flex', gap: 20, marginTop: 20, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.star }} />
                    <Text size="sm">Stars</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.plowhorse }} />
                    <Text size="sm">Plowhorses</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.puzzle }} />
                    <Text size="sm">Puzzles</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.dog }} />
                    <Text size="sm">Dogs</Text>
                </div>
            </div>
        </Card>
    );
};
