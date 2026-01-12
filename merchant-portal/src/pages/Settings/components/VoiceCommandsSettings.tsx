/**
 * P5-8: Voice Commands Settings Component
 * 
 * Componente para configurar comandos de voz
 */

import React from 'react';
import { useVoiceCommands } from '../../../core/voice/useVoiceCommands';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';

export const VoiceCommandsSettings: React.FC = () => {
    const { isAvailable, isListening, startListening, stopListening } = useVoiceCommands([], true);

    if (!isAvailable) {
        return (
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 8 }}>🎤 Comandos de Voz</Text>
                <Text size="sm" color="tertiary">
                    Comandos de voz não estão disponíveis no seu navegador.
                </Text>
            </Card>
        );
    }

    return (
        <Card surface="layer1" padding="lg">
            <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>🎤 Comandos de Voz</Text>
            <Text size="sm" color="tertiary" style={{ marginBottom: 16 }}>
                Ative comandos de voz para controlar o sistema por voz
            </Text>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Button
                    variant={isListening ? 'solid' : 'outline'}
                    tone={isListening ? 'destructive' : 'action'}
                    onClick={isListening ? stopListening : startListening}
                >
                    {isListening ? '⏹️ Parar' : '▶️ Iniciar'}
                </Button>
                <Text size="sm" color={isListening ? 'success' : 'tertiary'}>
                    {isListening ? '🎤 Escutando...' : '⏸️ Pausado'}
                </Text>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <Text size="sm" weight="bold" style={{ marginBottom: 8 }}>Comandos disponíveis:</Text>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li><Text size="xs">"novo pedido" - Criar novo pedido</Text></li>
                    <li><Text size="xs">"abrir caixa" - Abrir caixa</Text></li>
                    <li><Text size="xs">"fechar pedido" - Fechar pedido atual</Text></li>
                </ul>
            </div>
        </Card>
    );
};
