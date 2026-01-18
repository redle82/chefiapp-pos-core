import React from 'react';
import { StaffLayout } from '../../../ui/design-system/layouts/StaffLayout';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import type { Task } from '../context/StaffCoreTypes';
import { colors } from '../../../ui/design-system/tokens/colors';
import { NFCService } from '../core/NFCService';

interface CleaningTaskViewProps {
    tasks: Task[];
    role: string;
}

export const CleaningTaskView: React.FC<CleaningTaskViewProps> = ({ tasks, role }) => {
    const cleaningTasks = tasks.filter(t => t.uiMode === 'check');
    const [scannedTag, setScannedTag] = React.useState<string | null>(null);

    const handleNFCScan = async (taskId: string) => {
        const tag = await NFCService.scanTag();
        if (tag) {
            setScannedTag(tag);
            alert(`NFC Tag Detected: ${tag}. Task ${taskId} completed!`);
            // In real app, verify tag ID matches task requirements
        } else {
            alert('NFC Scan timed out or failed.');
        }
    };

    return (
        <StaffLayout
            title="Lista de Limpeza"
            role={role}
            status="active"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cleaningTasks.map(t => (
                    <Card key={t.id} surface="layer2" padding="md">
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: `2px solid ${colors.text.tertiary}`,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                onClick={() => console.log('Check', t.id)}
                            >
                                {/* Visual check if done */}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text size="md" weight="bold" color="primary">{t.title}</Text>
                                <Text size="xs" color="tertiary">{t.description}</Text>
                            </div>

                            {/* NFC Button */}
                            <Button
                                size="sm"
                                tone="neutral"
                                variant="ghost"
                                onClick={() => handleNFCScan(t.id)}
                            >
                                📡 Tap
                            </Button>
                        </div>
                    </Card>
                ))}

                {cleaningTasks.length === 0 && (
                    <div style={{
                        padding: 40,
                        textAlign: 'center',
                        opacity: 0.5
                    }}>
                        <Text size="sm" color="tertiary">Tudo limpo ✨</Text>
                    </div>
                )}
            </div>
        </StaffLayout>
    );
};
