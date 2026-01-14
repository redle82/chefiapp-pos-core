/**
 * ProductCard — Produto (segunda camada)
 * Princípio: Card grande, toque abre quantidade, zero modal pesado.
 */

import React, { useState } from 'react';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { QuantityPicker } from './QuantityPicker';
import { CommentChips } from './CommentChips';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

export interface Product {
  id: string;
  name: string;
  price: number; // em centavos
  currency?: string;
  description?: string;
  imageUrl?: string;
  trackStock?: boolean;
  stockQuantity?: number;
}

export interface ProductComment {
  id: string;
  label: string;
  icon?: string;
}

interface ProductCardProps {
  product: Product;
  comments?: ProductComment[];
  onAdd: (quantity: number, commentIds: string[]) => void;
}

export function ProductCard({ product, comments = [], onAdd }: ProductCardProps) {
  const [showQuantity, setShowQuantity] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showComments, setShowComments] = useState(false);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);

  const isOutOfStock = product.trackStock && (product.stockQuantity === undefined || product.stockQuantity <= 0);

  const handleProductClick = () => {
    if (isOutOfStock) return; // Block interaction

    if (!showQuantity) {
      setShowQuantity(true);
      setSelectedQuantity(1); // Default
    }
  };

  const handleQuantitySelect = (qty: number) => {
    // Basic Client-Side Stock Check (Optional: Backend checks too)
    if (product.trackStock && product.stockQuantity !== undefined && qty > product.stockQuantity) {
      alert(`Apenas ${product.stockQuantity} unidades disponíveis.`);
      setSelectedQuantity(product.stockQuantity);
    } else {
      setSelectedQuantity(qty);
    }
    // Avança automaticamente para comentários
    setShowComments(true);
  };

  const handleCommentToggle = (commentId: string) => {
    setSelectedComments(prev =>
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleAddToTable = () => {
    onAdd(selectedQuantity, selectedComments);
    // Reset
    setShowQuantity(false);
    setShowComments(false);
    setSelectedQuantity(1);
    setSelectedComments([]);

    // Feedback visual (flash verde)
    const card = document.getElementById(`product-${product.id}`);
    if (card) {
      card.style.background = '#32d74b22';
      setTimeout(() => {
        card.style.background = '';
      }, 300);
    }
  };

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: product.currency || 'EUR',
    minimumFractionDigits: 2,
  }).format(product.price / 100);

  return (
    <div
      id={`product-${product.id}`}
      style={{
        background: colors.surface.layer1,
        borderRadius: 12,
        padding: spacing[4],
        marginBottom: spacing[3],
        border: `1px solid ${colors.border.subtle}`,
        transition: 'all 0.2s ease',
        opacity: isOutOfStock ? 0.6 : 1, // Visual "Disabled" look
      }}
    >
      {/* Produto Principal */}
      {!showQuantity && (
        <button
          onClick={handleProductClick}
          disabled={isOutOfStock}
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            padding: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <Text size="lg" weight="bold" color={isOutOfStock ? 'tertiary' : 'primary'} style={{ marginBottom: spacing[1] }}>
                {product.name}
              </Text>
              {product.description && (
                <Text size="sm" color="secondary" style={{ marginBottom: spacing[2] }}>
                  {product.description}
                </Text>
              )}

              {isOutOfStock ? (
                <div style={{
                  display: 'inline-block',
                  backgroundColor: colors.feedback.error,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  ESGOTADO
                </div>
              ) : (
                <Text size="lg" weight="bold" color="primary">
                  {priceFormatted}
                </Text>
              )}
            </div>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  objectFit: 'cover',
                  marginLeft: spacing[3],
                  filter: isOutOfStock ? 'grayscale(100%)' : 'none'
                }}
              />
            )}
          </div>
        </button>
      )}

      {/* Seletor de Quantidade */}
      {showQuantity && !showComments && (
        <div>
          <Text size="md" weight="bold" color="primary" style={{ marginBottom: spacing[3] }}>
            Quantidade
          </Text>
          <QuantityPicker
            max={6}
            selected={selectedQuantity}
            onSelect={handleQuantitySelect}
          />
        </div>
      )}

      {/* Comentários */}
      {showComments && (
        <div>
          <Text size="md" weight="bold" color="primary" style={{ marginBottom: spacing[3] }}>
            Observações
          </Text>
          {comments.length > 0 ? (
            <>
              <CommentChips
                comments={comments}
                selectedIds={selectedComments}
                onToggle={handleCommentToggle}
              />
              <Button
                tone="action"
                variant="solid"
                onClick={handleAddToTable}
                style={{
                  width: '100%',
                  height: 56,
                  marginTop: spacing[4],
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                Adicionar {selectedQuantity}x à Mesa
              </Button>
            </>
          ) : (
            <Button
              tone="action"
              variant="solid"
              onClick={handleAddToTable}
              style={{
                width: '100%',
                height: 56,
                marginTop: spacing[3],
                fontSize: 16,
                fontWeight: 'bold',
              }}
            >
              Adicionar {selectedQuantity}x à Mesa
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

