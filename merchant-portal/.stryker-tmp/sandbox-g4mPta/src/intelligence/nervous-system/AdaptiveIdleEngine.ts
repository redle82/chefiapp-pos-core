// ------------------------------------------------------------------
// 🕰️ ADAPTIVE IDLE ENGINE (THE CLOCK)
// ------------------------------------------------------------------
// Replaces fixed thresholds with metabolic intelligence.
// Law 2: Memória Temporal.

type Density = 'low' | 'high'; // Single (Meta) vs Multi (Distributed)

interface AdaptiveContext {
    hour: number;        // 0-23
    density: Density;    // Derived from connection count
    hasPressure: boolean; // Is there active work?
}

// CONSTANTS (Base metabolic rates)
// CONSTANTS (Base metabolics for equation)
const BASELINE_MS = 5 * 60 * 1000; // 5 Minutes (Standard)

export const getAdaptiveIdleThreshold = (context: AdaptiveContext): number => {
    const { hour, density, hasPressure } = context;

    // 1. DETERMINE TIME OF DAY FACTOR
    let circadianFactor = 1.0;

    if ((hour >= 12 && hour < 15) || (hour >= 19 && hour < 23)) {
        circadianFactor = 1.0; // Rush
    } else {
        circadianFactor = 0.3; // Dead Zone (Wake up faster)
    }

    // 2. PRESSURE FACTOR
    const pressureFactor = hasPressure ? 1.5 : 1.0;

    // 3. DENSITY FACTOR
    const densityFactor = density === 'low' ? 0.8 : 1.0;

    // 4. THE EQUATION (Law 2 Physics)
    const threshold = BASELINE_MS * circadianFactor * pressureFactor * densityFactor;

    return Math.max(30000, Math.min(threshold, 600000));
};
