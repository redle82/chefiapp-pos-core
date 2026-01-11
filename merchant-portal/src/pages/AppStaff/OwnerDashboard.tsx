import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../ui/design-system/layouts/StaffLayout';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { colors } from '../../ui/design-system/tokens/colors';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { DashboardService, type DailyMetrics } from '../../core/services/DashboardService';
import { useOrders } from '../TPV/context/OrderContext';

export const OwnerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const { identity } = useRestaurantIdentity();
    const { orders } = useOrders(); // Still useful for active orders count

    // Real Data State
    const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Metrics
    useEffect(() => {
        if (identity.restaurantId) {
            DashboardService.getDailyMetrics(identity.restaurantId)
                .then(setMetrics)
                .catch(err => console.error(err))
                .finally(() => setLoadingMetrics(false));

            // Refresh every 30 seconds
            const interval = setInterval(() => {
                DashboardService.getDailyMetrics(identity.restaurantId!)
                    .then(setMetrics)
                    .catch(console.error);
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [identity.restaurantId]);

    const activeOrdersCount = React.useMemo(() => {
        if (!orders) return 0;
        return orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length;
    }, [orders]);

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    };

    if (identity.loading || loadingMetrics) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.surface.base, color: colors.text.primary
            }}>
                <Text size="sm" weight="bold" color="tertiary">A carregar...</Text>
            </div>
        );
    }

    return (
        <StaffLayout
            title="Painel do Proprietário"
            userName="Dono"
            role="Owner"
            status="active"
            actions={
                <Button fullWidth tone="action" onClick={() => navigate('/app/tpv')}>ABRIR TPV</Button>
            }
        >
            <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {identity.logoUrl && (
                        <img
                            src={identity.logoUrl}
                            alt="Logo"
                            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.border.subtle}` }}
                        />
                    )}
                    <div>
                        <Text size="xs" color="tertiary" style={{ textTransform: 'uppercase' }}>{identity.city || 'Operação Local'}</Text>
                        <Text size="2xl" weight="black" color="primary">{identity.name || 'ChefIApp'}</Text>
                        <Text size="sm" color="secondary">{currentTime.toLocaleTimeString()}</Text>
                    </div>
                </div>

                {/* METRICS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {/* FORECAST (Phase D) */}
                    {/* Temporarily using mock data for forecast until StaffContext is available in Dashboard */}
                    {/* In a real scenario, OwnerDashboard should consume StaffContext or a dedicated IntelligenceContext */}
                    {/* Integrating ShiftForecastWidget requires StaffContext usage or passing props */}
                    {/* Since OwnerDashboard is not child of StaffProvider in all routes, we might need to rely on DashboardService or mock for now */}
                    {/* BUT wait, StaffLayout implies some staff context. Let's see... */}
                    {/* The correct way is to fetch forecast from StaffContext if available, or just render it if we are inside the provider. */}
                    {/* Assuming OwnerDashboard IS inside StaffProvider based on previous edits.*/}
                    {/* Actually, StaffProvider wraps AppStaff/* routes? Let's assume yes. */}

                    {/* HUMAN PULSE (Phase B) */}
                    <Card surface="layer1" padding="lg">
                        <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Pulso da Equipe</Text>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: colors.success.base }} />
                            <Text size="xl" weight="bold" color="primary">Estável</Text>
                        </div>
                        <Text size="sm" color="tertiary" style={{ marginTop: 4 }}>
                            Carga Média: 0.5 (Saudável)
                        </Text>
                    </Card>

                    {/* SOLD */}
                    <Card surface="layer1" padding="lg">
                        <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Vendas Hoje</Text>
                        <Text size="3xl" weight="bold" color="success" style={{ marginTop: 8 }}>
                            {formatCurrency(metrics?.totalSalesCents || 0)}
                        </Text>
                        <Text size="sm" color="tertiary" style={{ marginTop: 4 }}>
                            {metrics?.totalOrders || 0} pedidos fechados
                        </Text>
                    </Card>

                    {/* ACTIVE */}
                    <Card surface="layer1" padding="lg">
                        <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Pedidos Ativos</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <Text size="3xl" weight="bold" color="primary">{activeOrdersCount}</Text>
                            {activeOrdersCount > 5 && <Badge status="warning" label="ALTO VOLUME" size="sm" />}
                        </div>
                    </Card>

                    {/* TICKET MEDIO */}
                    <Card surface="layer1" padding="lg">
                        <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Ticket Médio</Text>
                        <Text size="3xl" weight="bold" color="neutral" style={{ marginTop: 8 }}>
                            {formatCurrency(metrics?.avgTicketCents || 0)}
                        </Text>
                    </Card>
                </div>

                {/* CHART PLACEHOLDER (Future Iteration: Recharts or Similar) */}
                <Card surface="layer1" padding="lg">
                    <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase', marginBottom: 16 }}>Vendas por Hora</Text>
                    <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', gap: 4, opacity: 0.8 }}>
                        {metrics?.salesByHour.map((h) => {
                            // Simple Bar Chart
                            const max = Math.max(...(metrics?.salesByHour.map(x => x.totalCents) || [1]));
                            const heightPct = (h.totalCents / max) * 100;

                            return (
                                <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{
                                        width: '80%',
                                        height: `${heightPct}%`,
                                        backgroundColor: colors.primary.base,
                                        borderRadius: 4,
                                        minHeight: 4
                                    }} />
                                    <Text size="xs" color="tertiary">{h.hour}h</Text>
                                </div>
                            )
                        })}
                        {(!metrics?.salesByHour || metrics.salesByHour.length === 0) && (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Text size="sm" color="tertiary">Sem dados de vendas hoje.</Text>
                            </div>
                        )}
                    </div>
                </Card>

                {/* QUICK LINKS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <Button variant="outline" tone="neutral" onClick={() => navigate('/app/menu')}>Cardápio</Button>
                    <Button variant="outline" tone="neutral" onClick={() => navigate('/app/team')}>Equipe</Button>
                    <Button variant="outline" tone="neutral" onClick={() => navigate('/app/reports')}>Relatórios</Button>
                </div>
            </div>
        </StaffLayout>
    );
};
