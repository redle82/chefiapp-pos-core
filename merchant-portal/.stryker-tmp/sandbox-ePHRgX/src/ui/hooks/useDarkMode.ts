/**
 * P3-5: Dark Mode Hook
 * 
 * Sistema de tema escuro para turnos noturnos
 */
// @ts-nocheck


import { useState, useEffect } from 'react';
import { getTabIsolated, setTabIsolated } from '../../core/storage/TabIsolatedStorage';

const DARK_MODE_KEY = 'chefiapp_dark_mode';

export function useDarkMode() {
    const [isDark, setIsDark] = useState<boolean>(() => {
        // Check localStorage first
        const saved = getTabIsolated(DARK_MODE_KEY);
        if (saved !== null) {
            return saved === 'true';
        }
        
        // Check system preference
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        return false;
    });

    useEffect(() => {
        // Apply dark mode class to document
        if (isDark) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        
        // Save preference
        setTabIsolated(DARK_MODE_KEY, isDark ? 'true' : 'false');
    }, [isDark]);

    const toggle = () => setIsDark(prev => !prev);
    const enable = () => setIsDark(true);
    const disable = () => setIsDark(false);

    return {
        isDark,
        toggle,
        enable,
        disable,
    };
}
