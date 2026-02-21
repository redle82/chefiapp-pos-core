/**
 * QuantityPicker — Seletor de Quantidade (terceira camada)
 * Princípio: Botões grandes, toque já seleciona, zero confirmação.
 */

import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

interface QuantityPickerProps {
  max?: number;
  selected: number;
  onSelect: (quantity: number) => void;
}

export function QuantityPicker({ max = 6, selected, onSelect }: QuantityPickerProps) {
  const quantities = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: spacing[2],
      }}
    >
      {quantities.map((qty) => {
        const isSelected = selected === qty;
        
        return (
          <button
            key={qty}
            onClick={() => onSelect(qty)}
            style={{
              height: 64,
              borderRadius: 12,
              border: `2px solid ${isSelected ? colors.action.base : colors.border.subtle}`,
              background: isSelected 
                ? `${colors.action.base}22` 
                : colors.surface.layer2,
              fontSize: 24,
              fontWeight: 'bold',
              color: isSelected ? colors.action.base : colors.text.primary,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
            {qty}
          </button>
        );
      })}
    </div>
  );
}

