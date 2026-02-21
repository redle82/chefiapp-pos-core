/**
 * 🕰️ NERVOUS SYSTEM CLOCK
 * 
 * Abstraction layer over Date.now() to allow Time Travel in Playwright/Test environments.
 * The Nervous System lives by this clock, not the wall clock.
 */
// @ts-nocheck


declare global {
    interface Window {
        __NOW__?: number;
    }
}

export const now = (): number => {
    // If in Test Mode and Window has a forced time, use it.
    if (typeof window !== 'undefined' && window.__NOW__) {
        return window.__NOW__;
    }
    return Date.now();
};
