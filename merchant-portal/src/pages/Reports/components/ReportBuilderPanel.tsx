/**
 * P5-6: Report Builder Panel
 * 
 * Painel para construir relatórios customizados
 */

import React, { useState, useEffect } from 'react';
import { reportBuilder, type ReportConfig, type ReportField } from '../../../core/reporting/ReportBuilder';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';

export const ReportBuilderPanel: React.FC = () => {
    const [reports, setReports] = useState<ReportConfig[]>([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [newReportName, setNewReportName] = useState('');

    useEffect(() => {
        reportBuilder.initialize();
        setReports(reportBuilder.listReports());
    }, []);

    const createReport = () => {
        if (!newReportName.trim()) return;

        const newReport: ReportConfig = {
            id: `report-${Date.now()}`,
            name: newReportName,
            fields: [
                { id: 'date', label: 'Data', type: 'date', source: 'orders.created_at' },
                { id: 'total', label: 'Total', type: 'currency', source: 'orders.total_cents' },
            ],
            format: 'table',
        };

        reportBuilder.createReport(newReport);
        setReports(reportBuilder.listReports());
        setNewReportName('');
        setShowBuilder(false);
    };

    return (
        <Card surface="layer1" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text size="lg" weight="bold">📊 Builder de Relatórios</Text>
                <Button variant="outline" size="sm" onClick={() => setShowBuilder(!showBuilder)}>
                    {showBuilder ? '✕' : '+ Novo Relatório'}
                </Button>
            </div>

            {showBuilder && (
                <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                    <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>Criar Novo Relatório</Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Input
                            value={newReportName}
                            onChange={(e) => setNewReportName(e.target.value)}
                            placeholder="Nome do relatório..."
                            style={{ flex: 1 }}
                        />
                        <Button variant="outline" size="sm" onClick={createReport}>
                            Criar
                        </Button>
                    </div>
                </div>
            )}

            {reports.length === 0 ? (
                <Text size="sm" color="tertiary" style={{ textAlign: 'center', padding: 24 }}>
                    Nenhum relatório customizado criado ainda.
                </Text>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reports.map(report => (
                        <div key={report.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text size="sm" weight="bold">{report.name}</Text>
                                    <Text size="xs" color="tertiary">
                                        {report.fields.length} campos | Formato: {report.format}
                                    </Text>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    reportBuilder.deleteReport(report.id);
                                    setReports(reportBuilder.listReports());
                                }}>
                                    ✕
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
