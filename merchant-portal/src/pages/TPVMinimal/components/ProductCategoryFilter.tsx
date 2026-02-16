/**
 * ProductCategoryFilter — Filtro por categorias (horizontal, ícone + nome).
 */

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

export function ProductCategoryFilter({
  categories,
  selectedId,
  onSelect,
}: ProductCategoryFilterProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 8,
        marginBottom: 16,
        alignItems: "center",
      }}
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          style={{
            flexShrink: 0,
            minWidth: 72,
            padding: "12px 14px",
            borderRadius: 9999,
            border: "none",
            backgroundColor: selectedId === cat.id ? "var(--color-primary, #c9a227)" : "var(--surface-elevated, #262626)",
            color: selectedId === cat.id ? "var(--text-inverse, #1a1a1a)" : "var(--text-secondary, #a3a3a3)",
            fontWeight: selectedId === cat.id ? 600 : 400,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 20 }}>{cat.icon ?? "📦"}</span>
          {cat.name}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0,
          minWidth: 72,
          padding: "12px 14px",
          borderRadius: 9999,
          border: "none",
          backgroundColor: selectedId === null ? "var(--color-primary, #c9a227)" : "var(--surface-elevated, #262626)",
          color: selectedId === null ? "var(--text-inverse, #1a1a1a)" : "var(--text-secondary, #a3a3a3)",
          fontWeight: selectedId === null ? 600 : 400,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 20 }}>🍽️</span>
        Todos
      </button>
    </div>
  );
}
