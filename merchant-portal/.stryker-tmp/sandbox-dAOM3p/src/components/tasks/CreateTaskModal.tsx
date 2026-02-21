// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { Card } from '../../ui/design-system/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Input } from '../../ui/design-system/Input';
import { Button } from '../../ui/design-system/Button';
import { useToast } from '../../ui/design-system';
import { useStaff } from '../../pages/AppStaff/context/StaffContext';
import type { StaffRole } from '../../pages/AppStaff/context/StaffCoreTypes';

type Mode = 'person' | 'role';

interface CreateTaskModalProps {
    open: boolean;
    onClose: () => void;
}

const roleOptions: StaffRole[] = ['waiter', 'kitchen', 'cleaning', 'manager', 'owner', 'worker'];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ open, onClose }) => {
    const { employees, createTask } = useStaff();
    const { success, error } = useToast();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'background' | 'attention' | 'urgent' | 'critical'>('background');
    const [mode, setMode] = useState<Mode>('person');
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<StaffRole>('waiter');
    const [busy, setBusy] = useState(false);

    const targetLabel = useMemo(() => {
        if (mode === 'person') {
            const emp = employees.find((e) => e.id === selectedEmployee);
            return emp ? emp.name : '—';
        }
        return selectedRole;
    }, [mode, selectedEmployee, selectedRole, employees]);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!title.trim()) {
            error('Defina um título.');
            return;
        }

        if (mode === 'person' && !selectedEmployee) {
            error('Selecione um funcionário.');
            return;
        }

        if (mode === 'role' && !selectedRole) {
            error('Selecione uma função.');
            return;
        }

        setBusy(true);
        try {
            createTask({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                assigneeId: mode === 'person' ? selectedEmployee : null,
                assigneeRole: mode === 'role' ? selectedRole : undefined,
                type: 'foundational',
            });
            success('Tarefa criada.');
            onClose();
            setTitle('');
            setDescription('');
            setPriority('background');
            setSelectedEmployee('');
            setSelectedRole('waiter');
            setMode('person');
        } catch (err: any) {
            console.error(err);
            error(err?.message || 'Erro ao criar tarefa.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 2000
        }}>
            <Card surface="base" padding="xl" style={{ width: 480, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Text size="lg" weight="bold">Nova tarefa</Text>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                        <Text size="xs" weight="bold" color="secondary">Título</Text>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Revisar estoque de carnes" fullWidth />
                    </div>

                    <div>
                        <Text size="xs" weight="bold" color="secondary">Descrição (opcional)</Text>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalhes adicionais"
                            style={{
                                width: '100%',
                                minHeight: 80,
                                borderRadius: 8,
                                border: '1px solid #333',
                                background: '#111',
                                color: 'white',
                                padding: 10,
                                fontSize: 14,
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div>
                        <Text size="xs" weight="bold" color="secondary">Prioridade</Text>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as any)}
                            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #333', background: '#111', color: 'white' }}
                        >
                            <option value="background">Background</option>
                            <option value="attention">Atenção</option>
                            <option value="urgent">Urgente</option>
                            <option value="critical">Crítica</option>
                        </select>
                    </div>

                    <div>
                        <Text size="xs" weight="bold" color="secondary" style={{ marginBottom: 6 }}>Destinatário</Text>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Button size="sm" tone={mode === 'person' ? 'action' : 'neutral'} onClick={() => setMode('person')}>Pessoa</Button>
                            <Button size="sm" tone={mode === 'role' ? 'action' : 'neutral'} onClick={() => setMode('role')}>Função</Button>
                        </div>

                        {mode === 'person' ? (
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #333', background: '#111', color: 'white' }}
                            >
                                <option value="">Selecione um funcionário</option>
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
                                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #333', background: '#111', color: 'white' }}
                            >
                                {roleOptions.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div style={{ background: '#111', borderRadius: 8, padding: 10 }}>
                        <Text size="xs" color="secondary">
                            Esta tarefa será vista por <strong>{targetLabel}</strong>
                        </Text>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <Button tone="neutral" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button tone="action" onClick={handleSubmit} disabled={busy}>
                        {busy ? 'Criando...' : 'Criar tarefa'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

