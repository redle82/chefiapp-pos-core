import React, { useEffect, useState } from 'react';
import { Card } from '../../ui/design-system/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { colors } from '../../ui/design-system/tokens/colors';
import { DashboardService } from '../../core/services/DashboardService';

interface ShiftForecastWidgetProps {
    restaurantId: string;
    actualHourlySales: { hour: number; totalCents: number }[];
}

export const ShiftForecastWidget: React.FC<ShiftForecastWidgetProps> = ({ restaurantId, actualHourlySales }) => {
    const [forecast, setForecast] = useState<{ hour: number; expected: number; actual: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        DashboardService.getShiftForecast(restaurantId)
            .then(data => {
                // Merge actual sales into forecast data
                const merged = data.map(item => ({
                    ...item,
                    actual: actualHourlySales.find(a => a.hour === item.hour)?.totalCents || 0
                }));
                setForecast(merged);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [restaurantId, actualHourlySales]);

    // Find max value for scaling graph
    const maxValue = Math.max(
        ...forecast.map(f => f.expected),
        ...forecast.map(f => f.actual),
        1000 // min height safety
    );

    const currentHour = new Date().getHours();

    // Determine Insight Message
    const getInsight = () => {
        const nextPeak = forecast.find(f => f.hour > currentHour && f.expected > (maxValue * 0.7));
        if (nextPeak) {
            return `Previsão de pico às ${nextPeak.hour}:00. Prepare a equipe!`;
        }

        const currentData = forecast.find(f => f.hour === currentHour);
        if (currentData) {
            if (currentData.actual > currentData.expected * 1.2) {
                return "🔥 Vendas 20% acima do esperado! Ótimo ritmo.";
            } else if (currentData.actual < currentData.expected * 0.8 && currentHour < 22) { // Don't warn on close
                return "⚠️ Movimento abaixo do esperado.";
            }
        }

        return "Fluxo dentro da normalidade.";
    };

    if (loading) return (
        <Card surface="layer1" padding="lg" style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="sm" color="tertiary">Calculando previsão de fluxo...</Text>
        </Card>
    );

    return (
        <Card surface="layer1" padding="lg" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Fluxo do Turno (IA)</Text>
                    <Text size="lg" weight="bold" color="primary" style={{ marginTop: 4 }}>
                        {getInsight()}
                    </Text>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.surface.layer3 }} />
                        <Text size="xs" color="tertiary">Esperado</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.action.base }} />
                        <Text size="xs" color="tertiary">Real</Text>
                    </div>
                </div>
            </div>

            {/* Graph Container */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: 160,
                gap: 2,
                paddingBottom: 20, // Space for labels
                position: 'relative'
            }}>
                {/* X-Axis Line */}
                <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, height: 1, backgroundColor: colors.surface.layer2 }} />

                {forecast.map((d) => {
                    const expectedH = (d.expected / maxValue) * 100;
                    const actualH = (d.actual / maxValue) * 100;
                    const isFuture = d.hour > currentHour;

                    // Optimization: Only show certain hours labels to avoid clutter
                    const showLabel = d.hour % 3 === 0 || d.hour === currentHour;

                    return (
                        <div key={d.hour} style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            position: 'relative',
                            opacity: isFuture ? 0.5 : 1
                        }}>
                            {/* Expected Bar (Background/Ghost) */}
                            <div style={{
                                height: `${expectedH}%`,
                                width: '100%',
                                backgroundColor: colors.surface.layer3,
                                borderRadius: '4px 4px 0 0',
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                zIndex: 1
                            }} />

                            {/* Actual Bar (Foreground) */}
                            {d.actual > 0 && (
                                <div style={{
                                    height: `${actualH}%`,
                                    width: '60%',
                                    backgroundColor: colors.action.base,
                                    borderRadius: '4px 4px 0 0',
                                    zIndex: 2,
                                    marginLeft: '20%', // Center inside container
                                    boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                                }} />
                            )}

                            {/* Label */}
                            {showLabel && (
                                <div style={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center' }}>
                                    <Text size="xs" color={d.hour === currentHour ? 'action' : 'tertiary'} weight={d.hour === currentHour ? 'bold' : 'regular'}>
                                        {d.hour}h
                                    </Text>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
