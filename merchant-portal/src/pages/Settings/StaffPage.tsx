import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import { logger } from '../../core/logger';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';
import { EmptyState } from '../../ui/design-system/primitives/EmptyState';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { Input } from '../../ui/design-system/primitives/Input';
import { Toast, useToast } from '../../ui/design-system';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

// ------------------------------------------------------------------
// 🏢 STAFF MANAGEMENT (Admin Mode)
// ------------------------------------------------------------------

interface Employee {
    id: string;
    role: 'owner' | 'manager' | 'worker';
    position: 'kitchen' | 'waiter' | 'cleaning' | 'cashier' | 'manager';
    name: string;
    user_id?: string | null;
    email?: string | null;
    pin?: string;
    active: boolean;
}

export default function StaffPage() {
    const navigate = useNavigate();
    const { success, error: toastError } = useToast();
    const [members, setMembers] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));

    // Create State
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<'manager' | 'worker'>('worker');
    const [newPosition, setNewPosition] = useState<'waiter' | 'kitchen' | 'cleaning' | 'cashier'>('waiter');
    const [newPin, setNewPin] = useState('');
    const [newUserId, setNewUserId] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [busy, setBusy] = useState(false);

    // Initial Load
    useEffect(() => {
        if (restaurantId) fetchMembers();
    }, [restaurantId]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('active', true);

            if (error) throw error;
            setMembers(data || []);
        } catch (err: any) {
            logger.error('Error fetching employees', { error: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmployee = async () => {
        if (!restaurantId || !newName) return;
        setBusy(true);

        try {
            let resolvedUserId: string | null = newUserId.trim() || null;

            if (!resolvedUserId && newEmail.trim()) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', newEmail.trim().toLowerCase())
                    .maybeSingle();

                if (profileError) throw profileError;
                resolvedUserId = profile?.id || null;
            }

            const { error } = await supabase.from('employees').insert({
                restaurant_id: restaurantId,
                name: newName,
                role: newRole,
                position: newRole === 'manager' ? 'manager' : newPosition,
                pin: newPin || null,
                user_id: resolvedUserId,
                email: newEmail.trim() || null,
                active: true
            });

            if (error) throw error;
            success('Funcionário criado!');
            setShowModal(false);
            setNewName('');
            setNewPin('');
            setNewUserId('');
            setNewEmail('');
            fetchMembers();

        } catch (err: any) {
            console.error(err);
            toastError(err?.message || 'Erro ao criar funcionário.');
        } finally {
            setBusy(false);
        }
    };

    const handleRemoveMember = async (id: string) => {
        if (!confirm('Tem certeza? Isso removerá o acesso.')) return;

        try {
            const { error } = await supabase.from('employees').update({ active: false }).eq('id', id);
            if (error) throw error;
            setMembers(prev => prev.filter(m => m.id !== id));
            success('Funcionário removido.');
        } catch (err) {
            toastError('Erro ao remover.');
        }
    };

    return (
        <AdminLayout
            sidebar={<AdminSidebar activePath="/app/team" onNavigate={navigate} />}
            content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Text size="3xl" weight="black" color="primary">Sua Equipe</Text>
                            <Text size="sm" color="tertiary">Quem faz a mágica acontecer.</Text>
                        </div>
                        <Button tone="action" onClick={() => setShowModal(true)}>
                            + Adicionar
                        </Button>
                    </div>

                    {/* Staff List */}
                    {loading ? (
                        <div style={{ padding: spacing[12], textAlign: 'center' }}>
                            <Text color="tertiary">Carregando...</Text>
                        </div>
                    ) : members.length === 0 ? (
                        <EmptyState
                            icon={<div style={{ fontSize: 64 }}>☕️</div>}
                            title="Equipe Vazia"
                            description="Adicione garçons, cozinheiros e gerentes."
                            action={{
                                label: "Criar Primeiro Funcionário",
                                onClick: () => setShowModal(true)
                            }}
                        />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing[6] }}>
                            {members.map((member) => (
                                <EmployeeCard
                                    key={member.id}
                                    member={member}
                                    onRemove={() => handleRemoveMember(member.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* MODAL */}
                    {showModal && (
                        <div style={{
                            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing[4], zIndex: 100
                        }}>
                            <Card surface="base" padding="xl" style={{ maxWidth: '400px', width: '100%' }}>
                                <Text size="xl" weight="bold" style={{ marginBottom: spacing[6] }}>Novo Profissional</Text>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                                    <div>
                                        <Text size="xs" weight="bold" style={{ marginBottom: 4 }}>NOME</Text>
                                        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: João da Silva" fullWidth />
                                    </div>

                                    <div>
                                        <Text size="xs" weight="bold" style={{ marginBottom: 4 }}>USER ID (opcional, UUID)</Text>
                                        <Input
                                            value={newUserId}
                                            onChange={e => setNewUserId(e.target.value)}
                                            placeholder="Cole o user_id (se já existir)"
                                            fullWidth
                                        />
                                    </div>

                                    <div>
                                        <Text size="xs" weight="bold" style={{ marginBottom: 4 }}>EMAIL (para localizar perfil ou convite)</Text>
                                        <Input
                                            type="email"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            placeholder="email@restaurante.com"
                                            fullWidth
                                        />
                                    </div>

                                    <div>
                                        <Text size="xs" weight="bold" style={{ marginBottom: 4 }}>CARGO</Text>
                                        <div style={{ display: 'flex', gap: spacing[2] }}>
                                            <Button size="sm" tone={newRole === 'worker' ? 'action' : 'neutral'} onClick={() => setNewRole('worker')}>Operacional</Button>
                                            <Button size="sm" tone={newRole === 'manager' ? 'action' : 'neutral'} onClick={() => setNewRole('manager')}>Gerente</Button>
                                        </div>
                                    </div>

                                    {newRole === 'worker' && (
                                        <div>
                                            <Text size="xs" weight="bold" style={{ marginBottom: 4 }}>POSIÇÃO</Text>
                                            <select
                                                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #333', background: '#222', color: 'white' }}
                                                value={newPosition}
                                                onChange={(e) => setNewPosition(e.target.value as any)}
                                            >
                                                <option value="waiter">Garçom (Vendas)</option>
                                                <option value="kitchen">Cozinha (Produção)</option>
                                                <option value="cleaning">Limpeza / Serviços</option>
                                                <option value="cashier">Caixa</option>
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <Text size="xs" weight="bold" style={{ marginBottom: 4 }}>PIN (Opcional - Acesso Rápido)</Text>
                                        <Input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="0000" maxLength={4} fullWidth />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[3], marginTop: spacing[4] }}>
                                        <Button tone="neutral" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                                        <Button tone="action" onClick={handleCreateEmployee} disabled={busy || !newName}>
                                            {busy ? 'Salvando...' : 'Salvar'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            }
        />
    );
}

const EmployeeCard = ({ member, onRemove }: { member: Employee, onRemove: () => void }) => {
    return (
        <Card surface="layer2" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        backgroundColor: colors.surface.layer1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20
                    }}>
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <Text weight="bold">{member.name}</Text>
                        <Text size="xs" color="tertiary">{member.position.toUpperCase()} • {member.role}</Text>
                    </div>
                </div>
                {member.role !== 'owner' && (
                    <Button tone="destructive" variant="ghost" size="sm" onClick={onRemove}>X</Button>
                )}
            </div>
            {member.pin && (
                <div style={{ marginTop: spacing[4], padding: spacing[2], background: 'rgba(0,0,0,0.2)', borderRadius: 4, textAlign: 'center' }}>
                    <Text size="xs" color="secondary" style={{ fontFamily: 'monospace' }}>PIN: {member.pin}</Text>
                </div>
            )}
        </Card>
    );
};
