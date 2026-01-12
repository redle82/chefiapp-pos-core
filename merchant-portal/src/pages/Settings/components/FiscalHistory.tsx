/**
 * Fiscal History - Visualização de histórico de faturas
 * 
 * Permite:
 * - Visualizar faturas antigas
 * - Exportar faturas (CSV/JSON)
 * - Recuperar faturas perdidas
 * - Ver estatísticas
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';
import { useToast } from '../../../ui/design-system';
import { FiscalBackupService } from '../../../core/fiscal/FiscalBackupService';
import { Logger } from '../../../core/logger/Logger';

interface FiscalHistoryProps {
    restaurantId: string;
}

export const FiscalHistory: React.FC<FiscalHistoryProps> = ({ restaurantId }) => {
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('json');

    useEffect(() => {
        loadStats();
    }, [restaurantId]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const statsData = await FiscalBackupService.getFiscalStats(restaurantId);
            setStats(statsData);
        } catch (err) {
            Logger.error('[FiscalHistory] Failed to load stats', err);
            toastError('Erro ao carregar estatísticas');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const result = await FiscalBackupService.exportFiscals({
                format: exportFormat,
                startDate: start,
                endDate: end,
                restaurantId,
                includePending: true,
            });

            if (!result.success) {
                throw new Error(result.error || 'Erro ao exportar faturas');
            }

            // Download do arquivo
            const blob = new Blob([result.data], {
                type: exportFormat === 'csv' ? 'text/csv' : 'application/json',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            success(`Faturas exportadas: ${result.count} documentos`);
        } catch (err: any) {
            Logger.error('[FiscalHistory] Export failed', err);
            toastError('Erro ao exportar faturas: ' + (err.message || 'Unknown error'));
        } finally {
            setExporting(false);
        }
    };

    const handleCreateBackup = async () => {
        setExporting(true);
        try {
            const result = await FiscalBackupService.createAutomaticBackup(restaurantId);
            
            if (!result.success) {
                throw new Error(result.error || 'Erro ao criar backup');
            }

            // Download do backup
            const blob = new Blob([result.data], {
                type: 'application/json',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            success(`Backup criado: ${result.count} documentos`);
        } catch (err: any) {
            Logger.error('[FiscalHistory] Backup failed', err);
            toastError('Erro ao criar backup: ' + (err.message || 'Unknown error'));
        } finally {
            setExporting(false);
        }
    };

    return (
        <Card surface="base" padding="xl">
            <Text size="lg" weight="bold" color="primary" className="mb-4">
                Histórico e Backup de Faturas
            </Text>

            {/* Estatísticas */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <Text size="sm" color="secondary">Total</Text>
                        <Text size="xl" weight="bold">{stats.total}</Text>
                    </div>
                    <div>
                        <Text size="sm" color="secondary">Reportadas</Text>
                        <Text size="xl" weight="bold" color="success">{stats.reported}</Text>
                    </div>
                    <div>
                        <Text size="sm" color="secondary">Pendentes</Text>
                        <Text size="xl" weight="bold" color="warning">{stats.pending}</Text>
                    </div>
                    <div>
                        <Text size="sm" color="secondary">Rejeitadas</Text>
                        <Text size="xl" weight="bold" color="destructive">{stats.rejected}</Text>
                    </div>
                </div>
            )}

            {/* Export */}
            <div className="grid grid-cols-1 gap-4 mb-4">
                <Text size="md" weight="semibold">Exportar Faturas</Text>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Data Início"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        fullWidth
                    />
                    <Input
                        label="Data Fim"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        fullWidth
                    />
                </div>

                <div className="flex gap-4 items-end">
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                    </select>
                    <Button
                        variant="primary"
                        onClick={handleExport}
                        loading={exporting}
                        disabled={loading}
                    >
                        {exporting ? 'Exportando...' : '📥 Exportar'}
                    </Button>
                </div>
            </div>

            {/* Backup Automático */}
            <div className="mt-6 pt-6 border-t">
                <Text size="md" weight="semibold" className="mb-4">Backup Automático</Text>
                <Text size="sm" color="secondary" className="mb-4">
                    Cria backup de todas as faturas do último dia (incluindo pendentes)
                </Text>
                <Button
                    variant="secondary"
                    onClick={handleCreateBackup}
                    loading={exporting}
                    disabled={loading}
                >
                    {exporting ? 'Criando backup...' : '💾 Criar Backup Diário'}
                </Button>
            </div>
        </Card>
    );
};
