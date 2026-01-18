import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/Card';
import { Button } from '../../../ui/design-system/Button';
import { Text } from '../../../ui/design-system/primitives/Text';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { checkHardwareCapabilities } from '../../../core/hardware/HardwareCapabilities';

export const TPVInstallPrompt: React.FC = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [hwWarnings, setHwWarnings] = useState<string[]>([]);

    useEffect(() => {
        // Detect standalone mode
        const checkStandalone = () => {
            const isStandAlone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
            setIsStandalone(isStandAlone);
        };

        checkStandalone();
        window.addEventListener('resize', checkStandalone);

        // Check hardware
        const caps = checkHardwareCapabilities();
        const missing = caps.filter(c => !c.available).map(c => c.name);
        if (missing.length > 0) {
            // Only warn about USB/Serial as they are critical for TPV
            if (missing.includes('USB') || missing.includes('Serial')) {
                setHwWarnings(prev => [...prev, 'Navegador incompatível com Hardware (Use Chrome/Edge)']);
            }
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('resize', checkStandalone);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;

        installPrompt.prompt();

        const { outcome } = await installPrompt.userChoice;
        console.log(`[PWA] Install outcome: ${outcome}`);

        if (outcome === 'accepted') {
            setIsStandalone(true);
        }

        setInstallPrompt(null);
    };

    if (isStandalone || isHidden) return null;

    // Only show if we have the prompt OR if we want to show instructions (optional)
    // For now, only show if we captured the event (Chrome/Edge)
    if (!installPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: spacing[4],
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: '90%',
            maxWidth: '400px'
        }}>
            <Card surface="layer3" elevation="high">
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="h4">Instalar TPV</Text>
                        <button
                            onClick={() => setIsHidden(true)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>

                    <Text variant="body1" color="secondary">
                        Para melhor experiência e desempenho, instale o App do Caixa neste dispositivo.
                    </Text>

                    <Button
                        variant="primary"
                        fullWidth
                        onClick={handleInstallClick}
                    >
                        Instalar Agora
                    </Button>
                </div>
            </Card>
        </div>
    );
};
