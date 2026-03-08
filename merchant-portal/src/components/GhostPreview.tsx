import { useMemo } from "react";
import { getCurrencySymbol } from "../core/currency/CurrencyService";

export interface GhostPreviewProps {
  /** Identidade */
  restaurantName: string;
  tagline?: string;

  /** Branding (DesignStep) */
  theme: {
    primaryColor: string; // ex: '#C9A227'
    secondaryColor?: string;
    background: "light" | "dark";
    accentStyle?: "soft" | "bold";
  };

  /** Menu fake (MenuStep) */
  menuPreview?: {
    categories: Array<{
      name: string;
      items: Array<{
        name: string;
        price?: string;
      }>;
    }>;
  };

  /** Estado visual */
  stage: "identity" | "menu" | "design" | "ready";

  /** Opcional: mostrar badge */
  badge?: "preview" | "draft";

  /** Progresso visual (estes passos já foram completados) */
  progress?: {
    identity?: boolean;
    menu?: boolean;
    design?: boolean;
  };
}

// ⚙️ Faker inteligente de menu
function generateFakeMenu() {
  const s = getCurrencySymbol();
  const categories = [
    {
      name: "Entradas",
      items: [
        { name: "Pastel de Bacalhau", price: `3,50 ${s}` },
        { name: "Croquete de Presunto", price: `2,80 ${s}` },
      ],
    },
    {
      name: "Pratos",
      items: [
        { name: "Bacalhau à Brás", price: `12,00 ${s}` },
        { name: "Arroz de Marisco", price: `14,50 ${s}` },
      ],
    },
  ];
  return categories;
}

// 🧠 Copy contextual por stage
function getCopyForStage(stage: GhostPreviewProps["stage"]): string {
  const copies = {
    identity: "A tua página começa a ganhar forma.",
    menu: "O menu aparece aqui assim que adicionares itens.",
    design: "As cores refletem o estilo que escolheste.",
    ready: "Pronto para publicar quando quiseres.",
  };
  return copies[stage] || "";
}

// 📊 Micro-progress components
function ProgressItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: ok ? "#22c55e" : "#9ca3af",
        fontWeight: ok ? 600 : 400,
        fontSize: 11,
      }}
    >
      <span aria-hidden style={{ fontSize: 10 }}>
        {ok ? "✓" : "○"}
      </span>
      <span>{label}</span>
    </span>
  );
}

function Dot() {
  return <span style={{ opacity: 0.35, fontSize: 10 }}>•</span>;
}

export function GhostPreview(props: GhostPreviewProps) {
  const {
    restaurantName,
    tagline = "Restaurante",
    theme,
    menuPreview,
    stage,
    badge = "preview",
    progress,
  } = props;

  // Gerar menu fake se menuPreview vazio
  const menuData = useMemo(() => {
    if (menuPreview?.categories && menuPreview.categories.length > 0) {
      // Limitar a 2 categorias e 2-3 items por categoria
      return menuPreview.categories.slice(0, 2).map((cat) => ({
        ...cat,
        items: cat.items.slice(0, 3),
      }));
    }
    return generateFakeMenu();
  }, [menuPreview]);

  const isDark = theme.background === "dark";
  const isBold = theme.accentStyle === "bold";

  const footerCopy = getCopyForStage(stage);

  return (
    <div
      style={{
        width: "100%",
        height: 240,
        borderRadius: 8,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: isDark ? "#0a0a0a" : "#f9f9f9",
        border: `1px solid ${
          isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
        }`,
        fontSize: 11,
        lineHeight: 1.4,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          flex: "0 0 auto",
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${
            theme.secondaryColor || theme.primaryColor
          }${isBold ? "ff" : "dd"} 100%)`,
          padding: "14px 12px",
          color: isDark ? "#fff" : "#000",
          textShadow: isDark ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            opacity: 0.7,
            letterSpacing: "0.5px",
          }}
        >
          {badge === "preview" ? "⬤ PRÉ-VISUALIZAÇÃO" : "✏ RASCUNHO"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.3px" }}>
          {restaurantName}
        </div>
        <div style={{ fontSize: 9, opacity: 0.8 }}>{tagline}</div>
      </div>

      {/* Micro-progress indicator */}
      {progress && (
        <div
          style={{
            flex: "0 0 auto",
            padding: "8px 12px",
            borderBottom: `1px solid ${
              isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
            }`,
            display: "flex",
            gap: 8,
            alignItems: "center",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.01)",
          }}
        >
          <ProgressItem ok={!!progress.identity} label="Identidade" />
          <Dot />
          <ProgressItem ok={!!progress.menu} label="Menu" />
          <Dot />
          <ProgressItem ok={!!progress.design} label="Design" />
        </div>
      )}

      {/* Menu */}
      <div
        style={{
          flex: "1 1 auto",
          overflow: "hidden",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
        }}
      >
        {menuData.map((category, catIdx) => (
          <div key={catIdx}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: theme.primaryColor,
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              {category.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {category.items.slice(0, 3).map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 3,
                    borderBottom: `1px solid ${
                      isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                    }`,
                    color: isDark
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(0,0,0,0.75)",
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 10 }}>
                    {item.name}
                  </span>
                  {item.price && (
                    <span
                      style={{
                        fontWeight: 600,
                        color: theme.primaryColor,
                        fontSize: 9,
                        whiteSpace: "nowrap",
                        marginLeft: 8,
                      }}
                    >
                      {item.price}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / CTA Fake */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "8px 12px",
          borderTop: `1px solid ${
            isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
          }`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <button
          disabled
          style={{
            padding: "6px 10px",
            background: theme.primaryColor,
            color: isDark ? "#000" : "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 600,
            cursor: "not-allowed",
            opacity: 0.6,
          }}
        >
          Pedir agora
        </button>
        <span
          style={{
            fontSize: 8,
            color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
          }}
        >
          {footerCopy}
        </span>
      </div>
    </div>
  );
}
