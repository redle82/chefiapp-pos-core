import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import { DbWriteGate } from '../../core/governance/DbWriteGate';
import { FireSystem } from '../../ui/design-system/sovereign/FireSystem';
import { OSSignature } from '../../ui/design-system/sovereign/OSSignature';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

/**
 * OnboardingQuick - Onboarding Minimalista Pós-Login
 * 
 * FASE 1: 2 telas essenciais
 * - Tela 1: Nome + Tipo de negócio
 * - Tela 2: Modelo de operação
 * 
 * Após completar:
 * - Grava setup_status = 'quick_done'
 * - Provisiona estrutura base (menu, página)
 * - Redireciona para /dashboard
 */

type BusinessType = 'Restaurante' | 'Café' | 'Food Truck' | 'Bar' | 'Lanchonete';
type OperationMode = 'counter' | 'delivery' | 'tables' | 'all';

const mapOperationToPosMode = (operation: OperationMode): 'counter' | 'tables' | 'hybrid' => {
    switch (operation) {
        case 'tables':
            return 'tables';
        case 'all':
            return 'hybrid';
        default:
            return 'counter';
    }
};

export const OnboardingQuick = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1
    const [name, setName] = useState('');
    const [type, setType] = useState<BusinessType>('Restaurante');

    // Step 2
    const [operation, setOperation] = useState<OperationMode>('counter');

    const restaurantId = getTabIsolated('chefiapp_restaurant_id');

    // Safety: redirect if no restaurant_id
    useEffect(() => {
        if (!restaurantId) {
            console.warn('[OnboardingQuick] No restaurant_id found, redirecting to login');
            navigate('/login');
        }
    }, [restaurantId, navigate]);

    if (!restaurantId) {
        return null; // Prevent render while redirecting
    }

    const handleStep1 = () => {
        if (!name.trim()) {
            setError('Nome do restaurante é obrigatório');
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleComplete = async () => {
        if (!restaurantId) {
            setError('ID do restaurante não encontrado');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Atualizar restaurante com dados do onboarding
            const { error: updateError } = await DbWriteGate.update(
                'OnboardingQuick',
                'gm_restaurants',
                {
                    name: name.trim(),
                    type,
                    pos_mode: mapOperationToPosMode(operation),
                    setup_status: 'quick_done'
                },
                { id: restaurantId },
                { tenantId: restaurantId }
            );

            if (updateError) throw updateError;

            // 2. Provisionar estrutura base
            await provisionRestaurant(restaurantId, { type, operation });

            // 3. Redirecionar para billing (FASE 1 - Billing Integration)
            setTimeout(() => {
                navigate('/onboarding/billing', { 
                    state: { restaurantId } 
                });
            }, 500);

        } catch (err) {
            console.error('[OnboardingQuick] Error:', err);
            setError(err instanceof Error ? err.message : 'Erro ao salvar configuração');
            setLoading(false);
        }
    };

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
                maxWidth: '480px',
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Progress Indicator */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                    <div style={{
                        flex: 1,
                        height: '4px',
                        background: step >= 1 ? '#32d74b' : 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        transition: 'background 0.3s'
                    }} />
                    <div style={{
                        flex: 1,
                        height: '4px',
                        background: step >= 2 ? '#32d74b' : 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        transition: 'background 0.3s'
                    }} />
                </div>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <OSSignature state="ritual" size="xl" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', margin: 0 }}>
                        {step === 1 ? 'Identifique seu Negócio' : 'Como Você Opera?'}
                    </h1>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                        {step === 1 ? 'Apenas 2 passos rápidos' : 'Última etapa'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '12px 16px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        borderRadius: '8px',
                        color: '#ff3b30',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff3b30',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontSize: '18px',
                                opacity: 0.7
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Step 1: Nome + Tipo */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#f5f5f7' }}>
                                Nome do Restaurante *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: La Bella Pasta"
                                disabled={loading}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#f5f5f7',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#32d74b'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#f5f5f7' }}>
                                Tipo de Negócio
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                {(['Restaurante', 'Café', 'Food Truck', 'Bar', 'Lanchonete'] as BusinessType[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        disabled={loading}
                                        style={{
                                            padding: '16px',
                                            background: type === t ? 'rgba(50, 215, 75, 0.1)' : 'rgba(255,255,255,0.05)',
                                            border: type === t ? '2px solid #32d74b' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: type === t ? '#32d74b' : '#f5f5f7',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleStep1}
                            disabled={loading || !name.trim()}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                background: (!loading && name.trim()) ? '#32d74b' : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '10px',
                                color: (!loading && name.trim()) ? '#000' : 'rgba(255,255,255,0.3)',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: (!loading && name.trim()) ? 'pointer' : 'not-allowed',
                                marginTop: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            Próximo →
                        </button>
                    </div>
                )}

                {/* Step 2: Operação */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#f5f5f7' }}>
                                Selecione seu modelo de operação
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <OperationOption
                                    icon="🏪"
                                    title="Apenas Balcão"
                                    description="Clientes compram no balcão"
                                    selected={operation === 'counter'}
                                    onClick={() => setOperation('counter')}
                                    disabled={loading}
                                />
                                <OperationOption
                                    icon="🚀"
                                    title="Delivery"
                                    description="Entregas para clientes"
                                    selected={operation === 'delivery'}
                                    onClick={() => setOperation('delivery')}
                                    disabled={loading}
                                />
                                <OperationOption
                                    icon="🪑"
                                    title="Mesas"
                                    description="Atendimento em mesas"
                                    selected={operation === 'tables'}
                                    onClick={() => setOperation('tables')}
                                    disabled={loading}
                                />
                                <OperationOption
                                    icon="✨"
                                    title="Tudo"
                                    description="Balcão + Delivery + Mesas"
                                    selected={operation === 'all'}
                                    onClick={() => setOperation('all')}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                onClick={() => setStep(1)}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '14px 24px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#f5f5f7',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ← Voltar
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                style={{
                                    flex: 2,
                                    padding: '14px 24px',
                                    background: loading ? 'rgba(50, 215, 75, 0.5)' : '#32d74b',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#000',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? 'Preparando...' : 'Começar! 🚀'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Component
const OperationOption: React.FC<{
    icon: string;
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, title, description, selected, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: selected ? 'rgba(50, 215, 75, 0.1)' : 'rgba(255,255,255,0.05)',
            border: selected ? '2px solid #32d74b' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left'
        }}
    >
        <div style={{ fontSize: '32px' }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: selected ? '#32d74b' : '#f5f5f7', marginBottom: '4px' }}>
                {title}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                {description}
            </div>
        </div>
    </button>
);

/**
 * Provisiona estrutura base do restaurante
 */
async function provisionRestaurant(
    restaurantId: string,
    config: { type: BusinessType; operation: OperationMode }
) {
    console.log('[Provision] Starting for:', restaurantId, config);

    try {
        // 1. Criar categorias base do menu
        const baseCategories = getBaseCategoriesForType(config.type);

        for (const category of baseCategories) {
            await DbWriteGate.insert(
                'OnboardingQuick',
                'gm_menu_categories',
                {
                    restaurant_id: restaurantId,
                    name: category.name,
                    sort_order: category.order,
                    is_active: true
                },
                { tenantId: restaurantId }
            );
        }

        console.log('[Provision] Menu base created');

        console.log('[Provision] Complete');

    } catch (err) {
        console.error('[Provision] Error:', err);
        // Non-fatal: provisioning pode falhar sem bloquear o usuário
    }
}

function getBaseCategoriesForType(type: BusinessType) {
    const commonCategories = [
        { name: 'Entradas', order: 1 },
        { name: 'Principais', order: 2 },
        { name: 'Bebidas', order: 3 }
    ];

    switch (type) {
        case 'Café':
            return [
                { name: 'Cafés', order: 1 },
                { name: 'Doces', order: 2 },
                { name: 'Salgados', order: 3 }
            ];
        case 'Bar':
            return [
                { name: 'Cervejas', order: 1 },
                { name: 'Drinks', order: 2 },
                { name: 'Petiscos', order: 3 }
            ];
        case 'Food Truck':
        case 'Lanchonete':
            return [
                { name: 'Lanches', order: 1 },
                { name: 'Porções', order: 2 },
                { name: 'Bebidas', order: 3 }
            ];
        default:
            return commonCategories;
    }
}
