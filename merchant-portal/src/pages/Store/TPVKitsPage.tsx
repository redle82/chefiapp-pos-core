import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../ui/design-system/AppShell';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Select } from '../../ui/design-system/primitives/Select';
import { useToast } from '../../ui/design-system';
import { supabase } from '../../core/supabase';
import { colors } from '../../ui/design-system/tokens/colors';

// Use dashboard mode colors for consistency with AdminLayout
const theme = colors.modes.dashboard;
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
    const navigate = useNavigate();
    const [countries, setCountries] = useState<CountryMarket[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedTier, setSelectedTier] = useState<'budget' | 'standard' | 'pro' | null>(null);
    const [kits, setKits] = useState<KitBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCountries, setLoadingCountries] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3; // Limitar tentativas para evitar loops infinitos
    const { success, error: showError } = useToast();
    
    // Ref para evitar múltiplas chamadas simultâneas
    const loadingRef = React.useRef(false);
    const mountedRef = React.useRef(true);

    // Ref para rastrear se já tentou carregar (evita múltiplas tentativas no StrictMode)
    const hasAttemptedLoadRef = React.useRef(false);
    // Ref para armazenar showError sem causar recriações
    const showErrorRef = React.useRef(showError);
    
    // Atualizar ref quando showError muda
    React.useEffect(() => {
        showErrorRef.current = showError;
    }, [showError]);

    // Load countries function (extracted for retry)
    // FIX: Prevenir loops infinitos com ref e controle de estado
    const loadCountries = React.useCallback(async (isRetry: boolean = false) => {
        // Prevenir múltiplas chamadas simultâneas
        if (loadingRef.current) {
            console.warn('[TPVKitsPage] Load already in progress, skipping');
            return;
        }

        // Se já tentou muitas vezes, não tenta mais automaticamente
        if (isRetry && retryCount >= maxRetries) {
            console.warn('[TPVKitsPage] Max retries reached, stopping automatic attempts');
            return;
        }

        loadingRef.current = true;
        setLoadingCountries(true);
        if (!isRetry) {
            setError(null); // Só limpa erro se não for retry manual
        }
        
        try {
            const { data, error } = await supabase
                .from('country_market')
                .select('*')
                .order('code');

            if (!mountedRef.current) return; // Component unmounted

            if (error) {
                console.error('[TPVKitsPage] Failed to load countries:', error);
                let errorMessage: string;
                
                if (error.code === 'PGRST205') {
                    errorMessage = 'Tabela "country_market" não encontrada no banco de dados. Esta funcionalidade requer configuração do banco de dados.';
                } else {
                    errorMessage = `Erro ao carregar países: ${error.message || 'Erro desconhecido'}.`;
                }
                
                setError(errorMessage);
                if (isRetry) {
                    setRetryCount(prev => prev + 1);
                } else {
                    setRetryCount(1);
                }
                // Only show toast on first error, not on every retry
                if (retryCount === 0) {
                    showErrorRef.current('Erro ao carregar países');
                }
                setCountries([]);
            } else {
                setCountries(data || []);
                if (data && data.length > 0) {
                    // Se não há país selecionado, seleciona o primeiro
                    setSelectedCountry(prev => prev || data[0].code);
                    setError(null); // Clear any previous errors
                    setRetryCount(0); // Reset retry count on success
                } else {
                    setError('Nenhum país disponível no sistema.');
                    setCountries([]);
                }
            }
        } catch (err: any) {
            if (!mountedRef.current) return; // Component unmounted
            
            console.error('[TPVKitsPage] Unexpected error loading countries:', err);
            setError(`Erro inesperado ao carregar países: ${err?.message || 'Erro desconhecido'}.`);
            if (isRetry) {
                setRetryCount(prev => prev + 1);
            } else {
                setRetryCount(1);
            }
            // Only show toast on first error, not on every retry
            if (retryCount === 0) {
                showErrorRef.current('Erro ao carregar países');
            }
            setCountries([]);
        } finally {
            if (mountedRef.current) {
                setLoadingCountries(false);
            }
            loadingRef.current = false;
        }
    }, [retryCount, maxRetries]); // Removed showError - using ref instead

    // Load countries on mount only (once)
    useEffect(() => {
        // Prevenir múltiplas tentativas no StrictMode
        if (hasAttemptedLoadRef.current) {
            return;
        }
        
        mountedRef.current = true;
        hasAttemptedLoadRef.current = true;
        loadCountries(false);
        
        return () => {
            mountedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - only run once on mount

    // Load kits when country changes
    useEffect(() => {
        if (!selectedCountry) {
            setKits([]);
            setLoading(false);
            return;
        }

        const loadKits = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('kit_bundle')
                    .select('*')
                    .eq('country_code', selectedCountry)
                    .order('tier');

                if (error) {
                    console.error('Failed to load kits:', error);
                    setError(`Erro ao carregar kits para ${selectedCountry}. Tente novamente.`);
                    showError('Erro ao carregar kits');
                    setKits([]);
                } else {
                    setKits(data || []);
                    if (!data || data.length === 0) {
                        setError(null); // Não é erro, apenas não há kits
                    }
                }
            } catch (err) {
                console.error('Unexpected error loading kits:', err);
                setError('Erro inesperado ao carregar kits.');
                showError('Erro ao carregar kits');
                setKits([]);
            } finally {
                setLoading(false);
            }
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
            budget: theme.info.base,
            standard: theme.action.base,
            pro: theme.warning.base,
        };
        return map[tier] || theme.text.secondary;
    };

    return (
        <AppShell>
            <AdminLayout
                sidebar={<AdminSidebar activePath="/app/store/tpv-kits" onNavigate={navigate} />}
                content={
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        {/* Header */}
                        <div style={{ marginBottom: spacing[8] }}>
                            <Text size="4xl" weight="black" color="primary">
                                Loja TPV
                            </Text>
                            <Text size="lg" color="secondary" style={{ marginTop: spacing[2] }}>
                                Kits completos de equipamentos para o seu TPV
                            </Text>
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <Card surface="layer1" padding="md" style={{ marginBottom: spacing[4], border: `1px solid ${theme.destructive.base}`, backgroundColor: `${theme.destructive.base}20` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] }}>
                                    <Text size="sm" color="destructive" weight="bold">
                                        ⚠️ {error}
                                    </Text>
                                    <Button
                                        variant="outline"
                                        tone="destructive"
                                        size="sm"
                                        onClick={() => {
                                            setError(null);
                                            setRetryCount(0); // Reset retry count on manual retry
                                            loadCountries(true);
                                        }}
                                        disabled={loadingCountries || retryCount >= maxRetries}
                                    >
                                        {loadingCountries 
                                            ? 'A carregar...' 
                                            : retryCount >= maxRetries 
                                                ? 'Máximo de tentativas atingido' 
                                                : 'Tentar novamente'}
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Filters */}
                        <Card surface="layer1" padding="lg" style={{ marginBottom: spacing[6] }}>
                            <div style={{ display: 'flex', gap: spacing[4], flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                                        País
                                    </Text>
                                    {loadingCountries ? (
                                        <Text size="sm" color="tertiary">Carregando países...</Text>
                                    ) : countries.length === 0 ? (
                                        <Text size="sm" color="destructive">Nenhum país disponível</Text>
                                    ) : (
                                        <Select
                                            value={selectedCountry}
                                            onChange={(e) => setSelectedCountry(e.target.value)}
                                            fullWidth
                                            disabled={loadingCountries}
                                        >
                                            {countries.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                    {c.code} ({c.currency})
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                </div>

                                <div style={{ flex: '1 1 200px' }}>
                                    <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: spacing[2] }}>
                                        Tipo de Operação
                                    </Text>
                                    <select
                                        value={selectedTier || ''}
                                        onChange={(e) => setSelectedTier((e.target.value || null) as typeof selectedTier)}
                                        disabled={!selectedCountry || loading}
                                        style={{
                                            width: '100%',
                                            padding: spacing[2],
                                            borderRadius: spacing[1],
                                            border: `1px solid ${theme.border.subtle}`,
                                            backgroundColor: theme.surface.layer1,
                                            color: theme.text.primary,
                                            opacity: (!selectedCountry || loading) ? 0.5 : 1,
                                            cursor: (!selectedCountry || loading) ? 'not-allowed' : 'pointer',
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
                        {!selectedCountry ? (
                            <Card surface="layer1" padding="xl" style={{ textAlign: 'center' }}>
                                <Text size="lg" color="tertiary">
                                    Selecione um país para ver os kits disponíveis.
                                </Text>
                            </Card>
                        ) : loading ? (
                            <div style={{ textAlign: 'center', padding: spacing[12] }}>
                                <Text color="tertiary">A carregar kits...</Text>
                            </div>
                        ) : displayedKits.length === 0 ? (
                            <Card surface="layer1" padding="xl" style={{ textAlign: 'center' }}>
                                <Text size="lg" color="tertiary" style={{ marginBottom: spacing[2] }}>
                                    Nenhum kit disponível para este país.
                                </Text>
                                {selectedTier && (
                                    <Text size="sm" color="secondary">
                                        Tente remover o filtro de "Tipo de Operação" ou selecione outro país.
                                    </Text>
                                )}
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
                }
            />
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
                                background: theme.surface.layer1,
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

