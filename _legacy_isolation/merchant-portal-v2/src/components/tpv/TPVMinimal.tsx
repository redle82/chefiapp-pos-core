/**
 * TPVMinimal - TPV mínimo como adapter do Core
 *
 * Princípios:
 * - Não decide regras
 * - Não valida negócio
 * - Só chama Core e mostra resultado
 * - Feio mas verdadeiro
 */

import React, { useState, useEffect } from 'react';
import { createOrder, getTables, getProducts } from '../../core-adapter/coreClient';
import { mapCoreError } from '../../core-adapter/errorMapper';
import type { Table, Product } from '../../core-adapter/types';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface TPVMinimalProps {
  restaurantId: string;
}

export function TPVMinimal({ restaurantId }: TPVMinimalProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar mesas e produtos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tablesData, productsData] = await Promise.all([
          getTables(restaurantId),
          getProducts(restaurantId),
        ]);
        setTables(tablesData);
        setProducts(productsData);
      } catch (err: any) {
        setError(`Erro ao carregar dados: ${err.message}`);
      }
    };

    loadData();
  }, [restaurantId]);

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price_cents,
      }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleCreateOrder = async () => {
    if (!selectedTableId) {
      setError('Selecione uma mesa');
      return;
    }

    if (items.length === 0) {
      setError('Adicione pelo menos 1 item ao pedido');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const selectedTable = tables.find(t => t.id === selectedTableId);

      const result = await createOrder({
        restaurantId,
        tableId: selectedTableId,
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      if (result.success) {
        // Sucesso: limpar estado
        setItems([]);
        setError(null);
        setSuggestion(null);
        alert(`✅ Pedido criado com sucesso! ID: ${result.orderId?.slice(0, 8)}...`);
      } else {
        // Erro: mapear e mostrar
        const mapped = mapCoreError(
          { code: result.errorCode, message: result.error },
          {
            tableId: selectedTableId,
            tableNumber: selectedTable?.number,
          }
        );
        setError(mapped.message);
        setSuggestion(mapped.suggestion || null);
      }
    } catch (err: any) {
      const mapped = mapCoreError(err);
      setError(mapped.message);
      setSuggestion(mapped.suggestion || null);
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div style={{
      padding: 20,
      fontFamily: 'system-ui',
      maxWidth: 1200,
      margin: '0 auto',
    }}>
      <h1 style={{ marginBottom: 20 }}>TPV Mínimo (UI v2)</h1>

      {/* Seleção de Mesa */}
      <div style={{ marginBottom: 20 }}>
        <h2>Mesa</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: selectedTableId === table.id ? '#3b82f6' : '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              Mesa {table.number}
            </button>
          ))}
        </div>
        {selectedTableId && (
          <p style={{ marginTop: 10, color: '#9ca3af' }}>
            Mesa selecionada: {tables.find(t => t.id === selectedTableId)?.number}
          </p>
        )}
      </div>

      {/* Seleção de Produtos */}
      <div style={{ marginBottom: 20 }}>
        <h2>Produtos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addItem(product)}
              style={{
                padding: '15px',
                backgroundColor: '#1f2937',
                color: 'white',
                border: '1px solid #374151',
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{product.name}</div>
              <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>
                €{(product.price_cents / 100).toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Itens do Pedido */}
      {items.length > 0 && (
        <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#1f2937', borderRadius: 6 }}>
          <h3 style={{ marginBottom: 10 }}>Itens do Pedido</h3>
          {items.map(item => (
            <div
              key={item.productId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #374151',
              }}
            >
              <div>
                <div>{item.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  €{(item.unitPrice / 100).toFixed(2)} x {item.quantity}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span>€{((item.unitPrice * item.quantity) / 100).toFixed(2)}</span>
                <button
                  onClick={() => removeItem(item.productId)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 15,
            paddingTop: 15,
            borderTop: '2px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 18,
            fontWeight: 'bold',
          }}>
            <span>Total:</span>
            <span>€{(total / 100).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Feedback de Erro */}
      {error && (
        <div style={{
          marginBottom: 20,
          padding: 15,
          backgroundColor: '#7f1d1d',
          border: '1px solid #dc2626',
          borderRadius: 6,
          color: 'white',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 5 }}>❌ Erro:</div>
          <div>{error}</div>
          {suggestion && (
            <div style={{ marginTop: 10, fontSize: 14, color: '#fca5a5' }}>
              💡 {suggestion}
            </div>
          )}
        </div>
      )}

      {/* Botão Criar Pedido */}
      <button
        onClick={handleCreateOrder}
        disabled={!selectedTableId || items.length === 0 || loading}
        style={{
          padding: '15px 30px',
          fontSize: 18,
          fontWeight: 'bold',
          backgroundColor: (!selectedTableId || items.length === 0 || loading) ? '#374151' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: (!selectedTableId || items.length === 0 || loading) ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {loading ? 'Criando pedido...' : 'Criar Pedido'}
      </button>
    </div>
  );
}
