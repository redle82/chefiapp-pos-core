/**
 * Cash Register Alert - Alerta quando caixa não está aberto
 * 
 * Mostra banner vermelho se caixa não estiver aberto e bloqueia acesso ao TPV
 */

import React from 'react';

interface CashRegisterAlertProps {
    isOpen: boolean;
    onOpenCash: () => void;
}

export const CashRegisterAlert: React.FC<CashRegisterAlertProps> = ({ isOpen, onOpenCash }) => {
    // Não mostrar nada se caixa está aberto
    if (isOpen) {
        return null;
    }

    return (
        <div
            style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '14px',
                fontWeight: 500,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span>⚠️</span>
                <span>
                    <strong>Caixa não está aberto</strong> - Abra o caixa antes de criar vendas.
                </span>
            </div>
            <button
                onClick={onOpenCash}
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
            >
                Abrir Caixa
            </button>
        </div>
    );
};
