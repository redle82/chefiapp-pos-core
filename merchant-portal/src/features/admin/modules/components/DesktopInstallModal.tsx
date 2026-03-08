/**
 * DesktopInstallModal — Shown when a deep link attempt fails (desktop app not installed).
 *
 * Provides download buttons, retry link, and navigation to /admin/devices.
 *
 * Ref: DESKTOP_DISTRIBUTION_CONTRACT, UXG-001.
 */

import { useNavigate } from "react-router-dom";
import {
  buildDeepLink,
  getDesktopOS,
} from "../../../../core/operational/platformDetection";

interface DesktopInstallModalProps {
  moduleId: "tpv" | "kds";
  restaurantId: string;
  onDismiss: () => void;
}

const DOWNLOAD_BASE =
  import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE ??
  "https://github.com/goldmonkey777/ChefIApp-POS-CORE/releases/latest/download";

/** Whether actual desktop releases are available (flip to true when P1 ships). */
export const RELEASES_AVAILABLE = false;

export function DesktopInstallModal({
  moduleId,
  restaurantId,
  onDismiss,
}: DesktopInstallModalProps) {
  const navigate = useNavigate();
  const label = moduleId === "tpv" ? "TPV" : "KDS";
  const adminOS = getDesktopOS();

  const handleRetry = () => {
    if (!RELEASES_AVAILABLE) return; // No app to launch yet
    const url = buildDeepLink(moduleId, { restaurant: restaurantId });
    window.location.href = url;
  };

  const handleGoToDevices = () => {
    onDismiss();
    navigate("/admin/devices");
  };

  const downloadFile =
    adminOS === "windows"
      ? "ChefIApp-Desktop-Setup.exe"
      : "ChefIApp-Desktop.dmg";
  const downloadLabel = adminOS === "windows" ? "Windows" : "macOS";

  return (
    <div style={overlayStyle} onClick={onDismiss}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={iconRowStyle}>
          <span style={{ fontSize: 40 }}>💻</span>
        </div>

        <h3 style={titleStyle}>Aplicación de escritorio necesaria</h3>

        <p style={descStyle}>
          Para abrir el módulo <strong>{label}</strong>, necesitas la aplicación
          de escritorio ChefIApp instalada en este equipo.
        </p>

        {/* Download button */}
        {RELEASES_AVAILABLE ? (
          <a
            href={`${DOWNLOAD_BASE}/${downloadFile}`}
            style={downloadBtnStyle}
            target="_blank"
            rel="noopener noreferrer"
          >
            Descargar para {downloadLabel}
          </a>
        ) : (
          <div style={pendingNoticeStyle}>
            🚧 La aplicación de escritorio está en desarrollo.
            <br />
            <a
              href="mailto:soporte@chefiapp.com?subject=Acceso%20anticipado%20TPV/KDS%20desktop"
              style={mailtoStyle}
            >
              Solicitar acceso anticipado
            </a>
          </div>
        )}

        {/* Actions */}
        <div style={actionsStyle}>
          <button type="button" style={btnPrimaryStyle} onClick={handleRetry}>
            🔄 Ya la tengo — reintentar
          </button>
          <button
            type="button"
            style={btnSecondaryStyle}
            onClick={handleGoToDevices}
          >
            Ir a Dispositivos
          </button>
          <button type="button" style={btnDismissStyle} onClick={onDismiss}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg-on-dark, #141414)",
  borderRadius: 14,
  border: "1px solid var(--surface-border, #333)",
  padding: "28px 24px",
  maxWidth: 440,
  width: "92vw",
  textAlign: "center",
};

const iconRowStyle: React.CSSProperties = {
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: "var(--text-primary, #fafafa)",
  margin: "0 0 10px",
};

const descStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-secondary, #a3a3a3)",
  lineHeight: 1.6,
  margin: "0 0 20px",
};

const downloadBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 24px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  backgroundColor: "#eab308",
  color: "#0a0a0a",
  textDecoration: "none",
  marginBottom: 20,
};

const pendingNoticeStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#d4a800",
  border: "1px dashed #665500",
  borderRadius: 8,
  padding: "12px 16px",
  backgroundColor: "rgba(180, 140, 0, 0.08)",
  marginBottom: 20,
  lineHeight: 1.6,
};

const mailtoStyle: React.CSSProperties = {
  color: "#eab308",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor: "var(--surface-elevated, #262626)",
  color: "var(--text-primary, #fafafa)",
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "1px solid var(--surface-border, #404040)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  backgroundColor: "transparent",
  color: "var(--text-secondary, #a3a3a3)",
};

const btnDismissStyle: React.CSSProperties = {
  padding: "6px 16px",
  border: "none",
  fontSize: 12,
  cursor: "pointer",
  backgroundColor: "transparent",
  color: "var(--text-tertiary, #666)",
};
