import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FinanceEngine } from '../../core/reports/FinanceEngine';
import { Button } from '../../ui/design-system/primitives/Button';
import { Logger } from '../../core/logger';
import { useTenant } from '../../core/tenant/TenantContext';

export const ZReportPrint: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { restaurant } = useTenant(); // To show restaurant name
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const data = await FinanceEngine.getZReport(id);
                setReport(data);
            } catch (err) {
                Logger.error('Failed to load Z-Report', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="p-8 text-white">Carregando Relatório...</div>;
    if (!report) return <div className="p-8 text-red-500">Relatório não encontrado.</div>;

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-PT');
    };

    const paymentMethods = report.payment_method_breakdown || {};

    return (
        <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
            {/* Action Bar */}
            <div className="w-full max-w-md flex justify-between mb-6 print:hidden">
                <Button variant="outline" tone="neutral" onClick={() => navigate('/app/reports/daily-closing')}>
                    Voltar
                </Button>
                <Button tone="action" onClick={() => window.print()}>
                    Imprimir (PDF)
                </Button>
            </div>

            {/* Receipt Container */}
            <div className="bg-white text-black p-8 max-w-md w-full shadow-lg rounded-sm print:shadow-none print:w-full print:max-w-none">

                {/* Header */}
                <div className="text-center border-b border-black/10 pb-4 mb-4">
                    <h1 className="text-xl font-bold uppercase">{restaurant?.name || 'Restaurante'}</h1>
                    <p className="text-sm text-gray-600">Fecho de Dia (Relatório Z)</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {report.id.split('-')[0]}</p>
                </div>

                {/* Period */}
                <div className="mb-6 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Abertura:</span>
                        <span className="font-mono">{formatDate(report.opened_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Fecho:</span>
                        <span className="font-mono">{formatDate(report.closed_at)}</span>
                    </div>
                </div>

                {/* Totals */}
                <div className="border-b-2 border-dashed border-black/20 pb-4 mb-4">
                    <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-lg">Vendas Brutas</span>
                        <span className="font-bold text-xl">{formatCurrency(report.total_gross_cents)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Pedidos</span>
                        <span>{report.orders_count}</span>
                    </div>
                </div>

                {/* Payments */}
                <div className="mb-6">
                    <h3 className="font-bold text-sm uppercase mb-2 border-b border-black/10 pb-1">Pagamentos</h3>
                    <div className="space-y-1 text-sm">
                        {Object.entries(paymentMethods).map(([method, amount]: [string, any]) => (
                            <div key={method} className="flex justify-between">
                                <span className="capitalize text-gray-700">{method}</span>
                                <span className="font-mono">{formatCurrency(amount as number)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reconciliation */}
                <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-6 print:border-black/10">
                    <h3 className="font-bold text-xs uppercase mb-2 text-gray-500">Conferência</h3>
                    {report.notes && (
                        <div className="mb-2 text-sm italic">
                            "{report.notes}"
                        </div>
                    )}
                    {/* Note: We might want to compute difference if not stored directly, 
                        but usually closing logic handles it. 
                        Ideally we show "Declared" vs "System". 
                        The schema shows 'notes', 'total_gross'. 
                        Doesn't explicity show declared cash. 
                        We check 'cash_diff' returned by closeDay RPC? 
                        Wait, schema check showed total_gross, total_net. 
                        Did not show 'declared_cash'. 
                        Assuming it might be in JSONB or just not stored (only notes).
                        I'll skip specific declared value if not in schema.
                    */}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 mt-8 border-t border-black/10 pt-4">
                    <p>Processado por ChefiApp POS</p>
                    <p>{new Date().toLocaleString()}</p>
                </div>
            </div>

            <style>{`
                @media print {
                    body { background: white; }
                    .print\\:hidden { display: none; }
                    .print\\:shadow-none { box-shadow: none; }
                    .print\\:w-full { width: 100%; }
                    .print\\:max-w-none { max-width: none; }
                }
            `}</style>
        </div>
    );
};
