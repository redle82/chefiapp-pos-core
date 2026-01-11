import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { colors } from '../../../ui/design-system/tokens/colors';
import type { SovereignModule } from '../dashboard_manifest';

export const SystemStatusLine = ({ modules }: { modules: SovereignModule[] }) => {
    return (
        <Card surface="layer2" padding="sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text size="sm" weight="bold" color="primary">ESTADO DO SISTEMA</Text>
                <div style={{ width: 1, height: 16, background: colors.border.subtle }}></div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
                {modules.map(module => (
                    <div key={module.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '16px' }}>{module.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text size="xs" weight="medium" color="primary" style={{ lineHeight: 1 }}>{module.label}</Text>
                            <Text size="xs" color="tertiary" style={{ fontSize: '10px' }}>{module.status === 'active' ? 'ONLINE' : module.status.toUpperCase()}</Text>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#32d74b', boxShadow: '0 0 8px rgba(50, 215, 75, 0.5)' }}></div>
                <Text size="xs" color="secondary" weight="bold">NOMINAL</Text>
            </div>
        </Card>
    );
};
