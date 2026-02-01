/**
 * FinancialDashboardPage - Dashboard Financeiro
 *
 * Mostra fluxo de caixa, margens, custos e desperdício
 */

import React, { useState, useEffect } from 'react';
import { CashFlowSummary } from '../../components/Financial/CashFlowSummary';
import { TransactionsList } from '../../components/Financial/TransactionsList';
import { financialEngine, type CashFlowTransaction } from '../../core/financial/FinancialEngine';
import { useRestaurantId } from '../../core/hooks/useRestaurantId';
import { GlobalLoadingView } from '../../ui/design-system/components';

export function FinancialDashboardPage() {
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [cashBalance, setCashBalance] = useState<{ income: number; expenses: number; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!restaurantId) return;

      try {
        const [transactionsData, balanceData] = await Promise.all([
          financialEngine.listTransactions(restaurantId, { limit: 20 }),
          financialEngine.calculateCashBalance(restaurantId),
        ]);

        setTransactions(transactionsData);
        setCashBalance(balanceData);
      } catch (error) {
        console.error('Error loading financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!loadingRestaurantId && restaurantId) {
      loadData();
    }
  }, [restaurantId, loadingRestaurantId]);

  if (loading || loadingRestaurantId || !restaurantId) {
    return (
      <GlobalLoadingView
        message="Carregando dados financeiros..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
        Financeiro
      </h1>

      {/* Resumo de Caixa */}
      {cashBalance && <CashFlowSummary balance={cashBalance} />}

      {/* Transações */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Transações Recentes</h2>
        <TransactionsList transactions={transactions} />
      </div>
    </div>
  );
}
