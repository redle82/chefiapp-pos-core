import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { colors } from '../../ui/design-system/tokens/colors';
import { SOVEREIGN_MANIFEST } from './dashboard_manifest';
import type { SovereignModule } from './dashboard_manifest';
import { SystemStatusLine } from './components/SystemStatusLine';
import { supabase } from '../../core/supabase';
import { OSCopy } from '../../ui/design-system/sovereign/OSCopy';
import { ActivationInsightsPanel } from '../../components/activation/ActivationInsightsPanel';
import { useActivationAdvisor } from '../../core/activation/useActivationAdvisor';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { useTenant } from '../../core/tenant/TenantContext';
import { FiscalAlertBadge } from '../../components/FiscalAlertBadge';

const ModuleCard = ({ module, onClick, variant = 'standard' }: { module: SovereignModule; onClick?: () => void, variant?: 'standard' | 'primary' | 'secondary' }) => {
    const isLocked = module.status === 'locked' || module.status === 'planned';
    const isExperimental = module.status === 'experimental';
    const isPrimary = variant === 'primary';

    return (
        <Card
            surface="layer2"
            padding={isPrimary ? "lg" : "md"}
            hoverable
            onClick={onClick}
            style={{
                opacity: isLocked ? 0.7 : 1,
                cursor: 'pointer',
                border: isExperimental ? '1px solid #a855f733' : isPrimary ? `1px solid ${colors.action.base}33` : undefined,
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: isPrimary ? `linear-gradient(145deg, ${colors.surface.layer2}, ${colors.surface.layer1})` : undefined
            }}
        >
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isPrimary ? 24 : 16 }}>
                    <div style={{ fontSize: isPrimary ? '32px' : '24px' }}>{module.icon}</div>
                    <Badge
                        status={module.status === 'active' ? 'ready' : module.status === 'planned' ? 'new' : module.status === 'locked' ? 'delivered' : 'preparing'}
                        variant="soft"
                        label={module.status.toUpperCase()}
                    />
                </div>
                <Text size={isPrimary ? "xl" : "base"} weight="bold" color="primary">{module.label}</Text>
                <Text size="xs" color="secondary" style={{ marginTop: 4 }}>{module.description}</Text>
            </div>

            {isPrimary && (
                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Text size="xs" color="primary" weight="bold">ABRIR AGORA →</Text>
                </div>
            )}
        </Card>
    );
};

// Helper: Extract module from manifest
const getModule = (id: string) => {
    for (const section of SOVEREIGN_MANIFEST) {
        const found = section.modules.find(m => m.id === id);
        if (found) return found;
    }
    return null;
};

