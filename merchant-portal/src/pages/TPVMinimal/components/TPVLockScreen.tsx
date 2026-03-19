/**
 * TPVLockScreen — Full-screen operator selection + PIN gate.
 * Shows a grid of active staff members. Tapping one either unlocks
 * immediately (no PIN) or presents a numeric PIN pad for verification.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { MadeWithLoveFooter } from "../../../components/MadeWithLoveFooter";
import type { UserRole } from "../../../core/context/ContextTypes";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";
import type { Operator } from "../context/OperatorContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TPVLockScreenProps {
  onUnlock: (operator: Operator) => void;
  restaurantId: string;
}

interface StaffRow {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
  pin: string | null;
}

// ---------------------------------------------------------------------------
// Role badge palette
// ---------------------------------------------------------------------------

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  owner: { bg: "rgba(249,115,22,0.15)", color: "#f97316" },
  manager: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  waiter: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  kitchen: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  cashier: { bg: "rgba(234,179,8,0.15)", color: "#facc15" },
  staff: { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" },
};

function badgeFor(role: string) {
  return ROLE_BADGE[role] ?? ROLE_BADGE.staff;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TPVLockScreen({ onUnlock, restaurantId }: TPVLockScreenProps) {
  const { t } = useTranslation("tpv");
  const { identity } = useRestaurantIdentity();

  // Staff list (without pin — pin is stored separately in a ref)
  const [staffList, setStaffList] = useState<Omit<StaffRow, "pin">[]>([]);
  const [loading, setLoading] = useState(true);

  // PIN entry state
  const [selectedOperator, setSelectedOperator] = useState<Omit<StaffRow, "pin"> | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);

  // Keep PINs out of rendered state for security
  const pinMapRef = useRef<Map<string, string | null>>(new Map());

  // Fetch staff on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchStaff() {
      setLoading(true);
      try {
        const { data } = await dockerCoreClient
          .from("gm_staff")
          .select("id, name, role, active, pin")
          .eq("restaurant_id", restaurantId)
          .eq("active", true);

        if (cancelled) return;

        const rows = (data ?? []) as StaffRow[];
        const map = new Map<string, string | null>();
        const safe: Omit<StaffRow, "pin">[] = [];

        for (const row of rows) {
          map.set(row.id, row.pin);
          safe.push({ id: row.id, name: row.name, role: row.role, active: row.active });
        }

        pinMapRef.current = map;
        setStaffList(safe);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStaff();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectStaff = useCallback(
    (staff: Omit<StaffRow, "pin">) => {
      const pin = pinMapRef.current.get(staff.id);
      if (!pin) {
        // No PIN — unlock directly
        onUnlock({ id: staff.id, name: staff.name, role: staff.role });
        return;
      }
      setSelectedOperator(staff);
      setPinValue("");
      setPinError(false);
    },
    [onUnlock],
  );

  const handleOwnerBypass = useCallback(() => {
    onUnlock({ id: "owner-session", name: "Dono", role: "owner" as UserRole });
  }, [onUnlock]);

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (!selectedOperator) return;
      setPinError(false);

      const next = pinValue + digit;
      const storedPin = pinMapRef.current.get(selectedOperator.id);

      if (!storedPin) return;

      if (next.length >= storedPin.length) {
        if (next === storedPin) {
          onUnlock({
            id: selectedOperator.id,
            name: selectedOperator.name,
            role: selectedOperator.role,
          });
        } else {
          setPinError(true);
          setPinValue("");
        }
      } else {
        setPinValue(next);
      }
    },
    [pinValue, selectedOperator, onUnlock],
  );

  const handlePinBackspace = useCallback(() => {
    setPinError(false);
    setPinValue((v) => v.slice(0, -1));
  }, []);

  const handlePinClear = useCallback(() => {
    setPinError(false);
    setPinValue("");
  }, []);

  const handleBack = useCallback(() => {
    setSelectedOperator(null);
    setPinValue("");
    setPinError(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    height: "100%",
    backgroundColor: "#0a0a0a",
    boxSizing: "border-box",
    padding: 24,
    overflow: "auto",
    position: "relative",
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 600,
    width: "100%",
  };

  const titleStyle: React.CSSProperties = {
    color: "#fafafa",
    fontWeight: 700,
    fontSize: 22,
    margin: 0,
    textAlign: "center",
  };

  const subtitleStyle: React.CSSProperties = {
    color: "#737373",
    fontSize: 14,
    margin: "8px 0 28px",
    textAlign: "center",
  };

  // ---------------------------------------------------------------------------
  // PIN pad view
  // ---------------------------------------------------------------------------

  if (selectedOperator) {
    const storedPin = pinMapRef.current.get(selectedOperator.id);
    const pinLength = storedPin?.length ?? 4;
    const badge = badgeFor(selectedOperator.role);

    return (
      <div style={containerStyle}>
        {/* Restaurant logo — top */}
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <RestaurantLogo
            logoUrl={identity?.logoUrl ?? null}
            name={identity?.name ?? ""}
            size={44}
          />
          {identity?.name && (
            <span style={{ color: "rgba(250,250,250,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
              {identity.name}
            </span>
          )}
        </div>

        <div style={{ ...innerStyle, maxWidth: 340 }}>
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              color: "#737373",
              fontSize: 14,
              cursor: "pointer",
              padding: "4px 0",
              marginBottom: 24,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ← {t("lockScreen.back", "Voltar")}
          </button>

          {/* Operator avatar + name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
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
              <span style={{ color: "#fafafa", fontSize: 24, fontWeight: 700 }}>
                {selectedOperator.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 18 }}>
              {selectedOperator.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                backgroundColor: badge.bg,
                color: badge.color,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              {t(`operational:roles.${selectedOperator.role}`, selectedOperator.role)}
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
            {Array.from({ length: pinLength }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: i < pinValue.length ? "#fafafa" : "transparent",
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
            {pinError ? t("lockScreen.pinError", "PIN incorreto") : ""}
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
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"].map(
              (key) => {
                if (key === "clear") {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={handlePinClear}
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
                      onClick={handlePinBackspace}
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
                      ⌫
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
              },
            )}
          </div>
        </div>

        {/* ChefIApp branding — bottom */}
        <div style={{ marginTop: 24 }}>
          <MadeWithLoveFooter variant="inline" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Staff grid view
  // ---------------------------------------------------------------------------

  const logoUrl = identity?.logoUrl;

  return (
    <div style={containerStyle}>
      {/* Background: restaurant logo full-screen watermark */}
      {logoUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={logoUrl}
            alt=""
            style={{
              width: "180vmin",
              height: "180vmin",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              opacity: 0.08,
              userSelect: "none",
            }}
          />
        </div>
      )}

      {/* TOP section: Logo + title + staff grid (centered, grows) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Restaurant logo — top (small) */}
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <RestaurantLogo
            logoUrl={logoUrl ?? null}
            name={identity?.name ?? ""}
            size={200}
          />
          {identity?.name && (
            <span style={{ color: "rgba(250,250,250,0.4)", fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>
              {identity.name}
            </span>
          )}
        </div>

        <div style={innerStyle}>
          <p style={titleStyle}>{t("lockScreen.title", "Quem vai operar?")}</p>
          <p style={subtitleStyle}>{t("lockScreen.subtitle", "Selecione o operador para continuar")}</p>

          {loading && (
            <p style={{ color: "#737373", textAlign: "center", fontSize: 14 }}>...</p>
          )}

          {!loading && staffList.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ color: "#737373", fontSize: 15, margin: "0 0 8px" }}>
                {t("lockScreen.noStaff", "Nenhum operador encontrado")}
              </p>
              <p style={{ color: "#525252", fontSize: 13, margin: 0 }}>
                {t("lockScreen.noStaffHint", "Adicione operadores nas configuracoes do restaurante")}
              </p>
            </div>
          )}

          {!loading && staffList.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 14,
              }}
            >
              {staffList.map((staff) => {
                const badge = badgeFor(staff.role);

                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleSelectStaff(staff)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 140,
                      borderRadius: 16,
                      border: "1px solid #27272a",
                      backgroundColor: "#18181b",
                      cursor: "pointer",
                      padding: "16px 12px",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s, background-color 0.15s",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: "#27272a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ color: "#fafafa", fontSize: 18, fontWeight: 700 }}>
                        {staff.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>

                    {/* Name */}
                    <span
                      style={{
                        color: "#fafafa",
                        fontWeight: 600,
                        fontSize: 14,
                        margin: 0,
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {staff.name}
                    </span>

                    {/* Role badge */}
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        marginTop: 6,
                      }}
                    >
                      {t(`operational:roles.${staff.role}`, staff.role)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* "Continuar como Dono" fallback button */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
            <button
              type="button"
              onClick={handleOwnerBypass}
              style={{
                background: "none",
                border: "1px solid #27272a",
                borderRadius: 10,
                color: "#737373",
                fontSize: 13,
                fontWeight: 500,
                padding: "10px 20px",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                transition: "border-color 0.15s",
              }}
            >
              {t("lockScreen.continueAsOwner", "Continuar como Dono")}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM section: QR Code pinned at bottom — bigger */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          paddingTop: 20,
          paddingBottom: 8,
          borderTop: "1px solid #1a1a1a",
          width: "100%",
          maxWidth: 600,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#525252",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          {t("stationLock.scanToCheckin", "Escaneie para registar entrada")}
        </span>
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: 16,
            borderRadius: 16,
          }}
        >
          <QRCode
            value={`${window.location.origin}/app/staff/checkin?restaurant=${restaurantId}&station=tpv-central`}
            size={180}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>
        <span style={{ fontSize: 15, color: "#52525b", fontWeight: 500 }}>
          {t("stationLock.scanHint", "Use o AppStaff para registar entrada")}
        </span>
      </div>

      {/* ChefIApp branding — very bottom */}
      <div style={{ flexShrink: 0, paddingTop: 8, paddingBottom: 4, position: "relative", zIndex: 1 }}>
        <MadeWithLoveFooter variant="inline" />
      </div>
    </div>
  );
}
