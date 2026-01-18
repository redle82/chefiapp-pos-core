/**
 * RuntimeContext - Production vs Demo Mode Detection
 * 
 * This module enforces the PRODUCTION_READINESS_CONTRACT.md:
 * - Production mode: Mocks are FORBIDDEN (crash on detection)
 * - Demo mode: Mocks are allowed for development/testing
 * 
 * CRITICAL: This is a kernel-level guard. All services that could
 * potentially use mocks MUST call assertNoMock() before operation.
 */

import { isDevStableMode } from './devStableMode';

// ============================================================================
// TYPES
// ============================================================================

export type RuntimeMode = 'demo' | 'production';

export interface RuntimeContext {
    mode: RuntimeMode;
    isProduction: boolean;
    isDemo: boolean;
    devStableActive: boolean;
}

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Determines the current runtime mode based on environment variables.
 * 
 * Priority:
 * 1. VITE_RUNTIME_MODE env var (explicit)
 * 2. Production builds (NODE_ENV === 'production') → production
 * 3. Default → demo
 */
function detectRuntimeMode(): RuntimeMode {
    // 1. Explicit override via env var
    const explicit = import.meta.env.VITE_RUNTIME_MODE;
    if (explicit === 'production') return 'production';
    if (explicit === 'demo') return 'demo';

    // 2. Production build defaults to production mode
    if (import.meta.env.PROD) return 'production';

    // 3. Development defaults to demo
    return 'demo';
}

// ============================================================================
// SINGLETON
// ============================================================================

const RUNTIME_MODE: RuntimeMode = detectRuntimeMode();

export const RUNTIME: Readonly<RuntimeContext> = Object.freeze({
    mode: RUNTIME_MODE,
    isProduction: RUNTIME_MODE === 'production',
    isDemo: RUNTIME_MODE === 'demo',
    devStableActive: isDevStableMode(),
});

// ============================================================================
// GUARDS
// ============================================================================

/**
 * Asserts that a service is NOT using a mock implementation.
 * 
 * In production mode, this will CRASH the application to prevent
 * silent failures and ensure all services use real implementations.
 * 
 * @param serviceName - Human-readable name of the service
 * @param isMock - Whether the current implementation is a mock
 * @throws Error in production if isMock is true
 */
export function assertNoMock(serviceName: string, isMock: boolean): void {
    if (!isMock) return;
    if (RUNTIME.isDemo) {
        // Allowed in demo mode, but log for visibility
        console.log(`[RUNTIME] ⚠️ Mock active: ${serviceName} (allowed in demo mode)`);
        return;
    }

    // CRITICAL: Crash in production
    const message = `[PRODUCTION_VIOLATION] Mock usage forbidden: ${serviceName}`;
    console.error(`❌ ${message}`);
    console.error('Service attempted to use mock implementation in production mode.');
    console.error('This is a critical error that must be fixed before deployment.');
    throw new Error(message);
}

/**
 * Asserts that the system is running in production mode.
 * Use this for operations that should NEVER run in demo mode.
 * 
 * @param operationName - Human-readable name of the operation
 * @throws Error if not in production mode
 */
export function assertProduction(operationName: string): void {
    if (RUNTIME.isProduction) return;

    const message = `[DEMO_BLOCKED] ${operationName} is disabled in demo mode`;
    console.warn(`⚠️ ${message}`);
    throw new Error(message);
}

/**
 * Logs the current runtime status. Call this on app boot.
 */
export function logRuntimeStatus(): void {
    const icon = RUNTIME.isProduction ? '🔴' : '🟢';
    const modeLabel = RUNTIME.isProduction ? 'PRODUCTION' : 'DEMO';
    const devStable = RUNTIME.devStableActive ? ' [DEV_STABLE]' : '';

    console.log(`${icon} Runtime Mode: ${modeLabel}${devStable}`);

    if (RUNTIME.isProduction) {
        console.log('   → Mocks are FORBIDDEN');
        console.log('   → All operations are REAL');
    } else {
        console.log('   → Mocks are ALLOWED');
        console.log('   → Data may be ephemeral');
    }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const isProduction = RUNTIME.isProduction;
export const isDemo = RUNTIME.isDemo;
export const runtimeMode = RUNTIME.mode;
