/**
 * WorkerCheckInView — Tela de check-in do operador (estilo TPVLockScreen).
 * Duas formas de entrar:
 *   1. Nome manual + Entrar
 *   2. Escanear QR Code do TPV (câmera)
 * Visual unificado com TPV: fundo #0a0a0a, logo watermark, dark cards.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isDebugMode } from "../../core/debugMode";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { RestaurantLogo } from "../../ui/RestaurantLogo";
import { useStaff } from "./context/StaffContext";
import type { Employee, StaffRole } from "./context/StaffCoreTypes";


// ---------------------------------------------------------------------------
// Role badge palette (kept for employee list + PIN views)
// ---------------------------------------------------------------------------

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  owner: { bg: "rgba(249,115,22,0.15)", color: "#f97316" },
  manager: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  waiter: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  kitchen: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  cleaning: { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" },
  worker: { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" },
  delivery: { bg: "rgba(234,179,8,0.15)", color: "#facc15" },
  cashier: { bg: "rgba(234,179,8,0.15)", color: "#facc15" },
};

function badgeFor(role: string) {
  return ROLE_BADGE[role] ?? ROLE_BADGE.worker;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Dono",
  manager: "Gerente",
  waiter: "Garçom",
  kitchen: "Cozinha",
  cleaning: "Limpeza",
  worker: "Staff",
  delivery: "Entrega",
  cashier: "Caixa",
};

// ---------------------------------------------------------------------------
// QR Scanner component (uses device camera)
// ---------------------------------------------------------------------------

function QRScannerOverlay({
  onScan,
  onClose,
}: {
  onScan: (url: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setError(
            t(
              "staffCheckin.cameraError",
              "Não foi possível aceder à câmera. Verifique as permissões.",
            ),
          );
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [t]);

  // Simple QR decode polling via canvas + BarcodeDetector (if available)
  useEffect(() => {
    if (error) return;
    if (!("BarcodeDetector" in window)) return;

    const detector = new (window as any).BarcodeDetector({
      formats: ["qr_code"],
    });
    let raf: number;
    let running = true;

    async function scan() {
      if (!running || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) {
        raf = requestAnimationFrame(scan);
        return;
      }

      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          onScan(barcodes[0].rawValue);
          return;
        }
      } catch {
        // ignore detection errors
      }

      raf = requestAnimationFrame(scan);
    }

    raf = requestAnimationFrame(scan);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [error, onScan]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1px solid #27272a",
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "#fafafa",
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        ✕
      </button>

      {error ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: "#ef4444", fontSize: 15, marginBottom: 16 }}>
            {error}
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid #27272a",
              backgroundColor: "#18181b",
              color: "#fafafa",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t("back", "Voltar")}
          </button>
        </div>
      ) : (
        <>
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Scan frame overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {/* Scan frame */}
            <div
              style={{
                width: 240,
                height: 240,
                border: "3px solid rgba(201, 162, 39, 0.6)",
                borderRadius: 24,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              }}
            />
            <p
              style={{
                color: "#fafafa",
                fontSize: 14,
                fontWeight: 600,
                marginTop: 24,
                textAlign: "center",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {t(
                "staffCheckin.pointAtQR",
                "Aponte para o QR Code na tela do TPV",
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const WorkerCheckInView: React.FC = () => {
  const { t } = useTranslation("common");
  const { checkIn, employees, verifyPin, joinRemoteOperation, devQuickCheckIn } =
    useStaff();
  const { identity } = useRestaurantIdentity();


  // States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const [name, setName] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectEmployee = useCallback(
    (emp: Employee) => {
      if (emp.pin && emp.pin.length > 0) {
        setSelectedEmployee(emp);
        setPinValue("");
        setPinError(false);
      } else {
        checkIn(emp.name, emp.id);
      }
    },
    [checkIn],
  );

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (!selectedEmployee?.pin) return;
      setPinError(false);

      const next = pinValue + digit;
      const pinLength = selectedEmployee.pin.length;

      if (next.length >= pinLength) {
        const isValid = verifyPin(selectedEmployee.id, next);
        if (isValid) {
          checkIn(selectedEmployee.name, selectedEmployee.id);
        } else {
          setPinError(true);
          setPinValue("");
        }
      } else {
        setPinValue(next);
      }
    },
    [pinValue, selectedEmployee, verifyPin, checkIn],
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
    setSelectedEmployee(null);
    setPinValue("");
    setPinError(false);
  }, []);

  const handleEnter = useCallback(() => {
    if (!name.trim()) return;
    checkIn(name.trim());
  }, [name, checkIn]);

  const handleQRScan = useCallback(
    (url: string) => {
      setShowScanner(false);
      // The QR from TPVLockScreen contains a URL like:
      // {origin}/app/staff/checkin?restaurant=xxx&station=tpv-central
      try {
        const parsed = new URL(url);
        const restaurant = parsed.searchParams.get("restaurant");

        if (restaurant) {
          // QR from TPV — check in directly with name (prompt if empty)
          if (name.trim()) {
            checkIn(name.trim());
          } else {
            // Auto-generate a check-in name from the station
            const station = parsed.searchParams.get("station") ?? "staff";
            checkIn(`Staff-${station}`);
          }
          return;
        }
      } catch {
        // Not a URL — try as invite code
      }

      // Try as CHEF- invite code
      if (url.startsWith("CHEF-")) {
        joinRemoteOperation(url).then((result) => {
          if (result.success) {
            // After joining, still need to check in
            if (name.trim()) {
              checkIn(name.trim());
            }
          }
        });
      } else if (name.trim()) {
        checkIn(name.trim());
      }
    },
    [name, checkIn, joinRemoteOperation],
  );

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
    maxWidth: 380,
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
  // QR Scanner overlay
  // ---------------------------------------------------------------------------

  if (showScanner) {
    return (
      <QRScannerOverlay
        onScan={handleQRScan}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // PIN pad view (when employee with PIN is selected)
  // ---------------------------------------------------------------------------

  if (selectedEmployee) {
    const pinLength = selectedEmployee.pin?.length ?? 4;
    const badge = badgeFor(selectedEmployee.role ?? "worker");

    return (
      <div style={containerStyle}>
        {/* Restaurant logo — top */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RestaurantLogo
            logoUrl={identity?.logoUrl ?? null}
            name={identity?.name ?? ""}
            size={44}
          />
          {identity?.name && (
            <span
              style={{
                color: "rgba(250,250,250,0.4)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
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
            ← {t("back", "Voltar")}
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
              <span
                style={{ color: "#fafafa", fontSize: 24, fontWeight: 700 }}
              >
                {selectedEmployee.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 18 }}>
              {selectedEmployee.name}
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
              {ROLE_LABELS[selectedEmployee.role ?? ""] ??
                selectedEmployee.role ??
                "Staff"}
            </span>
          </div>

          {/* PIN title */}
          <p
            style={{
              color: "#737373",
              fontSize: 14,
              textAlign: "center",
              margin: "0 0 20px",
            }}
          >
            {t("staffCheckin.enterPin", "Introduza o PIN")}
          </p>

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
            {pinError ? t("staffCheckin.pinError", "PIN incorreto") : ""}
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
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24 }}>
          <MadeWithLoveFooter variant="inline" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main view: Login + QR scanner
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
              opacity: 0.06,
              userSelect: "none",
            }}
          />
        </div>
      )}

      {/* Main content — centered */}
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
        {/* Restaurant logo */}
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RestaurantLogo
            logoUrl={logoUrl ?? null}
            name={identity?.name ?? ""}
            size={100}
          />
          {identity?.name && (
            <span
              style={{
                color: "rgba(250,250,250,0.4)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {identity.name}
            </span>
          )}
        </div>

        <div style={innerStyle}>
          <p style={titleStyle}>{t("staffCheckin.hello", "Olá")}</p>
          <p style={subtitleStyle}>
            {t("staffCheckin.whoAreYou", "Quem é você?")}
          </p>

          {/* Name input */}
          <input
            type="text"
            placeholder={t("staffCheckin.yourName", "Seu Nome")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnter()}
            autoFocus
            style={{
              width: "100%",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 12,
              padding: "16px 20px",
              fontSize: 18,
              color: "#fafafa",
              outline: "none",
              textAlign: "center",
              boxSizing: "border-box",
              marginBottom: 16,
            }}
          />

          {/* Enter button */}
          <button
            type="button"
            onClick={handleEnter}
            disabled={!name.trim()}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 12,
              border: "none",
              backgroundColor: name.trim() ? "#c9a227" : "#27272a",
              color: name.trim() ? "#0a0a0a" : "#525252",
              fontSize: 16,
              fontWeight: 700,
              cursor: name.trim() ? "pointer" : "default",
              WebkitTapHighlightColor: "transparent",
              transition: "background-color 0.15s, color 0.15s",
              marginBottom: 24,
            }}
          >
            {t("staffCheckin.enter", "Entrar")}
          </button>

          {/* QR Scanner button */}
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "14px 24px",
              borderRadius: 12,
              border: "1px solid #27272a",
              backgroundColor: "transparent",
              color: "#a1a1aa",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              transition: "border-color 0.2s, color 0.2s",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            {t("staffCheckin.scanQR", "Escanear QR Code do TPV")}
          </button>

          <p
            style={{
              color: "#525252",
              fontSize: 12,
              textAlign: "center",
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            {t(
              "staffCheckin.scanHint",
              "Aponte a câmera para o QR Code na tela do terminal de vendas",
            )}
          </p>

          {/* DEBUG: Quick role entry (dev only) */}
          {isDebugMode() && (
            <div style={{ marginTop: 32 }}>
              <p
                style={{
                  color: "#525252",
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                DEBUG — ENTRAR COMO:
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {(
                  [
                    ["owner", "Dono", "#f97316"],
                    ["manager", "Gerente", "#a78bfa"],
                    ["waiter", "Garçom", "#60a5fa"],
                    ["kitchen", "Cozinha", "#4ade80"],
                    ["cleaning", "Limpeza", "#9ca3af"],
                    ["worker", "Staff", "#9ca3af"],
                    ["delivery", "Entrega", "#facc15"],
                  ] as [StaffRole, string, string][]
                ).map(([role, label, color]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => devQuickCheckIn(role)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: `1px solid ${color}40`,
                      backgroundColor: `${color}15`,
                      color,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          paddingTop: 16,
          paddingBottom: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <MadeWithLoveFooter variant="inline" />
      </div>
    </div>
  );
};
