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

// Mock: todas as mesas (para o mini-mapa)
const ALL_DEMO_TABLES: Table[] = [
  { id: '1', number: 1, status: TableStatus.FREE },
  { id: '2', number: 2, status: TableStatus.CALLING, callCount: 3 },
  { id: '3', number: 3, status: TableStatus.BILL_REQUESTED },
  { id: '4', number: 4, status: TableStatus.FREE },
  { id: '5', number: 5, status: TableStatus.OCCUPIED, seatedAt: new Date(Date.now() - 1080000) },
  { id: '6', number: 6, status: TableStatus.FREE },
  { id: '7', number: 7, status: TableStatus.OCCUPIED, seatedAt: new Date(Date.now() - 720000) },
  { id: '8', number: 8, status: TableStatus.FREE },
  { id: '9', number: 9, status: TableStatus.FREE },
  { id: '10', number: 10, status: TableStatus.KITCHEN_READY },
  { id: '11', number: 11, status: TableStatus.FREE },
  { id: '12', number: 12, status: TableStatus.FREE },
];

// Mock: buscar mesa por ID
const DEMO_TABLES: Record<string, Table> = {
  '1': ALL_DEMO_TABLES[0],
  '2': ALL_DEMO_TABLES[1],
  '3': ALL_DEMO_TABLES[2],
  '5': ALL_DEMO_TABLES[4],
  '7': ALL_DEMO_TABLES[6],
  '10': ALL_DEMO_TABLES[9],
};

// Mock: Categorias
const DEMO_CATEGORIES: Category[] = [
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'massas', name: 'Massas', icon: '🍝' },
  { id: 'acompanhamentos', name: 'Acompanhamentos', icon: '🍟' },
  { id: 'saladas', name: 'Saladas', icon: '🥗' },
  { id: 'bebidas', name: 'Bebidas', icon: '🍺' },
  { id: 'cafe', name: 'Café', icon: '☕' },
  { id: 'sobremesas', name: 'Sobremesas', icon: '🍰' },
];

// Mock: Produtos por categoria
const DEMO_PRODUCTS: Record<string, Product[]> = {
  burgers: [
    { id: 'burger-1', name: 'Chef Burger', price: 1250, description: 'Carne, queijo, alface, tomate', currency: 'EUR' },
    { id: 'burger-2', name: 'Bacon Burger', price: 1450, description: 'Carne, bacon, queijo', currency: 'EUR' },
    { id: 'burger-3', name: 'Veggie Burger', price: 1100, description: 'Hambúrguer vegetal', currency: 'EUR' },
  ],
  massas: [
    { id: 'pasta-1', name: 'Spaghetti Carbonara', price: 1350, currency: 'EUR' },
    { id: 'pasta-2', name: 'Penne Arrabbiata', price: 1200, currency: 'EUR' },
  ],
  bebidas: [
    { id: 'drink-1', name: 'Água', price: 300, currency: 'EUR' },
    { id: 'drink-2', name: 'Refrigerante', price: 500, currency: 'EUR' },
    { id: 'drink-3', name: 'Cerveja', price: 600, currency: 'EUR' },
  ],
};

// Mock: Comentários por produto/categoria
const DEMO_COMMENTS: Record<string, ProductComment[]> = {
  burgers: [
    { id: 'well-done', label: 'Bem passado', icon: '🥩' },
    { id: 'medium', label: 'Ao ponto', icon: '🥩' },
    { id: 'with-fries', label: 'Com batata', icon: '🍟' },
    { id: 'no-onion', label: 'Sem cebola', icon: '❌' },
    { id: 'extra-cheese', label: 'Extra queijo', icon: '➕' },
    { id: 'spicy', label: 'Picante', icon: '🌶️' },
  ],
  massas: [
    { id: 'al-dente', label: 'Al dente', icon: '🍝' },
    { id: 'extra-sauce', label: 'Molho extra', icon: '➕' },
  ],
  bebidas: [
    { id: 'no-ice', label: 'Sem gelo', icon: '❄️' },
    { id: 'extra-ice', label: 'Gelo extra', icon: '🧊' },
  ],
};

// Mock: Itens adicionados à mesa
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  comments: string[];
  price: number;
}

export function TablePanel() {
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();

  const table = tableId ? DEMO_TABLES[tableId] : null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Mock: Alertas ativos (chamados do garçom)
  const mockAlerts: WaiterCall[] = [
    {
      id: 'alert-1',
      tableId: '2',
      tableNumber: 2,
      priority: AlertPriority.P0,
      count: 3,
      createdAt: new Date(Date.now() - 120000),
      message: 'Cliente chamou 3 vezes',
    },
    {
      id: 'alert-2',
      tableId: '3',
      tableNumber: 3,
      priority: AlertPriority.P1,
      count: 1,
      createdAt: new Date(Date.now() - 300000),
      message: 'Conta solicitada',
    },
  ];

  const { calls: deduplicatedAlerts } = useWaiterCalls(mockAlerts);

  const handleAcknowledgeAlert = (alertId: string) => {
    // TODO: Marcar alerta como lido
    console.log('Alert acknowledged:', alertId);
  };

  const handleSnoozeAlert = (alertId: string, minutes: number) => {
    // TODO: Adiar alerta
    console.log('Alert snoozed:', alertId, minutes);
  };

  // Produtos da categoria selecionada
  const visibleProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return DEMO_PRODUCTS[selectedCategory] || [];
  }, [selectedCategory]);

  // Comentários da categoria selecionada
  const visibleComments = useMemo(() => {
    if (!selectedCategory) return [];
    return DEMO_COMMENTS[selectedCategory] || [];
  }, [selectedCategory]);

  if (!table) {
    return (
      <div style={{ padding: spacing[6] }}>
        <Text size="lg" color="destructive">Mesa não encontrada</Text>
        <Button onClick={() => navigate('/app/waiter')} style={{ marginTop: spacing[4] }}>
          Voltar ao Mapa
        </Button>
      </div>
    );
  }

  const seatedMinutes = table.seatedAt 
    ? Math.floor((Date.now() - table.seatedAt.getTime()) / 60000)
    : null;

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

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleTableClickFromMap = (table: Table) => {
    if (table.id !== tableId) {
      navigate(`/app/waiter/table/${table.id}`);
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
          tables={ALL_DEMO_TABLES}
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
          }}>
            <Text size="sm" weight="bold" color="primary" style={{ marginBottom: spacing[2] }}>
              Pedido ({orderItems.length} itens)
            </Text>
            {orderItems.map((item) => (
              <Text key={item.id} size="xs" color="secondary" style={{ marginBottom: spacing[1] }}>
                {item.quantity}x {item.productName}
                {item.comments.length > 0 && ` (${item.comments.join(', ')})`}
              </Text>
            ))}
            <Text size="base" weight="bold" color="primary" style={{ marginTop: spacing[2] }}>
              Total: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalAmount / 100)}
            </Text>
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
