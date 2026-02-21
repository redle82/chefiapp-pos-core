/**
 * P5-5: Currency Service
 * 
 * Serviço para gerenciar múltiplas moedas e conversões
 */

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'BRL' | 'MXN' | 'CAD' | 'AUD';

export interface Currency {
    code: CurrencyCode;
    symbol: string;
    name: string;
    locale: string;
}

export interface ExchangeRate {
    from: CurrencyCode;
    to: CurrencyCode;
    rate: number;
    timestamp: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, Currency> = {
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'pt-PT' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
    MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
    CAD: { code: 'CAD', symbol: '$', name: 'Canadian Dollar', locale: 'en-CA' },
    AUD: { code: 'AUD', symbol: '$', name: 'Australian Dollar', locale: 'en-AU' },
};

class CurrencyService {
    private exchangeRates: Map<string, ExchangeRate> = new Map();
    private defaultCurrency: CurrencyCode = 'EUR';

    /**
     * Get currency configuration
     */
    getCurrency(code: CurrencyCode): Currency {
        return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES[this.defaultCurrency];
    }

    /**
     * Format amount in currency
     */
    formatAmount(cents: number, currency: CurrencyCode = this.defaultCurrency): string {
        const currencyConfig = this.getCurrency(currency);
        const amount = cents / 100;
        return new Intl.NumberFormat(currencyConfig.locale, {
            style: 'currency',
            currency: currencyConfig.code,
        }).format(amount);
    }

    /**
     * Convert amount from one currency to another
     */
    convertAmount(amountCents: number, from: CurrencyCode, to: CurrencyCode): number {
        if (from === to) return amountCents;

        const rate = this.getExchangeRate(from, to);
        return Math.round(amountCents * rate);
    }

    /**
     * Get exchange rate (with caching)
     */
    getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
        if (from === to) return 1;

        const key = `${from}-${to}`;
        const cached = this.exchangeRates.get(key);
        
        // Use cached rate if less than 1 hour old
        if (cached && Date.now() - cached.timestamp < 3600000) {
            return cached.rate;
        }

        // Default rates (should be fetched from API in production)
        const defaultRates: Record<string, number> = {
            'EUR-USD': 1.10,
            'EUR-GBP': 0.85,
            'EUR-BRL': 5.50,
            'EUR-MXN': 20.00,
            'EUR-CAD': 1.50,
            'EUR-AUD': 1.65,
            'USD-EUR': 0.91,
            'USD-GBP': 0.77,
            'USD-BRL': 5.00,
            'GBP-EUR': 1.18,
            'GBP-USD': 1.30,
            'BRL-EUR': 0.18,
            'BRL-USD': 0.20,
            'MXN-EUR': 0.05,
            'MXN-USD': 0.055,
            'CAD-EUR': 0.67,
            'CAD-USD': 0.73,
            'AUD-EUR': 0.61,
            'AUD-USD': 0.67,
        };

        const rate = defaultRates[key] || 1;
        
        // Cache the rate
        this.exchangeRates.set(key, {
            from,
            to,
            rate,
            timestamp: Date.now(),
        });

        return rate;
    }

    /**
     * Fetch exchange rates from API (placeholder for future implementation)
     */
    async fetchExchangeRates(baseCurrency: CurrencyCode = 'EUR'): Promise<void> {
        // TODO: Implement API call to exchange rate service
        // For now, using default rates
        console.log(`[CurrencyService] Fetching rates for ${baseCurrency}`);
    }

    /**
     * Set default currency
     */
    setDefaultCurrency(currency: CurrencyCode): void {
        this.defaultCurrency = currency;
    }

    /**
     * Get default currency
     */
    getDefaultCurrency(): CurrencyCode {
        return this.defaultCurrency;
    }
}

export const currencyService = new CurrencyService();