export const DashboardZero = () => {
    const navigate = useNavigate();
    const { restaurant } = useTenant(); // TASK-3.3.2: Usar restaurant do DB
    const [setupStatus, setSetupStatus] = useState<'not_started' | 'quick_done' | 'advanced_in_progress' | 'advanced_done'>('not_started');
    const [advancedProgress, setAdvancedProgress] = useState<Record<string, any> | null>(null);

    // Activation Intelligence: Read-only recommendations
    const { recommendations, highPriority, isReady: advisorReady } = useActivationAdvisor();

    // Browser tab title for Dashboard (Command Center)
    useEffect(() => {
        document.title = 'ChefIApp POS — Dashboard';
        return () => { document.title = 'ChefIApp POS'; };
    }, []);

    useEffect(() => {
        const checkActivation = async () => {
            const restaurantId = getTabIsolated('chefiapp_restaurant_id');
            if (!restaurantId) return;

            // TASK-3.3.2: Verificar DB primeiro (fonte de verdade)
            // Se DB e cache divergem, DB vence
            const isActiveInDB = restaurant?.operation_status === 'active' ||
                (restaurant as any)?.operation_mode === 'Gamified' ||
                (restaurant as any)?.operation_mode === 'Active';

            // 🛡️ ACTIVATION GUARD
            // TASK-3.2.1: Bypass só funciona em desenvolvimento
            const urlParams = new URLSearchParams(window.location.search);
            const skipActivation = urlParams.get('skip_activation');
            const isDevBypass = skipActivation && import.meta.env.DEV;

            if (isActiveInDB) {
                // DB confirma ativação - permitir acesso
                const { setTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
                setTabIsolated('chefiapp_operation_mode', 'active'); // Atualizar cache
            } else if (!isDevBypass) {
                // DB não confirma e não há bypass válido
                const opMode = getTabIsolated('chefiapp_operation_mode');
                if (opMode && restaurant) {
                    // Cache existe mas DB não confirma - DB vence (limpar cache inválido)
                    console.warn('[Dashboard] ⚠️ Cache exists but DB does not confirm activation. DB wins.');
                    const { removeTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
                    removeTabIsolated('chefiapp_operation_mode');
                }
                console.log('[Dashboard] 🛑 Activation Guard: Operation Mode undefined in DB. Redirecting to Activation Wizard.');
                navigate('/activation', { replace: true });
                return;
            }

            if (skipActivation && !import.meta.env.DEV) {
                console.warn('[Dashboard] 🛑 Bypass blocked: skip_activation only works in DEV mode');
            }
        };

        checkActivation();
    }, [navigate, restaurant]);

    // 🛡️ Fail-Safe: Try to fetch columns. If schema is outdated (42703), degrade gracefully.
    useEffect(() => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (!restaurantId) return;

        supabase
            .from('gm_restaurants')
            .select('setup_status, advanced_progress')
            .eq('id', restaurantId)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    // Ignore schema errors (42703) as they are expected during migration/dev
                    if (error.code === '42703') {
                        console.log('[Dashboard] Schema lag detected (setup_status missing). Using default state.');
                    } else {
                        console.warn('[Dashboard] Failed to load setup status', error);
                    }
                    return;
                }
                if (data) {
                    setSetupStatus((data.setup_status as any) || 'not_started');
                    setAdvancedProgress((data.advanced_progress as Record<string, any>) || null);
                }
            });
    }, []);

    /**
     * Staff-style navigation: Active tools open in new browser tabs
     * for isolated, focused operation contexts (TPV, KDS, Menu, Orders).
     * Dashboard/settings remain in-app.
     * 
     * 🚨 CRÍTICO: window.open() deve ser chamado SINCRONAMENTE no onClick
     * Nada antes, nada depois, sem await, sem navigate() antes.
     */
    const handleNavigate = (path: string) => {
        // 🔒 ARQUITETURA LOCKED: Apps operacionais abrem em novas abas
        // Regra de ouro: window.open() sincronamente, sem await, sem navigate() antes
        // Ver: E2E_SOVEREIGN_NAVIGATION_VALIDATION.md
        const toolRoutes = ['/app/tpv', '/app/kds', '/app/menu', '/app/orders', '/app/staff'];

        if (toolRoutes.includes(path)) {
            // 🚨 CRÍTICO: chamada direta e síncrona
            console.log('OPEN TOOL:', path);
            window.open(path, '_blank', 'noopener,noreferrer');
            return;
        }

        navigate(path);
    };

    // 🟢 BLOCK 1: System State (Compact)
    const systemModules = [
        getModule('sys_health'),
        getModule('sys_db'),
        getModule('sys_devices'),
    ].filter(Boolean) as SovereignModule[];

    // ⚡ BLOCK 2: Operation (Focus) - Split into Primary and Secondary
    const primaryOps = [
        getModule('op_tpv'),
        getModule('op_kds'),
        getModule('op_menu'),
        getModule('op_orders'),
    ].filter(Boolean) as SovereignModule[];

    const secondaryOps = [
        getModule('op_map'),
        getModule('fin_sales'),
    ].filter(Boolean) as SovereignModule[];

    return (
        <>
            {/* Alerta Fiscal - Badge e Toast (impossível de ignorar) */}
            {restaurant?.id && (
                <FiscalAlertBadge restaurantId={restaurant.id} />
            )}

            <AdminLayout
                sidebar={<AdminSidebar activePath="/app/dashboard" onNavigate={navigate} />}
                content={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 60, maxWidth: '1000px', margin: '0 auto' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text size="2xl" weight="black" color="primary">{OSCopy.dashboard.title}</Text>
                                <Text size="sm" color="tertiary">{OSCopy.dashboard.subtitle}</Text>
                            </div>
                            {/* Compact System Status Line */}
                            <div style={{ width: '60%' }}>
                                <SystemStatusLine modules={systemModules} />
                            </div>
                        </div>

                        {setupStatus !== 'advanced_done' && (
                            <div style={{
                                padding: '16px 20px',
                                background: 'rgba(50, 215, 75, 0.08)',
                                border: '1px solid rgba(50, 215, 75, 0.35)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <Text size="sm" weight="bold" color="primary">Ritual Avançado Pendente</Text>
                                    <Text size="xs" color="secondary">
                                        Complete os protocolos avançados para provisionar site, mesas, QR e hardware. Estado: {setupStatus}.
                                    </Text>
                                    {advancedProgress && advancedProgress.completed && (
                                        <Text size="xs" color="secondary">Passos concluídos: {advancedProgress.completed.length}</Text>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate('/settings/advanced-setup')}
                                    style={{ padding: '10px 16px', borderRadius: 10, background: colors.action.base, color: '#0b0b0c', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    Iniciar Ritual Avançado
                                </button>
                            </div>
                        )}

                        {/* 🧠 BLOCK 3: Alerts & Attention (Placeholder for real data) */}
                        <div style={{
                            padding: '16px 24px',
                            background: 'rgba(255,165,0,0.05)',
                            border: '1px solid rgba(255,165,0,0.2)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ fontSize: '24px' }}>🛡️</div>
                                <div>
                                    <Text size="sm" weight="bold" color="primary" style={{ color: '#ffb74d' }}>OBSERVATION MODE ACTIVE</Text>
                                    <Text size="xs" color="tertiary">Monitorando anomalias. Nenhuma ação requerida.</Text>
                                </div>
                            </div>
                            <Badge status="ready" label="SECURE" variant="outline" />
                        </div>

                        {/* 💡 BLOCK: Activation Insights — Personalized Recommendations */}
                        {advisorReady && highPriority.length > 0 && (
                            <div style={{
                                padding: '20px 24px',
                                background: 'rgba(50, 215, 75, 0.03)',
                                border: '1px solid rgba(50, 215, 75, 0.15)',
                                borderRadius: '16px'
                            }}>
                                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Text size="lg" weight="bold" color="primary">Recomendações</Text>
                                    <div style={{
                                        padding: '2px 8px',
                                        background: 'rgba(50, 215, 75, 0.15)',
                                        borderRadius: 12,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#32d74b'
                                    }}>
                                        {highPriority.length} alta prioridade
                                    </div>
                                </div>
                                <ActivationInsightsPanel
                                    recommendations={highPriority}
                                    variant="compact"
                                    showHeader={false}
                                    limit={3}
                                />
                                {recommendations.length > 3 && (
                                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                                        <Text size="xs" color="secondary">
                                            + {recommendations.length - 3} mais recomendações disponíveis
                                        </Text>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ⚡ BLOCK 2: Operation (Focus) */}
                        <div>
                            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Text size="lg" weight="bold" color="primary">{OSCopy.dashboard.operation}</Text>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.action.base, opacity: 0.5 }}></div>
                                <Text size="xs" color="tertiary" weight="medium">{OSCopy.dashboard.priority}</Text>
                            </div>

                            {/* Primary Grid (Big Cards) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
                                {primaryOps.map(module => {
                                    if (module.status !== 'active' || !module.path) {
                                        return (
                                            <ModuleCard
                                                key={module.id}
                                                module={module}
                                                variant="primary"
                                                onClick={() => navigate(`/app/coming-soon?module=${module.id}`)}
                                            />
                                        );
                                    }
                                    return (
                                        <ModuleCard
                                            key={module.id}
                                            module={module}
                                            variant="primary"
                                            onClick={() => handleNavigate(module.path)}
                                        />
                                    );
                                })}
                            </div>

                            {/* Secondary Grid (Standard Cards) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                {secondaryOps.map(module => {
                                    if (module.status !== 'active' || !module.path) {
                                        return (
                                            <ModuleCard
                                                key={module.id}
                                                module={module}
                                                variant="secondary"
                                                onClick={() => navigate(`/app/coming-soon?module=${module.id}`)}
                                            />
                                        );
                                    }
                                    return (
                                        <ModuleCard
                                            key={module.id}
                                            module={module}
                                            variant="secondary"
                                            onClick={() => handleNavigate(module.path)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div style={{ textAlign: 'center', marginTop: 32, opacity: 0.3 }}>
                            <Text size="xs" color="tertiary">
                                ChefIApp Operation OS • v1.0.0 (Observability)
                            </Text>
                        </div>

                    </div>
                }
            />
        </>
    );
};

export default DashboardZero;
