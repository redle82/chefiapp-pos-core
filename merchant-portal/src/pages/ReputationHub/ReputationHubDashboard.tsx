/**
 * ReputationHubDashboard.tsx — Dashboard Principal de Reputação
 * 
 * Inspirado no Local Boss: gestão de múltiplas localizações, respostas, QR codes.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import { CONFIG } from '../../config';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface Location {
  id: string;
  location_name: string;
  current_rating?: number;
  total_reviews: number;
  enabled: boolean;
}

interface UnansweredReview {
  review_id: string;
  review_source: string;
  location_name?: string;
  rating: number;
  text: string;
  days_unanswered: number;
  priority: string;
}

interface Campaign {
  id: string;
  campaign_name: string;
  target_rating: number;
  current_rating?: number;
  reviews_needed: number;
  reviews_received: number;
  status: string;
}

export function ReputationHubDashboard() {
  const { success, error } = useToast();
  const [restaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));
  const [locations, setLocations] = useState<Location[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredReview[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId]);

  const loadData = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      // Load locations
      const locationsResponse = await fetch(
        `${CONFIG.API_BASE}/api/reputation-hub/locations?restaurant_id=${restaurantId}`
      );
      if (locationsResponse.ok) {
        const data = await locationsResponse.json();
        setLocations(data.locations || []);
      }

      // Load unanswered reviews
      const unansweredResponse = await fetch(
        `${CONFIG.API_BASE}/api/reputation-hub/unanswered?restaurant_id=${restaurantId}`
      );
      if (unansweredResponse.ok) {
        const data = await unansweredResponse.json();
        setUnanswered(data.reviews || []);
      }

      // Load campaigns
      const campaignsResponse = await fetch(
        `${CONFIG.API_BASE}/api/reputation-hub/campaigns?restaurant_id=${restaurantId}`
      );
      if (campaignsResponse.ok) {
        const data = await campaignsResponse.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Error loading ReputationHub data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string): 'success' | 'warning' | 'destructive' => {
    if (priority === 'urgent') return 'destructive';
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'warning';
    return 'success';
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
          ⭐ ReputationHub
        </Text>
        <Text color="secondary">
          Gestão completa de reputação — Múltiplas localizações, respostas e campanhas
        </Text>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Locations Overview */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            📍 Localizações ({locations.length})
          </Text>
          {locations.length === 0 ? (
            <Text color="secondary">
              Nenhuma localização configurada. Adicione sua primeira localização.
            </Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {locations.map((location) => (
                <div
                  key={location.id}
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <Text weight="bold">{location.location_name}</Text>
                      {location.current_rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Text size="lg" weight="bold" color="primary">
                            {location.current_rating.toFixed(1)}⭐
                          </Text>
                          <Text size="sm" color="secondary">
                            {location.total_reviews} avaliações
                          </Text>
                        </div>
                      )}
                    </div>
                    <Badge
                      label={location.enabled ? 'Ativa' : 'Inativa'}
                      variant={location.enabled ? 'success' : 'outline'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Unanswered Reviews */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            ⚠️ Avaliações Não Respondidas ({unanswered.length})
          </Text>
          {unanswered.length === 0 ? (
            <Text color="secondary">Todas as avaliações foram respondidas! 🎉</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {unanswered.slice(0, 5).map((review, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    borderLeft: `4px solid ${
                      review.priority === 'urgent' ? '#ff453a' :
                      review.priority === 'high' ? '#ff9500' : '#32d74b'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <Text weight="bold">{review.rating}⭐</Text>
                      {review.location_name && (
                        <Text size="sm" color="secondary">{review.location_name}</Text>
                      )}
                    </div>
                    <Badge
                      label={`${review.days_unanswered}d`}
                      variant={getPriorityColor(review.priority)}
                    />
                  </div>
                  <Text size="sm" color="secondary" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {review.text}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Campaigns */}
      <Card surface="layer1" padding="lg">
        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
          🎯 Campanhas de Avaliações ({campaigns.length})
        </Text>
        {campaigns.length === 0 ? (
          <Text color="secondary">
            Nenhuma campanha ativa. Crie uma campanha para aumentar suas avaliações.
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map((campaign) => {
              const progress = campaign.reviews_needed > 0
                ? (campaign.reviews_received / campaign.reviews_needed) * 100
                : 0;

              return (
                <div
                  key={campaign.id}
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <Text weight="bold">{campaign.campaign_name}</Text>
                      <Text size="sm" color="secondary">
                        Meta: {campaign.target_rating.toFixed(1)}⭐ • 
                        {campaign.reviews_received}/{campaign.reviews_needed} avaliações
                      </Text>
                    </div>
                    <Badge
                      label={campaign.status}
                      variant={campaign.status === 'active' ? 'success' : 'outline'}
                    />
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: 8, 
                    background: 'rgba(255,255,255,0.1)', 
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginTop: 8
                  }}>
                    <div style={{
                      width: `${Math.min(100, progress)}%`,
                      height: '100%',
                      background: progress >= 100 ? '#32d74b' : '#ff9500',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

