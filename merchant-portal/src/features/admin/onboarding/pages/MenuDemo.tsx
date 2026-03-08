/**
 * MenuDemo — Página de Exemplo de Menu (FASE 2)
 *
 * Permite ao utilizador escolher um tipo de negócio e ver um menu de exemplo
 * que pode utilizar como ponto de partida.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../../ui/design-system/Button";
import {
  EXAMPLE_MENUS,
  countMenuItems,
  type BusinessType,
  type ExampleMenu,
} from "../exampleMenus";

const BUSINESS_TYPES: BusinessType[] = ["restaurant", "cafe", "bar"];

export function MenuDemo() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BusinessType>("restaurant");
  const menu = EXAMPLE_MENUS[selected];

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 8px 0",
          }}
        >
          🍽️ Menu de Exemplo
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, margin: 0 }}>
          Escolhe o tipo de negócio para pré-visualizar um menu e começar
          rapidamente.
        </p>
      </div>

      {/* Business type selector */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        {BUSINESS_TYPES.map((type) => {
          const m = EXAMPLE_MENUS[type];
          const isActive = type === selected;
          return (
            <button
              key={type}
              onClick={() => setSelected(type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 20px",
                border: isActive
                  ? "2px solid var(--accent)"
                  : "2px solid var(--surface-border)",
                borderRadius: 12,
                background: isActive
                  ? "rgba(var(--accent-rgb, 255,165,0), 0.1)"
                  : "var(--card-bg-on-dark)",
                cursor: "pointer",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 15,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{m.emoji}</span>
              <div style={{ textAlign: "left" }}>
                <div>{m.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 400 }}>
                  {countMenuItems(m)} itens
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Menu preview */}
      <MenuPreview menu={menu} />

      {/* Actions */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Button
          variant="primary"
          onClick={() => navigate(`/menu-builder?example=${selected}`)}
        >
          Usar este Menu de Exemplo
        </Button>
        <Button variant="secondary" onClick={() => navigate("/menu-builder")}>
          Criar Menu Manualmente
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/app/onboarding/first-sale")}
        >
          Ir para Guia de Primeira Venda →
        </Button>
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          color: "var(--text-muted, var(--text-secondary))",
        }}
      >
        💡 Podes sempre editar ou apagar itens depois no Menu Builder.
      </p>
    </div>
  );
}

/* ---- Sub-componentes ---------------------------------------------------- */

function MenuPreview({ menu }: { menu: ExampleMenu }) {
  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: 16,
        overflow: "hidden",
        background: "var(--card-bg-on-dark)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--surface-border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>{menu.emoji}</span>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text-primary)",
            }}
          >
            {menu.label}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {menu.description}
          </div>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent)",
            background: "rgba(var(--accent-rgb, 255,165,0), 0.12)",
            padding: "4px 10px",
            borderRadius: 20,
          }}
        >
          {countMenuItems(menu)} itens
        </span>
      </div>

      {/* Categories and items */}
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {menu.categories.map((cat) => (
          <div key={cat.name}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 8,
              }}
            >
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    border: "1px solid var(--surface-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.emoji ? `${item.emoji} ` : ""}
                      {item.name}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--accent)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {formatPrice(item.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}
