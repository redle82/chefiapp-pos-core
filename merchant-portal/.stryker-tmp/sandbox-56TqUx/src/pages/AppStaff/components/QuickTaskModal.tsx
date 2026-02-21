// @ts-nocheck
import React, { useState } from 'react';
import { Card } from '../../../ui/design-system/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import type { Employee, StaffRole } from '../context/StaffCoreTypes';

interface QuickTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    onCreateTask: (task: {
        title: string;
        description?: string;
        priority?: 'background' | 'attention' | 'urgent' | 'critical';
        assigneeRole?: StaffRole;
        assigneeId: string | null;
    }) => void;
}

/**
 * QuickTaskModal
 * Phase 2: Manager's Control Room
 * Allows the manager to quickly create and delegate a task.
 */
export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({
    isOpen,
    onClose,
    employees,
    onCreateTask
}) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'background' | 'attention' | 'urgent' | 'critical'>('attention');
    const [assigneeId, setAssigneeId] = useState<string>('');

    const handleSubmit = () => {
        if (!title.trim()) return;

        const selectedEmployee = employees.find(e => e.id === assigneeId);

        onCreateTask({
            title: title.trim(),
            priority,
            assigneeRole: selectedEmployee?.role as StaffRole | undefined,
            assigneeId: assigneeId || null
        });

        // Reset
        setTitle('');
        setPriority('attention');
        setAssigneeId('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
        }}>
            <Card surface="layer1" padding="xl" style={{ width: '100%', maxWidth: 400 }}>
                <Text size="lg" weight="bold" color="action" style={{ marginBottom: 24 }}>
                    ➕ Nova Tarefa Rápida
                </Text>

                {/* Title Input */}
                <div style={{ marginBottom: 16 }}>
                    <Text size="xs" color="secondary" style={{ marginBottom: 4 }}>Título *</Text>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ex: Limpar mesa 5"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: `1px solid ${colors.border.subtle}`,
                            backgroundColor: colors.surface.layer2,
                            color: colors.text.primary,
                            fontSize: 16
                        }}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Text size="xs" color="secondary" style={{ marginBottom: 8 }}>Prioridade</Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {(['background', 'attention', 'urgent', 'critical'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPriority(p)}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: priority === p ? `2px solid ${colors.action.base}` : `1px solid ${colors.border.subtle}`,
                                    backgroundColor: priority === p ? colors.action.base + '20' : colors.surface.layer2,
                                    color: priority === p ? colors.action.base : colors.text.secondary,
                                    fontWeight: priority === p ? 700 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {p === 'background' ? '🟢' : p === 'attention' ? '🟡' : p === 'urgent' ? '🟠' : '🔴'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assignee Selector */}
                <div style={{ marginBottom: 24 }}>
                    <Text size="xs" color="secondary" style={{ marginBottom: 8 }}>Atribuir a (opcional)</Text>
                    <select
                        value={assigneeId}
                        onChange={e => setAssigneeId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: `1px solid ${colors.border.subtle}`,
                            backgroundColor: colors.surface.layer2,
                            color: colors.text.primary,
                            fontSize: 16
                        }}
                    >
                        <option value="">Qualquer disponível</option>
                        {employees.filter(e => e.active).map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.position})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button tone="neutral" variant="outline" fullWidth onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button tone="action" fullWidth onClick={handleSubmit} disabled={!title.trim()}>
                        Criar Tarefa
                    </Button>
                </div>
            </Card>
        </div>
    );
};
