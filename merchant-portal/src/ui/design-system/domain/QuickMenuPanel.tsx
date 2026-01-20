import React, { useMemo } from 'react';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Badge } from '../primitives/Badge';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    trackStock?: boolean;
    stockQuantity?: number;
    imageUrl?: string;
}

interface OrderItem {
    id: string;
    productId?: string;
    quantity: number;
}

interface QuickMenuPanelProps {
    items: MenuItem[];
    onAddItem: (item: MenuItem) => void;
    loading?: boolean;
    activeOrderItems?: OrderItem[]; // Para mostrar quantidades já adicionadas
}

export const QuickMenuPanel: React.FC<QuickMenuPanelProps> = ({
    items,
    onAddItem,
    loading = false,
    activeOrderItems = []
}) => {
    // DEBUG LOG
    if (items.length > 0) {
        console.log('[QuickMenuPanel] Received Items:', items.length);
        console.log('[QuickMenuPanel] First Item:', JSON.stringify(items[0], null, 2));
    }

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Order items logic
    const itemQuantities = useMemo(() => {
        const quantities: Record<string, number> = {};
        activeOrderItems.forEach(orderItem => {
            const productId = orderItem.productId || orderItem.id;
            quantities[productId] = (quantities[productId] || 0) + orderItem.quantity;
        });
        return quantities;
    }, [activeOrderItems]);

    // Scroll to category function
    const scrollToCategory = (category: string) => {
        const element = document.getElementById(`category-${category}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header - More prominent */}
            <div style={{ padding: 16, borderBottom: `1px solid ${colors.border.subtle}` }}>
                <Text size="xl" weight="black" color="primary" style={{ letterSpacing: '-0.02em' }}>MENU RÁPIDO</Text>
            </div>

            {/* Category Navigation Bar (Sticky) */}
            {items.length > 0 && (
                <div style={{
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 8,
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    borderBottom: `1px solid ${colors.border.subtle}`,
                    backgroundColor: colors.surface.layer2,
                    scrollbarWidth: 'none' // Firefox
                }}>
                    <style>
                        {`
                            /* Hide scrollbar for Chrome, Safari and Opera */
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        `}
                    </style>
                    {Object.keys(groupedItems).map(category => (
                        <button
                            key={category}
                            onClick={() => scrollToCategory(category)}
                            style={{
                                appearance: 'none',
                                background: colors.surface.layer3,
                                border: 'none',
                                borderRadius: 20,
                                padding: '8px 16px',
                                color: colors.text.secondary,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = colors.action.hover;
                                e.currentTarget.style.color = colors.text.primary;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = colors.surface.layer3;
                                e.currentTarget.style.color = colors.text.secondary;
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
                {loading ? (
                    <Text size="sm" color="tertiary">Carregando menu...</Text>
                ) : items.length === 0 ? (
                    <Text size="sm" color="tertiary">Nenhum item no menu. Adicione itens em Configurações → Menu.</Text>
                ) : (
                    Object.entries(groupedItems).map(([category, categoryItems]) => (
                        <div key={category} id={`category-${category}`}>
                            {/* Category Header - Cleaner & Spaced */}
                            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 4, height: 16, backgroundColor: colors.action.base, borderRadius: 2 }}></div>
                                <Text size="sm" weight="bold" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {category}
                                </Text>
                            </div>

                            {/* Grid - More Breathing Room */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: spacing[3] }}>
                                {categoryItems.map(item => {
                                    const quantity = itemQuantities[item.id] || 0;
                                    const hasQuantity = quantity > 0;
                                    const isOutOfStock = item.trackStock && (item.stockQuantity === undefined || item.stockQuantity <= 0);

                                    // Extended MenuItem interface locally to safely access imageUrl
                                    const itemWithImage = item as MenuItem & { imageUrl?: string };
                                    const imageUrl = itemWithImage.imageUrl;

                                    return (
                                        <Card
                                            key={item.id}
                                            surface={isOutOfStock ? "layer0" : (hasQuantity ? "layer1" : "layer2")}
                                            padding="none" // Remove default padding for full-bleed image control
                                            hoverable={!isOutOfStock}
                                            onClick={() => !isOutOfStock && onAddItem(item)}
                                            data-testid={`product-card-${item.id}`}
                                            style={{
                                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                border: hasQuantity ? `2px solid ${colors.action.base}` : '1px solid transparent',
                                                boxShadow: hasQuantity ? `0 0 0 1px ${colors.action.base}` : 'none',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                opacity: isOutOfStock ? 0.6 : 1,
                                                overflow: 'hidden', // Contain image
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                transform: hasQuantity ? 'translateY(-2px)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                {/* Image Area */}
                                                {imageUrl ? (
                                                    <div style={{
                                                        height: '110px',
                                                        width: '100%',
                                                        backgroundImage: `url(${imageUrl})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        backgroundColor: colors.surface.highlight
                                                    }} />
                                                ) : (
                                                    // Placeholder / No Image Area
                                                    <div style={{
                                                        height: '70px',
                                                        backgroundColor: colors.surface.layer3,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Text size="xs" color="tertiary" weight="bold" style={{ opacity: 0.5 }}>NO IMAGE</Text>
                                                    </div>
                                                )}

                                                {/* Content Area */}
                                                <div style={{ padding: spacing[3], display: 'flex', flexDirection: 'column', flex: 1, gap: spacing[1] }}>
                                                    {/* Nome e Badge de Quantidade */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[1] }}>
                                                        <Text
                                                            size="sm"
                                                            weight="bold"
                                                            color={isOutOfStock ? 'tertiary' : 'primary'}
                                                            style={{ flex: 1, lineHeight: 1.25 }}
                                                        >
                                                            {item.name}
                                                        </Text>
                                                        {hasQuantity && !isOutOfStock && (
                                                            <div style={{ flexShrink: 0 }}>
                                                                <Badge
                                                                    status="ready"
                                                                    label={quantity.toString()}
                                                                    variant="solid"
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Preço ou ESGOTADO */}
                                                    <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                                                        {isOutOfStock ? (
                                                            <Text size="xs" color="destructive" weight="black">ESGOTADO</Text>
                                                        ) : (
                                                            <Text size="sm" color="secondary" weight="bold">
                                                                €{item.price.toFixed(2)}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
