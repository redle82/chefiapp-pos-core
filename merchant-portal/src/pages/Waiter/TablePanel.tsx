/**
 * TablePanel — Painel da Mesa (modo Adicionar Pedido)
 * Princípio: Topo fixo, grupos expandem, produtos aparecem, zero navegação profunda.
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Table } from './types';
import { TableStatus } from './types';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { BottomNavBar } from './components/BottomNavBar';
import type { Category } from './components/CategoryStrip';
import { CategoryStrip } from './components/CategoryStrip';
import type { Product, ProductComment } from './components/ProductCard';
import { ProductCard } from './components/ProductCard';
import { MiniMap } from './components/MiniMap';
import { AlertSystem } from './components/AlertSystem';
import { useWaiterCalls } from './hooks/useWaiterCalls';
import type { WaiterCall } from './types';
import { AlertPriority } from './types';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';

import { useTables } from '../TPV/context/TableContext';
import { useOrders } from '../TPV/context/OrderContextReal';
import { useMenuItems } from '../../hooks/useMenuItems';
import type { MenuItem } from '../../hooks/useMenuItems';
import { useTenant } from '../../core/tenant/TenantContext';

interface TablePanelProps {
  tableId?: string;
  onBack?: () => void;
}

export function TablePanel({ tableId: propTableId, onBack }: TablePanelProps) {
  const navigate = useNavigate();
  const params = useParams<{ tableId: string }>();
  // Resolve tableId from Prop or URL
  const tableId = propTableId || params.tableId;

  const { tenantId } = useTenant(); // Needed for hooks

  // Real Hooks
  const { tables, loading: tablesLoading } = useTables();
  const { items: menuItems, loading: menuLoading } = useMenuItems(tenantId);
  const { orders, createOrder, addItemToOrder } = useOrders(); // Inject Order Context

  // Resolve Table
  const table = useMemo(() => tables.find(t => t.id === tableId), [tables, tableId]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [sending, setSending] = useState(false); // Loading state

  // Mock: Alertas (Keep Mock for now as Phase 6 focuses on Tables/Menu first)
  const mockAlerts: WaiterCall[] = [];


  const { calls: deduplicatedAlerts } = useWaiterCalls([]); // Changed from mockAlerts to empty array

  const handleAcknowledgeAlert = (alertId: string) => {
    console.log('Alert acknowledged:', alertId);
  };

  const handleSnoozeAlert = (alertId: string, minutes: number) => {
    console.log('Alert snoozed:', alertId, minutes);
  };

  // Extract Categories from Items
  const categories = useMemo(() => {
    // Filter out duplicate categories
    const uniqueCats = Array.from(new Set(menuItems.map(i => i.category)));
    return uniqueCats.map(c => ({
      id: c,
      name: c,
      icon: '🍽️' // Default icon for now
    }));
  }, [menuItems]);

  // Produtos da categoria selecionada
  const visibleProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return menuItems.filter(i => i.category === selectedCategory).map(i => ({
      id: i.id,
      name: i.name,
      price: i.priceCents, // ProductCard expects price in cents (number)
      description: i.description,
      currency: 'EUR',
      imageUrl: i.photoUrl,
      trackStock: i.trackStock,
      stockQuantity: i.stockQuantity
    }));
  }, [selectedCategory, menuItems]);

  // Comentários da categoria selecionada (Mock for now)
  const visibleComments: ProductComment[] = [];

  if (!table) {
    if (tablesLoading) {
      return (
        <div style={{ padding: spacing[6], color: 'white' }}>Carregando mesa...</div>
      );
    }
    return (
      <div style={{ padding: spacing[6] }}>
        <Text size="lg" color="destructive">Mesa não encontrada</Text>
        <Button onClick={() => navigate('/app/waiter')} style={{ marginTop: spacing[4] }}>
          Voltar ao Mapa
        </Button>
      </div>
    );
  }

  const seatedMinutes = table.status === 'occupied' // Check lowercase if from DB? Type is 'free'|'occupied'
    ? 0 // TODO: DB doesn't store seatedAt? Table struct here has seats. Check TableContext.
    : null; // TableContext Table interface: status: 'free' | 'occupied' | 'reserved'.

  // Helper handling
  const handleAddItem = (productId: string, quantity: number, commentIds: string[]) => {
    const product = visibleProducts.find(p => p.id === productId);
    if (!product) return;

    const comments = visibleComments
      .filter(c => commentIds.includes(c.id))
      .map(c => c.label);

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      productId,
      productName: product.name,
      quantity,
      comments,
      price: product.price,
    };

    setOrderItems(prev => [...prev, newItem]);

    // Feedback: vibração simulada (visual)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleSendOrder = async () => {
    if (!table || orderItems.length === 0) return;
    setSending(true);

    try {
      // 1. Check for Active Order on Table
      const activeOrder = orders.find(o => o.tableId === table.id && o.status !== 'paid' && o.status !== 'cancelled');

      if (activeOrder) {
        // Case A: Add to Existing Order
        // Parallelize requests for speed
        await Promise.all(orderItems.map(item =>
          addItemToOrder(activeOrder.id, {
            productId: item.productId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            notes: item.comments.join(', ')
          })
        ));
      } else {
        // Case B: Create New Order
        await createOrder({
          tableId: table.id,
          tableNumber: table.number,
          items: orderItems.map(item => ({
            productId: item.productId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            notes: item.comments.join(', ')
          }))
        });
      }

      // Success
      setOrderItems([]);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      // Simple Alert for Feedback (TODO: Replace with Toast)
      alert('Pedido enviado com sucesso!');
    } catch (error) {
      console.error('Failed to send order:', error);
      alert('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleTableClickFromMap = (t: Table) => {
    if (t.id !== tableId) {
      navigate(`/app/waiter/table/${t.id}`);
    }
  };

  return (
    <div style={{
      paddingBottom: 100, // Espaço para barra inferior
      minHeight: '100vh',
      background: '#000',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      {/* Sistema de Alertas */}
      <AlertSystem
        alerts={deduplicatedAlerts}
        onAcknowledge={handleAcknowledgeAlert}
        onSnooze={handleSnoozeAlert}
      />

      {/* Mini-Mapa Fixo no Topo */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: colors.surface.base,
      }}>
        <MiniMap
          tables={tables}
          currentTableId={tableId}
          onTableClick={handleTableClickFromMap}
          area="Área 1"
        />
      </div>

      {/* Topo Fixo */}
      <div style={{
        position: 'sticky',
        top: 120, // Abaixo do mini-mapa
        background: colors.surface.base,
        borderBottom: `1px solid ${colors.border.subtle}`,
        zIndex: 100,
        padding: spacing[4],
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[2]
        }}>
          <button
            onClick={() => navigate('/app/waiter')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: colors.text.primary,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <Text size="xl" weight="bold" color="primary">
              Mesa {table.number}
            </Text>
            <Text size="sm" color="secondary">
              {table.status === TableStatus.OCCUPIED && seatedMinutes !== null
                ? `Ocupada · ${seatedMinutes} min`
                : 'Livre'}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <button
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 20,
                color: colors.text.secondary,
              }}
            >
              📋
            </button>
            <button
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 20,
                color: colors.text.secondary,
              }}
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Resumo do Pedido */}
        {orderItems.length > 0 && (
          <div style={{
            padding: spacing[3],
            background: colors.surface.layer1,
            borderRadius: 8,
            marginTop: spacing[2],
            border: `1px solid ${colors.action.base}`
          }}>
            <Text size="sm" weight="bold" color="primary" style={{ marginBottom: spacing[2] }}>
              Novo Pedido ({orderItems.length} itens)
            </Text>
            {orderItems.map((item) => (
              <Text key={item.id} size="xs" color="secondary" style={{ marginBottom: spacing[1] }}>
                {item.quantity}x {item.productName}
                {item.comments.length > 0 && ` (${item.comments.join(', ')})`}
              </Text>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: spacing[3],
              borderTop: `1px solid ${colors.border.subtle}`,
              paddingTop: spacing[2]
            }}>
              <Text size="lg" weight="bold" color="primary">
                Total: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(totalAmount / 100)}
              </Text>

              <Button
                tone="action"
                onClick={handleSendOrder}
                disabled={sending}
              >
                {sending ? 'Enviando...' : 'Enviar Pedido 🚀'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Grupos/Categorias */}
      <CategoryStrip
        categories={DEMO_CATEGORIES}
        selectedId={selectedCategory || undefined}
        onSelect={(categoryId) => {
          setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
        }}
      />

      {/* Produtos da Categoria Selecionada */}
      {selectedCategory && (
        <div style={{ padding: spacing[4] }}>
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              comments={visibleComments}
              onAdd={(quantity, commentIds) => handleAddItem(product.id, quantity, commentIds)}
            />
          ))}
        </div>
      )}

      {/* Estado Vazio: Selecionar Categoria */}
      {!selectedCategory && (
        <div style={{
          padding: spacing[8],
          textAlign: 'center',
          color: colors.text.tertiary,
        }}>
          <Text size="lg" color="tertiary">
            👆 Selecione uma categoria acima
          </Text>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
