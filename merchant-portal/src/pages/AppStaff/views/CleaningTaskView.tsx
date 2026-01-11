import React from 'react';
import { StaffLayout } from '../../../ui/design-system/layouts/StaffLayout';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import type { Task } from '../context/StaffCoreTypes';
import { colors } from '../../../ui/design-system/tokens/colors';

interface CleaningTaskViewProps {
    tasks: Task[];
    role: string;
}

export const CleaningTaskView: React.FC<CleaningTaskViewProps> = ({ tasks, role }) => {
    const cleaningTasks = tasks.filter(t => t.uiMode === 'check');

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
                                    cursor: 'pointer'
                                }}
                                onClick={() => console.log('Check', t.id)}
                            />
                            <div style={{ flex: 1 }}>
                                <Text size="md" weight="bold" color="primary">{t.title}</Text>
                                <Text size="xs" color="tertiary">{t.description}</Text>
                            </div>
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
