/**
 * ProductCategoryFilter — Horizontal scrollable category pills (icon + name).
 * Ref: POS reference layout with circle avatar, orange selected state.
 */

const ACCENT = "#f97316";

export interface TPVCategory {
  id: string;
  name: string;
  icon?: string;
}

interface ProductCategoryFilterProps {
  categories: TPVCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Fallback emoji por nome de categoria */
function categoryEmoji(name?: string): string {
  if (!name) return "📦";
  const n = name.toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger") || n.includes("hambur")) return "🍔";
  if (n.includes("drink") || n.includes("bebida")) return "🥤";
  if (n.includes("hot") || n.includes("café") || n.includes("coffee"))
    return "☕";
  if (n.includes("dessert") || n.includes("sobremesa")) return "🍰";
  if (n.includes("salad") || n.includes("salada")) return "🥗";
  if (n.includes("pasta") || n.includes("massa")) return "🍝";
  if (n.includes("sushi") || n.includes("peixe") || n.includes("fish"))
    return "🍣";
  if (n.includes("carne") || n.includes("meat") || n.includes("steak"))
    return "🥩";
  if (n.includes("frango") || n.includes("chicken")) return "🍗";
  return "📦";
}

export function ProductCategoryFilter({
  categories,
  selectedId,
  onSelect,
}: ProductCategoryFilterProps) {
  const allCategories = [...categories];

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 6,
        marginBottom: 20,
        alignItems: "center",
        scrollbarWidth: "none",
      }}
    >
      {allCategories.map((cat) => {
        const isSelected = selectedId === cat.id;
        const emoji = cat.icon ?? categoryEmoji(cat.name);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            style={{
              flexShrink: 0,
              padding: "8px 18px 8px 8px",
              borderRadius: 9999,
              border: "none",
              backgroundColor: isSelected ? ACCENT : "#262626",
              color: isSelected ? "#fff" : "#a3a3a3",
              fontWeight: isSelected ? 600 : 400,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: isSelected
                  ? "rgba(255,255,255,0.2)"
                  : "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {emoji}
            </span>
            {cat.name}
          </button>
        );
      })}
      {/* "All" category */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0,
          padding: "8px 18px 8px 8px",
          borderRadius: 9999,
          border: "none",
          backgroundColor: selectedId === null ? ACCENT : "#262626",
          color: selectedId === null ? "#fff" : "#a3a3a3",
          fontWeight: selectedId === null ? 600 : 400,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "all 0.15s ease",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor:
              selectedId === null ? "rgba(255,255,255,0.2)" : "#1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          🍽️
        </span>
        Todos
      </button>
    </div>
  );
}
