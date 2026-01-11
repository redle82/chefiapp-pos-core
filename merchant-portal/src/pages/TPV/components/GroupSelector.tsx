import React from 'react';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Text } from '../../../ui/design-system/primitives/Text';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import type { ConsumptionGroup } from '../types/ConsumptionGroup';

interface GroupSelectorProps {
    groups: ConsumptionGroup[];
    selectedGroupId: string | null;
    onSelect: (groupId: string | null) => void;
    onCreateNew?: () => void;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
    groups,
    selectedGroupId,
    onSelect,
    onCreateNew,
}) => {
    const activeGroups = groups.filter(g => g.status === 'active');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            <Text size="sm" weight="bold" color="primary" style={{ marginBottom: spacing[1] }}>
                Selecionar Grupo
            </Text>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                {activeGroups.map(group => (
                    <Button
                        key={group.id}
                        variant={selectedGroupId === group.id ? 'solid' : 'outline'}
                        tone={selectedGroupId === group.id ? 'action' : 'neutral'}
                        size="sm"
                        onClick={() => onSelect(group.id)}
                        style={{
                            borderColor: group.color,
                            backgroundColor: selectedGroupId === group.id ? `${group.color}20` : 'transparent',
                        }}
                    >
                        <span style={{ 
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: group.color,
                            marginRight: spacing[1],
                        }} />
                        {group.label}
                    </Button>
                ))}

                {onCreateNew && (
                    <Button
                        variant="outline"
                        tone="neutral"
                        size="sm"
                        onClick={onCreateNew}
                        style={{ borderStyle: 'dashed' }}
                    >
                        ➕ Criar Grupo
                    </Button>
                )}
            </div>
        </div>
    );
};
