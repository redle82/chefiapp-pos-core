
import React from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

interface TPVSettingsModalProps {
    operatorName?: string;
    onClose: () => void;
    onAdvancedSettings: () => void;
    onLogout: () => void;
}

export const TPVSettingsModal: React.FC<TPVSettingsModalProps> = ({
    operatorName,
    onClose,
    onAdvancedSettings,
    onLogout
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            {/* Click outside to close (handled by backdrop click) */}
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: '90%' }}>
                <Card surface="layer1" padding="xl">
                    <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            backgroundColor: colors.surface.layer2,
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <Text size="lg" weight="bold" color="primary">
                            {operatorName || 'Operador'}
                        </Text>
                        <Text size="sm" color="tertiary">
                            Sessão Ativa
                        </Text>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => {
                                onAdvancedSettings();
                                onClose();
                            }}
                            fullWidth
                        >
                            ⚙️ Configurações Avançadas
                        </Button>

                        <Button
                            variant="primary"
                            tone="destructive"
                            size="lg"
                            onClick={() => {
                                onClose(); // Close modal first
                                onLogout(); // Then trigger logout/lock
                            }}
                            fullWidth
                        >
                            🔒 Bloquear Ecrã / Sair
                        </Button>
                    </div>

                    <div style={{ marginTop: spacing[6] }}>
                        <Button
                            variant="ghost"
                            size="default"
                            onClick={onClose}
                            fullWidth
                        >
                            Voltar
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
