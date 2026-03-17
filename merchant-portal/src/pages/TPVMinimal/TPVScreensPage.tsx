/**
 * TPVScreensPage — Hub centralizado de gestão de telas operacionais.
 *
 * Permite ao operador criar, visualizar e gerir instâncias de ecrãs
 * externos (KDS Cozinha, KDS Bar, Tarefas, Página Web, etc.) a partir
 * de um único ponto no TPV.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ScreenTypeId } from "./screens/screenTypes";
import { SCREEN_REGISTRY } from "./screens/screenTypes";
import { useActiveScreens } from "./screens/useActiveScreens";
import { useToast } from "../../ui/design-system/Toast";

/* ── Constants ─────────────────────────────────────────────────── */

const DEFAULT_SUFFIX_KEYS: Partial<Record<ScreenTypeId, string>> = {
  KDS_KITCHEN: "screens.suffixMain",
  KDS_BAR: "screens.suffixMain",
  TASKS: "screens.suffixOperation",
  WEB_EDITOR: "screens.suffixEditor",
};

/* ── Icons ──────────────────────────────────────────────────────── */

function IconKitchen() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
      <path d="M3 6V4a2 2 0 012-2h14a2 2 0 012 2v2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function IconBar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8l-4 9v5" />
      <path d="M8 22h8" />
      <path d="M12 16v6" />
    </svg>
  );
}

function IconScreen() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function IconTasks() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function IconWeb() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

const ICON_MAP: Record<string, () => JSX.Element> = {
  KDS_KITCHEN: IconKitchen,
  KDS_BAR: IconBar,
  KDS_EXPO: IconScreen,
  CUSTOMER_DISPLAY: IconScreen,
  DELIVERY: IconDelivery,
  TASKS: IconTasks,
  WEB_EDITOR: IconWeb,
};

/* ── Page ───────────────────────────────────────────────────────── */

