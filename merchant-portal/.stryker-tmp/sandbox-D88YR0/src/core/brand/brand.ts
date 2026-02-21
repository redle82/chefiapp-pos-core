export const APP_NAME = "ChefIApp";


export const BRAND_COLORS = {
    gold: "#FCD34D",
    navy: "#0F172A",
    green: "#22C55E", // Standard Success
    yerpiGreen: "#32d74b", // Brand Specific
    surface: "#1c1c1e"
};

/**
 * Generates 2-letter initials from a name.
 * Handles single names and multi-word names.
 */
export function getInitials(name?: string): string {
    if (!name) return "R";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Capitalizes names correctly for display (Title Case).
 */
export function formatRestaurantName(name?: string): string {
    if (!name) return "";
    return name.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}
