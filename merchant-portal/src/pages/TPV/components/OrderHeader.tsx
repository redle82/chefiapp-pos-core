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

import React, { useState } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { useOrders } from '../context/OrderContextReal';
import { useLoyalty } from '../../../core/loyalty/LoyaltyContext';
import { getCustomerTier, getSmartSuggestion } from '../../../core/loyalty/LoyaltyUtils';
import type { AICopilotSuggestion } from '../../../core/loyalty/LoyaltyUtils';
import { CustomerSearchModal } from './CustomerSearchModal';
import { CopilotWidget } from './CopilotWidget'; // Innovation
import { spacing } from '../../../ui/design-system/tokens/spacing';
import { colors } from '../../../ui/design-system/tokens/colors';

interface OrderHeaderProps {
  tableNumber?: number;
  orderId?: string;
  restaurantId?: string; // Passed from parent if available
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ tableNumber, orderId, restaurantId }) => {
  const { orders } = useOrders();
  const { activeCustomer, setActiveCustomer } = useLoyalty();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false); // Session state

  // Using a temporary fallback until LoyaltyContext is updated with total_spend_cents
  const tier = activeCustomer ? getCustomerTier(activeCustomer.total_spend_cents || 0) : null;
  const suggestion = activeCustomer && !dismissedSuggestion ? getSmartSuggestion(activeCustomer.total_spend_cents || 0) : null;


  // Find the active order based on orderId or tableNumber
  const order = orderId
    ? orders.find(o => o.id === orderId)
    : tableNumber
      ? orders.find(o => o.tableNumber === tableNumber)
      : null;

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
    <>
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
          {/* Título / Status */}
          <div>
            <Text weight="bold" size="lg" color="primary">
              {orderId ? (tableNumber ? `Mesa ${tableNumber}` : 'Pedido Balcão') : 'Novo Pedido'}
            </Text>
            {order && (
              <Text size="sm" color="secondary">
                #{order.id.slice(0, 8)} • {order.status}
              </Text>
            )}
            {/* Customer Pill */}
            <div
              onClick={() => setShowCustomerModal(true)}
              style={{
                marginTop: 4,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                backgroundColor: tier ? `${tier.color}20` : '#333',
                borderRadius: 12,
                cursor: 'pointer',
                border: tier ? `1px solid ${tier.color}` : '1px solid #444',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: 6, fontSize: '0.9em' }}>
                {activeCustomer ? (tier ? tier.icon : '👤') : '👤'}
              </span>
              <Text size="xs" color={tier ? 'primary' : 'secondary'} style={{ fontWeight: tier ? 'bold' : 'normal' }}>
                {activeCustomer ? (
                  <>
                    <span style={{ color: tier?.color }}>{activeCustomer.name}</span>
                    <span style={{ margin: '0 4px', opacity: 0.5 }}>|</span>
                    {activeCustomer.points_balance || 0} pts
                  </>
                ) : 'Identificar Cliente'}
              </Text>
            </div>
            {activeCustomer && (
              <span
                onClick={(e) => { e.stopPropagation(); setActiveCustomer(null); }}
                style={{ marginLeft: 4, cursor: 'pointer', opacity: 0.7 }}
              >
                ✕
              </span>
            )}
          </div>
        </div>

        {/* Total Parcial */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing[1], position: 'absolute', right: 16, top: 16 }}>
          <Text size="sm" color="tertiary" weight="medium">
            Total Parcial
          </Text>
          <Text size="xl" weight="bold" color="primary">
            {totalFormatted}
          </Text>
        </div>
      </Card >

      {/* AI Copilot Injection */}
      {suggestion && (
        <div style={{ marginBottom: spacing[3] }}>
          <CopilotWidget
            suggestion={suggestion}
            onDismiss={() => setDismissedSuggestion(true)}
            onAction={() => {
              // Future: Auto-scroll to category or open modal
              console.log('AI Logic Triggered:', suggestion.actionLabel);
            }}
          />
        </div>
      )}

      {showCustomerModal && (
        <CustomerSearchModal
          onClose={() => setShowCustomerModal(false)}
          onSelect={(customer) => {
            setActiveCustomer(customer);
            setShowCustomerModal(false);
            setDismissedSuggestion(false); // Reset suggestion for new customer
          }}
        />
      )}
    </>
  );
};
