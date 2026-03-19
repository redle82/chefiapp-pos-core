/**
 * StationLockScreen — "Live Station Screen" (Tier 2)
 *
 * Full-screen overlay shown when the TPV is locked by inactivity.
 * Displays restaurant identity, clock, QR for staff check-in,
 * PIN entry, and system status.
 *
 * When staff are currently on shift (via AppStaff), recognised operators
 * are shown as contextual quick-unlock cards above the QR code.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { MadeWithLoveFooter } from "../../../components/MadeWithLoveFooter";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { useShift } from "../../../core/shift/ShiftContext";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";
import type { Operator } from "../context/OperatorContext";
import { useActiveRoster } from "../hooks/useActiveRoster";
import type { RosterEntry } from "../hooks/useActiveRoster";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StationLockScreenProps {
  operator: Operator;
  restaurantId: string;
  onUnlockSession: (pin?: string) => Promise<boolean>;
  onLock: () => void;
}

// ---------------------------------------------------------------------------
// Role badge palette (reuse from TPVLockScreen)
// ---------------------------------------------------------------------------

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  owner: { bg: "rgba(249,115,22,0.15)", color: "#f97316" },
  manager: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  waiter: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  kitchen: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  staff: { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" },
};

// ---------------------------------------------------------------------------
// Core status dot color
// ---------------------------------------------------------------------------

function coreStatusColor(coreMode: string): string {
  if (coreMode === "online") return "#22c55e";
  if (coreMode === "offline-intencional") return "#eab308";
  return "#ef4444";
}

function coreStatusLabel(
  coreMode: string,
  t: (key: string, fallback: string) => string,
): string {
  if (coreMode === "online") return t("stationLock.coreOnline", "Core online");
  if (coreMode === "offline-intencional")
    return t("stationLock.coreUnavailable", "Core unavailable");
  return t("stationLock.coreOffline", "Core offline");
}

// ---------------------------------------------------------------------------
// Clock hook (updates every second)
// ---------------------------------------------------------------------------

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

// ---------------------------------------------------------------------------
// Elapsed time helper
// ---------------------------------------------------------------------------

function formatElapsed(isoStartTime: string): string {
  const start = new Date(isoStartTime).getTime();
  const now = Date.now();
  const minutes = Math.floor((now - start) / 60_000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StationLockScreen({
  operator,
  restaurantId,
  onUnlockSession,
  onLock,
}: StationLockScreenProps) {
  const { t, i18n } = useTranslation("tpv");
  const { identity } = useRestaurantIdentity();
  const runtimeCtx = useRestaurantRuntime();
  const runtime = runtimeCtx?.runtime ?? null;
  const coreMode = runtime?.coreMode ?? "online";

  const { isShiftOpen } = useShift();
  const { roster } = useActiveRoster(restaurantId);
  const [showPin, setShowPin] = useState(false);

  const now = useClock();

  // Format time HH:MM
  const timeStr = now.toLocaleTimeString(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Format date — capitalize first letter
  const rawDate = now.toLocaleDateString(i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dateStr = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // QR URL
  const qrUrl = `${window.location.origin}/app/staff/checkin?restaurant=${restaurantId}&station=tpv-central`;

  // Restaurant name
  const restaurantName = identity?.name ?? t("sidebar.restaurantName", "Restaurante");
  const logoUrl = identity?.logoUrl ?? undefined;

  // Whether roster has recognised operators
  const hasRoster = roster.length > 0;

  // QR size adapts: smaller when roster is visible to save vertical space
  const qrSize = hasRoster ? 140 : 180;

  // Handle recognised operator tap
  const handleRecognizedOperator = useCallback(
    (entry: RosterEntry) => {
      const isCurrentOperator = entry.staffId === operator.id;
      if (isCurrentOperator) {
        // Current operator — go straight to PIN entry
        setShowPin(true);
      } else {
        // Different operator — go to Tier 3 (full lock) where they can select themselves
        onLock();
      }
    },
    [operator.id, onLock],
  );

  // Try unlock without PIN on mount
  useEffect(() => {
    let cancelled = false;
    onUnlockSession().then((ok) => {
      if (!cancelled && ok) {
        // No PIN needed — auto-unlocked
      }
    });
    return () => {
      cancelled = true;
    };
  }, [onUnlockSession]);

  if (showPin) {
    return (
      <PinPadView
        operator={operator}
        onUnlockSession={onUnlockSession}
        onBack={() => setShowPin(false)}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(10, 10, 10, 0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fafafa",
        overflow: "auto",
      }}
    >
      {/* Top section — Restaurant Identity */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 48,
          gap: 8,
        }}
      >
        <RestaurantLogo
          logoUrl={logoUrl}
          name={restaurantName}
          size={56}
        />
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#fafafa",
            marginTop: 4,
          }}
        >
          {restaurantName}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: "#737373",
            }}
          >
            {t("stationLock.stationName", "TPV Central")}
          </span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: coreStatusColor(coreMode),
              display: "inline-block",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Center section — Clock + Roster + QR */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          flex: 1,
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* Clock */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 200,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-2px",
              color: "#fafafa",
              lineHeight: 1,
            }}
          >
            {timeStr}
          </span>
          <span
            style={{
              fontSize: 16,
              color: "#737373",
              fontWeight: 400,
            }}
          >
            {dateStr}
          </span>
        </div>

        {/* Recognised operators on shift */}
        {hasRoster && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#737373",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              {t("stationLock.onShift", "Em turno")}
            </span>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {roster.map((entry) => {
                const isCurrentOp = entry.staffId === operator.id;
                const badge = ROLE_BADGE[entry.role] ?? ROLE_BADGE.staff;

                return (
                  <button
                    key={entry.staffId}
                    type="button"
                    onClick={() => handleRecognizedOperator(entry)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "16px 20px",
                      borderRadius: 16,
                      border: isCurrentOp
                        ? "1px solid rgba(249,115,22,0.5)"
                        : "1px solid #27272a",
                      backgroundColor: "#18181b",
                      cursor: "pointer",
                      minWidth: 100,
                      transition: "border-color 0.15s",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {/* Avatar circle with initial */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: "#27272a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isCurrentOp
                          ? "2px solid rgba(249,115,22,0.6)"
                          : "2px solid rgba(249,115,22,0.3)",
                      }}
                    >
                      <span
                        style={{
                          color: "#fafafa",
                          fontSize: 18,
                          fontWeight: 700,
                        }}
                      >
                        {entry.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <span
                      style={{
                        color: "#fafafa",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {entry.name}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {t(`roles.${entry.role}`, entry.role)}
                    </span>
                    {/* Time on shift */}
                    <span style={{ fontSize: 11, color: "#525252" }}>
                      {formatElapsed(entry.startTime)}
                    </span>
                    {/* Contextual action hint */}
                    <span
                      style={{
                        fontSize: 11,
                        color: isCurrentOp ? "#f97316" : "#525252",
                        fontWeight: isCurrentOp ? 600 : 400,
                        marginTop: 2,
                      }}
                    >
                      {isCurrentOp
                        ? t("stationLock.tapToUnlock", "Toque para desbloquear")
                        : t("stationLock.switchOperator", "Trocar operador")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* QR Code */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: 16,
            borderRadius: 16,
          }}
        >
          <QRCode
            value={qrUrl}
            size={qrSize}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>

        {/* Instruction text */}
        <span
          style={{
            fontSize: 14,
            color: "#737373",
            textAlign: "center",
            maxWidth: 260,
          }}
        >
          {hasRoster
            ? t(
                "stationLock.scanOrSelectAbove",
                "Escaneie para entrada ou selecione acima",
              )
            : t("stationLock.scanToCheckin", "Escaneie para registar entrada")}
        </span>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            maxWidth: 280,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setShowPin(true)}
            style={{
              height: 48,
              borderRadius: 12,
              border: "1px solid #27272a",
              backgroundColor: "#18181b",
              color: "#fafafa",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              minWidth: 44,
            }}
          >
            {t("stationLock.enterWithPin", "Entrar com PIN")}
          </button>
          <button
            type="button"
            onClick={onLock}
            style={{
              height: 48,
              borderRadius: 12,
              border: "1px solid #27272a",
              backgroundColor: "transparent",
              color: "#737373",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              minWidth: 44,
            }}
          >
            {t("stationLock.selectOperator", "Selecionar operador")}
          </button>
        </div>
      </div>

      {/* Bottom section — Status + Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          paddingBottom: 24,
          width: "100%",
        }}
      >
        {/* Status indicators row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 12,
            color: "#737373",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: coreStatusColor(coreMode),
                display: "inline-block",
              }}
            />
            <span>{coreStatusLabel(coreMode, t)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: isShiftOpen ? "#22c55e" : "#3f3f46",
                display: "inline-block",
              }}
            />
            <span>
              {isShiftOpen
                ? t("stationLock.shiftOpen", "Turno aberto")
                : t("stationLock.shiftClosed", "Turno fechado")}
            </span>
          </div>
        </div>

        <MadeWithLoveFooter variant="inline" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PIN Pad View — shown when user clicks "Entrar com PIN"
// ---------------------------------------------------------------------------

function PinPadView({
  operator,
  onUnlockSession,
  onBack,
}: {
  operator: Operator;
  onUnlockSession: (pin?: string) => Promise<boolean>;
  onBack: () => void;
}) {
  const { t } = useTranslation("tpv");
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const [checking, setChecking] = useState(false);
  const pinLengthRef = useRef(4);

  const initial = operator.name.slice(0, 1).toUpperCase();
  const badge = ROLE_BADGE[operator.role] ?? ROLE_BADGE.staff;

  const handlePinDigit = useCallback(
    async (digit: string) => {
      if (checking) return;
      setPinError(false);
      const next = pinValue + digit;

      if (next.length >= pinLengthRef.current) {
        setChecking(true);
        const ok = await onUnlockSession(next);
        setChecking(false);
        if (!ok) {
          setPinError(true);
          setPinValue("");
        }
      } else {
        setPinValue(next);
      }
    },
    [pinValue, onUnlockSession, checking],
  );

  const handleBackspace = useCallback(() => {
    setPinError(false);
    setPinValue((v) => v.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPinError(false);
    setPinValue("");
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(10, 10, 10, 0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fafafa",
      }}
    >
      <div style={{ maxWidth: 340, width: "100%", padding: 24 }}>
        {/* Operator avatar + name + role badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          {operator.avatarUrl ? (
            <img
              src={operator.avatarUrl}
              alt={operator.name}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 12,
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#27272a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <span
                style={{ color: "#fafafa", fontSize: 24, fontWeight: 700 }}
              >
                {initial}
              </span>
            </div>
          )}

          <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 18 }}>
            {operator.name}
          </span>

          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "3px 10px",
              borderRadius: 6,
              backgroundColor: badge.bg,
              color: badge.color,
              marginTop: 6,
            }}
          >
            {t(`roles.${operator.role}`, operator.role)}
          </span>

          <span
            style={{
              color: "#737373",
              fontSize: 14,
              marginTop: 12,
            }}
          >
            {t("stationLock.pinTitle", "Introduza o PIN")}
          </span>
        </div>

        {/* PIN dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            marginBottom: 8,
          }}
        >
          {Array.from({ length: pinLengthRef.current }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor:
                  i < pinValue.length ? "#fafafa" : "transparent",
                border: `2px solid ${pinError ? "#ef4444" : "#3f3f46"}`,
                transition: "background-color 0.1s, border-color 0.15s",
              }}
            />
          ))}
        </div>

        {/* Error text */}
        <p
          style={{
            color: "#ef4444",
            fontSize: 13,
            textAlign: "center",
            margin: "0 0 16px",
            minHeight: 20,
          }}
        >
          {pinError ? t("stationLock.pinError", "PIN incorreto") : ""}
        </p>

        {/* Numeric keypad */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            justifyItems: "center",
          }}
        >
          {[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "clear",
            "0",
            "back",
          ].map((key) => {
            if (key === "clear") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={handleClear}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    border: "1px solid #27272a",
                    backgroundColor: "#18181b",
                    color: "#737373",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  C
                </button>
              );
            }

            if (key === "back") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={handleBackspace}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    border: "1px solid #27272a",
                    backgroundColor: "#18181b",
                    color: "#737373",
                    fontSize: 18,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {"\u232B"}
                </button>
              );
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePinDigit(key)}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  border: "1px solid #27272a",
                  backgroundColor: "#18181b",
                  color: "#fafafa",
                  fontSize: 22,
                  fontWeight: 600,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "block",
            width: "100%",
            marginTop: 24,
            height: 44,
            borderRadius: 10,
            border: "none",
            backgroundColor: "transparent",
            color: "#737373",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {t("stationLock.back", "Voltar")}
        </button>
      </div>
    </div>
  );
}
