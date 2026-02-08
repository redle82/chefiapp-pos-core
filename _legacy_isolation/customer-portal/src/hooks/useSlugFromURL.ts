/**
 * useSlugFromURL - Hook para extrair e validar slug da URL
 * 
 * URL esperada: /slug ou /:slug
 * Exemplo: /sofia-gastrobar -> slug = 'sofia-gastrobar'
 */

import { useParams, useLocation } from 'react-router-dom';

interface SlugResult {
    slug: string | null;
    isValid: boolean;
    error: string | null;
}

// Regex para validar slug: letras minúsculas, números, hífens
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function useSlugFromURL(): SlugResult {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();

    // Se não veio do param, tentar extrair do path
    let extractedSlug = slug;
    
    if (!extractedSlug) {
        // Tentar extrair do pathname: /sofia-gastrobar -> sofia-gastrobar
        const pathParts = location.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            extractedSlug = pathParts[0];
        }
    }

    // Validar
    if (!extractedSlug) {
        return {
            slug: null,
            isValid: false,
            error: 'Nenhum restaurante especificado na URL',
        };
    }

    // Normalizar: lowercase, trim
    const normalizedSlug = extractedSlug.toLowerCase().trim();

    if (!SLUG_REGEX.test(normalizedSlug)) {
        return {
            slug: normalizedSlug,
            isValid: false,
            error: 'URL do restaurante inválida. Use apenas letras minúsculas, números e hífens.',
        };
    }

    return {
        slug: normalizedSlug,
        isValid: true,
        error: null,
    };
}
