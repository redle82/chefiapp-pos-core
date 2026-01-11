import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { getRestaurantSlug, buildPublicUrls } from '../../../utils/buildPublicUrls';
import { supabase } from '../../../core/supabase';

interface PublicPresenceCardProps {
    restaurantId: string | null;
}

export const PublicPresenceCard: React.FC<PublicPresenceCardProps> = ({ restaurantId }) => {
    const navigate = useNavigate();
    const [slug, setSlug] = useState<string | null>(null);
    const [status, setStatus] = useState<'published' | 'draft' | 'not_configured'>('not_configured');
    const [viewsToday, setViewsToday] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [publicUrl, setPublicUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }

        const loadPublicPresence = async () => {
            try {
                // Get slug and profile status
                const restaurantSlug = await getRestaurantSlug(restaurantId);
                
                if (restaurantSlug) {
                    setSlug(restaurantSlug);
                    const urls = buildPublicUrls(restaurantSlug);
                    setPublicUrl(urls.home);

                    // Check if published
                    const { data: profile } = await supabase
                        .from('restaurant_web_profiles')
                        .select('status')
                        .eq('restaurant_id', restaurantId)
                        .maybeSingle();

                    setStatus(profile?.status === 'published' ? 'published' : 'draft');

                    // Get today's views
                    const today = new Date().toISOString().split('T')[0];
                    const { count } = await supabase
                        .from('analytics_impressions')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', restaurantId)
                        .gte('created_at', today);

                    setViewsToday(count ?? 0);
                } else {
                    setStatus('not_configured');
                }
            } catch (err) {
                console.warn('[PublicPresenceCard] Error loading:', err);
            } finally {
                setLoading(false);
            }
        };

        loadPublicPresence();
    }, [restaurantId]);

    const handleEdit = () => {
        // Navigate to web preview page or setup
        navigate('/app/web/preview');
    };

    const handleOpenSite = () => {
        if (publicUrl) {
            window.open(publicUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Card 
            surface="layer2" 
            padding="lg"
            style={{ 
                border: status === 'published' ? `1px solid ${colors.success.base}20` : undefined,
                backgroundColor: status === 'published' ? `${colors.success.base}05` : undefined
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing[4] }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text size="lg" weight="bold" color="primary">🌐 Presença Pública</Text>
                        {status === 'published' && (
                            <Badge status="ready" variant="outline" label="Ativo" />
                        )}
                        {status === 'draft' && (
                            <Badge status="preparing" variant="outline" label="Em construção" />
                        )}
                        {status === 'not_configured' && (
                            <Badge status="new" variant="outline" label="Não configurado" />
                        )}
                    </div>
                    <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                        {status === 'published' && 'Seu site está online e visível para clientes.'}
                        {status === 'draft' && 'Configure e publique seu site para clientes acessarem.'}
                        {status === 'not_configured' && 'Configure sua identidade e publique seu site.'}
                    </Text>
                </div>
            </div>

            {status === 'published' && viewsToday !== null && (
                <div style={{ marginBottom: spacing[4] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: 4 }}>👀 Visualizações hoje</Text>
                    <Text size="xl" weight="bold" color="primary">{viewsToday}</Text>
                </div>
            )}

            {slug && publicUrl && (
                <div style={{ marginBottom: spacing[4], padding: spacing[3], backgroundColor: colors.surface.base, borderRadius: 8 }}>
                    <Text size="xs" color="tertiary" style={{ marginBottom: 4 }}>🔗 Link público</Text>
                    <Text size="sm" color="primary" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {publicUrl}
                    </Text>
                </div>
            )}

            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                {status === 'published' && publicUrl && (
                    <Button variant="outline" size="sm" onClick={handleOpenSite}>
                        Abrir site
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleEdit}>
                    ✏️ {status === 'not_configured' ? 'Configurar' : 'Editar página'}
                </Button>
            </div>
        </Card>
    );
};

