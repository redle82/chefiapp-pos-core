import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { useTenant } from '../../core/tenant/TenantContext';
import { FinanceEngine, type FinanceSnapshot } from '../../core/reports/FinanceEngine';
import { Logger } from '../../core/logger';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';

export const FinanceDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
    const [financials, setFinancials] = useState<{ balance: any, payouts: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!tenantId) return;
            try {
                setLoading(true);
                const [snap, fin] = await Promise.all([
                    FinanceEngine.getDailySnapshot(tenantId),
                    FinanceEngine.getStripeFinancials(tenantId)
                ]);
                setSnapshot(snap);
                setFinancials(fin);
            } catch (err) {
                Logger.error('Failed to load finance data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tenantId]);

    if (loading) {
        return (
            <AdminLayout
                sidebar={<AdminSidebar activePath="/app/reports/finance" onNavigate={navigate} />}
                content={<div className="p-8 text-white">Carregando dados financeiros...</div>}
            />
        );
    }

    if (!snapshot) {
        return (
            <AdminLayout
                sidebar={<AdminSidebar activePath="/app/reports/finance" onNavigate={navigate} />}
                content={<div className="p-8 text-white">Nenhum dado disponível.</div>}
            />
        );
    }

    // Transform hourly sales for Recharts
    const chartData = Object.entries(snapshot.hourlySales).map(([hour, cents]) => ({
        hour: `${hour}:00`,
        amount: cents / 100
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Pad missing hours for a full 24h view if needed, or just show active hours
    // Let's show active hours mostly, or full day if empty.

    return (
        <AdminLayout
            sidebar={<AdminSidebar activePath="/app/reports/finance" onNavigate={navigate} />}
            content={
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                                Relatório de Vendas
                            </h1>
                            <Text size="sm" color="tertiary">{new Date().toLocaleDateString()} (Hoje)</Text>
                        </div>
                    </div>

                    {/* KPI GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card surface="layer1" padding="lg">
                            <Text size="sm" color="secondary">Vendas Brutas</Text>
                            <div className="text-3xl font-bold text-green-400 mt-2">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(snapshot.totalRevenue)}
                            </div>
                        </Card>
                        <Card surface="layer1" padding="lg">
                            <Text size="sm" color="secondary">Custo Mercadoria (CMV)</Text>
                            <div className="text-3xl font-bold text-red-400 mt-2">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(snapshot.totalCost)}
                            </div>
                        </Card>
                        <Card surface="layer1" padding="lg">
                            <Text size="sm" color="secondary">Margem Bruta</Text>
                            <div className="flex flex-col mt-2">
                                <span className={`text-3xl font-bold ${snapshot.grossMargin >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(snapshot.grossMargin)}
                                </span>
                                <Text size="xs" color={snapshot.totalRevenue > 0 ? 'secondary' : 'tertiary'}>
                                    {snapshot.totalRevenue > 0 ? `${((snapshot.grossMargin / snapshot.totalRevenue) * 100).toFixed(1)}%` : '0%'}
                                </Text>
                            </div>
                        </Card>
                        <Card surface="layer1" padding="lg">
                            <Text size="sm" color="secondary">Pedidos</Text>
                            <div className="flex flex-col mt-2">
                                <span className="text-3xl font-bold text-white">
                                    {snapshot.totalOrders}
                                </span>
                                <Text size="xs" color="tertiary">
                                    Ticket Médio: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(snapshot.averageTicket)}
                                </Text>
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

                    {/* STRIPE RECONCILIATION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        <Card surface="layer1" padding="lg">
                            <Text size="lg" weight="bold" className="mb-4">Saldo Stripe</Text>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <Text size="xs" color="secondary">Disponível para Saque</Text>
                                    <Text size="2xl" weight="bold" color="success" style={{ marginTop: 4 }}>
                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: financials?.balance?.currency || 'EUR' }).format((financials?.balance?.available || 0) / 100)}
                                    </Text>
                                </div>
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <Text size="xs" color="secondary">Pendente</Text>
                                    <Text size="2xl" weight="bold" color="warning" style={{ marginTop: 4 }}>
                                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: financials?.balance?.currency || 'EUR' }).format((financials?.balance?.pending || 0) / 100)}
                                    </Text>
                                </div>
                            </div>
                        </Card>

                        <Card surface="layer1" padding="lg">
                            <Text size="lg" weight="bold" className="mb-4">Últimos Pagamentos (Payouts)</Text>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {financials?.payouts.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <div>
                                            <div className="font-bold text-gray-200">
                                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: p.currency }).format(p.amount / 100)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Chega em: {new Date(p.arrival_date * 1000).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {p.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!financials?.payouts || financials.payouts.length === 0) && (
                                    <div className="text-center text-gray-500 py-4">Nenhum payout recente.</div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            }
        />
    );
};
