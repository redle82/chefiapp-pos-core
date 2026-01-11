import React, { useState } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { colors } from '../../../ui/design-system/tokens/colors';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreate: (label: string, color: string) => Promise<void>;
}

const DEFAULT_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate }) => {
    const [label, setLabel] = useState('');
    const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!label.trim()) return;

        setCreating(true);
        try {
            await onCreate(label.trim(), selectedColor);
            onClose();
        } catch (err) {
            console.error('Failed to create group:', err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <Card surface="layer1" padding="xl" style={{ maxWidth: 400, width: '90%' }}>
                <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
                    Criar Novo Grupo
                </Text>

                <div style={{ marginBottom: spacing[4] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                        Nome do Grupo
                    </Text>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ex: Casal, Amigos, Empresa..."
                        autoFocus
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: 6,
                            padding: spacing[3],
                            color: 'white',
                            fontSize: '16px',
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ marginBottom: spacing[6] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                        Cor
                    </Text>
                    <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                        {DEFAULT_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    border: selectedColor === color ? '3px solid white' : '2px solid transparent',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: spacing[3] }}>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onClose}
                        disabled={creating}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        tone="action"
                        size="lg"
                        onClick={handleCreate}
                        disabled={creating || !label.trim()}
                        style={{ flex: 1 }}
                    >
                        {creating ? 'Criando...' : 'Criar'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
