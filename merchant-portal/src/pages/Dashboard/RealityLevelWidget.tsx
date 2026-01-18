
import { useEffect, useState } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { GenesisKernel } from '../../core/kernel/GenesisKernel';
import { useTenant } from '../../core/tenant/TenantContext';
import { colors } from '../../ui/design-system/tokens/colors';

export const RealityLevelWidget = () => {
    const { restaurant, refreshTenant } = useTenant();
    const [status, setStatus] = useState<'DRAFT' | 'READY_FOR_REALITY' | 'LIVE_REALITY'>('DRAFT');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Read initial state (DB wins over Blueprint/Local)
        if (restaurant) {
            // New Schema: Check reality_status column
            if ((restaurant as any).reality_status) {
                setStatus((restaurant as any).reality_status);
            } else {
                // Fallback: Check Blueprint (Legacy/Local)
                GenesisKernel.getBlueprint().then(bp => {
                    if (bp?.organization.realityStatus) {
                        setStatus(bp.organization.realityStatus);
                    }
                });
            }
        }
    }, [restaurant]);

    const handlePromote = async () => {
        if (!restaurant?.id) return;

        setLoading(true);
        setError(null);
        try {
            await GenesisKernel.promoteToReality(restaurant.id);
            // Refresh
            const bp = await GenesisKernel.getBlueprint();
            if (bp) setStatus(bp.organization.realityStatus);
            await refreshTenant(); // Refresh context
        } catch (err: any) {
            console.error(err);
            // Nice error message formatting
            const msg = err.message.replace('Reality Promotion Failed:', '').trim();
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const isDraft = status === 'DRAFT';
    const isReady = status === 'READY_FOR_REALITY';
    const isLive = status === 'LIVE_REALITY';

    return (
        <Card surface="layer2" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        fontSize: '32px',
                        filter: isDraft ? 'grayscale(100%)' : 'none',
                        transition: 'all 0.5s ease'
                    }}>
                        {isDraft ? '🧬' : isReady ? '🎖️' : '🌍'}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text size="lg" weight="black" color="primary">REALITY LEVEL</Text>
                            <Badge
                                label={status}
                                status={isLive ? 'ready' : isReady ? 'warning' : 'neutral'}
                                variant={isDraft ? 'outline' : 'soft'}
                            />
                        </div>
                        <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                            {isDraft
                                ? "System operating in Draft Mode. Validation required for Reality."
                                : isReady
                                    ? "System is Reality Ready. Waiting for First Physical Contact."
                                    : "System is LIVE and strictly bound to Physical Reality."}
                        </Text>
                    </div>
                </div>

                <div>
                    {isDraft && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {error && (
                                <Text size="xs" color="critical" weight="bold" style={{ maxWidth: 200, textAlign: 'right' }}>
                                    🛑 {error}
                                </Text>
                            )}
                            <Button
                                size="default"
                                variant="solid"
                                tone="brand"
                                isLoading={loading}
                                onClick={handlePromote}
                            >
                                PROMOVER PARA REALIDADE
                            </Button>
                        </div>
                    )}

                    {isReady && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {error && (
                                <Text size="xs" color="critical" weight="bold" style={{ maxWidth: 200, textAlign: 'right' }}>
                                    🛑 {error}
                                </Text>
                            )}
                            <Button
                                size="default"
                                variant="solid"
                                tone="positive"
                                isLoading={loading}
                                onClick={async () => {
                                    if (!restaurant?.id) return;
                                    setLoading(true);
                                    setError(null);
                                    try {
                                        await GenesisKernel.confirmLiveReality(restaurant.id);
                                        const bp = await GenesisKernel.getBlueprint();
                                        if (bp) setStatus(bp.organization.realityStatus);
                                        await refreshTenant();
                                    } catch (err: any) {
                                        console.error(err);
                                        const msg = err.message.replace('Live Reality Confirmation Failed:', '').trim();
                                        setError(msg);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                CONFIRMAR VIDA (LIVE)
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
