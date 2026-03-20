/**
 * UIStatePatterns -- Standardized UI state components for all surfaces.
 *
 * Provides consistent Loading, Empty, Error, Offline, PermissionDenied,
 * and NotFound states across the application.
 *
 * All components:
 * - Dark theme with amber accents (#f59e0b / #92400e / #fef3c7)
 * - Responsive (mobile + desktop)
 * - Accessible (ARIA roles, labels)
 * - i18n-ready via react-i18next (common namespace)
 */

import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";

// ---------------------------------------------------------------------------
// Shared theme tokens
// ---------------------------------------------------------------------------

const COLORS = {
  bg: "#1c1917",
  bgCard: "#292524",
  border: "#44403c",
  textPrimary: "#fef3c7",
  textSecondary: "#a8a29e",
  amber: "#f59e0b",
  amberDark: "#92400e",
  red: "#ef4444",
  redDark: "#7f1d1d",
} as const;

const baseContainer: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: COLORS.textPrimary,
  padding: "32px 24px",
  gap: 16,
};

const fullPageStyle: CSSProperties = {
  ...baseContainer,
  minHeight: "100vh",
  backgroundColor: COLORS.bg,
};

const inlineStyle: CSSProperties = {
  ...baseContainer,
  minHeight: 200,
};

const iconCircle: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  flexShrink: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: COLORS.textPrimary,
};

const descStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: COLORS.textSecondary,
  maxWidth: 400,
  lineHeight: 1.5,
};

const buttonBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.15s",
  fontFamily: "inherit",
};

const primaryButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: COLORS.amber,
  color: COLORS.bg,
};

const secondaryButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: "transparent",
  color: COLORS.amber,
  border: `1px solid ${COLORS.border}`,
};

// ---------------------------------------------------------------------------
// Shimmer keyframes (injected once)
// ---------------------------------------------------------------------------

