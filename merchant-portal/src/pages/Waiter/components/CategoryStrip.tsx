/**
 * CategoryStrip — Grupos/Categorias (primeira camada)
 * Princípio: Botões grandes, expandem na mesma tela, zero navegação.
 */

import React from 'react';
import { Text } from '../../../ui/design-system/primitives/Text';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface CategoryStripProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryStrip({ categories, selectedId, onSelect }: CategoryStripProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: spacing[2],
        padding: spacing[3],
        overflowX: 'auto',
        background: colors.surface.base,
        borderBottom: `1px solid ${colors.border.subtle}`,
        // Esconder scrollbar mas manter scroll
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {categories.map((category) => {
        const isSelected = selectedId === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            style={{
              minWidth: 100,
              height: 64,
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: 12,
              border: `2px solid ${isSelected ? colors.action.base : colors.border.subtle}`,
              background: isSelected 
                ? `${colors.action.base}22` 
                : colors.surface.layer1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[1],
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {category.icon && (
              <Text size="lg" style={{ lineHeight: 1 }}>
                {category.icon}
              </Text>
            )}
            <Text 
              size="sm" 
              weight={isSelected ? 'bold' : 'regular'}
              style={{ 
                color: isSelected ? colors.action.base : colors.text.secondary 
              }}
            >
              {category.name}
            </Text>
          </button>
        );
      })}
      
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

