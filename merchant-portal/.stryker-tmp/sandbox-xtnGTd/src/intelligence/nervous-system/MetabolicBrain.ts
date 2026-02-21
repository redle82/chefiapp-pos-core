import { GlobalEventStore } from '../../core/events/EventStore';

// 🧠 METABOLIC BRAIN
// "The system that learns from the past to protect the future."

export type MetabolicInsight = {
    itemId: string;
    burnRatePerHour: number; // Units per hour
    daysUntilStockout: number;
    panicScore: number; // 0-100 (Probability of anxiety-driven behavior)
    lastPanicEvent?: number; // Timestamp
};

const HOUR_MS = 3600000;

export const MetabolicBrain = {

    // A) VELOCITY ANALYSIS
    // Calculates how fast we are burning through stock based on history.
    async analyzeItem(itemId: string, currentStock: number): Promise<MetabolicInsight> {
        const history = await GlobalEventStore.getAllSince(Date.now() - (7 * 24 * HOUR_MS)); // Last 7 days

        // Filter for this item
        const itemEvents = history.filter(e =>
            e.type === 'INVENTORY_ITEM_UPDATED' &&
            e.payload.itemId === itemId
        );

        if (itemEvents.length < 2) {
            return { itemId, burnRatePerHour: 0, daysUntilStockout: 999, panicScore: 0 };
        }

        // 1. Calculate Velocity (Burn Rate)
        // We look for drops in stock (consumption).
        let totalConsumed = 0;
        const firstTime = itemEvents[0].meta.timestamp;
        const lastTime = itemEvents[itemEvents.length - 1].meta.timestamp;

        // Naive approach: Look for downward trends in updates
        // Real approach would require knowing the "before" state, but we can infer from negative deltas if we tracked them,
        // or just differential between checkpoints. 
        // For V1, we will assume generic "updates" might include stock level.
        // If the payload has `currentStock`, we use it.

        const stockPoints = itemEvents
            .filter(e => e.payload.updates && typeof e.payload.updates.currentStock === 'number')
            .map(e => ({ ts: e.meta.timestamp, val: e.payload.updates.currentStock as number }))
            .sort((a, b) => a.ts - b.ts);

        if (stockPoints.length < 2) {
            return { itemId, burnRatePerHour: 0, daysUntilStockout: 999, panicScore: 0 };
        }

        // Calculate drips
        for (let i = 1; i < stockPoints.length; i++) {
            const diff = stockPoints[i - 1].val - stockPoints[i].val;
            if (diff > 0) {
                totalConsumed += diff;
            }
        }

        const timeSpanHours = (lastTime - firstTime) / HOUR_MS;
        const burnRate = timeSpanHours > 0 ? totalConsumed / timeSpanHours : 0;
        const daysLeft = burnRate > 0 ? (currentStock / burnRate) / 24 : 999;

        // B) PANIC DETECTION
        // Logic: Restocks happened frequently? Or late at night?
        // Let's define "Panic" as: Restocking > 2x per day OR Restocking between 23h-06h.

        let panicScore = 0;
        let lastPanic = undefined;

        const restockEvents = stockPoints.filter((p, i) => i > 0 && p.val > stockPoints[i - 1].val);

        restockEvents.forEach(r => {
            const date = new Date(r.ts);
            const hour = date.getHours();

            // Late night restock? (Anxiety)
            if (hour >= 23 || hour <= 5) {
                panicScore += 20;
                lastPanic = r.ts;
            }
        });

        // High frequency restock?
        if (timeSpanHours > 0 && (restockEvents.length / (timeSpanHours / 24)) > 2) {
            panicScore += 30; // More than 2 restocks per day average
        }

        return {
            itemId,
            burnRatePerHour: Number(burnRate.toFixed(2)),
            daysUntilStockout: Number(daysLeft.toFixed(1)),
            panicScore: Math.min(panicScore, 100),
            lastPanicEvent: lastPanic
        };
    }
};
