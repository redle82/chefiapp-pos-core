import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../supabaseClient';

interface FinancialMetrics {
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    order_count: number;
    margin_percent: number;
}

export const FinancialPage: React.FC = () => {
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('today'); // today, week, month

    useEffect(() => {
        fetchMetrics();
    }, [dateRange]);

    const fetchMetrics = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Restaurant ID (Simplified: first one found)
        const { data: member } = await supabase
            .from('restaurant_members')
            .select('restaurant_id')
            .eq('user_id', user.id)
            .single();

        if (!member) return;

        let startDate = new Date();
        const endDate = new Date();

        if (dateRange === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const { data, error } = await supabase
            .rpc('get_financial_metrics', {
                p_restaurant_id: member.restaurant_id,
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString()
            });

        if (error) {
            console.error('Error fetching metrics', error);
        } else if (data && data.length > 0) {
            setMetrics(data[0]);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8">Calculando P&L...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Relatório Financeiro (DRE)</h1>
                <div className="space-x-2">
                    <Button onClick={() => setDateRange('today')} variant={dateRange === 'today' ? 'primary' : 'outline'}>Hoje</Button>
                    <Button onClick={() => setDateRange('week')} variant={dateRange === 'week' ? 'primary' : 'outline'}>7 Dias</Button>
                    <Button onClick={() => setDateRange('month')} variant={dateRange === 'month' ? 'primary' : 'outline'}>30 Dias</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 bg-white shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Receita Bruta</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        {((metrics?.total_revenue || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </Card>
                <Card className="p-6 bg-white shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Custo (CMV)</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                        {((metrics?.total_cost || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </Card>
                <Card className="p-6 bg-white shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Lucro Bruto</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {((metrics?.gross_profit || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </Card>
                <Card className="p-6 bg-white shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Margem</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {metrics?.margin_percent || 0}%
                    </p>
                </Card>
            </div>

            {/* Placeholder for Chart */}
            <Card className="p-8 border-dashed border-2 border-gray-200 bg-gray-50 flex items-center justify-center h-64">
                <p className="text-gray-400">Gráfico de Evolução (Receita x Custo) em desenvolvimento</p>
            </Card>

             <div className="mt-4 text-xs text-gray-400">
                * Dados baseados em pedidos confirmados (não cancelados). O Custo é baseado no snapshot do momento da venda.
            </div>
        </div>
    );
};
