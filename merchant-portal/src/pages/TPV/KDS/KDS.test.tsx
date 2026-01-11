
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { OrderTimer } from './OrderTimer';

// Mock dependencies if necessary for larger KDS tests
// For now, testing OrderTimer isolated logic is high value

describe('OrderTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders initial time correctly', () => {
        const now = new Date('2024-01-01T12:00:00Z').getTime();
        vi.setSystemTime(now);

        // Order created exactly now = 0:00
        render(<OrderTimer createdAt={new Date(now).toISOString()} />);

        expect(screen.getByText('0:00')).toBeTruthy();
    });

    it('updates time after 1 second', () => {
        const now = new Date('2024-01-01T12:00:00Z').getTime();
        vi.setSystemTime(now);

        render(<OrderTimer createdAt={new Date(now).toISOString()} />);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('0:01')).toBeTruthy();
    });

    it('formats minutes correctly', () => {
        const now = new Date('2024-01-01T12:00:00Z').getTime();
        vi.setSystemTime(now);

        // Created 65 seconds ago = 1:05
        const past = now - 65000;

        render(<OrderTimer createdAt={new Date(past).toISOString()} />);
        // Force update if needed by advancing a tick, but initial render should calculate diff

        expect(screen.getByText('1:05')).toBeTruthy();
    });

    it('formats hours correctly', () => {
        const now = new Date('2024-01-01T12:00:00Z').getTime();
        vi.setSystemTime(now);

        // Created 3665 seconds ago = 1h 1m 5s
        const past = now - 3665000;

        render(<OrderTimer createdAt={new Date(past).toISOString()} />);

        expect(screen.getByText('1:01:05')).toBeTruthy();
    });
});
