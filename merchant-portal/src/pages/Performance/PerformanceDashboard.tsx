/**
 * P4-9: Performance Dashboard
 * 
 * Dashboard visual de performance do sistema
 */

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../ui/design-system/AppShell';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { performanceMonitor } from '../../core/monitoring/performanceMonitor';

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: string;
}

interface AggregatedMetric {
    name: string;
    avg: number;
    max: number;
    min: number;
    count: number;
}

export const PerformanceDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [aggregated, setAggregated] = useState<AggregatedMetric[]>([]);

    useEffect(() => {
        // Collect Web Vitals
        const collectWebVitals = () => {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (entry.entryType === 'navigation') {
                            performanceMonitor.recordMetric({
                                name: 'page_load',
                                value: entry.loadEventEnd - entry.fetchStart,
                                unit: 'ms',
                                timestamp: new Date().toISOString(),
                            });
                        } else if (entry.entryType === 'measure') {
                            performanceMonitor.recordMetric({
                                name: entry.name,
                                value: entry.duration,
                                unit: 'ms',
                                timestamp: new Date().toISOString(),
                            });
                        }
                    });
                });

                observer.observe({ entryTypes: ['navigation', 'measure'] });

                return () => observer.disconnect();
            }
        };

        const cleanup = collectWebVitals();

        // Aggregate metrics every 5 seconds
        const interval = setInterval(() => {
            // Get recent metrics (last 5 minutes)
            const recentMetrics = metrics.filter(m => {
                const metricTime = new Date(m.timestamp).getTime();
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                return metricTime > fiveMinutesAgo;
            });

            // Aggregate by name
            const aggMap = new Map<string, { count: number; sum: number; max: number; min: number }>();
            
            recentMetrics.forEach(m => {
                if (!aggMap.has(m.name)) {
                    aggMap.set(m.name, { count: 0, sum: 0, max: -Infinity, min: Infinity });
                }
                const agg = aggMap.get(m.name)!;
                agg.count++;
                agg.sum += m.value;
                agg.max = Math.max(agg.max, m.value);
                agg.min = Math.min(agg.min, m.value);
            });

            const aggregatedArray: AggregatedMetric[] = Array.from(aggMap.entries()).map(([name, data]) => ({
                name,
                avg: data.sum / data.count,
                max: data.max,
                min: data.min,
                count: data.count,
            }));

            setAggregated(aggregatedArray);
        }, 5000);

        return () => {
            if (cleanup) cleanup();
            clearInterval(interval);
        };
    }, [metrics]);

    // Chart data
    const chartData = aggregated.map(m => ({
        name: m.name,
        avg: Math.round(m.avg),
        max: Math.round(m.max),
        min: Math.round(m.min),
    }));

    return (
        <AppShell>
            <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 24 }}>
                    <Text size="2xl" weight="bold">⚡ Performance Dashboard</Text>
                    <Text size="sm" color="tertiary">Monitoramento em tempo real de métricas de performance</Text>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {aggregated.slice(0, 4).map((metric) => (
                        <Card key={metric.name} surface="layer1" padding="lg">
                            <Text size="sm" color="tertiary" style={{ marginBottom: 8 }}>{metric.name}</Text>
                            <Text size="xl" weight="bold">{Math.round(metric.avg)}{metric.name.includes('load') ? 'ms' : 'ms'}</Text>
                            <Text size="xs" color="tertiary" style={{ marginTop: 4 }}>
                                Max: {Math.round(metric.max)}ms | Min: {Math.round(metric.min)}ms
                            </Text>
                        </Card>
                    ))}
                </div>

                {/* Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Average Performance */}
                    <Card surface="layer1" padding="lg">
                        <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>Média de Performance</Text>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avg" fill="#0088FE" name="Média (ms)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Min/Max Range */}
                    <Card surface="layer1" padding="lg">
                        <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>Range de Performance</Text>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="max" stroke="#FF8042" strokeWidth={2} name="Máximo (ms)" />
                                <Line type="monotone" dataKey="min" stroke="#00C49F" strokeWidth={2} name="Mínimo (ms)" />
                                <Line type="monotone" dataKey="avg" stroke="#0088FE" strokeWidth={2} name="Média (ms)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Alerts */}
                {aggregated.some(m => m.avg > 1000) && (
                    <Card surface="layer2" padding="lg" style={{ marginTop: 24, border: '2px solid #FF8042' }}>
                        <Text size="md" weight="bold" color="destructive">⚠️ Alertas de Performance</Text>
                        {aggregated.filter(m => m.avg > 1000).map(m => (
                            <Text key={m.name} size="sm" style={{ marginTop: 8 }}>
                                {m.name}: {Math.round(m.avg)}ms (acima do limite recomendado de 1000ms)
                            </Text>
                        ))}
                    </Card>
                )}
            </div>
        </AppShell>
    );
};
