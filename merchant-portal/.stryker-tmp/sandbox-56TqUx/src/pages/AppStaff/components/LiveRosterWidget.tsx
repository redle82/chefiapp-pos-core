// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card } from '../../../ui/design-system/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { colors } from '../../../ui/design-system/tokens/colors';
// FASE 3.5: Removido import de supabase - agora usa dockerCoreClient via ShiftReader

interface ActiveShift {
    id: string;
    employee_id: string;
    role: string;
    start_time: string;
    employee_name?: string; // Joined from employees table
}

interface LiveRosterWidgetProps {
    restaurantId: string;
}

/**
 * LiveRosterWidget
 * Phase 2: Manager's Control Room
 * Displays currently active staff by querying shift_logs with status='active'.
 */
export const LiveRosterWidget: React.FC<LiveRosterWidgetProps> = ({ restaurantId }) => {
    const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const fetchActiveShifts = async () => {
            setLoading(true);
            // FASE 3.5: Usa ShiftReader (dockerCoreClient) em vez de supabase direto
            try {
                const { readActiveShifts } = await import('../../../infra/readers/ShiftReader');
                const shifts = await readActiveShifts(restaurantId);

                // Map the joined data
                const mapped = shifts.map((shift) => ({
                    id: shift.id,
                    employee_id: shift.employee_id,
                    role: shift.role,
                    start_time: shift.start_time,
                    employee_name: shift.employees?.name || 'Desconhecido'
                }));

                setActiveShifts(mapped);
            } catch (error) {
                console.error('Failed to fetch active shifts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveShifts();

        // 🔄 REALTIME DESABILITADO - Problema 431 no WebSocket
        // Usando apenas polling até resolver JWT no WebSocket
        // Polling via fetchActiveShifts() já está sendo chamado no useEffect
        
        // Não configurar realtime por enquanto
        return () => {
            // Cleanup vazio - sem realtime para limpar
        };
    }, [restaurantId]);

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            waiter: '🍽️ Garçom',
            kitchen: '👨‍🍳 Cozinha',
            bar: '🍹 Bar',
            manager: '🧑‍💼 Gerente',
            owner: '👑 Dono',
            cleaner: '🧹 Limpeza',
            runner: '🏃 Runner',
        };
        return labels[role] || role;
    };

    const formatDuration = (startTime: string) => {
        const start = new Date(startTime).getTime();
        const now = Date.now();
        const diffMinutes = Math.floor((now - start) / 60000);
        if (diffMinutes < 60) return `${diffMinutes}m`;
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <Card surface="layer2" padding="md">
                <Text size="sm" color="tertiary">A carregar equipa activa...</Text>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size="xs" weight="bold" color="secondary">EQUIPA EM TURNO</Text>
                <Badge status={activeShifts.length > 0 ? 'ready' : 'warning'} label={`${activeShifts.length} activo(s)`} size="sm" />
            </div>

            {activeShifts.length === 0 ? (
                <Card surface="layer2" padding="lg" style={{ textAlign: 'center', border: `1px dashed ${colors.border.subtle}` }}>
                    <Text size="lg">😴</Text>
                    <Text size="sm" color="tertiary" style={{ marginTop: 8 }}>Nenhum funcionário em turno.</Text>
                </Card>
            ) : (
                activeShifts.map(shift => (
                    <Card key={shift.id} surface="layer2" padding="md" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderLeft: `4px solid ${colors.success.base}`
                    }}>
                        <div>
                            <Text size="md" weight="bold" color="primary">{shift.employee_name}</Text>
                            <Text size="sm" color="secondary">{getRoleLabel(shift.role)}</Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <Text size="sm" color="tertiary">{formatDuration(shift.start_time)}</Text>
                            <div style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: colors.success.base,
                                marginTop: 4,
                                marginLeft: 'auto',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }} />
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
};
