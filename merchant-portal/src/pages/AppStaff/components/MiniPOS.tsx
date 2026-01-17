import { useTables } from '../../TPV/context/TableContext';
import { TablePanel } from '../../Waiter/TablePanel';
import { TableStatus } from '../../Waiter/types';
import { useKeyboardShortcuts } from '../../../core/hooks/useKeyboardShortcuts';

// ... (Existing Imports) ...

// Updated TableCard to use Real Status
const TableCard = ({ number, status, time, onClick }: { number: number, status: string, time?: string, onClick: () => void }) => {
    // Mapping Status to UDS props
    const borderColor = status === 'occupied' ? colors.action.base :
        status === 'payment' ? colors.success.base :
            colors.border.subtle;

    return (
        <div
            onClick={onClick}
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
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    // Real Table Data
    const { tables, loading } = useTables();

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
            navigate('/app/dashboard');
        } else {
            setActiveTab(tab);
            setSelectedTableId(null); // Reset detail view
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
                        <Text size="xs" weight="bold" color="tertiary" style={{ textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
                            Mesas {loading && '(Carregando...)'}
                        </Text>

                        {/* Real Table Grid */}
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

                        {/* Empty State */}
                        {!loading && tables.length === 0 && (
                            <Text size="sm" color="tertiary">Nenhuma mesa encontrada.</Text>
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
