import React from 'react';
import { Card } from '../primitives/Card';
import { Text } from '../primitives/Text';
import { Button } from '../primitives/Button';

interface CommandPanelProps {
    onCreateOrder: () => void;
    onOpenTables: () => void;
    dailyTotal?: string;
    cashRegisterOpen?: boolean;
    onOpenCashRegister?: () => void;
    onCloseCashRegister?: () => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
    onCreateOrder,
    onOpenTables,
    dailyTotal = '€ 0,00',
    cashRegisterOpen = false,
    onOpenCashRegister,
    onCloseCashRegister
}) => {
    return (
        <>
            {/* 1. STATUS CARD */}
            <Card surface="layer2" padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text size="lg" weight="bold" color="secondary">Status do Caixa</Text>
                    {cashRegisterOpen ? (
                        <Text size="xs" weight="black" color="success">ABERTO</Text>
                    ) : (
                        <Text size="xs" weight="black" color="destructive">FECHADO</Text>
                    )}
                </div>
                {cashRegisterOpen ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Text size="xs" weight="bold" color="tertiary">VENDAS HOJE</Text>
                        <Text size="4xl" weight="black" color="primary">{dailyTotal}</Text>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Text size="sm" color="secondary">Abra o caixa para começar a vender</Text>
                        {onOpenCashRegister && (
                            <Button 
                                tone="action" 
                                size="lg" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('[CommandPanel] ABRIR CAIXA clicked');
                                    onOpenCashRegister();
                                }}
                            >
                                ABRIR CAIXA
                            </Button>
                        )}
                    </div>
                )}
            </Card>

            {/* 2. PRIMARY ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Button 
                    tone="action" 
                    size="xl" 
                    onClick={onCreateOrder}
                    disabled={!cashRegisterOpen}
                >
                    + NOVA VENDA
                </Button>
                <Button 
                    tone="info" 
                    size="lg" 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[CommandPanel] MAPA DE MESAS clicked');
                        onOpenTables();
                    }}
                >
                    MAPA DE MESAS
                </Button>
            </div>

            {/* 3. SECONDARY */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cashRegisterOpen && onCloseCashRegister && (
                    <Button 
                        tone="destructive" 
                        variant="outline" 
                        size="lg"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[CommandPanel] FECHAR CAIXA clicked');
                            onCloseCashRegister();
                        }}
                    >
                        FECHAR CAIXA
                    </Button>
                )}
                <Button tone="destructive" variant="outline" size="default">
                    SAÍDA / PAUSA
                </Button>
            </div>
        </>
    );
};
