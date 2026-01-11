import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '../../ui/design-system/AppShell';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Select } from '../../ui/design-system/primitives/Select';
import { useToast } from '../../ui/design-system';
import { supabase } from '../../core/supabase';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface CountryMarket {
    code: string;
    currency: string;
    domain: string;
}

interface KitItem {
    asin: string;
    category_key: string;
    title: string;
    price_cents: number | null;
    image_url: string | null;
    detail_url: string;
}

interface KitBundle {
    id: string;
    country_code: string;
    tier: 'budget' | 'standard' | 'pro';
    title: string;
    items_json: KitItem[];
    total_price_cents: number | null;
    updated_at: string;
}

export const TPVKitsPage: React.FC = () => {
    const [countries, setCountries] = useState<CountryMarket[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>('ES');
    const [selectedTier, setSelectedTier] = useState<'budget' | 'standard' | 'pro' | null>(null);
    const [kits, setKits] = useState<KitBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const { success, error: showError } = useToast();

    // Load countries
    useEffect(() => {
        const loadCountries = async () => {
            const { data, error } = await supabase
                .from('country_market')
                .select('*')
                .order('code');

            if (error) {
                console.error('Failed to load countries:', error);
                showError('Erro ao carregar países');
            } else {
                setCountries(data || []);
                if (data && data.length > 0 && !selectedCountry) {
                    setSelectedCountry(data[0].code);
                }
            }
        };

        loadCountries();
    }, []);

    // Load kits when country changes
    useEffect(() => {
        if (!selectedCountry) return;

        const loadKits = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('kit_bundle')
                .select('*')
                .eq('country_code', selectedCountry)
                .order('tier');

            if (error) {
                console.error('Failed to load kits:', error);
                showError('Erro ao carregar kits');
            } else {
                setKits(data || []);
            }
            setLoading(false);
        };

        loadKits();
    }, [selectedCountry]);

    // Filter kits by tier if selected
    const displayedKits = useMemo(() => {
        if (!selectedTier) return kits;
        return kits.filter((k) => k.tier === selectedTier);
    }, [kits, selectedTier]);

    // Track click event
    const handleProductClick = async (
        asin: string,
        categoryKey: string | null,
        kitTier: string | null,
        source: 'kit' | 'product',
        detailUrl: string
    ) => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        const { data: { user } } = await supabase.auth.getUser();

        // Record click event
        await supabase.from('click_event').insert({
            tenant_id: restaurantId || null,
            user_id: user?.id || null,
            country_code: selectedCountry,
            category_key: categoryKey,
            asin,
            kit_tier: kitTier,
            source,
        });

        // Open Amazon link in new tab
        window.open(detailUrl, '_blank', 'noopener,noreferrer');
    };

    const formatPrice = (cents: number | null, currency: string): string => {
        if (cents === null) return 'Preço indisponível';
        const amount = cents / 100;
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const getTierLabel = (tier: string): string => {
        const map: Record<string, string> = {
            budget: 'Orçamento',
            standard: 'Padrão',
            pro: 'Profissional',
        };
        return map[tier] || tier;
    };

    const getTierColor = (tier: string): string => {
        const map: Record<string, string> = {
            budget: colors.info.base,
            standard: colors.action.base,
            pro: colors.warning.base,
        };
        return map[tier] || colors.text.secondary;
    };

    return (
        <AppShell>
            <div style={{ padding: spacing[6], maxWidth: 1200, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: spacing[8] }}>
                    <Text size="4xl" weight="black" color="primary">
                        Loja TPV
                    </Text>
                    <Text size="lg" color="secondary" style={{ marginTop: spacing[2] }}>
                        Kits completos de equipamentos para o seu TPV
                    </Text>
                </div>

                {/* Filters */}
                <Card surface="layer1" padding="lg" style={{ marginBottom: spacing[6] }}>
                    <div style={{ display: 'flex', gap: spacing[4], flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                                País
                            </Text>
                            <Select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                fullWidth
                            >
                                {countries.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} ({c.currency})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div style={{ flex: '1 1 200px' }}>
                            <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                                Tipo de Operação
                            </Text>
                            <select
                                value={selectedTier || ''}
                                onChange={(e) => setSelectedTier((e.target.value || null) as typeof selectedTier)}
                                style={{
                                    width: '100%',
                                    padding: spacing[2],
                                    borderRadius: spacing[1],
                                    border: `1px solid ${colors.border.subtle}`,
                                    backgroundColor: colors.surface.layer1,
                                    color: colors.text.primary,
                                }}
                            >
                                <option value="">Todos</option>
                                <option value="budget">Orçamento</option>
                                <option value="standard">Padrão</option>
                                <option value="pro">Profissional</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Kits Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: spacing[12] }}>
                        <Text color="tertiary">A carregar kits...</Text>
                    </div>
                ) : displayedKits.length === 0 ? (
                    <Card surface="layer1" padding="xl" style={{ textAlign: 'center' }}>
                        <Text size="lg" color="tertiary">
                            Nenhum kit disponível para este país.
                        </Text>
                    </Card>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: spacing[6],
                        }}
                    >
                        {displayedKits.map((kit) => (
                            <KitCard
                                key={kit.id}
                                kit={kit}
                                currency={countries.find((c) => c.code === kit.country_code)?.currency || 'EUR'}
                                onProductClick={handleProductClick}
                                getTierLabel={getTierLabel}
                                getTierColor={getTierColor}
                                formatPrice={formatPrice}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
};

interface KitCardProps {
    kit: KitBundle;
    currency: string;
    onProductClick: (
        asin: string,
        categoryKey: string | null,
        kitTier: string | null,
        source: 'kit',
        detailUrl: string
    ) => void;
    getTierLabel: (tier: string) => string;
    getTierColor: (tier: string) => string;
    formatPrice: (cents: number | null, currency: string) => string;
}

const KitCard: React.FC<KitCardProps> = ({
    kit,
    currency,
    onProductClick,
    getTierLabel,
    getTierColor,
    formatPrice,
}) => {
    const hasExpiredPrice = kit.total_price_cents === null;

    return (
        <Card surface="layer2" padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div
                style={{
                    padding: spacing[3],
                    borderRadius: spacing[2],
                    background: getTierColor(kit.tier),
                    marginBottom: spacing[4],
                    textAlign: 'center',
                }}
            >
                <Text size="lg" weight="black" color="inverse">
                    {getTierLabel(kit.tier)}
                </Text>
            </div>

            {/* Total Price */}
            <div style={{ marginBottom: spacing[4], textAlign: 'center' }}>
                <Text size="xs" color="tertiary" style={{ marginBottom: spacing[1] }}>
                    Preço Total
                </Text>
                <Text size="3xl" weight="black" color="primary">
                    {formatPrice(kit.total_price_cents, currency)}
                </Text>
                {hasExpiredPrice && (
                    <Text size="xs" color="warning" style={{ marginTop: spacing[1] }}>
                        Preços podem ter mudado
                    </Text>
                )}
            </div>

            {/* Items List */}
            <div style={{ flex: 1, marginBottom: spacing[4] }}>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[3] }}>
                    Inclui:
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                    {kit.items_json.map((item, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                gap: spacing[2],
                                padding: spacing[2],
                                background: colors.surface.layer1,
                                borderRadius: spacing[1],
                            }}
                        >
                            {item.image_url && (
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        objectFit: 'cover',
                                        borderRadius: spacing[1],
                                    }}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text size="xs" weight="bold" color="primary" style={{ marginBottom: spacing[1] }}>
                                    {item.title}
                                </Text>
                                <Text size="xs" color="tertiary">
                                    {formatPrice(item.price_cents, currency)}
                                </Text>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                <Button
                    tone="action"
                    variant="solid"
                    size="lg"
                    fullWidth
                    onClick={() => {
                        // Click on kit (opens first item or kit page)
                        if (kit.items_json.length > 0) {
                            onProductClick(
                                kit.items_json[0].asin,
                                kit.items_json[0].category_key,
                                kit.tier,
                                'kit',
                                kit.items_json[0].detail_url
                            );
                        }
                    }}
                >
                    {hasExpiredPrice ? 'Ver preços na Amazon' : 'Comprar Kit na Amazon'}
                </Button>

                {kit.items_json.map((item, idx) => (
                    <Button
                        key={idx}
                        tone="info"
                        variant="outline"
                        size="default"
                        fullWidth
                        onClick={() => {
                            onProductClick(item.asin, item.category_key, kit.tier, 'kit', item.detail_url);
                        }}
                    >
                        Ver {item.title}
                    </Button>
                ))}
            </div>

            {/* Updated timestamp */}
            <Text size="xs" color="tertiary" style={{ marginTop: spacing[3], textAlign: 'center' }}>
                Atualizado: {new Date(kit.updated_at).toLocaleDateString('pt-PT')}
            </Text>
        </Card>
    );
};

export default TPVKitsPage;

