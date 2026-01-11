import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveNextRoute, UserState } from './CoreFlow';

describe('CoreFlow Logic', () => {

    // Default valid state helper
    const baseState: UserState = {
        isAuthenticated: true,
        hasOrganization: true,
        onboardingStatus: 'completed',
        currentPath: '/app/dashboard'
    };

    describe('1. Authentication Barrier', () => {
        it('should allow public access to /public/*', () => {
            const decision = resolveNextRoute({
                ...baseState,
                isAuthenticated: false,
                currentPath: '/public/menu/123'
            });
            expect(decision).toEqual({ type: 'ALLOW' });
        });

        it('should allow public access to /', () => {
            const decision = resolveNextRoute({
                ...baseState,
                isAuthenticated: false,
                currentPath: '/'
            });
            expect(decision).toEqual({ type: 'ALLOW' });
        });

        it('should redirect unauthenticated user to /auth', () => {
            const decision = resolveNextRoute({
                ...baseState,
                isAuthenticated: false,
                currentPath: '/app/dashboard'
            });
            expect(decision).toEqual({ type: 'REDIRECT', to: '/auth', reason: 'Auth required' });
        });
    });

    describe('2. Organization Barrier', () => {
        it('should redirect to onboarding if organization is missing (and not already onboarding)', () => {
            const decision = resolveNextRoute({
                ...baseState,
                hasOrganization: false,
                currentPath: '/app/dashboard'
            });
            expect(decision).toEqual({ type: 'REDIRECT', to: '/onboarding/identity', reason: 'Organization missing' });
        });

        it('should allow onboarding path even if organization is missing', () => {
            const decision = resolveNextRoute({
                ...baseState,
                hasOrganization: false,
                onboardingStatus: 'identity', // Compatible status
                currentPath: '/onboarding/identity'
            });
            expect(decision).toEqual({ type: 'ALLOW' }); // Logic rule 3 catches this first now, but rule 2 has specific check
        });
    });

    describe('3. Onboarding Protocol', () => {
        it('should allow /onboarding routes if status is NOT completed', () => {
            const decision = resolveNextRoute({
                ...baseState,
                onboardingStatus: 'topology',
                currentPath: '/onboarding/topology'
            });
            expect(decision).toEqual({ type: 'ALLOW' });
        });

        it('should redirect to /onboarding/start if status is NOT completed and path is invalid', () => {
            const decision = resolveNextRoute({
                ...baseState,
                onboardingStatus: 'topology',
                currentPath: '/app/dashboard'
            });
            expect(decision).toEqual({ type: 'REDIRECT', to: '/onboarding/start', reason: 'Strict Protocol: topology' });
        });
    });

    describe('4. Sovereign State (Completed)', () => {
        beforeEach(() => {
            // Mock Desktop
            Object.defineProperty(window, 'navigator', {
                value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
                writable: true
            });
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
        });

        it('should redirect /onboarding to dashboard if completed (Desktop)', () => {
            const decision = resolveNextRoute({
                ...baseState,
                onboardingStatus: 'completed',
                currentPath: '/onboarding/start'
            });
            expect(decision).toEqual({ type: 'REDIRECT', to: '/app/dashboard', reason: 'System is already active' });
        });

        it('should allow /app/dashboard if completed', () => {
            const decision = resolveNextRoute({
                ...baseState,
                onboardingStatus: 'completed',
                currentPath: '/app/dashboard'
            });
            expect(decision).toEqual({ type: 'ALLOW' });
        });
    });

    describe('5. Mobile Handoff (Sovereign Law)', () => {
        beforeEach(() => {
            // Mock Mobile (iPhone)
            Object.defineProperty(window, 'navigator', {
                value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
                writable: true
            });
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
        });

        afterEach(() => {
            // Reset
            Object.defineProperty(window, 'navigator', {
                value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
                writable: true
            });
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
        });

        it('should redirect mobile user from Dashboard to Foundation', () => {
            const decision = resolveNextRoute({
                ...baseState,
                onboardingStatus: 'completed',
                currentPath: '/app/dashboard'
            });
            expect(decision).toEqual({ type: 'REDIRECT', to: '/onboarding/foundation', reason: 'Mobile Handoff Required' });
        });

        it('should allow mobile user to stay on Foundation', () => {
            const decision = resolveNextRoute({
                ...baseState,
                onboardingStatus: 'completed',
                currentPath: '/onboarding/foundation'
            });
            expect(decision).toEqual({ type: 'ALLOW' });
        });
    });

});
