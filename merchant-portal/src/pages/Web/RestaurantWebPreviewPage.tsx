import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { buildPublicUrls, getRestaurantSlug } from '../../utils/buildPublicUrls';
import { useToast } from '../../ui/design-system';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

export function RestaurantWebPreviewPage() {
    const navigate = useNavigate();
    const { error, warning } = useToast();
    const [restaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));
    const [slug, setSlug] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [urls, setUrls] = useState<ReturnType<typeof buildPublicUrls> | null>(null);

    useEffect(() => {
        if (restaurantId) {
            loadSlug();
        } else {
            setLoading(false);
        }
    }, [restaurantId]);

    const loadSlug = async () => {
        if (!restaurantId) return;
        
        setLoading(true);
        try {
            const restaurantSlug = await getRestaurantSlug(restaurantId);
            if (restaurantSlug) {
                setSlug(restaurantSlug);
                setUrls(buildPublicUrls(restaurantSlug));
            } else {
                warning('Restaurante não possui slug público configurado');
            }
        } catch (err: any) {
            console.error('Error loading slug:', err);
            error('Erro ao carregar informações do restaurante');
        } finally {
            setLoading(false);
        }
    };

    const openInNewTab = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div style={{ padding: 24 }}>
                <Text size="lg" weight="bold">Carregando...</Text>
            </div>
        );
    }

    if (!slug || !urls) {
        return (
            <div style={{ padding: 24 }}>
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
                        Páginas Web do Restaurante
                    </Text>
                    <Text color="secondary" style={{ marginBottom: 24 }}>
                        Seu restaurante ainda não possui páginas públicas configuradas.
                    </Text>
                    <Button
                        tone="action"
                        variant="solid"
                        onClick={() => navigate('/app/dashboard')}
                    >
                        Voltar ao Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                    Páginas Web do Restaurante
                </Text>
                <Text color="secondary">
                    Visualize e acesse as páginas públicas do seu restaurante
                </Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Home Page */}
                <Card surface="layer1" padding="lg" hoverable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                                🏠 Página Inicial
                            </Text>
                            <Text size="sm" color="secondary" style={{ marginBottom: 4 }}>
                                {urls.home}
                            </Text>
                            <Text size="xs" color="tertiary">
                                Landing page pública do restaurante
                            </Text>
                        </div>
                        <Button
                            tone="neutral"
                            variant="outline"
                            onClick={() => openInNewTab(urls.home)}
                        >
                            Abrir em Nova Aba
                        </Button>
                    </div>
                </Card>

                {/* Menu Page */}
                <Card surface="layer1" padding="lg" hoverable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                                🍔 Cardápio Público
                            </Text>
                            <Text size="sm" color="secondary" style={{ marginBottom: 4 }}>
                                {urls.menu}
                            </Text>
                            <Text size="xs" color="tertiary">
                                Menu completo para visualização e pedidos
                            </Text>
                        </div>
                        <Button
                            tone="neutral"
                            variant="outline"
                            onClick={() => openInNewTab(urls.menu)}
                        >
                            Abrir em Nova Aba
                        </Button>
                    </div>
                </Card>

                {/* QR Table Links */}
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
                        🪑 Links de Mesa (QR Code)
                    </Text>
                    <Text size="sm" color="secondary" style={{ marginBottom: 16 }}>
                        URLs para mesas 1-12 (preview)
                    </Text>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                        gap: 12 
                    }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(tableNum => (
                            <Button
                                key={tableNum}
                                tone="neutral"
                                variant="outline"
                                onClick={() => openInNewTab(urls.table(tableNum))}
                                style={{ fontSize: '0.875rem' }}
                            >
                                Mesa {tableNum}
                            </Button>
                        ))}
                    </div>
                </Card>

                {/* Info Card */}
                <Card surface="layer2" padding="md">
                    <Text size="sm" color="secondary">
                        💡 <strong>Dica:</strong> Use estes links para compartilhar com clientes, 
                        gerar QR codes para mesas, ou testar a experiência pública do seu restaurante.
                    </Text>
                </Card>
            </div>
        </div>
    );
}
