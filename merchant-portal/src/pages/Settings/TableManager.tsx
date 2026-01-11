/**
 * TableManager - Gestão Completa de Mesas
 * 
 * Permite criar, editar, deletar e organizar mesas do restaurante.
 * Integrado com TableContext e TPV.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useTables, type Table } from '../TPV/context/TableContext';
import { useTenant } from '../../core/tenant/TenantContext';
import { supabase } from '../../core/supabase';
import { useToast } from '../../ui/design-system';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';

interface TableFormData {
    number: number;
    seats: number;
    status: 'free' | 'occupied' | 'reserved';
}

export const TableManager: React.FC = () => {
    const { tables, loading, refreshTables } = useTables();
    const { tenantId } = useTenant();
    const { success, error: showError } = useToast();
    
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [formData, setFormData] = useState<TableFormData>({
        number: 1,
        seats: 4,
        status: 'free'
    });

    useEffect(() => {
        if (editingTable) {
            setFormData({
                number: editingTable.number,
                seats: editingTable.seats || 4,
                status: editingTable.status
            });
        } else {
            setFormData({
                number: tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1,
                seats: 4,
                status: 'free'
            });
        }
    }, [editingTable, tables]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) {
            showError('Restaurante não identificado');
            return;
        }

        try {
            // Verificar se número já existe
            const existing = tables.find(t => t.number === formData.number);
            if (existing) {
                showError(`Mesa ${formData.number} já existe`);
                return;
            }

            const { error } = await supabase
                .from('gm_tables')
                .insert({
                    restaurant_id: tenantId,
                    number: formData.number,
                    seats: formData.seats,
                    status: formData.status
                });

            if (error) throw error;

            success(`Mesa ${formData.number} criada com sucesso`);
            setShowCreateForm(false);
            await refreshTables();
        } catch (err: any) {
            console.error('Failed to create table:', err);
            showError(err.message || 'Erro ao criar mesa');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTable || !tenantId) return;

        try {
            const { error } = await supabase
                .from('gm_tables')
                .update({
                    number: formData.number,
                    seats: formData.seats,
                    status: formData.status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingTable.id)
                .eq('restaurant_id', tenantId);

            if (error) throw error;

            success(`Mesa ${formData.number} atualizada com sucesso`);
            setEditingTable(null);
            await refreshTables();
        } catch (err: any) {
            console.error('Failed to update table:', err);
            showError(err.message || 'Erro ao atualizar mesa');
        }
    };

    const handleDelete = async (tableId: string, tableNumber: number) => {
        if (!confirm(`Tem certeza que deseja deletar a Mesa ${tableNumber}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        if (!tenantId) {
            showError('Restaurante não identificado');
            return;
        }

        try {
            // Verificar se há pedidos ativos nesta mesa
            const { data: activeOrders } = await supabase
                .from('gm_orders')
                .select('id')
                .eq('restaurant_id', tenantId)
                .in('status', ['OPEN', 'IN_PREP', 'READY'])
                .eq('table_id', tableId)
                .limit(1);

            if (activeOrders && activeOrders.length > 0) {
                showError('Não é possível deletar mesa com pedidos ativos');
                return;
            }

            const { error } = await supabase
                .from('gm_tables')
                .delete()
                .eq('id', tableId)
                .eq('restaurant_id', tenantId);

            if (error) throw error;

            success(`Mesa ${tableNumber} deletada com sucesso`);
            await refreshTables();
        } catch (err: any) {
            console.error('Failed to delete table:', err);
            showError(err.message || 'Erro ao deletar mesa');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'free': return 'success';
            case 'occupied': return 'warning';
            case 'reserved': return 'info';
            default: return 'neutral';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'free': return 'Livre';
            case 'occupied': return 'Ocupada';
            case 'reserved': return 'Reservada';
            default: return status;
        }
    };

    if (loading) {
        return (
            <Card surface="layer1" padding="xl">
                <Text>Carregando mesas...</Text>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Text size="xl" weight="bold" color="primary">
                        Gestão de Mesas
                    </Text>
                    <Text size="sm" color="tertiary" style={{ marginTop: spacing[1] }}>
                        Gerencie as mesas do seu restaurante
                    </Text>
                </div>
                <Button
                    tone="action"
                    onClick={() => {
                        setEditingTable(null);
                        setShowCreateForm(true);
                    }}
                >
                    + Nova Mesa
                </Button>
            </div>

            {/* Formulário de Criação/Edição */}
            {(showCreateForm || editingTable) && (
                <Card surface="layer1" padding="lg">
                    <form onSubmit={editingTable ? handleUpdate : handleCreate}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                            <div>
                                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                                    {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
                                </Text>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
                                <div>
                                    <Text size="xs" color="tertiary" style={{ marginBottom: spacing[1] }}>
                                        Número da Mesa
                                    </Text>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: spacing[2],
                                            background: colors.surface.layer1,
                                            border: `1px solid ${colors.border.subtle}`,
                                            borderRadius: 6,
                                            color: colors.text.primary,
                                            fontSize: 14
                                        }}
                                    />
                                </div>

                                <div>
                                    <Text size="xs" color="tertiary" style={{ marginBottom: spacing[1] }}>
                                        Capacidade (lugares)
                                    </Text>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={formData.seats}
                                        onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 4 })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: spacing[2],
                                            background: colors.surface.layer1,
                                            border: `1px solid ${colors.border.subtle}`,
                                            borderRadius: 6,
                                            color: colors.text.primary,
                                            fontSize: 14
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <Text size="xs" color="tertiary" style={{ marginBottom: spacing[1] }}>
                                    Status Inicial
                                </Text>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    style={{
                                        width: '100%',
                                        padding: spacing[2],
                                        background: colors.surface.layer1,
                                        border: `1px solid ${colors.border.subtle}`,
                                        borderRadius: 6,
                                        color: colors.text.primary,
                                        fontSize: 14
                                    }}
                                >
                                    <option value="free">Livre</option>
                                    <option value="reserved">Reservada</option>
                                    <option value="occupied">Ocupada</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setEditingTable(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" tone="action">
                                    {editingTable ? 'Salvar' : 'Criar Mesa'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            )}

            {/* Lista de Mesas */}
            <Card surface="layer1" padding="lg">
                {tables.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: spacing[8] }}>
                        <Text size="lg" color="tertiary">
                            Nenhuma mesa cadastrada
                        </Text>
                        <Text size="sm" color="tertiary" style={{ marginTop: spacing[2] }}>
                            Clique em "Nova Mesa" para começar
                        </Text>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: spacing[3] }}>
                        {tables.map((table) => (
                            <Card
                                key={table.id}
                                surface="layer2"
                                padding="md"
                                style={{
                                    border: `1px solid ${colors.border.subtle}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setEditingTable(table)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing[2] }}>
                                    <Text size="lg" weight="bold" color="primary">
                                        Mesa {table.number}
                                    </Text>
                                    <Badge status={getStatusColor(table.status)} label={getStatusLabel(table.status)} />
                                </div>
                                <Text size="sm" color="tertiary">
                                    {table.seats || 4} lugares
                                </Text>
                                <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[3] }}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTable(table);
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        tone="destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(table.id, table.number);
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        Deletar
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};
