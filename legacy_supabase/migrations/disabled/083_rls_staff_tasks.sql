<file name=CreateTaskModal.tsx path=/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal/src/pages/AppStaff/components>
import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Textarea, Select, RadioGroup, Radio, Text } from '../../../components/ui'; // Ajustar caminho conforme design system do projeto
import { useStaff } from '../../../hooks/useStaff';

type CreateTaskModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const PRIORITY_OPTIONS = [
  { value: 'background', label: 'Background' },
  { value: 'attention', label: 'Attention' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];

const TYPE_OPTIONS = [
  { value: 'foundational', label: 'Foundational' },
  { value: 'mission_critical', label: 'Mission Critical' },
];

const ROLE_OPTIONS = [
  'waiter',
  'kitchen',
  'cleaning',
  'cashier',
  'worker',
  'manager',
];

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ open, onClose, onCreated }) => {
  const { employees, createTask } = useStaff();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('background');
  const [type, setType] = useState('foundational');
  const [recipientType, setRecipientType] = useState<'person' | 'role'>('person');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [assignedRole, setAssignedRole] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setPriority('background');
      setType('foundational');
      setRecipientType('person');
      setAssignedTo(null);
      setAssignedRole(null);
    }
  }, [open]);

  const handleRecipientPersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAssignedTo(val || null);
    if (val) setAssignedRole(null);
  };

  const handleRecipientRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAssignedRole(val || null);
    if (val) setAssignedTo(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        type,
        assigned_to: assignedTo,
        assigned_role: assignedRole,
      });
      onCreated();
      onClose();
    } catch (error) {
      // Pode adicionar tratamento de erro se desejar
      console.error('Erro ao criar tarefa:', error);
    }
  };

  if (!open) return null;

  const assignedPerson = employees.find((e) => e.id === assignedTo);
  const confirmationText =
    recipientType === 'person'
      ? assignedPerson
        ? `Esta tarefa será vista por ${assignedPerson.name}`
        : 'Esta tarefa será vista por ninguém'
      : assignedRole
      ? `Esta tarefa será vista por todos os ${assignedRole}`
      : 'Esta tarefa será vista por ninguém';

  return (
    <div className="modal-backdrop">
      <Card className="modal-card" style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
        <Text as="h2" size="lg" weight="bold" style={{ marginBottom: 16 }}>
          Criar Nova Tarefa
        </Text>

        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Título da tarefa"
          style={{ marginBottom: 12 }}
        />

        <Textarea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da tarefa (opcional)"
          style={{ marginBottom: 12 }}
          rows={3}
        />

        <Select
          label="Prioridade"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{ marginBottom: 12 }}
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <Select
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ marginBottom: 12 }}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <RadioGroup
          label="Destinatário"
          value={recipientType}
          onChange={(val) => setRecipientType(val as 'person' | 'role')}
          style={{ marginBottom: 12 }}
          direction="vertical"
        >
          <Radio value="person">Pessoa específica</Radio>
          {recipientType === 'person' && (
            <Select
              value={assignedTo || ''}
              onChange={handleRecipientPersonChange}
              style={{ marginTop: 4, marginBottom: 12 }}
            >
              <option value="">Selecione um funcionário</option>
              {employees
                .filter((e) => e.active)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} {e.position ? `(${e.position})` : ''}
                  </option>
                ))}
            </Select>
          )}

          <Radio value="role">Função</Radio>
          {recipientType === 'role' && (
            <Select
              value={assignedRole || ''}
              onChange={handleRecipientRoleChange}
              style={{ marginTop: 4, marginBottom: 12 }}
            >
              <option value="">Selecione uma função</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          )}
        </RadioGroup>

        <Text size="sm" color="gray" style={{ marginBottom: 16 }}>
          {confirmationText}
        </Text>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Criar Tarefa
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CreateTaskModal;

</file>

<file name=OperationalHubDashboard.tsx path=/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal/src/pages/AppStaff>
import React, { useState } from 'react';
import { Text, Button } from '../../components/ui'; // Ajustar caminho conforme design system do projeto
import { useStaff } from '../../hooks/useStaff';
import CreateTaskModal from './components/CreateTaskModal';

const OperationalHubDashboard: React.FC = () => {
  const { user, restaurant, staffRole } = useStaff();
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const isOwnerOrManager = staffRole === 'owner' || staffRole === 'manager';

  return (
    <div>
      <Text as="h1" size="xl" weight="bold" style={{ marginBottom: 16 }}>
        Painel Operacional
      </Text>

      {isOwnerOrManager && (
        <Button onClick={() => setShowCreateTaskModal(true)} style={{ marginBottom: 16 }}>
          + Nova Tarefa
        </Button>
      )}

      {/* Restante do conteúdo do dashboard */}

      <CreateTaskModal
        open={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreated={() => setShowCreateTaskModal(false)}
      />
    </div>
  );
};

export default OperationalHubDashboard;

</file>
