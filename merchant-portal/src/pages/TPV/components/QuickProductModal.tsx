import React, { useState } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { colors } from '../../../ui/design-system/tokens/colors';

interface QuickProductModalProps {
    onClose: () => void;
    onCreate: (name: string, price: number) => Promise<void>;
}

export const QuickProductModal: React.FC<QuickProductModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [priceStr, setPriceStr] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        // Parse "12,50" or "12.50"
        const cleanPrice = priceStr.replace(',', '.');
        const price = parseFloat(cleanPrice);

        if (isNaN(price) || price < 0) {
            // Basic validation (UI prevents invalid input mostly)
            return;
        }

        setCreating(true);
        try {
            await onCreate(name.trim(), price);
            onClose();
        } catch (err) {
            console.error('Failed to create quick product:', err);
        } finally {
            setCreating(false);
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
            zIndex: 1000,
        }}>
            <Card surface="layer1" padding="xl" style={{ maxWidth: 450, width: '90%' }}>
                <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
                    Novo Produto Rápido
                </Text>

                <div style={{ marginBottom: spacing[4] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                        Nome do Produto
                    </Text>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Prato do Dia, Bebida Especial..."
                        autoFocus
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: 6,
                            padding: spacing[3],
                            color: 'white',
                            fontSize: '18px',
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ marginBottom: spacing[6] }}>
                    <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                        Preço (€)
                    </Text>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={priceStr}
                        onChange={(e) => setPriceStr(e.target.value)}
                        placeholder="0.00"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: 6,
                            padding: spacing[3],
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: spacing[3] }}>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onClose}
                        disabled={creating}
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        tone="action"
                        size="lg"
                        onClick={handleCreate}
                        disabled={creating || !name.trim() || !priceStr}
                        style={{ flex: 1 }}
                    >
                        {creating ? 'Criando...' : 'Adicionar ao Pedido'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