const shimmerCSS = `
@keyframes uistate-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

let shimmerInjected = false;
function ensureShimmer() {
  if (shimmerInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = shimmerCSS;
  document.head.appendChild(style);
  shimmerInjected = true;
}

// ---------------------------------------------------------------------------
// LoadingState
// ---------------------------------------------------------------------------

export interface LoadingStateProps {
  /** Number of skeleton lines (1-5). Default 3. */
  lines?: 1 | 2 | 3 | 4 | 5;
  /** Show a circular avatar placeholder. */
  showAvatar?: boolean;
  /** Render as a full-page loader. */
  fullPage?: boolean;
}

export function LoadingState({
  lines = 3,
  showAvatar = false,
  fullPage = false,
}: LoadingStateProps) {
  const { t } = useTranslation("common");
  ensureShimmer();

  const skeletonLine = (width: string, key: number): ReactNode => (
    <div
      key={key}
      style={{
        height: 14,
        width,
        borderRadius: 6,
        background: `linear-gradient(90deg, ${COLORS.bgCard} 25%, ${COLORS.border} 50%, ${COLORS.bgCard} 75%)`,
        backgroundSize: "800px 14px",
        animation: "uistate-shimmer 1.5s infinite linear",
      }}
    />
  );

  const widths = ["80%", "60%", "70%", "50%", "90%"];

  return (
    <div
      role="status"
      aria-label={t("uiStates.loading", "Loading...")}
      aria-busy="true"
      style={fullPage ? fullPageStyle : inlineStyle}
    >
      {showAvatar && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `linear-gradient(90deg, ${COLORS.bgCard} 25%, ${COLORS.border} 50%, ${COLORS.bgCard} 75%)`,
            backgroundSize: "800px 48px",
            animation: "uistate-shimmer 1.5s infinite linear",
            marginBottom: 8,
          }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
        {Array.from({ length: lines }, (_, i) => skeletonLine(widths[i % widths.length], i))}
      </div>
      <span style={{ ...descStyle, fontSize: 12, marginTop: 4 }}>
        {t("uiStates.loading", "Loading...")}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export interface EmptyStateProps {
  /** Emoji or icon character to display. Default: inbox tray. */
  icon?: string;
  /** Heading text. */
  title: string;
  /** Description below the title. */
  description?: string;
  /** Label for the optional action button. */
  actionLabel?: string;
  /** Callback when the action button is pressed. */
  onAction?: () => void;
}

export function EmptyState({
  icon = "\uD83D\uDCE5",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { t } = useTranslation("common");

  return (
    <div role="status" style={inlineStyle}>
      <div style={{ ...iconCircle, backgroundColor: COLORS.bgCard, color: COLORS.amber }}>
        <span role="img" aria-hidden="true">{icon}</span>
      </div>
      <h3 style={titleStyle}>{title}</h3>
      {description && <p style={descStyle}>{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={primaryButton}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

export interface ErrorStateProps {
  /** Error message or Error object. */
  error: string | Error;
  /** Callback for the retry button. */
  onRetry?: () => void;
  /** Render as a full-page error. */
  fullPage?: boolean;
}

export function ErrorState({ error, onRetry, fullPage = false }: ErrorStateProps) {
  const { t } = useTranslation("common");
  const message = typeof error === "string" ? error : error.message;

  return (
    <div
      role="alert"
      style={fullPage ? fullPageStyle : inlineStyle}
    >
      <div style={{ ...iconCircle, backgroundColor: COLORS.redDark, color: "#fca5a5" }}>
        <span role="img" aria-hidden="true">!</span>
      </div>
      <h3 style={titleStyle}>
        {t("uiStates.errorTitle", "Something went wrong")}
      </h3>
      <p style={descStyle}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={primaryButton}
        >
          {t("uiStates.retry", "Try again")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OfflineState
// ---------------------------------------------------------------------------

export interface OfflineStateProps {
  /** Number of pending offline operations. */
  pendingCount?: number;
  /** Callback to force sync immediately. */
  onForceSync?: () => void;
}

export function OfflineState({ pendingCount = 0, onForceSync }: OfflineStateProps) {
  const { t } = useTranslation("common");

  return (
    <div role="status" aria-live="polite" style={inlineStyle}>
      <div style={{ ...iconCircle, backgroundColor: COLORS.amberDark, color: COLORS.textPrimary }}>
        <span role="img" aria-hidden="true">{"\u26A0\uFE0F"}</span>
      </div>
      <h3 style={titleStyle}>
        {t("uiStates.offlineTitle", "Working offline")}
      </h3>
      <p style={descStyle}>
        {t("uiStates.offlineDescription", "Changes will sync when the connection is restored.")}
      </p>
      {pendingCount > 0 && (
        <p style={{ ...descStyle, color: COLORS.amber, fontWeight: 500 }}>
          {t("uiStates.pendingCount", "{{count}} changes pending", { count: pendingCount })}
        </p>
      )}
      {onForceSync && (
        <button
          type="button"
          onClick={onForceSync}
          style={secondaryButton}
        >
          {t("uiStates.forceSync", "Sync now")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PermissionDeniedState
// ---------------------------------------------------------------------------

export interface PermissionDeniedStateProps {
  /** Role required to access this resource. */
  requiredRole: string;
  /** User's current role. */
  currentRole?: string;
}

export function PermissionDeniedState({ requiredRole, currentRole }: PermissionDeniedStateProps) {
  const { t } = useTranslation("common");

  return (
    <div role="alert" style={inlineStyle}>
      <div style={{ ...iconCircle, backgroundColor: COLORS.redDark, color: "#fca5a5" }}>
        <span role="img" aria-hidden="true">{"\uD83D\uDD12"}</span>
      </div>
      <h3 style={titleStyle}>
        {t("uiStates.permissionDeniedTitle", "Access denied")}
      </h3>
      <p style={descStyle}>
        {t("uiStates.permissionDeniedDescription", "You need the \"{{role}}\" role to access this area.", { role: requiredRole })}
      </p>
      {currentRole && (
        <p style={{ ...descStyle, fontSize: 12 }}>
          {t("uiStates.currentRole", "Your current role: {{role}}", { role: currentRole })}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotFoundState
// ---------------------------------------------------------------------------

export interface NotFoundStateProps {
  /** Callback for the back/home button. */
  onGoBack?: () => void;
}

export function NotFoundState({ onGoBack }: NotFoundStateProps) {
  const { t } = useTranslation("common");

  return (
    <div role="alert" style={fullPageStyle}>
      <div style={{ ...iconCircle, backgroundColor: COLORS.bgCard, color: COLORS.amber, fontSize: 32 }}>
        ?
      </div>
      <h3 style={{ ...titleStyle, fontSize: 48, fontWeight: 700 }}>404</h3>
      <h4 style={titleStyle}>
        {t("uiStates.notFoundTitle", "Page not found")}
      </h4>
      <p style={descStyle}>
        {t("uiStates.notFoundDescription", "The page you are looking for does not exist or has been moved.")}
      </p>
      {onGoBack && (
        <button
          type="button"
          onClick={onGoBack}
          style={primaryButton}
        >
          {t("uiStates.goBack", "Go back")}
        </button>
      )}
    </div>
  );
}
