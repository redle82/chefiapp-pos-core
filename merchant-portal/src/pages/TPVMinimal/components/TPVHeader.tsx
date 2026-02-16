/**
 * TPVHeader — Cabeçalho do TPV conforme exemplo: menu icon, identidade staff (avatar, nome, ID), pesquisa, filtro.
 */

interface TPVHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
}

/** Nome/ID do operador (quando houver auth de staff; por agora placeholder). */
const STAFF_PLACEHOLDER = { name: "Operador", id: "—" };

export function TPVHeader({
  searchQuery = "",
  onSearchChange,
  onFilterClick,
}: TPVHeaderProps) {
  const staffName = STAFF_PLACEHOLDER.name;
  const staffId = STAFF_PLACEHOLDER.id;

  return (
    <header
      style={{
        height: 56,
        minHeight: 56,
        backgroundColor: "var(--surface-elevated, #262626)",
        borderBottom: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
        display: "flex",
        alignItems: "center",
        gap: 16,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      {/* Ícone menu principal (grid 9 pontos) */}
      <button
        type="button"
        title="Menu"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          border: "none",
          backgroundColor: "transparent",
          color: "var(--text-secondary, #a3a3a3)",
          cursor: "pointer",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          padding: 6,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: "currentColor" }} />
        ))}
      </button>
      {/* Identidade staff: avatar + nome + ID */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: "var(--surface-elevated, #404040)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary, #fafafa)",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {staffName.slice(0, 1)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <span style={{ color: "var(--text-primary, #fafafa)", fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
          {staffName}
        </span>
        <span style={{ color: "var(--text-tertiary, #a3a3a3)", fontSize: 11 }}>
          {staffId}
        </span>
      </div>
      {/* Barra de pesquisa: placeholder "Search product by name, categories or SKU" */}
      <div
        style={{
          flex: 1,
          maxWidth: 420,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 12,
            color: "var(--text-tertiary, #737373)",
            fontSize: 16,
            pointerEvents: "none",
          }}
        >
          🔍
        </span>
        <input
          type="search"
          placeholder="Search product by name, categories or SKU"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          style={{
            width: "100%",
            height: 40,
            paddingLeft: 40,
            paddingRight: 36,
            borderRadius: 8,
            border: "1px solid var(--surface-border, #404040)",
            backgroundColor: "var(--surface-base, #171717)",
            color: "var(--text-primary, #fafafa)",
            fontSize: 14,
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange?.("")}
            title="Limpar"
            style={{
              position: "absolute",
              right: 8,
              width: 24,
              height: 24,
              borderRadius: 4,
              border: "none",
              backgroundColor: "transparent",
              color: "var(--text-tertiary, #737373)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ×
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        style={{
          height: 40,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 8,
          border: "none",
          backgroundColor: "var(--color-primary, #c9a227)",
          color: "var(--text-inverse, #1a1a1a)",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>⌃</span>
        Filtro
      </button>
      <button
        type="button"
        title="Fechar"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          border: "none",
          backgroundColor: "transparent",
          color: "var(--text-secondary, #a3a3a3)",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ×
      </button>
    </header>
  );
}
