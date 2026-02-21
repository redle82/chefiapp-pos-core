import React, { useEffect } from 'react';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';

export const ThemeEngine = () => {
    const data = useRestaurantIdentity();
    const brandColor = data?.identity?.brandColor || '#F59E0B'; // Default Amber-500

    useEffect(() => {
        // Inject CSS Variable for Brand Color
        document.documentElement.style.setProperty('--color-brand-primary', brandColor);

        // Optional: Derived variants (Darker/Lighter) if needed in future
        // const darker = darken(brandColor, 0.2);
        // document.documentElement.style.setProperty('--color-brand-primary-dark', darker);

    }, [brandColor]);

    return null; // Headless component
};
