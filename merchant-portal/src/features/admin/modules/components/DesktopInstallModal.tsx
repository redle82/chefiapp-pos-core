/**
 * DesktopInstallModal — Shown when a deep link attempt fails (desktop app not installed).
 *
 * Provides download buttons, retry link, and navigation to /admin/desktop.
 * DEV mode: shows local-build instructions.
 * PROD mode: shows download link or "configure installer" CTA.
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

/**
 * Lazy env reader — avoids module-level constants that break on HMR.
 * Reads at render time so Vite hot-reload always picks up current values.
 */
function getEnv() {
  const MODE = import.meta.env.MODE ?? "development";
  const IS_DEV_LIKE = /^(development|dev|local)$/i.test(MODE);
  const INSTALL_URL_MACOS =
    import.meta.env.VITE_DESKTOP_INSTALL_URL_MACOS?.trim() ?? "";
  const INSTALL_URL_WINDOWS =
    import.meta.env.VITE_DESKTOP_INSTALL_URL_WINDOWS?.trim() ?? "";
  const DESKTOP_INSTALL_DOC_URL_MACOS =
    import.meta.env.VITE_DESKTOP_INSTALL_DOC_MACOS_URL?.trim() ?? "";
  return {
    MODE,
    IS_DEV_LIKE,
    INSTALL_URL_MACOS,
    INSTALL_URL_WINDOWS,
    DESKTOP_INSTALL_DOC_URL_MACOS,
  };
}

export function DesktopInstallModal({
  moduleId,
  restaurantId,
  onDismiss,
}: DesktopInstallModalProps) {
  const navigate = useNavigate();
  const env = getEnv();
  const label = moduleId === "tpv" ? "TPV" : "KDS";
  const adminOS = getDesktopOS();

  const handleRetry = () => {
    // Usa iframe em vez de window.location.href para não navegar
    // fora da página. A mesma técnica que launchDesktopWithHandshake.
    const url = buildDeepLink(moduleId, { restaurant: restaurantId });
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      window.setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 5000);
    } catch {
      window.location.href = url;
    }
    onDismiss();
  };

  const handleGoToDesktop = () => {
    onDismiss();
    navigate("/admin/desktop");
  };

  const installLabel = adminOS === "windows" ? "Windows" : "macOS";
  const installUrl =
    adminOS === "windows" ? env.INSTALL_URL_WINDOWS : env.INSTALL_URL_MACOS;
  const hasInstallerUrl = installUrl.length > 0;

  return (
    <div style={overlayStyle} onClick={onDismiss}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={iconRowStyle}>
          <span style={{ fontSize: 40 }}>💻</span>
        </div>

        <h3 style={titleStyle}>Aplicación de escritorio necesaria</h3>

        <p style={descStyle}>
          Para abrir el módulo <strong>{label}</strong>, necesitas la aplicación
          de escritorio ChefIApp instalada en este equipo y registrada como
          manejador oficial del protocolo <code>chefiapp-pos://</code>.
        </p>

        {/* ---------- DEV mode: local build instructions ---------- */}
        {env.IS_DEV_LIKE && !hasInstallerUrl && (
          <>
            <div style={devBannerStyle}>
              <span style={{ fontSize: 14 }}>🛠</span>
              <span style={{ fontWeight: 600, fontSize: 12 }}>
                Modo DEV — build local
              </span>
            </div>
            <div style={devInstructionsStyle}>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: "#93c5fd" }}>
                Para gerar o instalador localmente:
              </p>
              <code style={codeBlockStyle}>
                cd desktop-app && pnpm install && pnpm build && pnpm dist:mac
              </code>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#8a8a8a" }}>
                Depois instala o <strong>.dmg</strong> gerado em{" "}
                <code>/Applications</code> e clica em Reintentar.
              </p>
            </div>
          </>
        )}

        {/* ---------- PROD mode: no installer configured ---------- */}
        {!env.IS_DEV_LIKE && !hasInstallerUrl && (
          <p style={descSecondaryStyle}>
            Nenhum instalador publicado para {installLabel}. Configure as
            variáveis de ambiente <code>VITE_DESKTOP_INSTALL_URL_MACOS</code> /{" "}
            <code>VITE_DESKTOP_INSTALL_URL_WINDOWS</code> no deploy.
          </p>
        )}

        {/* ---------- Protocol handler tip ---------- */}
        <p style={descSecondaryStyle}>
          Si al intentar abrir ves una ventana genérica chamada{" "}
          <strong>Electron</strong> (e não o TPV/KDS), significa que tu macOS
          está a enviar o protocolo para o binário errado. Nesse caso, reinstala
          o ChefIApp Desktop a partir do instalador oficial e volta a testar.
        </p>

        {env.DESKTOP_INSTALL_DOC_URL_MACOS && (
          <p style={docLinkWrapperStyle}>
            <a
              href={env.DESKTOP_INSTALL_DOC_URL_MACOS}
              target="_blank"
              rel="noopener noreferrer"
              style={docLinkStyle}
            >
              Ver guia de instalação detalhada para macOS
            </a>
          </p>
        )}

        {/* Install button */}
        {hasInstallerUrl ? (
          <a
            href={installUrl}
            style={downloadBtnStyle}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instalar en {installLabel}
          </a>
        ) : !env.IS_DEV_LIKE ? (
          <button
            type="button"
            style={downloadBtnStyle}
            onClick={handleGoToDesktop}
          >
            Configurar instalador para {installLabel}
          </button>
        ) : null}

        {/* Actions */}
        <div style={actionsStyle}>
          <button type="button" style={btnPrimaryStyle} onClick={handleRetry}>
            🔄 Reintentar deep link
          </button>
          <button
            type="button"
            style={btnSecondaryStyle}
            onClick={handleGoToDesktop}
          >
            Ir a Desktop
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

const descSecondaryStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-tertiary, #8a8a8a)",
  lineHeight: 1.5,
  margin: "-8px 0 18px",
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
  border: "none",
  cursor: "pointer",
  marginBottom: 20,
};

const devBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  backgroundColor: "rgba(59, 130, 246, 0.12)",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  borderRadius: 8,
  padding: "6px 12px",
  marginBottom: 10,
  color: "#93c5fd",
};

const devInstructionsStyle: React.CSSProperties = {
  backgroundColor: "rgba(0,0,0,0.3)",
  borderRadius: 8,
  padding: "10px 14px",
  marginBottom: 16,
  textAlign: "left",
};

const codeBlockStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontFamily: "ui-monospace, monospace",
  color: "#e5e7eb",
  backgroundColor: "rgba(0,0,0,0.4)",
  borderRadius: 4,
  padding: "6px 10px",
  overflowX: "auto",
  whiteSpace: "nowrap",
};

const docLinkWrapperStyle: React.CSSProperties = {
  margin: "-4px 0 16px",
};

const docLinkStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#93c5fd",
  textDecoration: "underline",
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
