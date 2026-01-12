/**
 * P4-4: Advanced Analytics Charts Component
 * 
 * Gráficos interativos usando Recharts
 */

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';

interface ChartData {
    name: string;
    value: number;
    [key: string]: string | number;
}

interface AdvancedChartsProps {
    revenueData: ChartData[];
    ordersData: ChartData[];
    topProducts: Array<{ name: string; value: number }>;
    peakHours: Record<number, number>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
    revenueData,
    ordersData,
    topProducts,
    peakHours,
}) => {
    // Convert peakHours to chart data
    const peakHoursData = Object.entries(peakHours).map(([hour, count]) => ({
        name: `${hour}h`,
        value: count,
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Revenue Trend */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>📈 Tendência de Receita</Text>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} name="Receita (€)" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Orders Trend */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>📦 Tendência de Pedidos</Text>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ordersData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#00C49F" name="Pedidos" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Top Products */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>🏆 Produtos Mais Vendidos</Text>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={topProducts}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {topProducts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Card>

            {/* Peak Hours */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>⏰ Horários de Pico</Text>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peakHoursData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#FF8042" name="Pedidos" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};
