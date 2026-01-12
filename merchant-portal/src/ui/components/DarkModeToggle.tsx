/**
 * P3-5: Dark Mode Toggle Component
 * 
 * Componente para alternar entre modo claro e escuro
 */

import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Button } from '../design-system/primitives/Button';

export const DarkModeToggle: React.FC = () => {
    const { isDark, toggle } = useDarkMode();

    return (
        <Button
            variant="outline"
            tone="neutral"
            size="sm"
            onClick={toggle}
            style={{ minWidth: 100 }}
        >
            {isDark ? '☀️ Claro' : '🌙 Escuro'}
        </Button>
    );
};
