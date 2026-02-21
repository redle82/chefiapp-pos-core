import { useMemo } from 'react';
import type { TableHealth } from '../../core/domain/TableHealthUtils';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'positive';

export interface OperationalInsight {
    id: string;
    type: 'bottleneck' | 'service_delay' | 'payment_friction' | 'praise' | 'alert';
    severity: InsightSeverity;
    message: string;
    actionLabel?: string;
    timestamp: number;
}

// Minimal interface for what the Cortex needs to know about input data
interface CortexTableData {
    id: string;
    health: TableHealth;
    status: 'free' | 'occupied' | 'reserved';
    waitMinutes: number;
}

// ----------------------------------------------------------------------
// THE CORTEX LOGIC
// ----------------------------------------------------------------------

export const OperationalCortex = {
    analyze(tables: CortexTableData[]): OperationalInsight[] {
        const insights: OperationalInsight[] = [];
        const now = Date.now();

        const occupied = tables.filter(t => t.status === 'occupied');
        if (occupied.length === 0) return [];

        // 1. ANGRY CUSTOMER DETECTION
        const angryTables = occupied.filter(t => t.health === 'angry');
        const angryCount = angryTables.length;
        const angryPercentage = (angryCount / occupied.length) * 100;

        if (angryCount > 0) {
            if (angryPercentage > 30) {
                insights.push({
                    id: `crit-angry-${now}`,
                    type: 'service_delay',
                    severity: 'critical',
                    message: `🚨 Crítico: ${angryCount} mesas estão furiosas (>30min). O salão está colapsando.`,
                    actionLabel: 'Disparar Apoio',
                    timestamp: now
                });
            } else {
                insights.push({
                    id: `warn-angry-${now}`,
                    type: 'service_delay',
                    severity: 'warning',
                    message: `Atenção: ${angryCount} mesas esperando muito tempo. Priorize o atendimento.`,
                    timestamp: now
                });
            }
        }

        // 2. BOREDOM / MISSED REVENUE
        const boredTables = occupied.filter(t => t.health === 'bored');
        if (boredTables.length >= 3 && angryCount === 0) {
            insights.push({
                id: `info-bored-${now}`,
                type: 'bottleneck',
                severity: 'info',
                message: `${boredTables.length} mesas "entediadas". Oportunidade de rodada de bebidas?`,
                actionLabel: 'Sugerir Bebidas',
                timestamp: now
            });
        }

        // 3. ACTION REQUIRED (Pulsing)
        const pulsingTables = occupied.filter(t => t.health === 'pulsing');
        if (pulsingTables.length > 0) {
            insights.push({
                id: `act-pulsing-${now}`,
                type: 'alert',
                severity: 'warning', // Actionable
                message: `${pulsingTables.length} mesas chamando.`,
                timestamp: now
            });
        }

        // 4. POSITIVE REINFORCEMENT
        const happyTables = occupied.filter(t => t.health === 'happy');
        if (happyTables.length === occupied.length && occupied.length > 2) {
            insights.push({
                id: `praise-flow-${now}`,
                type: 'praise',
                severity: 'positive',
                message: `Fluxo Perfeito. ${occupied.length} mesas rodando suavemente. Bom trabalho.`,
                timestamp: now
            });
        }

        // Return highest priority first
        return insights.sort((a, b) => {
            const severityScore = { 'critical': 4, 'warning': 3, 'info': 2, 'positive': 1 };
            return severityScore[b.severity] - severityScore[a.severity];
        });
    }
};

// ----------------------------------------------------------------------
// REACT HOOK
// ----------------------------------------------------------------------

export const useOperationalCortex = (tables: any[]) => {
    // We expect 'tables' to already have the 'health' and 'waitMinutes' augmented properties
    // from the calculation in TPV.tsx

    const insights = useMemo(() => {
        return OperationalCortex.analyze(tables);
    }, [tables]);

    const topInsight = insights.length > 0 ? insights[0] : null;

    return {
        insights,
        topInsight
    };
};
