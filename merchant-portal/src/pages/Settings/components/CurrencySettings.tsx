/**
 * P5-5: Currency Settings Component
 * 
 * Componente para configurar moeda do restaurante
 */

import React from 'react';
import { useCurrency } from '../../../core/currency/useCurrency';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { SUPPORTED_CURRENCIES } from '../../../core/currency/CurrencyService';

export const CurrencySettings: React.FC = () => {
    const { currency, setCurrency, supportedCurrencies } = useCurrency();

    return (
        <Card surface="layer1" padding="lg">
            <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>💱 Moeda</Text>
            <Text size="sm" color="tertiary" style={{ marginBottom: 16 }}>
                Selecione a moeda padrão para este restaurante
            </Text>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                    <Button
                        key={curr.code}
                        variant={currency === curr.code ? 'solid' : 'outline'}
                        tone={currency === curr.code ? 'action' : 'neutral'}
                        onClick={() => setCurrency(curr.code)}
                        style={{ justifyContent: 'flex-start' }}
                    >
                        <span style={{ marginRight: 8 }}>{curr.symbol}</span>
                        <span>{curr.code}</span>
                    </Button>
                ))}
            </div>

            <Text size="xs" color="tertiary" style={{ marginTop: 16 }}>
                Moeda atual: {SUPPORTED_CURRENCIES[currency].symbol} {SUPPORTED_CURRENCIES[currency].name}
            </Text>
        </Card>
    );
};
