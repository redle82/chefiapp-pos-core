/**
 * PurchaseSuggestions - Lista de Sugestões de Compra
 */

import React, { useState, useEffect } from 'react';
import { purchaseEngine, type PurchaseSuggestion } from '../../core/purchases/PurchaseEngine';

interface Props {
  restaurantId: string;
}

export function PurchaseSuggestions({ restaurantId }: Props) {
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const data = await purchaseEngine.listSuggestions(restaurantId, { status: ['pending'] });
        setSuggestions(data);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      loadSuggestions();
    }
  }, [restaurantId]);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Carregando...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <p>Nenhuma sugestão pendente</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
                {suggestion.reason}
              </h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                Quantidade sugerida: {suggestion.suggestedQuantity} {suggestion.currentStock !== undefined && `(Estoque atual: ${suggestion.currentStock})`}
              </p>
              {suggestion.priority === 'urgent' && (
                <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                  URGENTE
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
