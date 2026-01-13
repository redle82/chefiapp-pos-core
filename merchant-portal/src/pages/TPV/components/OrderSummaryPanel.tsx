/**
 * OrderSummaryPanel - Resumo Lateral da Conta
 * 
 * SEMANA 1 - Tarefa 2.3
 * 
 * Objetivo: Mostrar sempre visível quando há pedido ativo:
 * - Lista de itens (nome + qty + subtotal)
 * - Total parcial
 * - Ações: "Dividir conta" e "Fechar e pagar"
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import type { Order } from '../context/OrderTypes';
import { PaymentEngine } from '../../../core/tpv/PaymentEngine';

interface OrderSummaryPanelProps {
  order: Order | null;
  onSplitBill: () => void;
  onPay: () => void;
  loading?: boolean;
}

export const OrderSummaryPanel: React.FC<OrderSummaryPanelProps> = ({
  order,
  onSplitBill,
  onPay,
  loading = false,
}) => {
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // Buscar pagamentos quando o pedido mudar ou quando status for partially_paid
  useEffect(() => {
    if (!order || order.status !== 'partially_paid') {
      setPaidAmount(0);
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoadingPayments(true);
        const payments = await PaymentEngine.getPaymentsByOrder(order.id);
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
  }, [order?.id, order?.status]);

  // Se não há pedido ativo, não renderizar
  if (!order) {
    return null;
  }

  // Calcular totais
  const itemsTotal = order.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const remainingAmount = itemsTotal - paidAmount;
  const isPartiallyPaid = order.status === 'partially_paid' || paidAmount > 0;

  const totalFormatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(itemsTotal / 100);

  const paidFormatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(paidAmount / 100);

  const remainingFormatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(remainingAmount / 100);

  // Formatar subtotal de item
  const formatItemSubtotal = (price: number, quantity: number): string => {
    const subtotal = (price * quantity) / 100;
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(subtotal);
  };

  // Formatar preço unitário
  const formatUnitPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(price / 100);
  };

  return (
    <Card
      surface="layer2"
      padding="lg"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: spacing[4] }}>
        <Text size="lg" weight="bold" color="primary">
          Conta {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Sem Mesa'}
        </Text>
        {order.tableId && (
          <Text size="sm" color="secondary" style={{ marginTop: spacing[1] }}>
            ID: {order.tableId.slice(0, 8)}...
          </Text>
        )}
      </div>

      {/* Lista de Itens */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: spacing[4],
          borderTop: `1px solid ${colors.border.subtle}`,
          borderBottom: `1px solid ${colors.border.subtle}`,
          paddingTop: spacing[3],
          paddingBottom: spacing[3],
        }}
      >
        {order.items.length === 0 ? (
          <Text size="sm" color="secondary" align="center" style={{ padding: spacing[4] }}>
            Nenhum item adicionado
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: spacing[2],
                  backgroundColor: colors.surface.layer1,
                  borderRadius: '4px',
                }}
              >
                {/* Nome e Quantidade */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: spacing[1],
                  }}
                >
                  <Text size="base" weight="medium" color="primary" style={{ flex: 1 }}>
                    {item.name}
                  </Text>
                  <Text size="sm" color="secondary" style={{ marginLeft: spacing[2] }}>
                    x{item.quantity}
                  </Text>
                </div>

                {/* Preço Unitário e Subtotal */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text size="sm" color="tertiary">
                    {formatUnitPrice(item.price)} un.
                  </Text>
                  <Text size="base" weight="semibold" color="primary">
                    {formatItemSubtotal(item.price, item.quantity)}
                  </Text>
                </div>

                {/* Observações (se houver) */}
                {item.notes && (
                  <Text
                    size="xs"
                    color="tertiary"
                    style={{
                      marginTop: spacing[1],
                      fontStyle: 'italic',
                    }}
                  >
                    {item.notes}
                  </Text>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total e Status de Pagamento */}
      <div
        style={{
          paddingTop: spacing[4],
          borderTop: `2px solid ${colors.border.default}`,
          marginBottom: spacing[4],
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[2],
          }}
        >
          <Text size="lg" weight="bold" color="primary">
            Total:
          </Text>
          <Text size="xl" weight="bold" color="primary">
            {totalFormatted}
          </Text>
        </div>

        {/* Status de Pagamento Parcial (se aplicável) */}
        {isPartiallyPaid && !loadingPayments && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[1],
                paddingTop: spacing[2],
                borderTop: `1px solid ${colors.border.subtle}`,
              }}
            >
              <Text size="sm" color="tertiary">
                Já Pago:
              </Text>
              <Text size="base" weight="semibold" color="success">
                {paidFormatted}
              </Text>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[2],
              }}
            >
              <Text size="base" weight="bold" color="primary">
                Saldo Restante:
              </Text>
              <Text size="lg" weight="bold" color={remainingAmount > 0 ? 'warning' : 'success'}>
                {remainingFormatted}
              </Text>
            </div>
            {order.status === 'partially_paid' && (
              <div
                style={{
                  padding: spacing[2],
                  backgroundColor: colors.info.base + '20',
                  borderRadius: 4,
                  marginTop: spacing[2],
                }}
              >
                <Text size="xs" color="info" weight="medium">
                  ⚠️ Conta parcialmente paga. Continue dividindo ou finalize o pagamento.
                </Text>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ações */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        <Button
          tone="info"
          variant="outline"
          size="lg"
          fullWidth
          onClick={onSplitBill}
          disabled={loading || order.items.length === 0 || itemsTotal === 0}
        >
          Dividir Conta
        </Button>

        <Button
          tone="action"
          variant="solid"
          size="xl"
          fullWidth
          onClick={onPay}
          disabled={loading || order.items.length === 0 || itemsTotal === 0 || order.status === 'paid'}
          isLoading={loading}
        >
          {isPartiallyPaid && remainingAmount > 0
            ? `Pagar Restante (${remainingFormatted})`
            : order.status === 'paid'
            ? 'Conta Fechada'
            : 'Fechar e Pagar'}
        </Button>
      </div>
    </Card>
  );
};
