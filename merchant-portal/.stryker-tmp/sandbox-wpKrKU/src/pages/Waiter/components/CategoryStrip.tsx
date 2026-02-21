/**
 * CategoryStrip — Last.app-inspired pill chip selector
 * Princípio: Pill chips horizontais, scroll suave, active = roxo (#6366f1).
 */

import { colors } from "../../../ui/design-system/tokens/colors";

/** Active accent — purple from Last.app design */
const ACTIVE_COLOR = "#6366f1";

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

export function CategoryStrip({
  categories,
  selectedId,
  onSelect,
}: CategoryStripProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "10px 16px",
        overflowX: "auto",
        background: colors.surface.base,
        borderBottom: `1px solid ${colors.border.subtle}`,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {categories.map((category) => {
        const isSelected = selectedId === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 18,
              border: "none",
              background: isSelected ? ACTIVE_COLOR : "#27272a",
              color: isSelected ? "#ffffff" : "#a1a1aa",
              fontSize: 13,
              fontWeight: isSelected ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
            }}
            onPointerDown={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {category.icon && (
              <span style={{ fontSize: 14, lineHeight: 1 }}>
                {category.icon}
              </span>
            )}
            <span>{category.name}</span>
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
