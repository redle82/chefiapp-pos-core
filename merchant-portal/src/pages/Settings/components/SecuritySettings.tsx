/**
 * P5-9: Security Settings Component
 * 
 * Componente para configurações de segurança avançadas
 */

import React, { useState } from 'react';
import { advancedSecurityService } from '../../../core/security/AdvancedSecurityService';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';

export const SecuritySettings: React.FC = () => {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [totpSecret, setTotpSecret] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState('');

    const enable2FA = () => {
        const secret = advancedSecurityService.generateTOTPSecret();
        setTotpSecret(secret);
        setTwoFactorEnabled(true);
    };

    const verify2FA = () => {
        if (totpSecret && totpCode) {
            const isValid = advancedSecurityService.verifyTOTP(totpSecret, totpCode);
            if (isValid) {
                // Save 2FA config
                console.log('[SecuritySettings] 2FA enabled');
            } else {
                alert('Código inválido');
            }
        }
    };

    return (
        <Card surface="layer1" padding="lg">
            <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>🔒 Segurança Avançada</Text>

            {/* 2FA */}
            <div style={{ marginBottom: 24 }}>
                <Text size="md" weight="bold" style={{ marginBottom: 8 }}>Autenticação de Dois Fatores (2FA)</Text>
                <Text size="sm" color="tertiary" style={{ marginBottom: 12 }}>
                    Adicione uma camada extra de segurança à sua conta
                </Text>

                {!twoFactorEnabled ? (
                    <Button variant="outline" onClick={enable2FA}>
                        Ativar 2FA
                    </Button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Text size="sm">Secret: {totpSecret}</Text>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Input
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                placeholder="Código TOTP (6 dígitos)"
                                style={{ flex: 1 }}
                            />
                            <Button variant="outline" onClick={verify2FA}>
                                Verificar
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Audit Log */}
            <div>
                <Text size="md" weight="bold" style={{ marginBottom: 8 }}>Log de Auditoria</Text>
                <Text size="sm" color="tertiary">
                    Todas as ações críticas são registradas automaticamente para segurança e compliance.
                </Text>
            </div>
        </Card>
    );
};
