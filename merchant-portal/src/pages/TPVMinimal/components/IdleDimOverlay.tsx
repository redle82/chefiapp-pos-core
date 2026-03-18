/**
 * IdleDimOverlay — Full-screen overlay for Tier 1 (dimmed) idle state.
 *
 * Layout: two large panels side by side filling the screen.
 * - LEFT: Restaurant logo (huge) + name + clock
 * - RIGHT: QR code (huge) + "Scan to clock in" label
 * - Bottom center: "Tap to continue" + ChefIApp branding
 *
 * Any interaction dismisses it (resets idle timer).
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { MadeWithLoveFooter } from "../../../components/MadeWithLoveFooter";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IdleDimOverlayProps {
  /** Called when user interacts to dismiss the overlay */
  onDismiss: () => void;
  /** Restaurant name to show */
  restaurantName?: string;
  /** Restaurant ID for QR code check-in link */
  restaurantId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IdleDimOverlay({ onDismiss, restaurantName, restaurantId }: IdleDimOverlayProps) {
  const { t } = useTranslation("tpv");
  const { identity } = useRestaurantIdentity();
  const [clock, setClock] = useState(() => formatTime(new Date()));
  const [visible, setVisible] = useState(false);

  const displayName = restaurantName ?? identity?.name ?? "";

  // Fade-in animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(formatTime(new Date()));
    }, 1_000);
    return () => clearInterval(interval);
  }, []);

  // Dismiss on any key press
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      onDismiss();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      aria-label={t("autoLock.tapToContinue", "Toque para continuar")}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `rgba(0, 0, 0, ${visible ? 0.88 : 0})`,
        transition: "background-color 300ms ease-in",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Main content: Logo + QR side by side, filling the screen */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          padding: "40px 60px",
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease-in 50ms",
        }}
      >
        {/* LEFT: Restaurant logo + name + clock */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            flex: 1,
          }}
        >
          <RestaurantLogo
            logoUrl={identity?.logoUrl ?? null}
            name={displayName}
            size={220}
          />
          {displayName && (
            <span
              style={{
                color: "#fafafa",
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: 1,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </span>
          )}
          {/* Clock */}
          <span
            style={{
              color: "rgba(250, 250, 250, 0.6)",
              fontSize: 96,
              fontWeight: 200,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 4,
              lineHeight: 1,
            }}
          >
            {clock}
          </span>
        </div>

        {/* RIGHT: QR Code (huge) */}
        {restaurantId && (
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              flex: 1,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: 20,
                borderRadius: 20,
              }}
            >
              <QRCode
                value={`${window.location.origin}/app/staff/checkin?restaurant=${restaurantId}&station=tpv-central`}
                size={280}
                bgColor="#ffffff"
                fgColor="#0a0a0a"
              />
            </div>
            <span
              style={{
                fontSize: 18,
                color: "rgba(250, 250, 250, 0.5)",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {t("stationLock.scanToCheckin", "Escaneie para registar entrada")}
            </span>
          </div>
        )}
      </div>

      {/* Bottom: Tap to continue + branding */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          paddingBottom: 32,
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease-in 150ms",
        }}
      >
        <span
          style={{
            color: "rgba(250, 250, 250, 0.5)",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: 1,
          }}
        >
          {t("autoLock.tapToContinue", "Toque para continuar")}
        </span>
        <MadeWithLoveFooter variant="inline" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