export function TPVScreensPage() {
  const { t } = useTranslation("tpv");
  const { screens, openScreen, focusScreen, closeScreen, removeScreen, copyLink } =
    useActiveScreens();
  const toast = useToast();

  // Naming popover state
  const [namingFor, setNamingFor] = useState<ScreenTypeId | null>(null);
  const [namingValue, setNamingValue] = useState("");
  const namingInputRef = useRef<HTMLInputElement>(null);

  // Tick every 60s to update relative timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const activeScreens = screens.filter((s) => s.state === "open");

  const handleCardClick = (typeId: ScreenTypeId) => {
    const def = SCREEN_REGISTRY.find((d) => d.id === typeId);
    if (!def?.available) return;
    // Navigate-mode screens open immediately (no naming)
    if (def.openMode === "navigate") {
      openScreen(typeId);
      return;
    }
    // Show naming popover for new-window screens
    const existingCount = screens.filter((s) => s.typeId === typeId).length;
    const suffixKey = DEFAULT_SUFFIX_KEYS[typeId] ?? "screens.suffixMain";
    const suffix = t(suffixKey);
    const screenLabel = t(`screens.types.${typeId}.label`, def.label);
    const suggested =
      existingCount === 0
        ? `${screenLabel} — ${suffix}`
        : `${screenLabel} — ${suffix} ${existingCount + 1}`;
    setNamingValue(suggested);
    setNamingFor(typeId);
    setTimeout(() => namingInputRef.current?.select(), 50);
  };

  const handleNamingConfirm = () => {
    if (!namingFor) return;
    openScreen(namingFor, namingValue.trim() || undefined);
    setNamingFor(null);
    setNamingValue("");
  };

  const handleNamingCancel = () => {
    setNamingFor(null);
    setNamingValue("");
  };

  const handleCopyLink = async (instanceId: string) => {
    await copyLink(instanceId);
    toast.show({
      type: "success",
      title: t("screens.linkCopiedTitle"),
      description: t("screens.linkCopiedDescription"),
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: 24,
        gap: 24,
        backgroundColor: "#050505",
        color: "#fafafa",
        overflow: "auto",
      }}
      data-testid="tpv-screens-page"
    >
      {/* Page header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            letterSpacing: 0.3,
          }}
        >
          {t("screens.title")}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#9ca3af",
            margin: 0,
          }}
        >
          {t("screens.subtitle")}
        </p>
      </div>

      {/* ── Block 1: Criar nova tela ─────────────────────────────── */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={sectionTitleStyle}>{t("screens.createNew")}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {SCREEN_REGISTRY.map((def) => {
            const IconComponent = ICON_MAP[def.id] ?? IconScreen;
            return (
              <button
                key={def.id}
                type="button"
                disabled={!def.available}
                onClick={() => handleCardClick(def.id)}
                data-testid={`screen-create-${def.id}`}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: "#111827",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: def.available ? "#fafafa" : "#6b7280",
                  cursor: def.available ? "pointer" : "not-allowed",
                  opacity: def.available ? 1 : 0.4,
                  textAlign: "left",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (def.available) {
                    e.currentTarget.style.borderColor = "rgba(249,115,22,0.5)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 1px rgba(249,115,22,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(148,163,184,0.2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {!def.available && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 999,
                      backgroundColor: "rgba(107,114,128,0.3)",
                      color: "#9ca3af",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("screens.comingSoon")}
                  </span>
                )}
                <IconComponent />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {t(`screens.types.${def.id}.label`, def.label)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: def.available ? "#9ca3af" : "#4b5563",
                    lineHeight: 1.4,
                  }}
                >
                  {t(`screens.types.${def.id}.description`, def.description)}
                </span>
              </button>
            );
          })}
        </div>
        {/* Naming popover */}
        {namingFor && (
          <div
            data-testid="screen-naming-popover"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 12,
              backgroundColor: "#1f2937",
              border: "1px solid rgba(249,115,22,0.4)",
            }}
          >
            <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>
              {t("screens.nameLabel")}
            </span>
            <input
              ref={namingInputRef}
              type="text"
              value={namingValue}
              onChange={(e) => setNamingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNamingConfirm();
                if (e.key === "Escape") handleNamingCancel();
              }}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.3)",
                backgroundColor: "#020617",
                color: "#fafafa",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={handleNamingConfirm}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#f97316",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("screens.open")}
            </button>
            <button
              type="button"
              onClick={handleNamingCancel}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.3)",
                backgroundColor: "transparent",
                color: "#9ca3af",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {t("screens.cancel")}
            </button>
          </div>
        )}
      </section>

      {/* ── Block 2: Telas ativas ────────────────────────────────── */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={sectionTitleStyle}>{t("screens.activeScreens")}</h2>
          {activeScreens.length > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                backgroundColor: "rgba(34,197,94,0.15)",
                color: "#4ade80",
                fontWeight: 500,
              }}
            >
              {activeScreens.length}
            </span>
          )}
        </div>

        {screens.length === 0 ? (
          <div
            style={{
              padding: 32,
              borderRadius: 16,
              backgroundColor: "#111827",
              border: "1px solid rgba(148,163,184,0.1)",
              textAlign: "center",
              color: "#6b7280",
              fontSize: 13,
            }}
          >
            {t("screens.noActiveScreens")}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {screens.map((screen) => (
              <div
                key={screen.instanceId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  backgroundColor: "#111827",
                  border: "1px solid rgba(148,163,184,0.15)",
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor:
                      screen.state === "open" ? "#4ade80" : "#6b7280",
                    flexShrink: 0,
                  }}
                />

                {/* Info */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {screen.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 4,
                        backgroundColor: "rgba(148,163,184,0.15)",
                        color: "#9ca3af",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {getTypeBadgeLabel(screen.typeId, t)}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    {screen.state === "open"
                      ? formatElapsed(screen.openedAt, t)
                      : t("screens.closed")}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  {screen.state === "open" && (
                    <>
                      <ActionButton
                        label={t("screens.focus")}
                        onClick={() => focusScreen(screen.instanceId)}
                      />
                      <ActionButton
                        label={t("screens.copyLink")}
                        onClick={() => handleCopyLink(screen.instanceId)}
                      />
                      <ActionButton
                        label={t("screens.close")}
                        onClick={() => closeScreen(screen.instanceId)}
                        danger
                      />
                    </>
                  )}
                  {screen.state === "closed" && (
                    <ActionButton
                      label={t("screens.remove")}
                      onClick={() => removeScreen(screen.instanceId)}
                      danger
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Block 3: Resumo de instâncias ──────────────────────── */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        data-testid="instance-summary-section"
      >
        <h2 style={sectionTitleStyle}>{t("screens.instanceSummary")}</h2>

        {screens.length === 0 ? (
          <div
            style={{
              padding: 32,
              borderRadius: 16,
              backgroundColor: "#111827",
              border: "1px solid rgba(148,163,184,0.1)",
              textAlign: "center",
              color: "#6b7280",
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
            data-testid="instance-summary-empty"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.4 }}
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
            <span>
              {t("screens.noRunningScreens")}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "12px 16px",
              borderRadius: 16,
              backgroundColor: "#111827",
              border: "1px solid rgba(148,163,184,0.1)",
            }}
          >
            {screens.map((s) => (
              <div
                key={s.instanceId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                }}
                data-testid={`instance-summary-${s.instanceId}`}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor:
                      s.state === "open" ? "#4ade80" : "#6b7280",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 4,
                    backgroundColor: "rgba(148,163,184,0.12)",
                    color: "#9ca3af",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {getTypeBadgeLabel(s.typeId, t)}
                </span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>
                  {s.state === "open"
                    ? formatElapsed(s.openedAt, t)
                    : t("screens.closed")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

function formatElapsed(openedAt: Date, t: TFunc): string {
  const mins = Math.floor((Date.now() - openedAt.getTime()) / 60_000);
  if (mins < 1) return t("screens.openedNow");
  if (mins < 60) return t("screens.openedMinutes", { mins });
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return t("screens.openedHours", { h, m });
}

function getTypeBadgeLabel(typeId: string, t: TFunc): string {
  if (typeId.startsWith("KDS")) return t("screens.badgeKDS");
  if (typeId === "TASKS") return t("screens.badgeTasks");
  return t("screens.badgeWeb");
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
  color: "#e5e5e5",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

function ActionButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        border: `1px solid ${danger ? "rgba(248,113,113,0.35)" : "rgba(148,163,184,0.3)"}`,
        backgroundColor: "transparent",
        color: danger ? "#f87171" : "#d4d4d4",
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
