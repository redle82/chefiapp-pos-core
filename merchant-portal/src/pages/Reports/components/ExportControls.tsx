
import React, { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Download, Printer, FileText } from 'lucide-react';
import { FinanceSnapshot } from '../../../core/reports/FinanceEngine';
import { CustomReportBuilder } from './CustomReportBuilder';

interface ExportControlsProps {
    data: FinanceSnapshot | null;
    fileName?: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ data, fileName = 'relatorio-vendas' }) => {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    const handleExportCSV = () => {
        if (!data) return;

        const csvData = [
            {
                Data: data.date,
                Receita_Total: data.totalRevenue.toFixed(2),
                Custo_Total: data.totalCost.toFixed(2),
                Margem_Bruta: data.grossMargin.toFixed(2),
                Pedidos: data.totalOrders,
                Ticket_Medio: data.averageTicket.toFixed(2),
                ...Object.entries(data.paymentMethods).reduce((acc, [method, cent]) => ({
                    ...acc,
                    [`Pagamento_${method}`]: (cent / 100).toFixed(2)
                }), {})
            }
        ];

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <div className="flex gap-2 print:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBuilderOpen(true)}
                    leftIcon={<FileText size={16} />}
                >
                    Relatório Personalizado
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<Printer size={16} />}
                >
                    Imprimir / PDF
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExportCSV}
                    leftIcon={<Download size={16} />}
                    disabled={!data}
                >
                    Exportar CSV
                </Button>
            </div>

            <CustomReportBuilder
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
            />
        </>
    );
};
