/**
 * Local Boss - Review Text Sanitization
 * 
 * Removes staff names from review text to protect privacy.
 * Uses simple NER heuristics (v1) + staff directory lookup.
 */

export interface SanitizeOptions {
    staffNames: string[]; // List of staff names/nicknames to redact
    languages?: string[]; // ['pt', 'es', 'en'] - for common name patterns
}

export interface SanitizeResult {
    textSafe: string; // Sanitized text (public)
    detectedNames: string[]; // Names that were detected and redacted
}

/**
 * Common name patterns in Portuguese, Spanish, and English
 * (Simple heuristic - can be enhanced with proper NER later)
 */
const COMMON_NAME_PATTERNS = {
    pt: ['joão', 'maria', 'carlos', 'ana', 'pedro', 'luis', 'paula', 'ricardo', 'sandra', 'miguel'],
    es: ['juan', 'maria', 'carlos', 'ana', 'pedro', 'luis', 'paula', 'ricardo', 'sandra', 'miguel'],
    en: ['john', 'mary', 'carlos', 'anna', 'peter', 'luis', 'paula', 'richard', 'sandra', 'michael']
};

/**
 * Sanitize review text by removing staff names
 */
export function sanitizeReviewText(
    textRaw: string,
    options: SanitizeOptions
): SanitizeResult {
    let textSafe = textRaw;
    const detectedNames: string[] = [];

    // Normalize staff names (lowercase, trim, remove accents for matching)
    const normalizedStaffNames = options.staffNames.map(name => 
        normalizeName(name)
    );

    // 1. Direct staff name matches (case-insensitive, word boundaries)
    for (const staffName of options.staffNames) {
        const normalized = normalizeName(staffName);
        // Match whole words only (not substrings)
        const regex = new RegExp(`\\b${escapeRegex(staffName)}\\b`, 'gi');
        if (regex.test(textSafe)) {
            detectedNames.push(staffName);
            textSafe = textSafe.replace(regex, '[EQUIPE]');
        }
    }

    // 2. Pattern-based detection (garçom João, waiter Maria, o João me atendeu)
    const patterns = [
        /(?:garçom|waiter|mesero|camarero)\s+([A-Z][a-z]+)/gi,
        /(?:o|a|el|la)\s+([A-Z][a-z]+)\s+(?:me|nos)\s+(?:atendeu|atendió|served)/gi,
        /(?:o|a|el|la)\s+([A-Z][a-z]+)\s+(?:foi|era|was)\s+(?:muito|very|muy)/gi,
    ];

    for (const pattern of patterns) {
        textSafe = textSafe.replace(pattern, (match, name) => {
            const normalized = normalizeName(name);
            // Check if it's a staff name or common name
            if (normalizedStaffNames.includes(normalized) || 
                isCommonName(normalized, options.languages || ['pt'])) {
                if (!detectedNames.includes(name)) {
                    detectedNames.push(name);
                }
                return match.replace(name, '[EQUIPE]');
            }
            return match;
        });
    }

    // 3. Capitalized words that might be names (simple heuristic)
    // Only if they appear in context that suggests they're staff
    const capitalizedWords = textSafe.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    for (const word of capitalizedWords) {
        const normalized = normalizeName(word);
        if (normalizedStaffNames.includes(normalized)) {
            const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');
            textSafe = textSafe.replace(regex, '[EQUIPE]');
            if (!detectedNames.includes(word)) {
                detectedNames.push(word);
            }
        }
    }

    return {
        textSafe: textSafe.trim(),
        detectedNames: [...new Set(detectedNames)] // Remove duplicates
    };
}

/**
 * Normalize name for comparison (lowercase, remove accents, trim)
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove accents
}

/**
 * Check if a name is a common name (to reduce false positives)
 */
function isCommonName(name: string, languages: string[]): boolean {
    const normalized = normalizeName(name);
    for (const lang of languages) {
        const commonNames = COMMON_NAME_PATTERNS[lang as keyof typeof COMMON_NAME_PATTERNS] || [];
        if (commonNames.includes(normalized)) {
            return true;
        }
    }
    return false;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

