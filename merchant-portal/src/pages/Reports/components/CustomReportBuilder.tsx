
import React, { useState } from 'react';
import { DateRangeSelector } from '../../../ui/design-system/DateRangeSelector';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { FinanceEngine, type FinanceSnapshot } from '../../../core/reports/FinanceEngine';
import { useTenant } from '../../../core/tenant/TenantContext';
import Papa from 'papaparse';
import { Download, X } from 'lucide-react';

interface CustomReportBuilderProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({ isOpen, onClose }) => {
    const { tenantId } = useTenant();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({ from: new Date(), to: new Date() });
    const [loading, setLoading] = useState(false);

    // Metric Toggles
    const [includeSales, setIncludeSales] = useState(true);
    const [includeStaff, setIncludeStaff] = useState(false);
    // const [includeInventory, setIncludeInventory] = useState(false); // Potential future

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!tenantId) return;
        setLoading(true);

        try {
            // 1. Fetch Data
            const snapshot = await FinanceEngine.getDailySnapshot(tenantId, dateRange.from, dateRange.to);
            let staffData: any[] = [];

            if (includeStaff) {
                staffData = await FinanceEngine.getStaffPerformance(tenantId, dateRange.from, dateRange.to);
            }

            // 2. Build CSV
            // We might need zip if multiple files, or just one big CSV?
            // Let's do Sales Summary CSV for now, maybe separate logic later.

            const csvData = [{
                Report_Type: 'Custom Financial Report',
                Start_Date: dateRange.from.toISOString().split('T')[0],
                End_Date: dateRange.to.toISOString().split('T')[0],
                Total_Revenue: snapshot.totalRevenue.toFixed(2),
                Total_Cost: snapshot.totalCost.toFixed(2),
                Gross_Margin: snapshot.grossMargin.toFixed(2),
                Total_Orders: snapshot.totalOrders,
                Avg_Ticket: snapshot.averageTicket.toFixed(2),
            }];

            if (includeStaff) {
                // If staff selected, maybe we export a SECOND file or append?
                // For simplicity, we trigger two downloads if mixed, or just one combined if clever.
                // Let's download Staff CSV separately if checked.
                const staffCSV = Papa.unparse(staffData.map(s => ({
                    Staff_ID: s.id,
                    Name: s.name,
                    Orders: s.orders,
                    Revenue: (s.revenue / 100).toFixed(2)
                })));
                downloadCSV(staffCSV, `staff_performance_${dateRange.from.toISOString().split('T')[0]}`);
            }

            if (includeSales) {
                const salesCSV = Papa.unparse(csvData);
                downloadCSV(salesCSV, `financial_summary_${dateRange.from.toISOString().split('T')[0]}`);
            }

            onClose();

        } catch (err) {
            console.error(err);
            alert('Erro ao gerar relatório.');
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (csv: string, name: string) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card surface="base" padding="xl" className="w-full max-w-lg relative border border-white/10">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>

                <div className="mb-6">
                    <Text size="xl" weight="bold" className="mb-1">Construtor de Relatórios</Text>
                    <Text color="tertiary" size="sm">Selecione o período e os dados que deseja exportar.</Text>
                </div>

                <div className="space-y-6">
                    {/* Date Selector */}
                    <div>
                        <Text size="sm" weight="medium" className="mb-2 block">Período</Text>
                        <DateRangeSelector
                            onSelect={(range) => setDateRange(range)}
                            initialPreset="today"
                        />
                    </div>

                    {/* Metrics Selector */}
                    <div>
                        <Text size="sm" weight="medium" className="mb-2 block">Dados Incluídos</Text>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={includeSales}
                                    onChange={e => setIncludeSales(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                                />
                                <div>
                                    <Text weight="bold">Vendas e Financeiro</Text>
                                    <Text size="xs" color="tertiary">Receita, Custos, Margem, Ticket Médio</Text>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                                <input
                                    type="checkbox"
                                    checked={includeStaff}
                                    onChange={e => setIncludeStaff(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                                />
                                <div>
                                    <Text weight="bold">Performance da Equipe</Text>
                                    <Text size="xs" color="tertiary">Vendas por garçom/operador</Text>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button
                            variant="primary"
                            onClick={handleGenerate}
                            disabled={loading || (!includeSales && !includeStaff)}
                            leftIcon={loading ? undefined : <Download size={18} />}
                        >
                            {loading ? 'Gerando...' : 'Baixar Relatório (.csv)'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
