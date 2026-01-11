import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Input } from '../../ui/design-system/primitives/Input';
import { useTenant } from '../../core/tenant/TenantContext';
import { FinanceEngine, FinanceSnapshot } from '../../core/reports/FinanceEngine';
import { Logger } from '../../core/logger/Logger';

export const DailyClosing: React.FC = () => {
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
    const [loading, setLoading] = useState(true);

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
            } catch (err) {
                Logger.error('Failed to load finance data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tenantId]);

    if (loading) return <div className="p-8 text-white">Carregando fechamento...</div>;
    if (!snapshot) return <div className="p-8 text-white">Sem dados.</div>;

    const systemCash = (snapshot.paymentMethods['cash'] || 0) / 100;
    const systemCard = (Object.entries(snapshot.paymentMethods)
        .filter(([k]) => k !== 'cash')
        .reduce((sum, [, v]) => sum + v, 0)) / 100;

    const cashDiff = (parseFloat(countedCash) || 0) - systemCash;

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-900 text-white animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Fechamento de Caixa</h1>
                    <Text size="sm" color="tertiary">{new Date().toLocaleDateString()} (Hoje)</Text>
                </div>
                <Button onClick={() => navigate('/app/dashboard')} variant="outline" tone="neutral">
                    Voltar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
