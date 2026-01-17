import { useState } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { colors } from '../../ui/design-system/tokens/colors';
import { useToast } from '../../ui/design-system';

export type WebPresenceType = 'simple' | 'menu' | 'site';

interface WebPresenceOption {
    type: WebPresenceType;
    title: string;
    description: string;
    icon: string;
    features: string[];
    idealFor: string;
}

const OPTIONS: WebPresenceOption[] = [
    {
        type: 'simple',
        title: 'Página Simples',
        description: 'Gerada automaticamente com seus dados básicos',
        icon: '⚡',
        features: [
            'Nome e informações do restaurante',
            'Horários de funcionamento',
            'Botão WhatsApp',
            'Link para menu',
            'Zero configuração'
        ],
        idealFor: 'Pequenos restaurantes, MVP, ativação rápida'
    },
    {
        type: 'menu',
        title: 'Página com Menu / QR',
        description: 'Menu público operacional com QR Code',
        icon: '🍔',
        features: [
            'Menu completo com produtos',
            'QR Code para mesas',
            'Visualização de preços',
            'URL tipo: restaurant.chefiapp.com/menu',
            'Usa dados do TPV'
        ],
        idealFor: 'Restaurantes com mesas, QR Code, experiência no salão'
    },
    {
        type: 'site',
        title: 'Site Completo',
        description: 'Presença digital completa com branding',
        icon: '🌐',
        features: [
            'Homepage profissional',
            'Página Sobre',
            'Menu completo',
            'Contato e delivery',
            'Templates personalizáveis'
        ],
        idealFor: 'Marca, marketing, SEO, presença digital completa'
    }
];

interface WebPresenceWizardProps {
    restaurantId: string;
    onSelect: (type: WebPresenceType) => void;
    onCancel?: () => void;
}

export function WebPresenceWizard({ restaurantId, onSelect, onCancel }: WebPresenceWizardProps) {
    const [selectedType, setSelectedType] = useState<WebPresenceType | null>(null);
    const { success, error: toastError } = useToast();

    const handleCreate = () => {
        console.log('[WebPresenceWizard] ========== BUTTON CLICKED ==========', {
            selectedType,
            restaurantId,
            hasOnSelect: !!onSelect,
            timestamp: new Date().toISOString()
        });

        if (!selectedType) {
            console.warn('[WebPresenceWizard] No option selected');
            toastError('Por favor, selecione uma opção');
            return;
        }

        if (!onSelect) {
            console.error('[WebPresenceWizard] onSelect handler is missing!');
            toastError('Erro: Handler não configurado');
            return;
        }

        console.log('[WebPresenceWizard] Calling onSelect with type:', selectedType);
        try {
            onSelect(selectedType);
            console.log('[WebPresenceWizard] onSelect called successfully');
        } catch (err) {
            console.error('[WebPresenceWizard] Error calling onSelect:', err);
            toastError('Erro ao criar página web');
        }
    };

    return (
        <div style={{ 
            padding: spacing[8], 
            maxWidth: 1200, 
            margin: '0 auto',
            minHeight: '100vh',
            background: colors.surface.base
        }}>
            {/* Header */}
            <div style={{ marginBottom: spacing[8] }}>
                <Text size="3xl" weight="black" color="primary" style={{ marginBottom: spacing[2] }}>
                    Criar Página Web do Restaurante
                </Text>
                <Text size="lg" color="secondary">
                    Escolha o tipo de presença web que melhor se adapta ao seu restaurante
                </Text>
            </div>

            {/* Options Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: spacing[6],
                marginBottom: spacing[8]
            }}>
                {OPTIONS.map((option) => {
                    const isSelected = selectedType === option.type;
                    return (
                        <Card
                            key={option.type}
                            surface="layer1"
                            padding="xl"
                            hoverable
                            onClick={() => setSelectedType(option.type)}
                            style={{
                                cursor: 'pointer',
                                border: isSelected ? `2px solid ${colors.action.base}` : `2px solid transparent`,
                                backgroundColor: isSelected ? `${colors.action.base}15` : undefined,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* Icon & Title */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: spacing[3],
                                marginBottom: spacing[4]
                            }}>
                                <Text size="4xl">{option.icon}</Text>
                                <div>
                                    <Text size="xl" weight="bold" color="primary">
                                        {option.title}
                                    </Text>
                                    <Text size="sm" color="secondary">
                                        {option.description}
                                    </Text>
                                </div>
                            </div>

                            {/* Features */}
                            <div style={{ marginBottom: spacing[4] }}>
                                <Text size="xs" weight="bold" color="tertiary" style={{ marginBottom: spacing[2] }}>
                                    RECURSOS:
                                </Text>
                                <ul style={{ 
                                    listStyle: 'none', 
                                    padding: 0, 
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: spacing[2]
                                }}>
                                    {option.features.map((feature, idx) => (
                                        <li key={idx} style={{ 
                                            display: 'flex', 
                                            alignItems: 'flex-start',
                                            gap: spacing[2]
                                        }}>
                                            <Text size="sm" color="secondary">✓</Text>
                                            <Text size="sm" color="secondary">{feature}</Text>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Ideal For */}
                            <div style={{
                                padding: spacing[3],
                                background: colors.surface.layer2,
                                borderRadius: 8,
                                marginTop: spacing[4]
                            }}>
                                <Text size="xs" weight="bold" color="tertiary" style={{ marginBottom: spacing[1] }}>
                                    IDEAL PARA:
                                </Text>
                                <Text size="sm" color="secondary">{option.idealFor}</Text>
                            </div>

                            {/* Selection Indicator */}
                            {isSelected && (
                                <div style={{
                                    marginTop: spacing[4],
                                    padding: spacing[2],
                                    background: colors.action.base,
                                    borderRadius: 8,
                                    textAlign: 'center'
                                }}>
                                    <Text size="sm" weight="bold" color="white">
                                        ✓ Selecionado
                                    </Text>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Actions */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: spacing[6],
                background: colors.surface.layer1,
                borderRadius: 12,
                border: `1px solid ${colors.surface.layer2}`
            }}>
                <div>
                    {selectedType && (
                        <Text size="sm" color="secondary">
                            Opção selecionada: <strong>{OPTIONS.find(o => o.type === selectedType)?.title}</strong>
                        </Text>
                    )}
                </div>
                <div style={{ display: 'flex', gap: spacing[3] }}>
                    {onCancel && (
                        <Button 
                            tone="neutral" 
                            variant="ghost"
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button 
                        tone="action" 
                        variant="solid"
                        onClick={(e) => {
                            console.log('[WebPresenceWizard] Button onClick triggered', {
                                selectedType,
                                disabled: !selectedType,
                                event: e
                            });
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreate();
                        }}
                        disabled={!selectedType}
                        type="button"
                    >
                        {selectedType ? 'Criar Página Web' : 'Selecione uma opção primeiro'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
