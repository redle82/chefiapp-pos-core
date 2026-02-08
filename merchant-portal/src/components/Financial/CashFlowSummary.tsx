/**
 * CashFlowSummary - Resumo de Fluxo de Caixa
 */

import React from 'react';

interface Props {
  balance: {
    income: number;
    expenses: number;
    balance: number;
  };
}

export function CashFlowSummary({ balance }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Receitas</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#28a745' }}>
          R$ {balance.income.toFixed(2)}
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Despesas</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#dc3545' }}>
          R$ {balance.expenses.toFixed(2)}
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Saldo</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: balance.balance >= 0 ? '#28a745' : '#dc3545' }}>
          R$ {balance.balance.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
