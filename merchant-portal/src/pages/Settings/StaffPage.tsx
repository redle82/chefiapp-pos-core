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
import { useTenant } from '../../core/tenant/TenantContext';

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
    const { tenantId } = useTenant();
    const [members, setMembers] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const restaurantId = tenantId;

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
        if (!restaurantId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('active', true);

            if (error) {
                console.error('[StaffPage] Error fetching employees:', error);
                // Se a tabela não existe, mostra erro específico
                if (error.code === '42P01') {
                    toastError('A tabela de funcionários não foi encontrada. Entre em contato com o suporte.');
                } else {
                    logger.error('Error fetching employees', { error: error.message, code: error.code });
                }
                return;
            }
            setMembers(data || []);
        } catch (err: any) {
            console.error('[StaffPage] Unexpected error fetching employees:', err);
            logger.error('Error fetching employees', { error: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmployee = async (e?: React.FormEvent | React.MouseEvent) => {
        // Prevenir submit do formulário se chamado via form
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Verificar se já está processando
        if (busy) {
            console.warn('[StaffPage] handleCreateEmployee called but already busy');
            return;
        }

        console.log('[StaffPage] ========== handleCreateEmployee CALLED ==========', {
            restaurantId,
            newName,
            newRole,
            newPosition,
            hasEmail: !!newEmail.trim(),
            hasPin: !!newPin.trim(),
            busy,
            timestamp: new Date().toISOString()
        });

        if (!restaurantId) {
            console.error('[StaffPage] No restaurantId available');
            toastError('Restaurante não identificado. Por favor, selecione um restaurante.');
            return;
        }

        if (!newName || newName.trim().length === 0) {
            console.warn('[StaffPage] Name is required');
            toastError('O nome é obrigatório.');
            return;
        }

        setBusy(true);
        console.log('[StaffPage] Starting employee creation...');

        try {
            let resolvedUserId: string | null = newUserId.trim() || null;

            // Se não tem user_id mas tem email, tenta encontrar o perfil
            if (!resolvedUserId && newEmail.trim()) {
                console.log('[StaffPage] Looking up profile by email:', newEmail.trim());
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', newEmail.trim().toLowerCase())
                    .maybeSingle();

                if (profileError) {
                    console.warn('[StaffPage] Profile lookup error:', profileError);
                    // Não é crítico, continua sem user_id
                } else {
                    resolvedUserId = profile?.id || null;
                    console.log('[StaffPage] Profile found:', resolvedUserId);
                }
            }

            // VALIDAÇÃO: Verificar se já existe funcionário com mesmo user_id no restaurante
            if (resolvedUserId) {
                console.log('[StaffPage] Checking for existing employee with user_id:', resolvedUserId);
                const { data: existing, error: checkError } = await supabase
                    .from('employees')
                    .select('id, name, email')
                    .eq('restaurant_id', restaurantId)
                    .eq('user_id', resolvedUserId)
                    .eq('active', true)
                    .maybeSingle();

                if (checkError && checkError.code !== 'PGRST116') {
                    console.warn('[StaffPage] Check error (non-critical):', checkError);
                } else if (existing) {
                    const existingName = existing.name || 'funcionário existente';
                    toastError(`Já existe um funcionário ativo (${existingName}) vinculado a este usuário neste restaurante.`);
                    setBusy(false);
                    return;
                }
            }

            // VALIDAÇÃO: Verificar se já existe funcionário com mesmo email no restaurante
            if (newEmail.trim()) {
                console.log('[StaffPage] Checking for existing employee with email:', newEmail.trim());
                const { data: existing, error: checkError } = await supabase
                    .from('employees')
                    .select('id, name')
                    .eq('restaurant_id', restaurantId)
                    .eq('email', newEmail.trim().toLowerCase())
                    .eq('active', true)
                    .maybeSingle();

                if (checkError && checkError.code !== 'PGRST116') {
                    console.warn('[StaffPage] Check error (non-critical):', checkError);
                } else if (existing) {
                    const existingName = existing.name || 'funcionário existente';
                    toastError(`Já existe um funcionário ativo (${existingName}) com este email neste restaurante.`);
                    setBusy(false);
                    return;
                }
            }

            // VALIDAÇÃO: Verificar se já existe funcionário com mesmo PIN no restaurante
            if (newPin && newPin.trim().length > 0) {
                console.log('[StaffPage] Checking for existing employee with PIN');
                const { data: existing, error: checkError } = await supabase
                    .from('employees')
                    .select('id, name')
                    .eq('restaurant_id', restaurantId)
                    .eq('pin', newPin.trim())
                    .eq('active', true)
                    .maybeSingle();

                if (checkError && checkError.code !== 'PGRST116') {
                    console.warn('[StaffPage] Check error (non-critical):', checkError);
                } else if (existing) {
                    const existingName = existing.name || 'funcionário existente';
                    toastError(`Já existe um funcionário ativo (${existingName}) com este PIN neste restaurante.`);
                    setBusy(false);
                    return;
                }
            }

            const insertData: any = {
                restaurant_id: restaurantId,
                name: newName.trim(),
                role: newRole,
                position: newRole === 'manager' ? 'manager' : newPosition,
                active: true
            };

            // Campos opcionais
            if (newPin && newPin.trim().length > 0) {
                insertData.pin = newPin.trim();
            }
            if (resolvedUserId) {
                insertData.user_id = resolvedUserId;
            }
            if (newEmail.trim().length > 0) {
                insertData.email = newEmail.trim().toLowerCase();
            }

            console.log('[StaffPage] Inserting employee with data:', {
                ...insertData,
                pin: insertData.pin ? '***' : undefined // Não logar PIN completo
            });

            // Verificar se supabase está disponível
            if (!supabase || typeof supabase.from !== 'function') {
                console.error('[StaffPage] Supabase client not available', { supabase, hasFrom: typeof supabase?.from });
                toastError('Erro de conexão com o banco de dados. Recarregue a página.');
                setBusy(false);
                return;
            }

            console.log('[StaffPage] About to insert into employees table', {
                table: 'employees',
                data: insertData,
                supabaseUrl: (supabase as any).supabaseUrl || 'N/A',
                hasRestaurantId: !!insertData.restaurant_id,
                restaurantIdType: typeof insertData.restaurant_id
            });

            // Teste: Verificar se a tabela existe fazendo um SELECT simples primeiro
            console.log('[StaffPage] Testing table access...');
            const testQuery = await supabase
                .from('employees')
                .select('id')
                .limit(1);
            
            if (testQuery.error) {
                console.error('[StaffPage] Table access test failed:', {
                    code: testQuery.error.code,
                    message: testQuery.error.message,
                    details: testQuery.error.details,
                    hint: testQuery.error.hint
                });
                
                if (testQuery.error.code === '42P01') {
                    toastError('A tabela "employees" não existe. Aplique a migração SQL primeiro.');
                    setBusy(false);
                    return;
                } else if (testQuery.error.code === '42501' || testQuery.error.message?.includes('permission denied')) {
                    toastError('Sem permissão para acessar a tabela employees. Verifique suas permissões.');
                    setBusy(false);
                    return;
                }
                // Se for outro erro, continua tentando o INSERT
            } else {
                console.log('[StaffPage] ✅ Table exists and is accessible');
            }

            console.log('[StaffPage] Proceeding with INSERT...');
            console.log('[StaffPage] Insert data:', JSON.stringify(insertData, null, 2));
            
            const { data, error } = await supabase
                .from('employees')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('[StaffPage] Insert error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }

            console.log('[StaffPage] Employee created successfully:', data);
            success('Funcionário criado com sucesso!');
            setShowModal(false);
            setNewName('');
            setNewPin('');
            setNewUserId('');
            setNewEmail('');
            setNewRole('worker');
            setNewPosition('waiter');
            await fetchMembers();

        } catch (err: any) {
            console.error('[StaffPage] Error creating employee:', {
                error: err,
                code: err?.code,
                message: err?.message,
                details: err?.details,
                hint: err?.hint
            });
            
            // Mensagens de erro mais específicas
            let errorMessage = 'Erro ao criar funcionário.';
            
            // Erro 409 Conflict (HTTP) ou 23505 (PostgreSQL unique violation)
            if (err?.code === '23505' || err?.status === 409 || err?.statusCode === 409) {
                // Tentar extrair qual campo causou o conflito
                const errorDetails = err?.details || err?.message || '';
                if (errorDetails.includes('user_id') || errorDetails.includes('employees_unique_user_per_restaurant')) {
                    errorMessage = 'Já existe um funcionário ativo vinculado a este usuário neste restaurante.';
                } else if (errorDetails.includes('email')) {
                    errorMessage = 'Já existe um funcionário ativo com este email neste restaurante.';
                } else if (errorDetails.includes('pin')) {
                    errorMessage = 'Já existe um funcionário ativo com este PIN neste restaurante.';
                } else {
                    errorMessage = 'Já existe um funcionário com estes dados. Verifique email, PIN ou usuário.';
                }
            } else if (err?.code === '42P01' || err?.message?.includes("relation") && err?.message?.includes("employees")) {
                errorMessage = 'A tabela "employees" não existe no banco de dados. Aplique a migração: 20260130000000_create_employees_table.sql';
            } else if (err?.code === '42501' || err?.message?.includes('permission denied') || err?.message?.includes('row-level security')) {
                errorMessage = 'Sem permissão para criar funcionários. Verifique se você é owner ou manager do restaurante.';
            } else if (err?.code === '23503') {
                errorMessage = 'Referência inválida. Verifique o user_id ou restaurant_id.';
            } else if (err?.code === 'PGRST301' || err?.message?.includes('new row violates row-level security')) {
                errorMessage = 'Política de segurança bloqueou a operação. Verifique se você tem permissão de owner ou manager.';
            } else if (err?.message) {
                errorMessage = err.message;
            }
            
            toastError(errorMessage);
        } finally {
            setBusy(false);
            console.log('[StaffPage] handleCreateEmployee finished');
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

    // Show warning if restaurantId is not available
    if (!restaurantId) {
        return (
            <AdminLayout
                sidebar={<AdminSidebar activePath="/app/team" onNavigate={navigate} />}
                content={
                    <Card surface="layer1" padding="xl">
                        <Text size="lg" weight="bold" color="destructive" style={{ marginBottom: spacing[4] }}>
                            ⚠️ Restaurante não identificado
                        </Text>
                        <Text color="tertiary" style={{ marginBottom: spacing[4] }}>
                            Por favor, selecione um restaurante para gerenciar a equipe.
                        </Text>
                        <Button tone="action" onClick={() => navigate('/app/select-tenant')}>
                            Selecionar Restaurante
                        </Button>
                    </Card>
                }
            />
        );
    }

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
                            {restaurantId && (
                                <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
                                    Restaurante: {restaurantId.substring(0, 8)}...
                                </Text>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: spacing[3] }}>
                            {import.meta.env.DEV && (
                                <Button 
                                    tone="neutral" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={async () => {
                                        console.log('[StaffPage] ========== TESTE DIRETO ==========');
                                        console.log('Restaurant ID:', restaurantId);
                                        console.log('Supabase client:', supabase);
                                        
                                        if (!restaurantId) {
                                            alert('❌ Restaurant ID não encontrado!');
                                            return;
                                        }
                                        
                                        const testData = {
                                            restaurant_id: restaurantId,
                                            name: 'TESTE ' + Date.now(),
                                            role: 'worker',
                                            position: 'waiter',
                                            active: true
                                        };
                                        
                                        console.log('Tentando inserir:', testData);
                                        
                                        try {
                                            const { data, error } = await supabase
                                                .from('employees')
                                                .insert(testData)
                                                .select()
                                                .single();
                                            
                                            if (error) {
                                                console.error('❌ ERRO:', error);
                                                alert(`ERRO: ${error.code} - ${error.message}`);
                                            } else {
                                                console.log('✅ SUCESSO:', data);
                                                alert('✅ Funcionário de teste criado! ID: ' + data.id);
                                                await fetchMembers();
                                            }
                                        } catch (err: any) {
                                            console.error('❌ EXCEÇÃO:', err);
                                            alert('ERRO: ' + err.message);
                                        }
                                    }}
                                >
                                    🧪 Teste Direto
                                </Button>
                            )}
                            <Button tone="action" onClick={() => setShowModal(true)}>
                                + Adicionar
                            </Button>
                        </div>
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
                        <div 
                            style={{
                                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: spacing[4], zIndex: 100
                            }}
                            onClick={(e) => {
                                // Fechar modal ao clicar no backdrop
                                if (e.target === e.currentTarget) {
                                    setShowModal(false);
                                }
                            }}
                        >
                            <Card surface="base" padding="xl" style={{ maxWidth: '400px', width: '100%' }}>
                                <Text size="xl" weight="bold" style={{ marginBottom: spacing[6] }}>Novo Profissional</Text>

                                <form 
                                    onSubmit={(e) => {
                                        console.log('[StaffPage] Form onSubmit triggered');
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Não chamar aqui, deixar o botão chamar diretamente
                                    }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}
                                    id="employee-form"
                                >
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
                                        <Button 
                                            tone="neutral" 
                                            variant="ghost" 
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button 
                                            tone="action" 
                                            type="button"
                                            disabled={busy || !newName || !newName.trim()}
                                            onClick={(e) => {
                                                console.log('[StaffPage] ========== BUTTON CLICKED ==========', {
                                                    busy,
                                                    hasName: !!newName?.trim(),
                                                    newName,
                                                    restaurantId,
                                                    disabled: busy || !newName || !newName.trim(),
                                                    timestamp: new Date().toISOString()
                                                });
                                                
                                                // Prevenir comportamento padrão
                                                e.preventDefault();
                                                e.stopPropagation();
                                                
                                                // Validações
                                                if (busy) {
                                                    console.warn('[StaffPage] Already processing, ignoring click');
                                                    return;
                                                }
                                                
                                                if (!newName || !newName.trim()) {
                                                    console.warn('[StaffPage] Name is required');
                                                    toastError('O nome é obrigatório.');
                                                    return;
                                                }
                                                
                                                if (!restaurantId) {
                                                    console.error('[StaffPage] No restaurantId');
                                                    toastError('Restaurante não identificado. Por favor, selecione um restaurante.');
                                                    return;
                                                }
                                                
                                                // Chamar diretamente - não depender do form submit
                                                console.log('[StaffPage] Calling handleCreateEmployee directly from button');
                                                handleCreateEmployee(e);
                                            }}
                                        >
                                            {busy ? 'Salvando...' : 'Salvar'}
                                        </Button>
                                    </div>
                                </form>
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
