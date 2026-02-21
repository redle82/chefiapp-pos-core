/**
 * P4-5: I18n Hook
 * 
 * Hook React para usar internacionalização
 */
// @ts-nocheck


import { useState, useEffect } from 'react';
import { i18nService, type Language } from './I18nService';

export function useI18n() {
    const [language, setLanguageState] = useState<Language>(i18nService.getLanguage());

    useEffect(() => {
        // Update state when language changes externally
        const currentLang = i18nService.getLanguage();
        if (currentLang !== language) {
            setLanguageState(currentLang);
        }
    }, [language]);

    const setLanguage = (lang: Language) => {
        i18nService.setLanguage(lang);
        setLanguageState(lang);
    };

    const t = (key: string, params?: Record<string, string>) => {
        return i18nService.t(key, params);
    };

    return {
        language,
        setLanguage,
        t,
        availableLanguages: i18nService.getAvailableLanguages(),
    };
}
