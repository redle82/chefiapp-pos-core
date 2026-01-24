import React, { useState } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

// Define types locally for now, could be moved to domain later
export type OperatorRole = 'manager' | 'caixa' | 'staff';
export type OperationMode = 'command' | 'rush' | 'training';

export interface Operator {
    id: string;
    name: string;
    role: OperatorRole;
    avatar?: string; // Emoji for now
}

interface TPVLockScreenProps {
    onUnlock: (operator: Operator, mode: OperationMode) => void;
}

const MOCK_OPERATORS: Operator[] = [
    { id: '1', name: 'Sofia (Gerente)', role: 'manager', avatar: '👩‍💼' },
    { id: '2', name: 'João (Caixa)', role: 'caixa', avatar: '👨‍💻' },
    { id: '3', name: 'Maria (Apoio)', role: 'staff', avatar: '🏃‍♀️' },
];

const MODES: { id: OperationMode; label: string; description: string; icon: string }[] = [
    { id: 'command', label: 'Torre de Controle', description: 'Gestão completa e resolução de exceções.', icon: '🧠' },
    { id: 'rush', label: 'Modo Rush', description: 'Interface simplificada para alta velocidade.', icon: '⚡' },
    { id: 'training', label: 'Modo Treino', description: 'Ambiente seguro para novos colaboradores.', icon: '🛡️' },
];

