/**
 * TransactionsList - Lista de Transações
 */

import React from 'react';
import type { CashFlowTransaction } from '../../core/financial/FinancialEngine';

interface Props {
  transactions: CashFlowTransaction[];
}

export function TransactionsList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
        <p>Nenhuma transação registrada</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              {transaction.description || transaction.category}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {transaction.transactionDate.toLocaleDateString()} • {transaction.category}
            </div>
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: transaction.transactionType === 'income' ? '#28a745' : '#dc3545',
            }}
          >
            {transaction.transactionType === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
