import React, { useState } from 'react';
import { useTenant } from '../../../core/tenant/TenantContext'; // Adjust path
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { Button } from '../../../ui/design-system/primitives/Button';
import { supabase } from '../../../core/supabase';

export const OperationStatusWidget: React.FC = () => {
    const { restaurant, refreshTenant } = useTenant();
    const [loading, setLoading] = useState(false);

    const status = restaurant?.operation_status || 'active';

    const handleToggleStatus = async () => {
        if (!restaurant?.id) return;
        const newStatus = status === 'active' ? 'paused' : 'active';
        const reason = status === 'active' ? 'Paused by Admin via Settings' : 'Resumed by Admin via Settings';

        if (!confirm(`Tem certeza que deseja ${status === 'active' ? 'PAUSAR' : 'RETOMAR'} a operação do sistema?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase.rpc('update_operation_status', {
                p_restaurant_id: restaurant.id,
                p_status: newStatus,
                p_reason: reason
            });

            if (error) throw error;

            await refreshTenant();
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Erro ao atualizar status.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'active': return 'success';
            case 'paused': return 'warning';
            case 'suspended': return 'destructive';
            default: return 'neutral';
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'active': return 'OPERACIONAL';
            case 'paused': return 'PAUSADO';
            case 'suspended': return 'SUSPENSO';
            default: return 'DESCONHECIDO';
        }
    };

    return (
        <Card surface="layer1" padding="lg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${status === 'active' ? '#10b981' : status === 'paused' ? '#f59e0b' : '#ef4444'}` }}>
            <div>
                <Text size="sm" color="tertiary">Status Operacional</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text size="2xl" weight="black" color={getStatusColor()}>
                        {getStatusLabel()}
                    </Text>
                    {status === 'suspended' && <Badge status="error" label="Contate Suporte" />}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                {status !== 'suspended' && (
                    <Button
                        tone={status === 'active' ? 'critical' : 'positive'}
                        variant="solid"
                        onClick={handleToggleStatus}
                        loading={loading}
                    >
                        {status === 'active' ? 'Pausar Operação' : 'Retomar Operação'}
                    </Button>
                )}
            </div>
        </Card>
    );
};
