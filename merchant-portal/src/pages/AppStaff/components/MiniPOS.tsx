import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { StaffLayout } from '../../../ui/design-system/layouts/StaffLayout';
import { colors } from '../../../ui/design-system/tokens/colors';
import { radius } from '../../../ui/design-system/tokens/radius';
import { useKeyboardShortcuts } from '../../../core/hooks/useKeyboardShortcuts';
import { ScannerService } from '../core/ScannerService';
import { useStaff } from '../context/StaffContext';
import { useAppStaffTables } from '../hooks/useAppStaffTables';
import { TablePanel } from '../../Waiter/TablePanel';
import type { Task } from '../context/StaffCoreTypes';
import { MobileBottomNav } from './MobileBottomNav';

export interface MiniPOSProps {
  tasks: Task[];
  /** Mesa a preselecionar (ex.: vindo de WaiterHome). Query ?tableId= ou state.tableId. */
  initialTableId?: string | null;
}

// TableCard: feedback tátil (scale 0.97) — app UX, sem hover
const TableCard = ({ number, status, time, onClick }: { number: number, status: string, time?: string, onClick: () => void }) => {
    const [pressed, setPressed] = useState(false);
    const borderColor = status === 'occupied' ? colors.action.base :
        status === 'payment' ? colors.success.base :
            colors.border.subtle;

    return (
        <div
            onClick={onClick}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            style={{
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
                transition: 'transform 0.08s ease',
                transform: pressed ? 'scale(0.97)' : 'scale(1)',
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

export const MiniPOS: React.FC<MiniPOSProps> = ({ tasks, initialTableId = null }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { restaurantId } = useStaff();
    const [activeTab, setActiveTab] = useState('tables');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(initialTableId ?? null);

    useEffect(() => {
        setSelectedTableId(initialTableId ?? null);
    }, [initialTableId]);

    const { tables: appStaffTables, loading, error, refetch } = useAppStaffTables(restaurantId);
    const tables = appStaffTables.map(table => ({
      id: table.id,
      number: table.number,
      status: table.status,
    }));

    // Mapping Keyboard Shortcuts
    useKeyboardShortcuts({
        'mod+n': (e) => { e.preventDefault(); setActiveTab('order'); },
        'mod+m': (e) => { e.preventDefault(); setActiveTab('tables'); },
        'mod+d': (e) => { e.preventDefault(); setActiveTab('menu'); },
        'esc': (e) => {
            if (selectedTableId) {
                e.preventDefault();
                setSelectedTableId(null);
            }
        }
    }, [selectedTableId]);

    const attentionTasks = tasks.filter(t => t.priority === 'attention' || t.priority === 'critical');

    const handleNavigate = (tab: string) => {
        if (tab === 'exit') {
            // APPSTAFF_LAUNCHER_NAVIGATION_CONTRACT: dentro do staff, "Sair" volta ao launcher (evita loop)
            if (location.pathname.startsWith('/app/staff')) {
                navigate('/app/staff/home');
            } else {
                navigate('/app/dashboard');
            }
        } else {
            setActiveTab(tab);
            setSelectedTableId(null); // Reset detail view
        }
    };

    const handleScan = async () => {
        const result = await ScannerService.scan();
        if (result) {
            // Check if result matches a table ID
            const table = tables.find(t => t.id === result);
            if (table) {
                setSelectedTableId(table.id);
            } else {
                alert(`QR Code não reconhecido: ${result}`);
            }
        }
    };

    // Render Table Detail (TablePanel)
    if (selectedTableId) {
        return (
            <TablePanel
                tableId={selectedTableId}
                onBack={() => setSelectedTableId(null)}
            />
        );
    }

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text size="xs" weight="bold" color="tertiary" style={{ textTransform: 'uppercase', letterSpacing: 2 }}>
                                Mesas {loading && '(Carregando...)'}
                            </Text>
                            <Button size="sm" tone="neutral" onClick={handleScan}>
                                📷 Scan QR
                            </Button>
                        </div>

                        {/* Estado erro: mensagem + retry */}
                        {error && (
                            <Card surface="layer3" padding="md" style={{ borderLeft: `4px solid ${colors.destructive.base}` }}>
                                <Text size="sm" color="primary" style={{ marginBottom: 12 }}>
                                    Não foi possível carregar as mesas. Tente novamente.
                                </Text>
                                <Button size="sm" tone="primary" onClick={() => refetch()}>
                                    Tentar novamente
                                </Button>
                            </Card>
                        )}

                        {!error && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    {tables
                                        .sort((a, b) => a.number - b.number)
                                        .map(t => (
                                            <TableCard
                                                key={t.id}
                                                number={t.number}
                                                status={t.status}
                                                time={t.status === 'occupied' ? 'On' : undefined}
                                                onClick={() => setSelectedTableId(t.id)}
                                            />
                                        ))}
                                </div>
                                {!loading && tables.length === 0 && (
                                    <Text size="sm" color="tertiary">Nenhuma mesa configurada.</Text>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Legacy Tabs Placeholder */}
                {activeTab === 'order' && (
                    // ... same ...
                    <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
                        <div className="text-4xl mb-4">📝</div>
                        <Text size="lg" weight="bold">Nova Comanda</Text>
                        <Button style={{ marginTop: 24 }} onClick={() => setActiveTab('tables')}>
                            Ir para Mesas
                        </Button>
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
                        <div className="text-4xl mb-4">🍔</div>
                        <Text size="lg" weight="bold">Menu Digital</Text>
                    </div>
                )}

            </div>
        </StaffLayout>
    );
};
