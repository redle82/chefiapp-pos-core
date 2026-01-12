/**
 * P5-2: Predictive Analytics Panel
 * 
 * Painel para analytics preditivo e previsões
 */

import React, { useState, useEffect } from 'react';
import { predictiveAnalyticsService, type DemandForecast, type InventoryForecast, type StaffForecast } from '../../../core/analytics/PredictiveAnalyticsService';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const PredictiveAnalyticsPanel: React.FC = () => {
    const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
    const [inventoryForecasts, setInventoryForecasts] = useState<InventoryForecast[]>([]);
    const [staffForecasts, setStaffForecasts] = useState<StaffForecast[]>([]);
    const [loading, setLoading] = useState(false);

    const loadForecasts = async () => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (!restaurantId) return;

        setLoading(true);
        try {
            const demand = await predictiveAnalyticsService.forecastDemand(restaurantId, 7);
            const inventory = await predictiveAnalyticsService.forecastInventory(restaurantId);
            const staff = await predictiveAnalyticsService.forecastStaff(restaurantId, 7);
            setDemandForecasts(demand);
            setInventoryForecasts(inventory);
            setStaffForecasts(staff);
        } catch (err) {
            console.error('[PredictiveAnalyticsPanel] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadForecasts();
    }, []);

    const demandChartData = demandForecasts.map(f => ({
        date: new Date(f.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
        orders: f.predictedOrders,
        revenue: Math.round(f.predictedRevenue / 100),
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Demand Forecast */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>📈 Previsão de Demanda (7 dias)</Text>
                {demandForecasts.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={demandChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="orders" stroke="#0088FE" strokeWidth={2} name="Pedidos" />
                            <Line type="monotone" dataKey="revenue" stroke="#00C49F" strokeWidth={2} name="Receita (€)" />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Inventory Forecast */}
            {inventoryForecasts.length > 0 && (
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>📦 Previsão de Estoque</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {inventoryForecasts.filter(f => f.predictedDaysUntilStockout < 7).slice(0, 5).map(forecast => (
                            <div key={forecast.itemId} style={{ padding: 12, background: '#fff3cd', borderRadius: 8 }}>
                                <Text size="sm" weight="bold">{forecast.itemName}</Text>
                                <Text size="xs" color="tertiary">
                                    Estoque atual: {forecast.currentStock} | 
                                    Dias até esgotar: {forecast.predictedDaysUntilStockout} | 
                                    Sugerido reabastecer: {forecast.suggestedQuantity}
                                </Text>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Staff Forecast */}
            {staffForecasts.length > 0 && (
                <Card surface="layer1" padding="lg">
                    <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>👥 Previsão de Staff</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {staffForecasts.slice(0, 7).map(forecast => (
                            <div key={forecast.date} style={{ padding: 12, background: '#e3f2fd', borderRadius: 8 }}>
                                <Text size="sm" weight="bold">
                                    {new Date(forecast.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Text>
                                <Text size="xs" color="tertiary">
                                    Demanda: {forecast.predictedDemand} | 
                                    Staff sugerido: {forecast.suggestedStaffCount} | 
                                    Horários de pico: {forecast.peakHours.join(', ')}h
                                </Text>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
