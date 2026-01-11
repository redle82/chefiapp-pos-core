import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { useTenant } from '../../core/tenant/TenantContext';
import { FinanceEngine, FinanceSnapshot } from '../../core/reports/FinanceEngine';
import { Logger } from '../../core/logger/Logger';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const FinanceDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!tenantId) return;
            try {
                setLoading(true);
                const data = await FinanceEngine.getDailySnapshot(tenantId);
                setSnapshot(data);
            } catch (err) {
                Logger.error('Failed to load finance data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tenantId]);

    if (loading) {
        return <div className="p-8 text-white">Loading Financial Data...</div>;
    }

    if (!snapshot) {
        return <div className="p-8 text-white">No data available.</div>;
    }

    // Transform hourly sales for Recharts
    const chartData = Object.entries(snapshot.hourlySales).map(([hour, cents]) => ({
        hour: `${hour}:00`,
        amount: cents / 100
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Pad missing hours for a full 24h view if needed, or just show active hours
    // Let's show active hours mostly, or full day if empty.

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-900 text-white animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                        Relatório de Vendas
                    </h1>
                    <Text size="sm" color="tertiary">{new Date().toLocaleDateString()} (Hoje)</Text>
                </div>
                <Button onClick={() => navigate('/app/dashboard')} variant="outline" tone="neutral">
                    Voltar
                </Button>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card surface="layer1" padding="lg">
                    <Text size="sm" color="secondary">Vendas Totais</Text>
                    <div className="text-3xl font-bold text-green-400 mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(snapshot.totalRevenue)}
                    </div>
                </Card>
                <Card surface="layer1" padding="lg">
                    <Text size="sm" color="secondary">Pedidos</Text>
                    <div className="text-3xl font-bold text-white mt-2">
                        {snapshot.totalOrders}
                    </div>
                </Card>
                <Card surface="layer1" padding="lg">
                    <Text size="sm" color="secondary">Ticket Médio</Text>
                    <div className="text-3xl font-bold text-blue-400 mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(snapshot.averageTicket)}
                    </div>
                </Card>
            </div>

            {/* CHART */}
            <Card surface="layer1" padding="xl" className="h-96">
                <div className="flex justify-between mb-4">
                    <Text size="lg" weight="bold">Vendas por Hora</Text>
                </div>
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="hour"
                                stroke="#666"
                                tick={{ fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                            />
                            <Bar
                                dataKey="amount"
                                fill="#fbbf24"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* PAYMENT METHODS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" className="mb-4">Métodos de Pagamento</Text>
                    <div className="space-y-3">
                        {Object.entries(snapshot.paymentMethods).map(([method, cents]) => (
                            <div key={method} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                <span className="capitalize text-gray-300">{method}</span>
                                <span className="font-mono font-bold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)}
                                </span>
                            </div>
                        ))}
                        {Object.keys(snapshot.paymentMethods).length === 0 && (
                            <Text color="tertiary">Nenhum pagamento registrado hoje.</Text>
                        )}
                    </div>
                </Card>

                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" className="mb-4">Resumo Operacional</Text>
                    <div className="space-y-2 text-sm text-gray-400">
                        <p>Total de Transações: {Object.values(snapshot.paymentMethods).length > 0 ? 'Analítico indisponível' : '0'}</p>
                        <p>Cancelamentos: --</p>
                        <p>Descontos Aplicados: --</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
