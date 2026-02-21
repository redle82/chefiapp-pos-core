/**
 * P5-5: Currency Hook
 * 
 * Hook para usar o serviço de moedas
 */

import { useState, useEffect } from 'react';
import { currencyService, type CurrencyCode } from './CurrencyService';
import { getTabIsolated, setTabIsolated } from '../storage/TabIsolatedStorage';

const CURRENCY_KEY = 'chefiapp_currency';

export function useCurrency() {
    const [currency, setCurrency] = useState<CurrencyCode>(() => {
        const saved = getTabIsolated(CURRENCY_KEY);
        if (saved && saved in currencyService.getCurrency('EUR')) {
            return saved as CurrencyCode;
        }
        return 'EUR';
    });

    useEffect(() => {
        currencyService.setDefaultCurrency(currency);
        setTabIsolated(CURRENCY_KEY, currency);
    }, [currency]);

    const formatAmount = (cents: number) => {
        return currencyService.formatAmount(cents, currency);
    };

    const convertAmount = (amountCents: number, toCurrency: CurrencyCode) => {
        return currencyService.convertAmount(amountCents, currency, toCurrency);
    };

    return {
        currency,
        setCurrency,
        formatAmount,
        convertAmount,
        getCurrency: (code: CurrencyCode) => currencyService.getCurrency(code),
        supportedCurrencies: Object.values(currencyService.getCurrency('EUR')),
    };
}
