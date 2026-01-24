/**
 * OnboardingReminder - Avisos de Onboarding Incompleto
 * 
 * FASE 2 - Onboarding com Primeira Venda
 * 
 * Funcionalidades:
 * - Mostrar banner se menu não criado
 * - Mostrar banner se primeira venda não feita
 * - Botões para completar onboarding
 * - Não bloquear acesso (usuário pode voltar depois)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { Button } from '../ui/design-system/Button';
import { Card } from '../ui/design-system/primitives/Card';
import { Text } from '../ui/design-system/primitives/Text';

export const OnboardingReminder: React.FC = () => {
    const navigate = useNavigate();
    const { hasMenu, hasFirstSale, loading } = useOnboardingStatus();

    // Não mostrar nada se já completou ou está carregando
    if (loading || (hasMenu && hasFirstSale)) {
        return null;
    }

    return (
        <div style={{
            marginBottom: '24px',
        }}>
            {!hasMenu && (
                <Card surface="layer2" padding="md" style={{
                    border: '2px solid #ffa500',
                    background: 'rgba(255, 165, 0, 0.1)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}>
                        <div>
                            <Text size="md" weight="bold" style={{ color: '#fff', marginBottom: '4px' }}>
                                ⚠️ Menu não criado
                            </Text>
                            <Text size="sm" color="secondary">
                                Você precisa criar um menu para fazer sua primeira venda
                            </Text>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/onboarding/menu-demo')}
                        >
                            Criar Menu
                        </Button>
                    </div>
                </Card>
            )}

            {hasMenu && !hasFirstSale && (
                <Card surface="layer2" padding="md" style={{
                    border: '2px solid #32d74b',
                    background: 'rgba(50, 215, 75, 0.1)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}>
                        <div>
                            <Text size="md" weight="bold" style={{ color: '#fff', marginBottom: '4px' }}>
                                🎯 Pronto para sua primeira venda!
                            </Text>
                            <Text size="sm" color="secondary">
                                Faça sua primeira venda para completar o onboarding
                            </Text>
                        </div>
                        <Button
                            variant="constructive"
                            onClick={() => {
                                // FASE 2: Navegar para tutorial (funciona mesmo em devStable)
                                navigate('/onboarding/first-sale-guide', { replace: false });
                            }}
                        >
                            Ver Tutorial
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};
