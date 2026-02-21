/**
 * P4-5: I18n Service
 * 
 * Serviço para internacionalização (multi-idioma)
 */

import { getTabIsolated, setTabIsolated } from '../storage/TabIsolatedStorage';

export type Language = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it';

export interface Translations {
    [key: string]: string | Translations;
}

const LANGUAGE_KEY = 'chefiapp_language';

// Translation dictionaries
const translations: Record<Language, Translations> = {
    pt: {
        common: {
            save: 'Salvar',
            cancel: 'Cancelar',
            delete: 'Excluir',
            edit: 'Editar',
            create: 'Criar',
            search: 'Buscar',
            loading: 'Carregando...',
            error: 'Erro',
            success: 'Sucesso',
        },
        tpv: {
            title: 'TPV',
            newOrder: 'Novo Pedido',
            closeOrder: 'Fechar Pedido',
            payment: 'Pagamento',
            total: 'Total',
        },
        menu: {
            title: 'Menu',
            addItem: 'Adicionar Item',
            editItem: 'Editar Item',
        },
    },
    en: {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            create: 'Create',
            search: 'Search',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
        },
        tpv: {
            title: 'POS',
            newOrder: 'New Order',
            closeOrder: 'Close Order',
            payment: 'Payment',
            total: 'Total',
        },
        menu: {
            title: 'Menu',
            addItem: 'Add Item',
            editItem: 'Edit Item',
        },
    },
    es: {
        common: {
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            create: 'Crear',
            search: 'Buscar',
            loading: 'Cargando...',
            error: 'Error',
            success: 'Éxito',
        },
        tpv: {
            title: 'TPV',
            newOrder: 'Nuevo Pedido',
            closeOrder: 'Cerrar Pedido',
            payment: 'Pago',
            total: 'Total',
        },
        menu: {
            title: 'Menú',
            addItem: 'Añadir Item',
            editItem: 'Editar Item',
        },
    },
    fr: {
        common: {
            save: 'Enregistrer',
            cancel: 'Annuler',
            delete: 'Supprimer',
            edit: 'Modifier',
            create: 'Créer',
            search: 'Rechercher',
            loading: 'Chargement...',
            error: 'Erreur',
            success: 'Succès',
        },
        tpv: {
            title: 'TPV',
            newOrder: 'Nouvelle Commande',
            closeOrder: 'Fermer Commande',
            payment: 'Paiement',
            total: 'Total',
        },
        menu: {
            title: 'Menu',
            addItem: 'Ajouter Article',
            editItem: 'Modifier Article',
        },
    },
    de: {
        common: {
            save: 'Speichern',
            cancel: 'Abbrechen',
            delete: 'Löschen',
            edit: 'Bearbeiten',
            create: 'Erstellen',
            search: 'Suchen',
            loading: 'Laden...',
            error: 'Fehler',
            success: 'Erfolg',
        },
        tpv: {
            title: 'Kasse',
            newOrder: 'Neue Bestellung',
            closeOrder: 'Bestellung Schließen',
            payment: 'Zahlung',
            total: 'Gesamt',
        },
        menu: {
            title: 'Menü',
            addItem: 'Artikel Hinzufügen',
            editItem: 'Artikel Bearbeiten',
        },
    },
    it: {
        common: {
            save: 'Salva',
            cancel: 'Annulla',
            delete: 'Elimina',
            edit: 'Modifica',
            create: 'Crea',
            search: 'Cerca',
            loading: 'Caricamento...',
            error: 'Errore',
            success: 'Successo',
        },
        tpv: {
            title: 'POS',
            newOrder: 'Nuovo Ordine',
            closeOrder: 'Chiudi Ordine',
            payment: 'Pagamento',
            total: 'Totale',
        },
        menu: {
            title: 'Menu',
            addItem: 'Aggiungi Articolo',
            editItem: 'Modifica Articolo',
        },
    },
};

class I18nService {
    private currentLanguage: Language = 'pt';

    constructor() {
        // Load saved language preference
        const saved = getTabIsolated(LANGUAGE_KEY);
        if (saved && this.isValidLanguage(saved)) {
            this.currentLanguage = saved as Language;
        } else {
            // Detect browser language
            const browserLang = navigator.language.split('-')[0];
            if (this.isValidLanguage(browserLang)) {
                this.currentLanguage = browserLang as Language;
            }
        }
    }

    /**
     * Check if language is valid
     */
    private isValidLanguage(lang: string): boolean {
        return ['pt', 'en', 'es', 'fr', 'de', 'it'].includes(lang);
    }

    /**
     * Get current language
     */
    getLanguage(): Language {
        return this.currentLanguage;
    }

    /**
     * Set language
     */
    setLanguage(language: Language): void {
        if (this.isValidLanguage(language)) {
            this.currentLanguage = language;
            setTabIsolated(LANGUAGE_KEY, language);
        }
    }

    /**
     * Translate key
     */
    t(key: string, params?: Record<string, string>): string {
        const keys = key.split('.');
        let value: any = translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to Portuguese if key not found
                value = translations.pt;
                for (const k2 of keys) {
                    if (value && typeof value === 'object' && k2 in value) {
                        value = value[k2];
                    } else {
                        return key; // Return key if not found
                    }
                }
                break;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        // Replace parameters
        if (params) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] || match;
            });
        }

        return value;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): Array<{ code: Language; name: string; nativeName: string }> {
        return [
            { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' },
            { code: 'it', name: 'Italian', nativeName: 'Italiano' },
        ];
    }
}

export const i18nService = new I18nService();
