import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { buildPublicUrls, getRestaurantSlug } from '../../utils/buildPublicUrls';
import { useToast } from '../../ui/design-system';
import { useTenant } from '../../core/tenant/TenantContext';
import { supabase } from '../../core/supabase';
import { WebPresenceWizard, type WebPresenceType } from './WebPresenceWizard';

interface WebPresence {
    id: string;
    restaurant_id: string;
    type: 'simple' | 'menu' | 'site';
    status: 'draft' | 'provisioning' | 'live' | 'error';
    config: Record<string, any>;
    domain?: string | null;
    custom_domain?: string | null;
    error_message?: string | null;
}

export function RestaurantWebPreviewPage() {
    const navigate = useNavigate();
    const { success, error: toastError, warning } = useToast();
    const { tenantId } = useTenant();
    const [webPresence, setWebPresence] = useState<WebPresence | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);
    const [provisioning, setProvisioning] = useState(false);

    useEffect(() => {
        if (tenantId) {
            loadWebPresence();
        } else {
            setLoading(false);
        }
    }, [tenantId]);

    const loadWebPresence = async () => {
        if (!tenantId) return;
        
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('restaurant_web_presence')
                .select('*')
                .eq('restaurant_id', tenantId)
                .maybeSingle();

            // 404 ou PGRST116 significa que não há registro (esperado)
            // 42P01 significa que a tabela não existe (migração não aplicada)
            if (error) {
                if (error.code === '42P01' || error.message?.includes('relation') && error.message?.includes('restaurant_web_presence')) {
                    console.error('[RestaurantWebPreviewPage] ❌ Tabela restaurant_web_presence não existe!');
                    console.error('   Aplique a migração: supabase/migrations/20260130000001_restaurant_web_presence.sql');
                    toastError('Tabela não encontrada. Aplique a migração SQL primeiro.');
                    return;
                } else if (error.code === 'PGRST116' || error.status === 404) {
                    // Não há registro - isso é esperado, mostrar wizard
                    console.log('[RestaurantWebPreviewPage] Nenhuma web presence encontrada - mostrando wizard');
                } else {
                    console.error('[RestaurantWebPreviewPage] Error loading web presence:', error);
                    toastError('Erro ao carregar presença web');
                    return;
                }
            }

            if (data) {
                setWebPresence(data as WebPresence);
                setShowWizard(false);
            } else {
                // Não há web presence - mostrar wizard
                setShowWizard(true);
            }
        } catch (err: any) {
            console.error('[RestaurantWebPreviewPage] Unexpected error:', err);
            // Se for erro de tabela não encontrada, mostrar mensagem específica
            if (err?.code === '42P01' || err?.message?.includes('relation')) {
                toastError('Tabela não encontrada. Aplique a migração SQL primeiro.');
            } else {
                toastError('Erro ao carregar informações');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWebPresence = useCallback(async (type: WebPresenceType) => {
        console.log('[RestaurantWebPreviewPage] ========== handleCreateWebPresence CALLED ==========', {
            type,
            tenantId,
            timestamp: new Date().toISOString()
        });

        if (!tenantId) {
            console.error('[RestaurantWebPreviewPage] No tenantId available');
            toastError('Restaurante não identificado');
            return;
        }

        setProvisioning(true);
        setShowWizard(false);

        try {
            console.log('[RestaurantWebPreviewPage] Inserting web presence into database...');
            
            // Criar registro no banco
            const { data, error } = await supabase
                .from('restaurant_web_presence')
                .insert({
                    restaurant_id: tenantId,
                    type,
                    status: 'provisioning',
                    config: {}
                })
                .select()
                .single();

            if (error) {
                console.error('[RestaurantWebPreviewPage] ❌ Error creating web presence:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                
                // Tratamento específico de erros
                if (error.code === '42P01' || error.message?.includes('relation') && error.message?.includes('restaurant_web_presence')) {
                    toastError('Tabela não encontrada. Aplique a migração SQL primeiro.');
                    setShowWizard(true); // Voltar ao wizard
                    setProvisioning(false);
                    return;
                } else if (error.code === '23505') {
                    toastError('Já existe uma página web para este restaurante.');
                    setShowWizard(true);
                    setProvisioning(false);
                    return;
                } else if (error.code === '42501' || error.message?.includes('permission denied')) {
                    toastError('Sem permissão para criar página web. Verifique se você é owner ou manager.');
                    setShowWizard(true);
                    setProvisioning(false);
                    return;
                }
                
                throw error;
            }

            console.log('[RestaurantWebPreviewPage] ✅ Web presence created successfully:', data);
            setWebPresence(data as WebPresence);
            success('Página web criada! Provisionando...');

            // TODO: Chamar edge function para provisionar
            // Por enquanto, apenas simular sucesso após 2 segundos
            setTimeout(async () => {
                const { data: updated, error: updateError } = await supabase
                    .from('restaurant_web_presence')
                    .update({ 
                        status: 'live',
                        domain: `${type}.chefiapp.com`,
                        provisioned_at: new Date().toISOString()
                    })
                    .eq('id', data.id)
                    .select()
                    .single();

                if (!updateError && updated) {
                    setWebPresence(updated as WebPresence);
                    success('Página web ativada com sucesso!');
                }
            }, 2000);

        } catch (err: any) {
            console.error('[RestaurantWebPreviewPage] ❌ Unexpected error:', {
                error: err,
                code: err?.code,
                message: err?.message,
                stack: err?.stack
            });
            
            let errorMessage = 'Erro ao criar página web.';
            if (err?.message) {
                errorMessage = err.message;
            } else if (err?.code) {
                errorMessage = `Erro ${err.code}: ${err.message || 'Erro desconhecido'}`;
            }
            
            toastError(errorMessage);
            setShowWizard(true); // Voltar ao wizard em caso de erro
        } finally {
            setProvisioning(false);
            console.log('[RestaurantWebPreviewPage] handleCreateWebPresence finished');
        }
    }, [tenantId, success, toastError]);

    const openInNewTab = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (loading || provisioning) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Text size="lg" weight="bold" style={{ marginBottom: 8 }}>
                    {provisioning ? 'Provisionando página web...' : 'Carregando...'}
                </Text>
                {provisioning && (
                    <Text size="sm" color="secondary">
                        Isso pode levar alguns segundos
                    </Text>
                )}
            </div>
        );
    }

    // Mostrar wizard se não há web presence ou se está em draft
    if (showWizard || !webPresence || webPresence.status === 'draft') {
        if (!tenantId) {
            return (
                <div style={{ padding: 24 }}>
                    <Card surface="layer1" padding="lg">
                        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
                            Restaurante não identificado
                        </Text>
                        <Text color="secondary" style={{ marginBottom: 24 }}>
                            Por favor, selecione um restaurante primeiro.
                        </Text>
                        <Button
                            tone="action"
                            variant="solid"
                            onClick={() => navigate('/app/select-tenant')}
                        >
                            Selecionar Restaurante
                        </Button>
                    </Card>
                </div>
            );
        }

        return (
            <WebPresenceWizard
                restaurantId={tenantId}
                onSelect={(type) => {
                    console.log('[RestaurantWebPreviewPage] onSelect callback received type:', type);
                    handleCreateWebPresence(type);
                }}
                onCancel={() => navigate('/app/dashboard')}
            />
        );
    }

    // Se está provisionando ou com erro
    if (webPresence.status === 'provisioning') {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Text size="xl" weight="bold" style={{ marginBottom: 8 }}>
                    ⏳ Provisionando...
                </Text>
                <Text color="secondary" style={{ marginBottom: 24 }}>
                    Sua página web está sendo criada. Isso pode levar alguns minutos.
                </Text>
                <Button
                    tone="neutral"
                    variant="outline"
                    onClick={loadWebPresence}
                >
                    Atualizar Status
                </Button>
            </div>
        );
    }

    if (webPresence.status === 'error') {
        return (
            <div style={{ padding: 24 }}>
                <Card surface="layer1" padding="lg">
                    <Text size="xl" weight="bold" color="destructive" style={{ marginBottom: 16 }}>
                        ❌ Erro ao criar página web
                    </Text>
                    <Text color="secondary" style={{ marginBottom: 24 }}>
                        {webPresence.error_message || 'Ocorreu um erro durante o provisionamento.'}
                    </Text>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button
                            tone="action"
                            variant="solid"
                            onClick={() => setShowWizard(true)}
                        >
                            Tentar Novamente
                        </Button>
                        <Button
                            tone="neutral"
                            variant="outline"
                            onClick={() => navigate('/app/dashboard')}
                        >
                            Voltar ao Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Web presence está live - mostrar URLs
    const slug = webPresence.domain || webPresence.custom_domain || 'seu-restaurante';
    const urls = buildPublicUrls(slug);

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                    Páginas Web do Restaurante
                </Text>
                <Text color="secondary">
                    Visualize e acesse as páginas públicas do seu restaurante
                </Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Home Page */}
                <Card surface="layer1" padding="lg" hoverable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                                🏠 Página Inicial
                            </Text>
                            <Text size="sm" color="secondary" style={{ marginBottom: 4 }}>
                                {urls.home}
                            </Text>
                            <Text size="xs" color="tertiary">
                                Landing page pública do restaurante
                            </Text>
                        </div>
                        <Button
                            tone="neutral"
                            variant="outline"
                            onClick={() => openInNewTab(urls.home)}
                        >
                            Abrir em Nova Aba
                        </Button>
                    </div>
                </Card>

                {/* Menu Page */}
                <Card surface="layer1" padding="lg" hoverable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                                🍔 Cardápio Público
                            </Text>
                            <Text size="sm" color="secondary" style={{ marginBottom: 4 }}>
                                {urls.menu}
                            </Text>
                            <Text size="xs" color="tertiary">
                                Menu completo para visualização e pedidos
                            </Text>
                        </div>
                        <Button
                            tone="neutral"
                            variant="outline"
                            onClick={() => openInNewTab(urls.menu)}
                        >
                            Abrir em Nova Aba
                        </Button>
                    </div>
                </Card>

                {/* QR Table Links */}
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
                        🪑 Links de Mesa (QR Code)
                    </Text>
                    <Text size="sm" color="secondary" style={{ marginBottom: 16 }}>
                        URLs para mesas 1-12 (preview)
                    </Text>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                        gap: 12 
                    }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(tableNum => (
                            <Button
                                key={tableNum}
                                tone="neutral"
                                variant="outline"
                                onClick={() => openInNewTab(urls.table(tableNum))}
                                style={{ fontSize: '0.875rem' }}
                            >
                                Mesa {tableNum}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* Info Card */}
                <Card surface="layer2" padding="md">
                    <Text size="sm" color="secondary">
                        💡 <strong>Dica:</strong> Use estes links para compartilhar com clientes, 
                        gerar QR codes para mesas, ou testar a experiência pública do seu restaurante.
                    </Text>
                </Card>
            </div>
        </div>
    );
}
