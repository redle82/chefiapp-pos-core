import React, { useState, useEffect } from 'react';
import { useStaff } from './context/StaffContext';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { colors } from '../../ui/design-system/tokens/colors';
import { radius } from '../../ui/design-system/tokens/radius';
import { BiometricService } from './core/BiometricService';

export const WorkerCheckInView: React.FC = () => {
    const { checkIn } = useStaff();
    const [name, setName] = useState('');
    const [biometricsAvailable, setBiometricsAvailable] = useState(false);

    useEffect(() => {
        BiometricService.checkAvailability().then(setBiometricsAvailable);
    }, []);

    const handleEnter = async () => {
        if (!name.trim()) return;

        // Enrollment Prompt
        if (biometricsAvailable) {
            const wantsBio = window.confirm(`Deseja ativar Login Rápido (FaceID/TouchID) para "${name}"?`);
            if (wantsBio) {
                await BiometricService.registerUser(name);
            }
        }

        checkIn(name);
    };

    const handleBiometricLogin = async () => {
        const username = await BiometricService.verifyUser();
        if (username) {
            setName(username);
            // Optional: Auto-login or just fill
            checkIn(username);
        } else {
            // alert('Falha ao verificar identidade.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.surface.base,
            color: colors.text.primary,
            padding: 24
        }}>
            <div style={{ width: '100%', maxWidth: 380 }}>
                {/* 1. BRAND SIGNAL */}
                <div style={{
                    marginBottom: 48,
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: colors.action.base,
                        boxShadow: `0 0 20px ${colors.action.base}40`
                    }} />
                </div>

                {/* 2. IDENTITY PROMPT */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Text size="3xl" weight="black" color="primary">Olá!</Text>
                    <Text size="lg" color="secondary" style={{ marginTop: 8 }}>Quem é você hoje?</Text>
                </div>

                {/* 3. INPUT FIELD */}
                <div style={{ marginBottom: 24 }}>
                    <input
                        type="text"
                        placeholder="Seu Nome"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEnter()}
                        style={{
                            width: '100%',
                            backgroundColor: colors.surface.layer1,
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: radius.md,
                            padding: 16,
                            fontSize: 18,
                            color: colors.text.primary,
                            outline: 'none',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                        }}
                        onFocus={(e) => e.target.style.borderColor = colors.action.base}
                        onBlur={(e) => e.target.style.borderColor = colors.border.subtle}
                        autoFocus
                    />
                </div>

                {/* 4. ACTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Button
                        tone="action"
                        fullWidth
                        size="lg"
                        onClick={handleEnter}
                        disabled={!name.trim()}
                    >
                        Entrar
                    </Button>

                    {biometricsAvailable && (
                        <Button
                            tone="neutral"
                            variant="ghost"
                            fullWidth
                            size="lg"
                            onClick={handleBiometricLogin}
                        >
                            🔐 Usar Face ID
                        </Button>
                    )}
                </div>

                <div style={{ marginTop: 40, textAlign: 'center', opacity: 0.5 }}>
                    <Text size="xs" color="tertiary" style={{ fontFamily: 'monospace' }}>v1.1 (Bio-Enabled)</Text>
                </div>
            </div>
        </div>
    );
};
