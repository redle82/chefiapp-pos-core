import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import { CONFIG } from '../../config';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface Review {
    id: string;
    source: string;
    rating: number;
    author?: string;
    text_safe: string;
    published_at: string;
}

interface Insight {
    score: number;
    themes: Array<{
        theme: string;
        count: number;
        sentiment: 'positive' | 'negative' | 'neutral';
    }>;
    recommendations: Array<{
        priority: 'high' | 'medium' | 'low';
        action: string;
        reason: string;
    }>;
}

export function LocalBossPage() {
    const { success, error, warning } = useToast();
    const [restaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));
    const [insight, setInsight] = useState<Insight | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            loadInsights();
            loadReviews();
        }
    }, [restaurantId]);

    const loadInsights = async () => {
        if (!restaurantId) return;
        
        try {
            const response = await fetch(
                `${CONFIG.API_BASE}/api/local-boss/insights?restaurant_id=${restaurantId}`
            );
            if (response.ok) {
                const data = await response.json();
                setInsight({
                    score: data.score || 0,
                    totalReviews: data.totalReviews || 0,
                    topics: data.topics || [],
                    recommendations: data.recommendations || []
                });
            }
        } catch (err) {
            console.error('Error loading insights:', err);
        }
    };

    const loadReviews = async () => {
        if (!restaurantId) return;
        
        try {
            const response = await fetch(
                `${CONFIG.API_BASE}/api/local-boss/reviews?restaurant_id=${restaurantId}`
            );
            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
            }
        } catch (err) {
            console.error('Error loading reviews:', err);
        }
    };

    const handleIngestDemo = async () => {
        if (!restaurantId) return;
        
        setLoading(true);
        try {
            // Import demo reviews (40 reviews covering all topics)
            const DEMO_REVIEWS = await import('../../data/demo-reviews.json').then(m => m.default);

            const response = await fetch(`${CONFIG.API_BASE}/api/local-boss/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    reviews: DEMO_REVIEWS
                })
            });

            if (response.ok) {
                const result = await response.json();
                success(`Ingeridos ${result.ingested} reviews (demo)`);
                loadReviews();
            } else {
                const err = await response.json();
                error(err.error || 'Erro ao ingerir reviews');
            }
        } catch (err: any) {
            console.error('Error ingesting reviews:', err);
            error('Erro ao ingerir reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleRunLocalBoss = async () => {
        if (!restaurantId) return;
        
        setRunning(true);
        try {
            const response = await fetch(`${CONFIG.API_BASE}/api/local-boss/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    period_days: 30
                })
            });

            if (response.ok) {
                const result = await response.json();
                // Reload insights after analysis
                await loadInsights();
                success('Análise concluída! Insights atualizados.');
            } else {
                const err = await response.json();
                error(err.error || 'Erro ao gerar insights');
            }
        } catch (err: any) {
            console.error('Error running Local Boss:', err);
            error('Erro ao gerar insights');
        } finally {
            setRunning(false);
        }
    };

    const getScoreColor = (score: number): 'success' | 'warning' | 'destructive' => {
        if (score >= 70) return 'success';
        if (score >= 50) return 'warning';
        return 'destructive';
    };

    const getPriorityColor = (priority: string): 'success' | 'warning' | 'destructive' => {
        if (priority === 'high') return 'destructive';
        if (priority === 'medium') return 'warning';
        return 'success';
    };

    return (
        <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
                    🧠 Local Boss
                </Text>
                <Text color="secondary">
                    Análise inteligente de reviews do Google e outras fontes
                </Text>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <Button
                    tone="action"
                    variant="solid"
                    onClick={handleIngestDemo}
                    disabled={loading}
                >
                    {loading ? 'Ingerindo...' : 'Ingerir Reviews Demo'}
                </Button>
                <Button
                    tone="neutral"
                    variant="outline"
                    onClick={handleRunLocalBoss}
                    disabled={running}
                >
                    {running ? 'Gerando Insights...' : 'Rodar Local Boss (Demo)'}
                </Button>
            </div>

            {/* Protection Notice */}
            <Card surface="layer2" padding="md" style={{ marginBottom: 32 }}>
                <Text size="sm" color="secondary">
                    🛡️ <strong>Proteção da Equipe:</strong> Para proteger a equipe, nomes de funcionários 
                    são removidos automaticamente dos reviews antes de serem exibidos.
                </Text>
            </Card>

            {/* Score Card */}
            {insight && (
                <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <div style={{ 
                            fontSize: 48, 
                            fontWeight: 800,
                            color: insight.score >= 70 ? '#32d74b' : insight.score >= 50 ? '#ff9500' : '#ff453a'
                        }}>
                            {Math.round(insight.score)}
                        </div>
                        <div>
                            <Text size="lg" weight="bold" color="primary">
                                Score Local Boss
                            </Text>
                            <Text size="sm" color="secondary">
                                Baseado em {insight.totalReviews} reviews dos últimos 30 dias
                            </Text>
                        </div>
                    </div>
                </Card>
            )}

            {/* Topics */}
            {insight && insight.topics.length > 0 && (
                <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
                    <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
                        📊 Análise por Tema
                    </Text>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        {insight.topics.map((topic, idx) => {
                            const topicLabels: Record<string, string> = {
                                service: 'Atendimento',
                                cleanliness: 'Limpeza',
                                price: 'Preço',
                                product: 'Produto',
                                ambiance: 'Ambiente',
                                wait_time: 'Tempo de Espera',
                            };
                            const topicLabel = topicLabels[topic.topic] || topic.topic;
                            const sentimentColor = topic.sentimentScore >= 50 ? '#32d74b' : 
                                                   topic.sentimentScore >= 0 ? '#ff9500' : '#ff453a';
                            
                            return (
                                <div key={idx} style={{ 
                                    padding: 16,
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 8,
                                    borderLeft: `4px solid ${sentimentColor}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                        <Text weight="bold">{topicLabel}</Text>
                                        <div style={{ 
                                            fontSize: 24, 
                                            fontWeight: 800,
                                            color: sentimentColor
                                        }}>
                                            {topic.sentimentScore > 0 ? '+' : ''}{topic.sentimentScore}
                                        </div>
                                    </div>
                                    <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
                                        {topic.volume} menções • 
                                        {topic.positiveCount > 0 && ` ${topic.positiveCount} positivas`}
                                        {topic.negativeCount > 0 && ` ${topic.negativeCount} negativas`}
                                    </Text>
                                    {topic.whySummary && (
                                        <Text size="xs" color="tertiary" style={{ marginTop: 8, fontStyle: 'italic' }}>
                                            {topic.whySummary}
                                        </Text>
                                    )}
                                    {topic.topPhrases.length > 0 && (
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <Text size="xs" color="tertiary" style={{ marginBottom: 4 }}>
                                                Frases destacadas:
                                            </Text>
                                            {topic.topPhrases.slice(0, 2).map((phrase, pIdx) => (
                                                <Text key={pIdx} size="xs" color="secondary" style={{ 
                                                    display: 'block',
                                                    marginTop: 4,
                                                    fontStyle: 'italic'
                                                }}>
                                                    "{phrase}"
                                                </Text>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Recommendations */}
            {insight && insight.recommendations.length > 0 && (
                <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
                    <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
                        💡 Ações Sugeridas ({insight.recommendations.length})
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {insight.recommendations.map((rec) => {
                            const topicLabels: Record<string, string> = {
                                service: 'Atendimento',
                                cleanliness: 'Limpeza',
                                price: 'Preço',
                                product: 'Produto',
                                ambiance: 'Ambiente',
                                wait_time: 'Tempo de Espera',
                            };
                            const topicLabel = topicLabels[rec.topic] || rec.topic;
                            
                            return (
                                <div key={rec.id} style={{ 
                                    padding: 16,
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 8,
                                    borderLeft: `4px solid ${
                                        rec.priority === 'high' ? '#ff453a' : 
                                        rec.priority === 'medium' ? '#ff9500' : '#32d74b'
                                    }`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                                        <Badge 
                                            label={rec.priority.toUpperCase()} 
                                            variant={getPriorityColor(rec.priority)}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <Text weight="bold">{rec.action}</Text>
                                                <Badge label={topicLabel} variant="outline" />
                                            </div>
                                            <Text size="sm" color="secondary">
                                                {rec.reason}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Reviews List */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
                    📝 Reviews Recentes
                </Text>
                {reviews.length === 0 ? (
                    <Text color="secondary">
                        Nenhum review encontrado. Use "Ingerir Reviews Demo" para começar.
                    </Text>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {reviews.map((review) => (
                            <div key={review.id} style={{ 
                                padding: 16,
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 8
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Text weight="bold">{review.author || 'Anônimo'}</Text>
                                        <Badge label={`${review.rating}⭐`} variant="outline" />
                                        <Text size="xs" color="tertiary">{review.source}</Text>
                                    </div>
                                    <Text size="xs" color="tertiary">
                                        {new Date(review.published_at).toLocaleDateString('pt-BR')}
                                    </Text>
                                </div>
                                <Text size="sm" color="secondary">
                                    {review.text_safe}
                                </Text>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
