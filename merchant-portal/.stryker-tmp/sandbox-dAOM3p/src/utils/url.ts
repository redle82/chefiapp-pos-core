/**
 * Utility to generate absolute URLs for the application, handling the /app base path.
 * 
 * Usage:
 * appUrl('/onboarding') -> 'https://site.com/app/onboarding'
 * appUrl('/dashboard') -> 'https://site.com/app/dashboard'
 */
// @ts-nocheck

export const appUrl = (path: string) => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Check if we are incorrectly double-stacking /app
    if (normalizedPath.startsWith('/app/')) {
        console.warn('[appUrl] Path already contains /app, trimming it to avoid duplication:', path);
        const fixed = normalizedPath.replace('/app', '');
        return `${window.location.origin}/app${fixed}`;
    }

    return `${window.location.origin}/app${normalizedPath}`;
};
