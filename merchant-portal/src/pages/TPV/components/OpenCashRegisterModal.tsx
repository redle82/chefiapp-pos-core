/**
 * OpenCashRegisterModal - Modal de Abertura de Caixa
 * 
 * Permite abrir caixa com saldo inicial.
 */

import React, { useState } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

interface OpenCashRegisterModalProps {
    onOpen: (openingBalanceCents: number) => Promise<void>;
    onCancel: () => void;
}

export const OpenCashRegisterModal: React.FC<OpenCashRegisterModalProps> = ({ onOpen, onCancel }) => {
    const [openingBalance, setOpeningBalance] = useState<string>('0.00');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = async () => {
        setError(null);

        // Validar valor
        const balance = parseFloat(openingBalance.replace(',', '.'));
        if (isNaN(balance) || balance < 0) {
            setError('Valor inválido');
            return;
        }

        setProcessing(true);
        try {
            const balanceCents = Math.round(balance * 100);
            await onOpen(balanceCents);
        } catch (err: any) {
            console.error('[OpenCashRegisterModal] Error opening register:', err);
            setError(err.message || 'Erro ao abrir caixa');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <Card surface="layer1" padding="xl" style={{ maxWidth: 400, width: '90%' }}>
                <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
                    Abrir Caixa
                </Text>

                <div style={{ marginBottom: spacing[6] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                        Saldo inicial em caixa
                    </Text>
                    <input
                        type="text"
                        value={openingBalance}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9,.]/g, '');
                            setOpeningBalance(value);
                        }}
                        placeholder="0.00"
                        style={{
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            padding: spacing[3],
                            backgroundColor: colors.surface.base,
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: 8,
                            color: colors.text.primary,
                            outline: 'none',
                            width: '100%'
                        }}
                        autoFocus
                    />
                    <Text size="xs" color="secondary" style={{ marginTop: spacing[1] }}>
                        Digite o valor em dinheiro que está no caixa agora
                    </Text>
                </div>

                {error && (
                    <div style={{
                        padding: spacing[3],
                        backgroundColor: `${colors.destructive.base}15`,
                        borderRadius: 8,
                        marginBottom: spacing[4]
                    }}>
                        <Text size="sm" color="destructive">{error}</Text>
                    </div>
                )}

                <div style={{ display: 'flex', gap: spacing[3] }}>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onCancel}
                        disabled={processing}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        tone="action"
                        size="lg"
                        onClick={handleOpen}
                        disabled={processing}
                        style={{ flex: 1 }}
                    >
                        {processing ? 'Abrindo...' : 'Abrir Caixa'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

