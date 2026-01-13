/**
 * SplitBillModalWrapper - Wrapper para buscar pagamentos e calcular valor pago
 * 
 * SEMANA 2 - Tarefa 3.3
 * 
 * Busca pagamentos do pedido e calcula quanto já foi pago antes de mostrar o modal
 */

import React, { useState, useEffect } from 'react';
import { SplitBillModal } from './SplitBillModal';
import { PaymentEngine } from '../../../core/tpv/PaymentEngine';

interface SplitBillModalWrapperProps {
  orderId: string;
  restaurantId: string;
  orderTotal: number; // em centavos
  onPayPartial: (amountCents: number, method: 'cash' | 'card' | 'pix') => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const SplitBillModalWrapper: React.FC<SplitBillModalWrapperProps> = ({
  orderId,
  restaurantId,
  orderTotal,
  onPayPartial,
  onCancel,
  loading = false,
}) => {
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoadingPayments(true);
        const payments = await PaymentEngine.getPaymentsByOrder(orderId);
        const totalPaid = payments
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + p.amountCents, 0);
        setPaidAmount(totalPaid);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
        setPaidAmount(0);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [orderId]);

  if (loadingPayments) {
    return (
      <div
        style={{
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
        }}
      >
        <div style={{ color: 'white', textAlign: 'center' }}>
          Carregando informações de pagamento...
        </div>
      </div>
    );
  }

  return (
    <SplitBillModal
      orderId={orderId}
      restaurantId={restaurantId}
      orderTotal={orderTotal}
      paidAmount={paidAmount}
      onPayPartial={onPayPartial}
      onCancel={onCancel}
      loading={loading}
    />
  );
};
