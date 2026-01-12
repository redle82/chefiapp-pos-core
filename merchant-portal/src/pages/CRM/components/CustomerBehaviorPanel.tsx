/**
 * P5-3: Customer Behavior Panel
 * 
 * Painel para análise de comportamento de clientes
 */

import React, { useState, useEffect } from 'react';
import { customerBehaviorService, type CustomerProfile, type CustomerSegment } from '../../../core/customer/CustomerBehaviorService';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const CustomerBehaviorPanel: React.FC = () => {
    const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
    const [segments, setSegments] = useState<CustomerSegment[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (!restaurantId) return;

        setLoading(true);
        try {
            const customerProfiles = await customerBehaviorService.analyzeCustomerBehavior(restaurantId);
            const customerSegments = await customerBehaviorService.segmentCustomers(restaurantId);
            setProfiles(customerProfiles);
            setSegments(customerSegments);
        } catch (err) {
            console.error('[CustomerBehaviorPanel] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const segmentChartData = segments.map(s => ({
        name: s.name,
        value: s.customerCount,
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Segments */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>👥 Segmentação de Clientes</Text>
                {segments.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={segmentChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {segmentChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Top Customers */}
            <Card surface="layer1" padding="lg">
                <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>⭐ Top Clientes</Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {profiles.slice(0, 10).map(profile => (
                        <div key={profile.customerId} style={{ padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text size="sm" weight="bold">{profile.name}</Text>
                                    <Text size="xs" color="tertiary">
                                        {profile.totalOrders} pedidos | 
                                        Lifetime Value: €{(profile.lifetimeValue / 100).toFixed(2)} | 
                                        Segmento: {profile.segment}
                                    </Text>
                                </div>
                                <Text size="sm" weight="bold">€{(profile.averageOrderValue / 100).toFixed(2)}</Text>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
