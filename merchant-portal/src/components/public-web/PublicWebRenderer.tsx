/**
 * PublicWebRenderer — Renderizador partilhado das secções institucionais
 * da página web pública do restaurante.
 *
 * Contrato:
 *   - Recebe `WebsiteQuickConfig` (draft OU published)
 *   - Renderiza: Hero · Horários · Contactos · Destaques
 *   - Usado em DOIS contextos:
 *       1. Preview do editor TPV (`TPVWebEditorPage`)
 *       2. Página pública (`PublicWebPage`)
 *   - Zero divergência: o que o operador vê no preview é exactamente
 *     o que o cliente vê na página publicada.
 *
 * O componente é puramente visual — sem estado, sem side-effects, sem fetches.
 */

import type { WebsiteQuickConfig } from "../../core/website/websiteConfigService";

const DAYS_LABEL: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const HIGHLIGHT_ICONS: Record<string, string> = {
  bolt: "BOLT",
  star: "STAR",
  calendar: "CALENDAR",
  truck: "TRUCK",
  clock: "CLOCK",
  heart: "HEART",
  shield: "SHIELD",
  fire: "FIRE",
};

interface PublicWebRendererProps {
  config: WebsiteQuickConfig;
  /** Restaurant name — used in contacts/header fallback */
  restaurantName?: string;
  /** Compact mode for editor preview panel (smaller spacing) */
  compact?: boolean;
}

export function PublicWebRenderer({
  config,
  restaurantName,
  compact = false,
}: PublicWebRendererProps) {
  const gap = compact ? 12 : 20;
  const pad = compact ? 16 : 24;
  const titleSize = compact ? 22 : 32;
  const subtitleSize = compact ? 12 : 15;

  const statusLabel =
    config.status.mode === "open"
      ? "Aberto"
      : config.status.mode === "closed"
        ? "Fechado"
        : "Em pausa";

  return (
    <div
      data-testid="public-web-renderer"
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        width: "100%",
      }}
    >
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          borderRadius: compact ? 14 : 20,
          overflow: "hidden",
          minHeight: compact ? 160 : 220,
          background:
            "linear-gradient(135deg, #f97316 0%, #ef4444 38%, #0f172a 100%)",
          padding: pad,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {config.hero.imageUrl && (
          <img
            src={config.hero.imageUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
              filter: "grayscale(0.1)",
            }}
          />
        )}
        <div
          style={{
            position: "relative",
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <h1
            style={{
              fontSize: titleSize,
              lineHeight: 1.1,
              margin: 0,
              color: "#fafafa",
              fontWeight: 800,
            }}
          >
            {config.hero.title}
          </h1>
          {config.hero.subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: subtitleSize,
                color: "#fee2e2",
              }}
            >
              {config.hero.subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: compact ? 10 : 16,
          }}
        >
          {config.hero.ctaLabel && (
            <button
              type="button"
              style={{
                padding: compact ? "6px 14px" : "10px 20px",
                borderRadius: 999,
                border: "none",
                backgroundColor: "#0f172a",
                color: "#fefce8",
                fontSize: compact ? 12 : 14,
                fontWeight: 600,
                boxShadow: "0 10px 25px rgba(15,23,42,0.6)",
                cursor: "default",
              }}
            >
              {config.hero.ctaLabel}
            </button>
          )}
          {config.status.message && (
            <div
              style={{
                maxWidth: 260,
                padding: compact ? "6px 8px" : "8px 12px",
                borderRadius: 10,
                backgroundColor: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(254,249,195,0.4)",
                fontSize: compact ? 10 : 12,
                color: "#fefce8",
              }}
            >
              {config.status.message}
            </div>
          )}
        </div>
      </section>

      {/* ── Schedule + Contacts (side by side) ────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1.2fr",
          gap,
        }}
      >
        {/* Schedule */}
        <div
          style={{
            borderRadius: compact ? 12 : 16,
            backgroundColor: "#020617",
            border: "1px solid rgba(31,41,55,0.85)",
            padding: compact ? 12 : 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <h3
            style={{
              fontSize: compact ? 12 : 14,
              fontWeight: 600,
              margin: 0,
              color: "#fafafa",
            }}
          >
            Horário de hoje
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              fontSize: compact ? 10 : 12,
              color: "#e5e5e5",
            }}
          >
            {config.schedule.map((entry) => (
              <div
                key={entry.day}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  opacity: entry.closed ? 0.5 : 1,
                }}
              >
                <span>{DAYS_LABEL[entry.day] ?? entry.day}</span>
                <span>
                  {entry.closed
                    ? "Fechado"
                    : `${entry.open} – ${entry.close}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div
          style={{
            borderRadius: compact ? 12 : 16,
            backgroundColor: "#020617",
            border: "1px solid rgba(31,41,55,0.85)",
            padding: compact ? 12 : 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: compact ? 11 : 13,
          }}
        >
          <h3
            style={{
              fontSize: compact ? 12 : 14,
              fontWeight: 600,
              margin: 0,
              color: "#fafafa",
            }}
          >
            Contactos
          </h3>
          {config.contacts.phone && (
            <ContactRow label="Telefone" value={config.contacts.phone} />
          )}
          {config.contacts.whatsapp && (
            <ContactRow label="WhatsApp" value={config.contacts.whatsapp} />
          )}
          {config.contacts.email && (
            <ContactRow label="Email" value={config.contacts.email} />
          )}
          {config.contacts.address && (
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: "1px dashed rgba(55,65,81,0.9)",
                color: "#e5e5e5",
                fontSize: compact ? 10 : 12,
                whiteSpace: "pre-wrap",
              }}
            >
              {config.contacts.address}
            </div>
          )}
        </div>
      </section>

      {/* ── Highlights ────────────────────────────────────── */}
      {config.highlights.length > 0 && (
        <section
          style={{
            borderRadius: compact ? 12 : 16,
            backgroundColor: "#020617",
            border: "1px solid rgba(31,41,55,0.85)",
            padding: compact ? 12 : 16,
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(config.highlights.length, 3)}, minmax(0,1fr))`,
            gap: compact ? 8 : 12,
          }}
        >
          {config.highlights.map((card) => (
            <div
              key={card.id}
              style={{
                borderRadius: compact ? 10 : 12,
                background:
                  "radial-gradient(circle at top left, #1f2937 0, #020617 65%)",
                border: "1px solid rgba(55,65,81,0.9)",
                padding: compact ? 8 : 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: compact ? 10 : 12,
              }}
            >
              <span
                style={{
                  fontSize: compact ? 9 : 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                  color: "#9ca3af",
                }}
              >
                {HIGHLIGHT_ICONS[card.icon ?? ""] ?? card.icon ?? "destaque"}
              </span>
              <span
                style={{
                  fontSize: compact ? 12 : 14,
                  fontWeight: 600,
                  color: "#fafafa",
                }}
              >
                {card.title}
              </span>
              {card.description && (
                <p style={{ margin: 0, color: "#9ca3af" }}>
                  {card.description}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Status badge ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: compact ? "4px 0" : "8px 0",
        }}
      >
        <span
          style={{
            fontSize: compact ? 10 : 12,
            padding: "4px 12px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.4)",
            color: "#e5e5e5",
          }}
        >
          Status: {statusLabel}
        </span>
      </div>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        color: "#e5e5e5",
      }}
    >
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
