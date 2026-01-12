/**
 * P6-7: Social Media Settings Component
 * 
 * Componente para configurar integração com redes sociais
 */

import React, { useState, useEffect } from 'react';
import { socialMediaService, type SocialMediaCampaign } from '../../../core/social/SocialMediaService';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';

export const SocialMediaSettings: React.FC = () => {
    const [campaigns, setCampaigns] = useState<SocialMediaCampaign[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await socialMediaService.getCampaigns();
            setCampaigns(data);
        } catch (err) {
            console.error('[SocialMediaSettings] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card surface="layer1" padding="lg">
            <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>📱 Redes Sociais</Text>
            <Text size="sm" color="tertiary" style={{ marginBottom: 16 }}>
                Configure postagens automáticas em redes sociais
            </Text>

            {loading ? (
                <Text size="sm" color="tertiary">Carregando campanhas...</Text>
            ) : campaigns.length === 0 ? (
                <Text size="sm" color="tertiary">Nenhuma campanha configurada ainda.</Text>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {campaigns.map(campaign => (
                        <div key={campaign.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                            <Text size="sm" weight="bold">{campaign.name}</Text>
                            <Text size="xs" color="tertiary">
                                Plataformas: {campaign.platforms.join(', ')} | 
                                Trigger: {campaign.trigger} | 
                                {campaign.enabled ? '✅ Ativa' : '⏸️ Inativa'}
                            </Text>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
