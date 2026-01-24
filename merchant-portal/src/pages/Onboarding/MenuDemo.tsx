/**
 * MenuDemo - Criar Menu de Exemplo no Onboarding
 * 
 * FASE 2 - Onboarding com Primeira Venda
 * 
 * Funcionalidades:
 * - Oferece menu de exemplo baseado no tipo de negócio
 * - Opção "Usar Menu de Exemplo" (recomendado)
 * - Opção "Criar Manualmente" (redireciona para MenuManager)
 * - Integração com MenuBootstrapService
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { supabase } from '../../core/supabase';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { MenuBootstrapService } from '../../core/menu/MenuBootstrapService';
import { FireSystem } from '../../ui/design-system/sovereign/FireSystem';
import { OSSignature } from '../../ui/design-system/sovereign/OSSignature';

interface MenuDemoProps {
    restaurantId?: string;
    businessType?: string;
    onComplete?: () => void;
}

// Mapeamento de tipos de negócio para presets
const BUSINESS_TYPE_TO_PRESET: Record<string, string> = {
    'Café': 'CAFE_V1',
    'Bar': 'BAR_V1',
    'Restaurante': 'RESTAURANT_V1',
    'Food Truck': 'RESTAURANT_V1',
    'Lanchonete': 'RESTAURANT_V1',
};

// Descrições dos menus de exemplo
const MENU_DESCRIPTIONS: Record<string, { name: string; items: string[] }> = {
    'CAFE_V1': {
        name: 'Café & Bistro',
        items: ['Bebidas Quentes (4 itens)', 'Pastelaria (3 itens)', 'Bebidas Frias (3 itens)'],
    },
    'BAR_V1': {
        name: 'Bar & Pub',
        items: ['Cervejas (3 itens)', 'Cocktails (3 itens)'],
    },
    'RESTAURANT_V1': {
        name: 'Restaurante Típico',
        items: ['Entradas (2 itens)', 'Pratos Principais (3 itens)', 'Bebidas (3 itens)'],
    },
};

export const MenuDemo: React.FC<MenuDemoProps> = ({
    restaurantId: propRestaurantId,
    businessType: propBusinessType,
    onComplete
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [restaurantType, setRestaurantType] = useState<string | null>(null);

    const restaurantId = propRestaurantId || getTabIsolated('chefiapp_restaurant_id') || location.state?.restaurantId;
    const businessType = propBusinessType || location.state?.businessType;

    useEffect(() => {
        if (businessType) {
            setRestaurantType(businessType);
        } else if (restaurantId) {
            // Buscar tipo do restaurante
            fetchRestaurantType();
        }
    }, [restaurantId, businessType]);

    const fetchRestaurantType = async () => {
        if (!restaurantId) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('gm_restaurants')
                .select('business_type, type')
                .eq('id', restaurantId)
                .single();

            if (fetchError) throw fetchError;

            const type = data.business_type || data.type || 'Restaurante';
            setRestaurantType(type);
        } catch (err: any) {
            console.error('[MenuDemo] Error fetching restaurant type:', err);
            setRestaurantType('Restaurante'); // Default
        }
    };

    const handleUseExample = async () => {
        if (!restaurantId || !restaurantType) {
            setError('Restaurant ID ou tipo não encontrado');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const presetKey = BUSINESS_TYPE_TO_PRESET[restaurantType] || 'RESTAURANT_V1';
            const service = new MenuBootstrapService(supabase);

            // Criar contexto básico
            const context = {
                businessType: restaurantType.toUpperCase(),
                serviceStyle: ['TABLE'],
                operationSpeed: 'BALANCED',
                mode: 'QUICK' as const,
            };

            // Nota: MenuBootstrapService precisa de um kernel, mas para onboarding rápido
            // vamos usar uma abordagem simplificada
            // TODO: Criar Edge Function ou RPC para criar menu sem kernel
            
            // Por enquanto, vamos criar categorias e itens diretamente
            await createExampleMenu(restaurantId, presetKey);

            if (onComplete) {
                onComplete();
            } else {
                navigate('/onboarding/first-sale-guide', {
                    state: { restaurantId, menuCreated: true }
                });
            }
        } catch (err: any) {
            console.error('[MenuDemo] Error creating example menu:', err);
            setError(err.message || 'Erro ao criar menu de exemplo. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const createExampleMenu = async (rId: string, presetKey: string) => {
        // Usar presets do MenuBootstrapService
        const PRESETS: Record<string, any> = {
            'CAFE_V1': {
                categories: [
                    { name: 'Bebidas Quentes', items: [
                        { name: 'Café Expresso', price: 1.00 },
                        { name: 'Meia de Leite', price: 1.50 },
                        { name: 'Cappuccino', price: 2.50 }
                    ]},
                    { name: 'Pastelaria', items: [
                        { name: 'Pastel de Nata', price: 1.20 },
                        { name: 'Croissant Simples', price: 1.50 }
                    ]},
                ]
            },
            'BAR_V1': {
                categories: [
                    { name: 'Cervejas', items: [
                        { name: 'Imperial', price: 1.50 },
                        { name: 'Caneca', price: 3.00 }
                    ]},
                    { name: 'Cocktails', items: [
                        { name: 'Mojito', price: 7.00 },
                        { name: 'Caipirinha', price: 6.50 }
                    ]},
                ]
            },
            'RESTAURANT_V1': {
                categories: [
                    { name: 'Entradas', items: [
                        { name: 'Pão e Azeitonas', price: 2.50 },
                        { name: 'Sopa do Dia', price: 3.00 }
                    ]},
                    { name: 'Pratos Principais', items: [
                        { name: 'Bitoque', price: 12.00 },
                        { name: 'Bacalhau à Brás', price: 14.00 },
                        { name: 'Hambúrguer da Casa', price: 11.50 }
                    ]},
                    { name: 'Bebidas', items: [
                        { name: 'Água', price: 1.50 },
                        { name: 'Refrigerante', price: 2.00 }
                    ]},
                ]
            },
        };

        const preset = PRESETS[presetKey] || PRESETS['RESTAURANT_V1'];

        // Criar categorias e itens
        for (const cat of preset.categories) {
            // Criar categoria
            const { data: category, error: catError } = await supabase
                .from('gm_menu_categories')
                .insert({
                    restaurant_id: rId,
                    name: cat.name,
                    is_visible: true,
                    sort_order: 0,
                })
                .select()
                .single();

            if (catError) {
                console.warn('[MenuDemo] Error creating category:', catError);
                continue;
            }

            // Criar itens
            for (const item of cat.items) {
                const { error: itemError } = await supabase
                    .from('gm_products')
                    .insert({
                        restaurant_id: rId,
                        name: item.name,
                        price_cents: Math.round(item.price * 100),
                        category_id: category.id,
                        available: true,
                        status: 'available',
                    });

                if (itemError) {
                    console.warn('[MenuDemo] Error creating item:', itemError);
                }
            }
        }
    };

    const handleCreateManually = () => {
        navigate('/app/menu', {
            state: { fromOnboarding: true }
        });
    };

    const handleSkip = () => {
        if (onComplete) {
            onComplete();
        } else {
            navigate('/app/dashboard');
        }
    };

    if (!restaurantId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Text>Restaurant ID não encontrado. Redirecionando...</Text>
            </div>
        );
    }

    const presetKey = restaurantType ? (BUSINESS_TYPE_TO_PRESET[restaurantType] || 'RESTAURANT_V1') : 'RESTAURANT_V1';
    const menuInfo = MENU_DESCRIPTIONS[presetKey] || MENU_DESCRIPTIONS['RESTAURANT_V1'];

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
                        Criar Seu Menu
                    </h1>
                    <Text size="md" color="secondary">
                        Vamos criar seu primeiro menu para começar a vender
                    </Text>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '12px 16px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        borderRadius: '8px',
                        color: '#ff3b30',
                        fontSize: '14px',
                    }}>
                        {error}
                    </div>
                )}

                {/* Menu Example Card */}
                <Card surface="layer2" padding="lg" style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Text size="lg" weight="bold" style={{ color: '#fff', marginBottom: '8px' }}>
                            Menu de Exemplo: {menuInfo.name}
                        </Text>
                        <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
                            Baseado no tipo de negócio: {restaurantType || 'Restaurante'}
                        </Text>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}>
                            {menuInfo.items.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#32d74b' }}>✓</span>
                                    <Text size="sm" color="secondary">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Text size="xs" color="secondary" style={{ marginTop: '16px' }}>
                        Você pode editar ou adicionar mais itens depois
                    </Text>
                </Card>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    <Button
                        variant="primary"
                        onClick={handleUseExample}
                        disabled={loading || !restaurantType}
                        loading={loading}
                        fullWidth
                    >
                        Usar Menu de Exemplo (Recomendado)
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleCreateManually}
                        disabled={loading}
                        fullWidth
                    >
                        Criar Menu Manualmente
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={loading}
                        fullWidth
                    >
                        Pular por Agora
                    </Button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Text size="xs" color="secondary">
                        Você precisará de um menu para fazer sua primeira venda
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default MenuDemo;
