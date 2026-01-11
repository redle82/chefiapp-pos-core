import React, { useMemo } from 'react';
import { useStaff } from '../context/StaffContext';
import { StaffLayout } from '../../../ui/design-system/layouts/StaffLayout';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { colors } from '../../../ui/design-system/tokens/colors';
import type { LatentObligation } from '../context/StaffCoreTypes';
import { now as getNow } from '../../../intelligence/nervous-system/Clock';

// ------------------------------------------------------------------
// 📅 CÉREBRO EXECUTIVO (Calendar View)
// ------------------------------------------------------------------

const CalendarCard: React.FC<{ obligation: LatentObligation; status: 'overdue' | 'today' | 'future' }> = ({ obligation, status }) => {

    let tone: 'destructive' | 'warning' | 'neutral' = 'neutral';
    if (status === 'overdue') tone = 'destructive';
    if (status === 'today') tone = 'warning';

    const surface = status === 'future' ? 'layer1' : 'layer2';
    const borderColor = status === 'overdue' ? colors.destructive.base :
        status === 'today' ? colors.warning.base :
            colors.border.subtle;

    return (
        <Card
            surface={surface}
            padding="md"
            style={{
                borderLeft: `4px solid ${borderColor}`,
                marginBottom: 12
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <Text size="xs" weight="bold" color="tertiary" style={{ textTransform: 'uppercase' }}>
                            {obligation.type} • {obligation.sourceId}
                        </Text>
                    </div>
                    <Text size="lg" weight="bold" color="primary">{obligation.title}</Text>
                    <Text size="sm" color="secondary">{obligation.description}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text size="xs" color="tertiary" style={{ fontFamily: 'monospace' }}>CRITICALITY</Text>
                    <Badge
                        status={obligation.criticality === 'high' ? 'error' : obligation.criticality === 'medium' ? 'warning' : 'neutral'}
                        label={obligation.criticality.toUpperCase()}
                        size="sm"
                    />
                </div>
            </div>
        </Card>
    );
};

export const ManagerCalendarView: React.FC = () => {
    const { activeWorkerId, activeRole, obligations } = useStaff();
    const now = getNow();

    const { overdue, today, future } = useMemo(() => {
        const result = {
            overdue: [] as LatentObligation[],
            today: [] as LatentObligation[],
            future: [] as LatentObligation[]
        };

        obligations?.forEach(ob => {
            if (ob.status === 'fulfilled' || ob.status === 'expired') return;

            if (ob.validUntil < now) {
                result.overdue.push(ob);
            } else if (ob.validFrom <= now && ob.validUntil >= now) {
                result.today.push(ob);
            } else if (ob.validFrom > now) {
                result.future.push(ob);
            }
        });

        return result;
    }, [obligations, now]);

    return (
        <StaffLayout
            title="Time Horizon"
            userName={activeWorkerId || 'Manager'}
            role={activeRole}
            status="active"
        >
            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* OVERDUE */}
                {overdue.length > 0 && (
                    <div className="animate-pulse">
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <Text size="sm" weight="bold" color="destructive" style={{ textTransform: 'uppercase', letterSpacing: 2 }}>⚠️ Attention Needed</Text>
                        </div>
                        {overdue.map(ob => <CalendarCard key={ob.id} obligation={ob} status="overdue" />)}
                    </div>
                )}

                {/* TODAY */}
                <div>
                    <Text size="sm" weight="bold" color="warning" style={{ textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Active Window (Now)</Text>
                    {today.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', opacity: 0.5, border: `1px dashed ${colors.border.subtle}`, borderRadius: radius.md }}>
                            <Text size="sm" color="tertiary">No active obligations for today.</Text>
                        </div>
                    ) : (
                        today.map(ob => <CalendarCard key={ob.id} obligation={ob} status="today" />)
                    )}
                </div>

                {/* FUTURE */}
                <div>
                    <Text size="sm" weight="bold" color="tertiary" style={{ textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Horizon</Text>
                    {future.map(ob => <CalendarCard key={ob.id} obligation={ob} status="future" />)}
                </div>

            </div>
        </StaffLayout>
    );
};
