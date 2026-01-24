/**
 * FirstSaleGuide - Tutorial de Primeira Venda
 * 
 * FASE 2 - Onboarding com Primeira Venda
 * 
 * Funcionalidades:
 * - Tutorial visual passo a passo
 * - Botão "Fazer Primeira Venda" (abre TPV em modo demo)
 * - Pode pular tutorial
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { FireSystem } from '../../ui/design-system/sovereign/FireSystem';
import { OSSignature } from '../../ui/design-system/sovereign/OSSignature';

interface FirstSaleGuideProps {
    restaurantId?: string;
    menuCreated?: boolean;
    onComplete?: () => void;
}

const STEPS = [
    {
        number: 1,
        title: 'Abra o TPV',
        description: 'O TPV (Terminal de Ponto de Venda) é onde você processa todas as vendas',
        icon: '💻',
    },
    {
        number: 2,
        title: 'Selecione uma Mesa',
        description: 'Escolha uma mesa ou balcão para o pedido',
        icon: '🪑',
    },
    {
        number: 3,
        title: 'Adicione Itens do Menu',
        description: 'Clique nos itens do menu para adicionar ao pedido',
        icon: '🍽️',
    },
    {
        number: 4,
        title: 'Processe o Pagamento',
        description: 'Finalize o pedido escolhendo o método de pagamento',
        icon: '💳',
    },
];

export const FirstSaleGuide: React.FC<FirstSaleGuideProps> = ({
    restaurantId: propRestaurantId,
    menuCreated: propMenuCreated,
    onComplete
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(0);

    const restaurantId = propRestaurantId || getTabIsolated('chefiapp_restaurant_id') || location.state?.restaurantId;
    const menuCreated = propMenuCreated || location.state?.menuCreated;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleStartDemo();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStartDemo = () => {
        // Abrir TPV em modo demo
        navigate('/app/tpv?demo=true', {
            state: { 
                demo: true,
                tutorial: true,
            }
        });
    };

    const handleSkip = () => {
        if (onComplete) {
            onComplete();
        } else {
            navigate('/app/dashboard');
        }
    };

    const currentStepData = STEPS[currentStep];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: FireSystem.ritual.background,
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <OSSignature state="ritual" size="xl" />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#fff', margin: 0, marginBottom: '8px' }}>
                        Como Fazer Sua Primeira Venda
                    </h1>
                    <Text size="md" color="secondary">
                        Tutorial rápido de 4 passos
                    </Text>
                </div>

                {/* Step Indicator */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '32px',
                }}>
                    {STEPS.map((step, idx) => (
                        <div
                            key={step.number}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: idx <= currentStep ? '#32d74b' : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.3s',
                            }}
                        />
                    ))}
                </div>

                {/* Current Step Card */}
                <Card surface="layer2" padding="lg" style={{ marginBottom: '24px', minHeight: '300px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '64px',
                            marginBottom: '24px',
                        }}>
                            {currentStepData.icon}
                        </div>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'rgba(50, 215, 75, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            fontSize: '24px',
                            fontWeight: 600,
                            color: '#32d74b',
                        }}>
                            {currentStepData.number}
                        </div>
                        <Text size="xl" weight="bold" style={{ color: '#fff', marginBottom: '12px' }}>
                            {currentStepData.title}
                        </Text>
                        <Text size="md" color="secondary" style={{ maxWidth: '400px', margin: '0 auto' }}>
                            {currentStepData.description}
                        </Text>
                    </div>
                </Card>

                {/* Navigation */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                }}>
                    {currentStep > 0 && (
                        <Button
                            variant="secondary"
                            onClick={handlePrevious}
                            style={{ flex: 1 }}
                        >
                            Anterior
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        onClick={handleNext}
                        style={{ flex: currentStep === 0 ? 1 : 2 }}
                    >
                        {currentStep === STEPS.length - 1 ? 'Fazer Primeira Venda' : 'Próximo'}
                    </Button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                    >
                        Pular Tutorial
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FirstSaleGuide;
