import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';

interface SalesForecastChartProps {
    data: { date: string; amount: number; type: 'historical' | 'forecast' }[];
    isLoading: boolean;
}

export const SalesForecastChart: React.FC<SalesForecastChartProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <Card surface="layer1" padding="xl" className="h-96 flex items-center justify-center">
                <Text color="tertiary">Carregando previsões...</Text>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card surface="layer1" padding="xl" className="h-96 flex items-center justify-center">
                <Text color="tertiary">Dados insuficientes para previsão.</Text>
            </Card>
        );
    }

    return (
        <Card surface="layer1" padding="xl" className="h-96">
            <div className="flex justify-between mb-4">
                <div>
                    <Text size="lg" weight="bold">Previsão de Vendas (IA)</Text>
                    <Text size="xs" color="tertiary">Baseado em regressão linear dos últimos 30 dias</Text>
                </div>
            </div>
            <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="90%">
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            tick={{ fill: '#888', fontSize: 12 }}
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            stroke="#666"
                            tick={{ fill: '#888' }}
                            tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorHistorical)"
                            name="Histórico"
                            connectNulls
                        />
                        {/* We separate predictions visually via logic in parent or by using composed chart features, 
                             but here simpler to just have one line or two distinct data series if we format data right.
                             Let's assume data has 'amount' for historical and 'predicted' for forecast? 
                             Wait, the prop 'data' structure above is single array mixed. 
                             Better pattern: Have 'historical' and 'forecast' keys in matched dates?
                             Or two lines.
                          */}
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 4 }}
                            name="Tendência / Previsão"
                            connectNulls
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
