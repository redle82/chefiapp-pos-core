import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import { Card } from '../../ui/design-system/Card'; // Legacy import match
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { RitualScreen } from '../Onboarding/RitualScreen'; // Reuse Ritual UI
import { getTabIsolated, setTabIsolated } from '../../core/storage/TabIsolatedStorage';

type ActivationStep = 'intro' | 'mode' | 'device' | 'menu' | 'finishing';

export const ActivationPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<ActivationStep>('intro');
    const [config, setConfig] = useState({
        operationMode: '',
        deviceRole: '',
        menuStrategy: ''
    });

    // Save to LocalStorage/DB
    const saveAndAdvance = async (key: string, value: string, nextStep: ActivationStep | 'DONE') => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);

        // Persist incrementally
        setTabIsolated('chefiapp_activation_config', JSON.stringify(newConfig));

        if (nextStep === 'DONE') {
            setStep('finishing');
            await finalizeActivation(newConfig);
        } else {
            setStep(nextStep);
        }
    };

    const finalizeActivation = async (finalConfig: any) => {
        // 1. Local Persistence (Speed)
        setTabIsolated('chefiapp_operation_mode', finalConfig.operationMode);
        setTabIsolated('chefiapp_device_role', finalConfig.deviceRole);

        // 2. Sovereign Persistence (Truth)
        try {
            await supabase.rpc('update_operation_status', {
                p_status: 'active',
                p_reason: 'Activation Ritual Complete'
            });
            console.log('[Activation] ✅ Sovereign Status: Active');
        } catch (err) {
            console.error('[Activation] ⚠️ Failed to sync status:', err);
            // Non-blocking: Proceed to dashboard
        }

        setTimeout(() => {
            navigate('/app/dashboard');
        }, 1500);
    };

    // --- SCREENS ---

    if (step === 'intro') {
        return (
            <RitualScreen
                id="activation_intro"
                title="Ativação Operacional"
                subtitle="A fundação está completa. Agora, vamos configurar como sua equipe vai trabalhar."
                primaryAction={{
                    label: 'Iniciar Configuração',
                    onClick: () => setStep('mode')
                }}
            >
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 24 }}>✨</div>
                    <Text size="lg" color="secondary">
                        3 perguntas rápidas para adaptar o ChefIApp à sua realidade física.
                    </Text>
                </div>
            </RitualScreen>
        );
    }

    if (step === 'mode') {
        return (
            <RitualScreen
                id="activation_mode"
                title="Como você vai operar?"
                subtitle="Defina o estilo de comando do seu restaurante."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <OptionCard
                        icon="📱"
                        title="Comando Mobile (Light)"
                        description="Apenas o dono gerenciando pelo celular. Sem TPV fixo, sem garçons com app."
                        onClick={() => saveAndAdvance('operationMode', 'mobile_only', 'device')}
                    />
                    <OptionCard
                        icon="🖥️"
                        title="Híbrido (Recomendado)"
                        description="Computador no caixa + Dono no celular. Equilíbrio perfeito."
                        onClick={() => saveAndAdvance('operationMode', 'hybrid', 'device')}
                        highlight
                    />
                    <OptionCard
                        icon="🏢"
                        title="Operação Completa (Pro)"
                        description="Caixa, Cozinha (KDS) e Garçons conectados. Full Power."
                        onClick={() => saveAndAdvance('operationMode', 'full', 'device')}
                    />
                </div>
            </RitualScreen>
        );
    }

    if (step === 'device') {
        return (
            <RitualScreen
                id="activation_device"
                title="Quem é este dispositivo?"
                subtitle="Identifique o papel desta tela na operação."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <OptionCard
                        icon="👑"
                        title="Celular do Dono"
                        description="Acesso total. Painel de comando e monitoramento."
                        onClick={() => saveAndAdvance('deviceRole', 'owner_device', 'menu')}
                    />
                    <OptionCard
                        icon="🖥️"
                        title="Caixa / Gerente"
                        description="Computador principal. Abre e fecha caixa, edita cardápio."
                        onClick={() => saveAndAdvance('deviceRole', 'manager_terminal', 'menu')}
                    />
                    <OptionCard
                        icon="🍳"
                        title="Tela de Cozinha (KDS)"
                        description="Apenas recebe pedidos. Sem acesso a financeiro."
                        onClick={() => saveAndAdvance('deviceRole', 'kds_screen', 'menu')}
                    />
                </div>
            </RitualScreen>
        );
    }

    if (step === 'menu') {
        return (
            <RitualScreen
                id="activation_menu"
                title="E o Cardápio?"
                subtitle="O coração da sua venda precisa ser criado."
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <OptionCard
                        icon="🪄"
                        title="Vou criar do zero agora"
                        description="Quero cadastrar meus produtos manualmente no próximo passo."
                        onClick={() => saveAndAdvance('menuStrategy', 'scratch', 'DONE')}
                    />
                    <OptionCard
                        icon="🛵"
                        title="Tenho no iFood / Apps"
                        description="Quero importar meu cardápio de outra plataforma (Beta)."
                        onClick={() => saveAndAdvance('menuStrategy', 'import', 'DONE')}
                    />
                    <OptionCard
                        icon="⏳"
                        title="Configurar depois"
                        description="Quero explorar o sistema primeiro."
                        onClick={() => saveAndAdvance('menuStrategy', 'later', 'DONE')}
                    />
                </div>
            </RitualScreen>
        );
    }

    if (step === 'finishing') {
        return (
            <RitualScreen
                id="activation_finish"
                title="Configurando Ambiente..."
                subtitle="Adaptando a interface para sua escolha."
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #333', borderTopColor: '#32d74b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </RitualScreen>
        );
    }

    return null;
};

// Sub-component for options
const OptionCard = ({ icon, title, description, onClick, highlight }: any) => (
    <Card
        surface="layer2"
        padding="md"
        hoverable
        onClick={onClick}
        style={{
            cursor: 'pointer',
            border: highlight ? '1px solid #32d74b' : '1px solid rgba(255,255,255,0.1)',
            background: highlight ? 'rgba(50, 215, 75, 0.05)' : undefined
        }}
    >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div>
                <Text weight="bold" color={highlight ? 'success' : 'primary'}>{title}</Text>
                <Text size="sm" color="secondary">{description}</Text>
            </div>
        </div>
    </Card>
);
