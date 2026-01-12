/**
 * P5-1: Menu Optimization Panel
 * 
 * Painel para análise e otimização de menu
 */

import React, { useState, useEffect } from 'react';
import { menuOptimizationService, type MenuItemAnalysis, type PriceSuggestion } from '../../../core/ai/MenuOptimizationService';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const MenuOptimizationPanel: React.FC = () => {
    const [analyses, setAnalyses] = useState<MenuItemAnalysis[]>([]);
    const [suggestions, setSuggestions] = useState<PriceSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAnalyses = async () => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (!restaurantId) return;

        setLoading(true);
        try {
            const menuAnalyses = await menuOptimizationService.analyzeMenuItems(restaurantId);
            const priceSuggestions = await menuOptimizationService.suggestPrices(restaurantId);
            setAnalyses(menuAnalyses);
            setSuggestions(priceSuggestions);
        } catch (err) {
            console.error('[MenuOptimizationPanel] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalyses();
    }, []);

    const chartData = analyses.slice(0, 10).map(a => ({
        name: a.name.substring(0, 20),
        profit: Math.round(a.profit / 100),
        revenue: Math.round(a.revenue / 100),
        cost: Math.round(a.cost / 100),
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card surface="layer1" padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text size="lg" weight="bold">🤖 Otimização de Menu</Text>
                    <Button variant="outline" size="sm" onClick={loadAnalyses} disabled={loading}>
                        {loading ? 'Carregando...' : 'Atualizar'}
                    </Button>
                </div>

                {analyses.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="#0088FE" name="Receita (€)" />
                            <Bar dataKey="cost" fill="#FF8042" name="Custo (€)" />
                            <Bar dataKey="profit" fill="#00C49F" name="Lucro (€)" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Recommendations */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>💡 Recomendações</Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analyses.filter(a => a.recommendation === 'promote').slice(0, 5).map(item => (
                        <div key={item.itemId} style={{ padding: 12, background: '#e8f5e9', borderRadius: 8 }}>
                            <Text size="sm" weight="bold">⭐ {item.name}</Text>
                            <Text size="xs" color="tertiary">
                                Promover: {item.profitMargin.toFixed(1)}% margem, {item.popularity.toFixed(0)}% popularidade
                            </Text>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Price Suggestions */}
            {suggestions.length > 0 && (
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>💰 Sugestões de Preço</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {suggestions.slice(0, 5).map(suggestion => (
                            <div key={suggestion.itemId} style={{ padding: 12, background: '#fff3cd', borderRadius: 8 }}>
                                <Text size="sm" weight="bold">{suggestion.itemId}</Text>
                                <Text size="xs" color="tertiary">
                                    Atual: €{(suggestion.currentPrice / 100).toFixed(2)} → Sugerido: €{(suggestion.suggestedPrice / 100).toFixed(2)}
                                </Text>
                                <Text size="xs" color="tertiary">{suggestion.reason}</Text>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