export const TPVLockScreen: React.FC<TPVLockScreenProps> = ({ onUnlock }) => {
    const [step, setStep] = useState<'nucleus' | 'operator' | 'pin' | 'mode'>('nucleus');
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
    const [selectedMode, setSelectedMode] = useState<OperationMode | null>(null);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);

    // Auto-transition from nucleus to operator selection after 3 seconds
    React.useEffect(() => {
        if (step === 'nucleus') {
            const timer = setTimeout(() => {
                setStep('operator');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleOperatorSelect = (op: Operator) => {
        setSelectedOperator(op);
        setPin('');
        setPinError(false);
        setStep('pin');
    };

    const handlePinSubmit = () => {
        // For demo: accept any 4-digit PIN (real impl would verify against operator.pin)
        if (pin.length === 4) {
            setPinError(false);
            setStep('mode');
        } else {
            setPinError(true);
        }
    };

    const handleUnlock = () => {
        if (selectedOperator && selectedMode) {
            onUnlock(selectedOperator, selectedMode);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: colors.surface.base, // Absolute Void
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.text.primary
        }}>
            <div style={{ maxWidth: '600px', width: '100%', padding: spacing[6] }}>

                {/* Header / Branding */}
                <div style={{ marginBottom: spacing[8], textAlign: 'center' }}>
                    <Text size="3xl" weight="black" color="primary">ChefIApp</Text>
                    <Text size="lg" color="tertiary" style={{ marginTop: spacing[2] }}>
                        {step === 'nucleus' && 'Terminal Central Operacional'}
                        {step === 'operator' && 'Identifique-se para assumir o comando.'}
                        {step === 'pin' && `Olá, ${selectedOperator?.name.split(' ')[0]}!`}
                        {step === 'mode' && `Bem-vindo, ${selectedOperator?.name.split(' ')[0]}.`}
                    </Text>
                </div>

                {/* --- STEP: NUCLEUS AWAKE --- */}
                {step === 'nucleus' && (
                    <div style={{ textAlign: 'center', animation: 'pulse 2s ease-in-out infinite' }}>
                        <div style={{ fontSize: '80px', marginBottom: spacing[6] }}>🧠</div>
                        <Text size="xl" weight="bold" color="action">Sistema Inicializado</Text>
                        <Text size="md" color="tertiary" style={{ marginTop: spacing[2] }}>
                            Hardware: ✓ Online &nbsp;|&nbsp; Voz: ✓ Ativa &nbsp;|&nbsp; Rede: ✓ Conectada
                        </Text>
                        <div style={{ marginTop: spacing[6], opacity: 0.5 }}>
                            <Text size="sm" color="tertiary">Aguardando operador...</Text>
                        </div>
                    </div>
                )}

                {/* --- STEP: OPERATOR SELECT --- */}
                {step === 'operator' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[4], animation: 'fadeIn 0.3s ease-in-out' }}>
                        {MOCK_OPERATORS.map(op => (
                            <div key={op.id} onClick={() => handleOperatorSelect(op)} style={{ cursor: 'pointer' }}>
                                <Card surface="layer1" padding="lg" hoverable style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[3],
                                    border: `1px solid ${colors.border.subtle}`, textAlign: 'center'
                                }}>
                                    <span style={{ fontSize: '48px' }}>{op.avatar}</span>
                                    <div>
                                        <Text size="lg" weight="bold" color="primary">{op.name.split(' ')[0]}</Text>
                                        <Text size="sm" color="tertiary">{op.role.toUpperCase()}</Text>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- STEP: PIN ENTRY --- */}
                {step === 'pin' && selectedOperator && (
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={{ fontSize: '64px', marginBottom: spacing[4] }}>{selectedOperator.avatar}</div>
                        <Text size="xl" weight="bold" color="primary">{selectedOperator.name.split(' ')[0]}</Text>
                        <Text size="sm" color="tertiary" style={{ marginTop: spacing[1] }}>
                            Digite seu PIN para confirmar
                        </Text>

                        <div style={{ marginTop: spacing[6], display: 'flex', justifyContent: 'center', gap: spacing[2] }}>
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{
                                    width: 48, height: 56,
                                    border: `2px solid ${pinError ? colors.signal.negative : (pin.length > i ? colors.action.base : colors.border.subtle)}`,
                                    borderRadius: 8, backgroundColor: colors.surface.layer1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px', fontWeight: 'bold', color: colors.text.primary
                                }}>
                                    {pin[i] ? '•' : ''}
                                </div>
                            ))}
                        </div>
                        {pinError && <Text size="sm" color="error" style={{ marginTop: spacing[2] }}>PIN inválido</Text>}

                        <div style={{ marginTop: spacing[6], display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[2], maxWidth: 240, margin: '0 auto' }}>
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(key => (
                                <Button
                                    key={key}
                                    variant="ghost"
                                    disabled={key === ''}
                                    onClick={() => {
                                        if (key === '⌫') setPin(p => p.slice(0, -1));
                                        else if (pin.length < 4 && key !== '') setPin(p => p + key);
                                    }}
                                    style={{ height: 56, fontSize: '20px' }}
                                >
                                    {key}
                                </Button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[6] }}>
                            <Button variant="ghost" onClick={() => { setStep('operator'); setPin(''); }} style={{ flex: 1 }}>
                                Voltar
                            </Button>
                            <Button variant="primary" disabled={pin.length !== 4} onClick={handlePinSubmit} style={{ flex: 2 }}>
                                CONFIRMAR
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- STEP: MODE SELECT --- */}
                {step === 'mode' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6], animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={{ display: 'grid', gap: spacing[3] }}>
                            <Text size="sm" color="tertiary" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Defina o Modo Operacional
                            </Text>
                            {MODES.map(mode => (
                                <div
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode.id)}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <Card
                                        surface={selectedMode === mode.id ? 'layer3' : 'layer1'}
                                        padding="md"
                                        style={{
                                            border: selectedMode === mode.id ? `2px solid ${colors.action.base}` : `1px solid ${colors.border.subtle}`,
                                            display: 'flex', alignItems: 'center', gap: spacing[4]
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '24px',
                                            width: 48, height: 48,
                                            borderRadius: '50%', backgroundColor: colors.surface.layer2,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {mode.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text size="lg" weight="bold" color={selectedMode === mode.id ? 'action' : 'primary'}>
                                                {mode.label}
                                            </Text>
                                            <Text size="sm" color="tertiary">{mode.description}</Text>
                                        </div>
                                        {selectedMode === mode.id && (
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colors.action.base }} />
                                        )}
                                    </Card>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[4] }}>
                            <Button variant="ghost" onClick={() => setStep('pin')} style={{ flex: 1 }}>
                                Voltar
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                disabled={!selectedMode}
                                onClick={handleUnlock}
                                style={{ flex: 2 }}
                            >
                                INICIAR TURNO
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
};
