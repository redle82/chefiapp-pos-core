/**
 * OrderHeader - Header Fixo da Conta Ativa
 * 
 * SEMANA 1 - Tarefa 1.2
 * 
 * Objetivo: Mostrar sempre visível quando há pedido ativo:
 * - Mesa (número ou ID)
 * - Hora de abertura
 * - Total parcial
 */

import React from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';
import type { Order } from '../context/OrderTypes';

interface OrderHeaderProps {
  order: Order | null;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ order }) => {
  // Se não há pedido ativo, não renderizar
  if (!order) {
    return null;
  }

  // INV-006: UI uses Domain's total, never calculates independently
  const itemsTotal = order.total;

  const totalFormatted = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(itemsTotal / 100);

  // Formatar hora de abertura
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Identificar mesa
  const mesaLabel = order.tableNumber
    ? `Mesa ${order.tableNumber}`
    : order.tableId
      ? `Mesa ${order.tableId.slice(0, 8)}...`
      : 'Sem Mesa';

  return (
    <Card
      surface="layer1"
      padding="md"
      style={{
        borderBottom: `2px solid ${colors.border.default}`,
        marginBottom: spacing[3],
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Mesa e Hora */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
          <Text size="lg" weight="bold" color="primary">
            {mesaLabel}
          </Text>
          <Text size="sm" color="secondary">
            Aberta às {formatTime(order.createdAt)}
          </Text>
        </div>

        {/* Total Parcial */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing[1] }}>
          <Text size="sm" color="tertiary" weight="medium">
            Total Parcial
          </Text>
          <Text size="xl" weight="bold" color="primary">
            {totalFormatted}
          </Text>
        </div>
      </div>
    </Card>
  );
};
