import React, { useState } from 'react';
import { useStaff } from './context/StaffContext';
import type { BusinessType } from './context/StaffCoreTypes';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { colors } from '../../ui/design-system/tokens/colors';
import { radius } from '../../ui/design-system/tokens/radius';

export const AppStaffLanding: React.FC = () => {
    const { createLocalContract } = useStaff();
    const [step, setStep] = useState<'initial' | 'select_type' | 'connect_code'>('initial');

    // WRAPPER
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: colors.surface.base,
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
        }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                {children}
            </div>
        </div>
    );

    // STEP 1: THE DOOR
    if (step === 'initial') {
        return (
            <Wrapper>
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                    <Text size="4xl" weight="black" color="primary">ChefIApp</Text>
                    <Text size="md" color="secondary" style={{ marginTop: 8 }}>Painel Operacional</Text>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* MODE B: EXISTING (THE BRIDGE) */}
                    <Card
                        surface="layer1"
                        padding="xl"
                        style={{ cursor: 'pointer', border: `1px solid ${colors.border.subtle}` }}
                    // onClick workaround
                    >
                        <div onClick={() => setStep('connect_code')} style={{ width: '100%', height: '100%' }}>
                            <Text size="lg" weight="bold" color="primary">Entrar na Equipa</Text>
                            <Text size="sm" color="tertiary" style={{ marginTop: 4 }}>Usar código de convite ou QR.</Text>
                        </div>
                    </Card>

                    {/* MODE A: STANDALONE */}
                    <Button
                        tone="neutral"
                        variant="ghost"
                        fullWidth
                        onClick={() => setStep('select_type')}
                        style={{ justifyContent: 'center' }}
                    >
                        Criar Operação Local (Demo)
                    </Button>
                </div>
            </Wrapper>
        );
    }

    // STEP 1.5: CONNECT CODE INPUT
    if (step === 'connect_code') {
        return (
            <Wrapper>
                <ConnectCodeView onBack={() => setStep('initial')} />
            </Wrapper>
        );
    }

    // STEP 2: BUSINESS SELECTOR (CORE 1 MINI)
    return (
        <Wrapper>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Text size="xl" weight="bold" color="primary">O que vamos operar?</Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(['cafe', 'restaurant', 'bar'] as BusinessType[]).map(type => (
                    <Card
                        key={type}
                        surface="layer1"
                        padding="lg"
                        style={{ cursor: 'pointer', border: `1px solid ${colors.border.subtle}` }}
                    >
                        <div
                            onClick={() => createLocalContract(type)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <Text size="lg" weight="bold" color="primary">
                                {type === 'cafe' ? '☕ Café' : type === 'bar' ? '🍸 Bar' : '🍽️ Restaurante'}
                            </Text>
                            <Text size="lg" color="tertiary">→</Text>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ marginTop: 40 }}>
                <Button tone="neutral" variant="ghost" fullWidth onClick={() => setStep('initial')}>
                    Voltar
                </Button>
            </div>
        </Wrapper>
    );
};

// 🔌 THE BRIDGE UI
const ConnectCodeView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { joinRemoteOperation } = useStaff();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await joinRemoteOperation(code);
        if (!result.success) {
            setError(result.message || 'Erro desconhecido');
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Text size="xl" weight="bold" color="primary">Inserir Código</Text>
                <Text size="sm" color="tertiary" style={{ marginTop: 8 }}>Digite o código do Painel do Gerente.</Text>
            </div>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="CHEF-XXXX-XX"
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${colors.border.strong}`,
                        fontSize: 32,
                        color: colors.text.primary,
                        marginBottom: 24,
                        textAlign: 'center',
                        letterSpacing: 4,
                        fontFamily: 'monospace',
                        outline: 'none',
                        padding: 8
                    }}
                    autoFocus
                />

                {error && (
                    <div style={{ marginBottom: 24, textAlign: 'center' }}>
                        <Text size="sm" color="destructive">{error}</Text>
                    </div>
                )}

                <Button
                    tone="action"
                    fullWidth
                    disabled={loading || code.length < 5}
                    onClick={() => { }} // Form submit handles it
                    style={{ justifyContent: 'center' }}
                >
                    {loading ? 'A verificar...' : 'Conectar'}
                </Button>
            </form>

            <div style={{ marginTop: 24 }}>
                <Button tone="neutral" variant="ghost" fullWidth onClick={onBack}>
                    Voltar
                </Button>
            </div>
        </div>
    );
}
