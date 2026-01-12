/**
 * P4-5: Language Settings Component
 * 
 * Componente para configurar idioma
 */

import React from 'react';
import { useI18n } from '../../../core/i18n/useI18n';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';

export const LanguageSettings: React.FC = () => {
    const { language, setLanguage, availableLanguages } = useI18n();

    return (
        <Card surface="layer1" padding="lg">
            <Text size="lg" weight="bold" style={{ marginBottom: 16 }}>🌍 Idioma</Text>
            <Text size="sm" color="tertiary" style={{ marginBottom: 16 }}>
                Selecione o idioma da interface
            </Text>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {availableLanguages.map((lang) => (
                    <Button
                        key={lang.code}
                        variant={language === lang.code ? 'solid' : 'outline'}
                        tone={language === lang.code ? 'action' : 'neutral'}
                        onClick={() => setLanguage(lang.code)}
                        style={{ justifyContent: 'flex-start' }}
                    >
                        <span>{lang.nativeName}</span>
                    </Button>
                ))}
            </div>

            <Text size="xs" color="tertiary" style={{ marginTop: 16 }}>
                Idioma atual: {availableLanguages.find(l => l.code === language)?.nativeName}
            </Text>
        </Card>
    );
};
