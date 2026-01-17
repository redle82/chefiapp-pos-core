import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Input } from '../../ui/design-system/primitives/Input';
import { useTenant } from '../../core/tenant/TenantContext';
import { FinanceEngine, type FinanceSnapshot } from '../../core/reports/FinanceEngine';
import { Logger } from '../../core/logger';

export const DailyClosing: React.FC = () => {
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [fiscalQueueCount, setFiscalQueueCount] = useState<number>(0);

    // Inputs for reconciliation
    const [countedCash, setCountedCash] = useState<string>('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!tenantId) return;
            try {
                setLoading(true);
                const data = await FinanceEngine.getDailySnapshot(tenantId);
                setSnapshot(data);

                // Check Fiscal Queue
                const { count, error } = await supabase
                    .from('gm_fiscal_queue')
                    .select('*', { count: 'exact', head: true })
                    .eq('restaurant_id', tenantId)
                    .in('status', ['pending', 'failed']);

                if (!error) setFiscalQueueCount(count || 0);

            } catch (err) {
                Logger.error('Failed to load finance data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tenantId]);

    const systemCash = (snapshot?.paymentMethods['cash'] || 0) / 100;
    const systemCard = (Object.entries(snapshot?.paymentMethods || {})
        .filter(([k]) => k !== 'cash')
        .reduce((sum, [, v]) => sum + v, 0)) / 100;

    const cashDiff = (parseFloat(countedCash) || 0) - systemCash;

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-900 text-white animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Fechamento de Caixa</h1>
                    <Text size="sm" color="tertiary">{new Date().toLocaleDateString()} (Hoje)</Text>
                </div>
                <Button onClick={() => navigate('/app/dashboard')} variant="outline" tone="neutral">
                    Voltar
                </Button>
            </div>

            {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">Carregando...</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 0. FISCAL STATUS */}
                <Card surface="layer1" padding="xl">
                    <Text size="lg" weight="bold" className="mb-6 border-b border-gray-700 pb-2">Fiscal Status</Text>

                    <div className="flex flex-col items-center justify-center py-4 bg-gray-800 rounded-lg">
                        <Text size="3xl" weight="black" color={fiscalQueueCount > 0 ? 'destructive' : 'success'}>
                            {fiscalQueueCount}
                        </Text>
                        <Text size="sm" color="tertiary" className="mt-2">Faturas Pendentes</Text>
                    </div>

                    <div className="mt-4 text-center">
                        {fiscalQueueCount > 0 ? (
                            <>
                                <p className="text-yellow-500 text-xs mb-3">
                                    Existem faturas não emitidas. Tente reprocessar antes de fechar.
                                </p>
                                <Button variant="solid" tone="critical" fullWidth onClick={() => alert('Retry logic not implemented yet. Please check invoices manually.')}>
                                    Reprocessar Fila
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-green-500 text-sm">
                                <span>✅</span>
                                <span>Tudo em ordem.</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* 1. SYSTEM TOTALS */}
                <Card surface="layer1" padding="xl">
                    <Text size="lg" weight="bold" className="mb-6 border-b border-gray-700 pb-2">Totais do Sistema</Text>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Text color="secondary">Vendas em Dinheiro</Text>
                            <Text weight="bold" size="lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(systemCash)}</Text>
                        </div>
                        <div className="flex justify-between items-center">
                            <Text color="secondary">Vendas em Cartão</Text>
                            <Text weight="bold" size="lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(systemCard)}</Text>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                            <Text weight="bold" color="primary">Total Geral</Text>
                            <Text weight="black" size="xl" color="primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(systemCard + systemCash)}</Text>
                        </div>
                    </div>
                </Card>

                {/* 2. RECONCILIATION */}
                <Card surface="layer1" padding="xl">
                    <Text size="lg" weight="bold" className="mb-6 border-b border-gray-700 pb-2">Conferência Física</Text>

                    <div className="space-y-6">
                        <Input
                            label="Dinheiro em Gaveta (Contado)"
                            type="number"
                            placeholder="0.00"
                            value={countedCash}
                            onChange={(e) => setCountedCash(e.target.value)}
                            fullWidth
                        />

                        <div className={`p-4 rounded-lg border ${Math.abs(cashDiff) < 0.1 ? 'bg-green-900/20 border-green-500/30' :
                            cashDiff < 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-yellow-900/20 border-yellow-500/30'
                            }`}>
                            <div className="flex justify-between items-center">
                                <Text size="sm" color="tertiary">Diferença de Caixa</Text>
                                <Text weight="bold" color={Math.abs(cashDiff) < 0.1 ? 'success' : 'destructive'}>
                                    {cashDiff > 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cashDiff)}
                                </Text>
                            </div>
                        </div>

                        <Input
                            label="Observações do Fechamento"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            fullWidth
                            placeholder="Ex: Diferença justificada por quebra de caixa..."
                        />
                    </div>
                </Card>
            </div>

            <div className="flex justify-end pt-6">
                <Button
                    tone="accent"
                    size="lg"
                    onClick={() => alert(`Fechamento Simulado!\n\nDinheiro: ${systemCash}\nCartão: ${systemCard}\nDiferença: ${cashDiff.toFixed(2)}`)}
                >
                    Confirmar Fechamento do Dia
                </Button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
                * Esta ação irá gerar um relatório imutável e resetar o caixa para o próximo turno. (Simulado na Sprint 4)
            </p>
        </div>
    );
};
