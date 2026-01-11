import React, { useState } from 'react';
import type { Task } from '../context/StaffCoreTypes';
import { StaffLayout } from '../../../ui/design-system/layouts/StaffLayout';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { radius } from '../../../ui/design-system/tokens/radius';
import { MobileBottomNav } from './MobileBottomNav';
import { useNavigate } from 'react-router-dom';

// ------------------------------------------------------------------
// 🍷 CINEMATIC MINI POS (Sales Sovereign)
// ------------------------------------------------------------------

interface MiniPOSProps {
    tasks: Task[];
    role: string;
}

const TableCard = ({ number, status, time }: { number: number, status: 'free' | 'occupied' | 'payment', time?: string }) => {
    // Mapping Status to UDS props
    const borderColor = status === 'occupied' ? colors.action.base :
        status === 'payment' ? colors.success.base :
            colors.border.subtle;

    return (
        <div style={{
            position: 'relative',
            aspectRatio: '1/1',
            borderRadius: radius.lg,
            border: `2px solid ${borderColor}`,
            backgroundColor: status === 'free' ? 'transparent' : `${borderColor}20`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.1s'
        }}>
            <Text size="3xl" weight="black" color={status === 'free' ? 'tertiary' : 'primary'}>{number.toString()}</Text>
            {time && <Text size="xs" color="secondary" style={{ marginTop: 4, fontFamily: 'monospace' }}>{time}</Text>}

            {status === 'payment' && (
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <Text size="md">💰</Text>
                </div>
            )}
        </div>
    );
};

export const MiniPOS: React.FC<MiniPOSProps> = ({ tasks }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tables');

    // Mock Table Data for Cinematic Viz
    const tables = [
        { id: 1, status: 'occupied', time: '12m' },
        { id: 2, status: 'free', time: undefined },
        { id: 3, status: 'occupied', time: '45m' },
        { id: 4, status: 'free', time: undefined },
        { id: 5, status: 'occupied', time: '5m' },
        { id: 6, status: 'payment', time: '60m' }
    ] as const;

    const attentionTasks = tasks.filter(t => t.priority === 'attention' || t.priority === 'critical');

    const handleNavigate = (tab: string) => {
        if (tab === 'exit') {
            navigate('/app/dashboard'); // Back to main dashboard or logout
        } else {
            setActiveTab(tab);
        }
    };

    return (
        <StaffLayout
            title={activeTab === 'tables' ? "Salão Principal" : activeTab === 'order' ? "Nova Comanda" : "Menu Digital"}
            userName="Waiter"
            role="Waiter"
            status="active"
            bottomNav={<MobileBottomNav activeTab={activeTab} onNavigate={handleNavigate} />}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64 }}>

                {/* HEADS UP DISPLAY - ALERTS (Global) */}
                {attentionTasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {attentionTasks.map(task => (
                            <Card
                                key={task.id}
                                surface="layer3"
                                padding="md"
                                style={{
                                    borderLeft: `4px solid ${task.priority === 'critical' ? colors.destructive.base : colors.warning.base}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Text size="lg">{task.priority === 'critical' ? '🔥' : '⚠️'}</Text>
                                        <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>{task.title}</Text>
                                    </div>
                                    <Text size="sm" color="primary">{task.description}</Text>
                                </div>
                                <Button size="sm" tone="neutral">OK</Button>
                            </Card>
                        ))}
                    </div>
                )}

                {/* VIEW SWITCHER */}
                {activeTab === 'tables' && (
                    <div className="animate-fade-in">
                        <Text size="xs" weight="bold" color="tertiary" style={{ textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Mesas</Text>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {tables.map(t => (
                                // @ts-ignore - Mock data type mismatch fix
                                <TableCard key={t.id} number={t.id} status={t.status} time={t.time} />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'order' && (
                    <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
                        <div className="text-4xl mb-4">📝</div>
                        <Text size="lg" weight="bold">Nova Comanda</Text>
                        <Text size="sm" color="tertiary" style={{ textAlign: 'center', maxWidth: 250, marginTop: 8 }}>
                            Selecione uma mesa livre no mapa para iniciar.
                        </Text>
                        <Button style={{ marginTop: 24 }} onClick={() => setActiveTab('tables')}>
                            Ir para Mesas
                        </Button>
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
                        <div className="text-4xl mb-4">🍔</div>
                        <Text size="lg" weight="bold">Menu Digital</Text>
                        <Text size="sm" color="tertiary">Consulta rápida de itens.</Text>
                    </div>
                )}

            </div>
        </StaffLayout>
    );
};
