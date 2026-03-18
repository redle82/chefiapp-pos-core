/**
 * StaffAppShellLayout — App container unificado com TPV/Admin/KDS.
 *
 * Contrato visual: header limpo (sem sobreposição), bottom nav por papel, More sheet.
 * Identidade: mesmo dark theme, mesmos tokens, mesma marca que TPV.
 * PROIBIDO: sidebar, billing banners, portal/dashboard.
 */

import { useFormatLocale } from "@/core/i18n/useFormatLocale";
import React, { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { ChefIAppSignature } from "../../../ui/design-system/sovereign/ChefIAppSignature";
import { colors } from "../../../ui/design-system/tokens/colors";
import { LocaleSwitcher } from "../../../components/LocaleSwitcher";
import { OfflineIndicator } from "../../../ui/OfflineIndicator";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";
import { AppStaffBootScreen } from "../AppStaffBootScreen";
import { OfflineBanner } from "../components/OfflineBanner";
import { useStaff } from "../context/StaffContext";
import { getOperatorProfile } from "../data/operatorProfiles";
import {
  BOTTOM_NAV_BY_ROLE,
  canSeeMode,
} from "../visibility/appStaffVisibility";
import type { StaffModeId } from "./staffModeConfig";
import {
  getModeById,
  getModeByPath,
  isFullScreenMode,
} from "./staffModeConfig";

/** Brand gold — mesma cor do dashboard/TPV action accent. */
const actionAccent = colors.modes.dashboard.action;
const BOOT_SESSION_KEY = "chefiapp_staff_boot_shown";

/* ── More sheet domain groups ──
 * Agrupa os items do "Mais" por domínio operacional
 * em vez de uma lista solta (padrão 7shifts / Toast). */
type MoreGroup = {
  label: string;
  items: StaffModeId[];
};

const MORE_GROUPS: MoreGroup[] = [
  {
    label: "Operacao",
    items: ["operation", "tpv", "kds", "tasks", "turn", "alerts"],
  },
  {
    label: "Equipa",
    items: ["team", "schedule", "tips"],
  },
  {
    label: "Comunicacao",
    items: ["comms", "notifications"],
  },
  {
    label: "Conta",
    items: ["profile"],
  },
];

/* ── Core status dot ── */
function CoreDot({ status }: { status: string }) {
  const dotColor =
    status === "UP"
      ? "#4ade80"
      : status === "DEGRADED"
      ? "#eab308"
      : "#f87171";
  const label =
    status === "UP"
      ? "Core online"
      : status === "DEGRADED"
      ? "Core degradado"
      : "Core indisponível";
  return (
    <span
      title={label}
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        backgroundColor: dotColor,
        flexShrink: 0,
        boxShadow: `0 0 6px ${dotColor}60`,
      }}
    />
  );
}

/* ── Shift badge ── */
function ShiftBadge({ state }: { state: string }) {
  const isActive = state === "active";
  const isClosing = state === "closing";
  return (
    <span
      style={{
        fontSize: 10,
        padding: "3px 8px",
        borderRadius: 999,
        backgroundColor: isActive
          ? "rgba(34, 197, 94, 0.12)"
          : isClosing
          ? "rgba(245, 158, 11, 0.12)"
          : "rgba(148, 163, 184, 0.08)",
        color: isActive
          ? "#4ade80"
          : isClosing
          ? "#f59e0b"
          : colors.text.tertiary,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        flexShrink: 0,
        lineHeight: 1.4,
      }}
    >
      {isActive ? "ATIVO" : isClosing ? "ENCERRANDO" : "SEM TURNO"}
    </span>
  );
}

/* ── Header icon button ── */
function HeaderIconBtn({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        position: "relative",
        background: active ? "rgba(201, 162, 39, 0.12)" : "transparent",
        border: "none",
        color: active ? actionAccent.base : colors.text.tertiary,
        padding: "6px",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1,
        borderRadius: 8,
        transition: "background 0.15s",
      }}
    >
      {icon}
      {badge != null && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
          }}
        />
      )}
    </button>
  );
}

export function StaffAppShellLayout({
  children,
}: { children?: ReactNode } = {}) {
  const { activeRole, shiftState, activeLocation, specDrifts, tasks, activeWorkerId } =
    useStaff();
  const { identity } = useRestaurantIdentity();
  const { status: coreStatus } = useCoreHealth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const locale = useFormatLocale();

  const [showBoot, setShowBoot] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem(BOOT_SESSION_KEY);
  });

  const handleBootDone = React.useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setShowBoot(false);
  }, []);

  // isLauncher = any home path (root launcher or role-specific home)
  const isLauncher =
    pathname === "/app/staff/home" ||
    pathname === "/app/staff" ||
    pathname === "/app/staff/" ||
    /^\/app\/staff\/home\/(owner|manager|waiter|kitchen|cleaning|worker|delivery)/.test(
      pathname,
    );
  const currentMode = getModeByPath(pathname);
  const fullScreen = isFullScreenMode(pathname);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const profile = getOperatorProfile(activeRole ?? undefined);

  // Bottom nav: role-based mapping
  const hasMappedBottomNavRole =
    typeof activeRole === "string" && activeRole in BOTTOM_NAV_BY_ROLE;
  const navRole = hasMappedBottomNavRole ? activeRole : "manager";
  const bottomNavItems =
    BOTTOM_NAV_BY_ROLE[navRole as keyof typeof BOTTOM_NAV_BY_ROLE] ??
    BOTTOM_NAV_BY_ROLE.manager;
  const _allModeIds: StaffModeId[] = [
    "operation",
    "tpv",
    "kds",
    "tasks",
    "turn",
    "team",
    "alerts",
    "comms",
    "notifications",
    "schedule",
    "tips",
    "profile",
  ];
  const maisItems = _allModeIds.filter(
    (id) =>
      canSeeMode(navRole, id) &&
      !(bottomNavItems as readonly string[]).includes(id),
  );

  // Time display
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Page title
  const pageTitle = isLauncher
    ? profile?.roleLabel ?? "Início"
    : currentMode?.label ?? "Staff";

  // Restaurant name
  const restaurantName =
    identity.name || activeLocation?.name || "Restaurante";

  if (showBoot) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          height: "100dvh",
          backgroundColor: colors.surface.base,
          color: colors.text.primary,
          overflow: "hidden",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <AppStaffBootScreen onDone={handleBootDone} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        height: "100dvh",
        backgroundColor: colors.surface.base,
        color: colors.text.primary,
        overflow: "hidden",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* ── Header — unified with TPV visual language ── */}
      <header
        style={{
          flexShrink: 0,
          backgroundColor: "#1a1a1a",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Row 1: Restaurant identity + time + core status */}
        <div
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 10,
          }}
        >
          {/* Left: back + logo + restaurant name */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            {!isLauncher && (
              <button
                type="button"
                onClick={() => navigate("/app/staff/home")}
                aria-label="Voltar ao início"
                style={{
                  background: "none",
                  border: "none",
                  color: colors.text.secondary,
                  padding: "4px",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ←
              </button>
            )}
            <RestaurantLogo
              logoUrl={identity.logoUrl}
              name={restaurantName}
              size={28}
              style={{
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "#fafafa",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {restaurantName}
            </span>
            <CoreDot status={coreStatus} />
          </div>

          {/* Right: time + shift + locale */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: colors.text.tertiary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timeStr}
            </span>
            <ShiftBadge state={shiftState} />
            <LocaleSwitcher />
          </div>
        </div>

        {/* Row 2: Role badge + page title + quick actions */}
        {!fullScreen && (
          <div
            style={{
              height: 36,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 8,
              borderTop: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            {/* Role label + Worker name */}
            {profile && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: actionAccent.base,
                  letterSpacing: "0.02em",
                  flexShrink: 0,
                }}
              >
                {profile.roleLabel}
              </span>
            )}
            {profile && (
              <span
                style={{
                  width: 1,
                  height: 14,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  flexShrink: 0,
                }}
              />
            )}
            {/* Worker name (who's logged in) */}
            {activeWorkerId && (
              <>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fafafa",
                    letterSpacing: "0.01em",
                    flexShrink: 0,
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeWorkerId.startsWith("dev-")
                    ? profile?.name ?? activeWorkerId
                    : activeWorkerId}
                </span>
                <span
                  style={{
                    width: 1,
                    height: 14,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    flexShrink: 0,
                  }}
                />
              </>
            )}
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                color: colors.text.secondary,
                letterSpacing: "0.02em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pageTitle}
            </span>

            <HeaderIconBtn
              icon="💬"
              label="Chat da equipa"
              active={pathname.startsWith("/app/staff/home/comms")}
              onClick={() => navigate("/app/staff/home/comms")}
            />
            <HeaderIconBtn
              icon="🔔"
              label="Notificacoes"
              active={pathname.startsWith("/app/staff/home/notifications")}
              onClick={() => navigate("/app/staff/home/notifications")}
              badge={tasks.filter((t) => t.status === "pending" && t.priority === "critical").length}
            />
          </div>
        )}
      </header>

      <OfflineIndicator />
      <OfflineBanner />

      {/* ── Content area — single scroller ── */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.surface.base,
          overflow: "hidden",
        }}
      >
        <div
          key={pathname}
          className="staff-mode-transition"
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: colors.surface.base,
            overflow: isLauncher ? "hidden" : "auto",
            paddingLeft: fullScreen || isLauncher ? 0 : 16,
            paddingRight: fullScreen || isLauncher ? 0 : 16,
            paddingTop: fullScreen || isLauncher ? 0 : 12,
            paddingBottom: fullScreen || isLauncher ? 0 : 80,
          }}
        >
          {children ?? <Outlet />}
        </div>
      </main>

      {/* ── Bottom Nav — role-based action bar ── */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 4px",
          paddingBottom: "env(safe-area-inset-bottom)",
          backgroundColor: "#1a1a1a",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {bottomNavItems.map((item) => {
          if (item === "home") {
            const isHome =
              pathname.startsWith("/app/staff/home/") || isLauncher;
            return (
              <Link
                key="home"
                to={`/app/staff/home/${navRole}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  padding: "6px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: isHome ? actionAccent.base : colors.text.tertiary,
                  backgroundColor: isHome
                    ? "rgba(201, 162, 39, 0.1)"
                    : "transparent",
                  fontSize: 10,
                  fontWeight: isHome ? 700 : 500,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>🏠</span>
                Início
              </Link>
            );
          }
          const mode = getModeById(item);
          const isActive =
            pathname === mode.path || pathname.startsWith(mode.path + "/");
          return (
            <Link
              key={item}
              to={mode.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "6px 14px",
                borderRadius: 12,
                textDecoration: "none",
                color: isActive ? actionAccent.base : colors.text.tertiary,
                backgroundColor: isActive
                  ? "rgba(201, 162, 39, 0.1)"
                  : "transparent",
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{mode.icon}</span>
              {mode.shortLabel ?? mode.label}
            </Link>
          );
        })}
        {maisItems.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: "6px 14px",
              borderRadius: 12,
              border: "none",
              backgroundColor: moreOpen
                ? "rgba(201, 162, 39, 0.1)"
                : "transparent",
              color: moreOpen ? actionAccent.base : colors.text.tertiary,
              fontSize: 10,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>⋯</span>
            Mais
          </button>
        )}
      </nav>

      {/* ── More sheet ── */}
      {moreOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "#1a1a1a",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "12px 16px 24px",
              boxShadow: "0 -16px 48px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.12)",
                margin: "0 auto 16px",
              }}
            />

            {/* Grouped mode list (agrupado por domínio operacional) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              {MORE_GROUPS.map((group) => {
                const groupItems = group.items.filter((id) =>
                  maisItems.includes(id),
                );
                if (groupItems.length === 0) return null;
                return (
                  <div key={group.label}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: colors.text.tertiary,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "10px 8px 4px",
                      }}
                    >
                      {group.label}
                    </div>
                    {groupItems.map((id) => {
                      const mode = getModeById(id);
                      const isActive =
                        pathname === mode.path ||
                        pathname.startsWith(mode.path + "/");
                      const isAlert =
                        id === "alerts" && specDrifts.length > 0;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setMoreOpen(false);
                            navigate(mode.path);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                            padding: "11px 8px",
                            border: "none",
                            borderRadius: 10,
                            background: isActive
                              ? "rgba(201, 162, 39, 0.08)"
                              : "transparent",
                            color: isAlert
                              ? colors.destructive.base
                              : isActive
                                ? actionAccent.base
                                : colors.text.primary,
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 18,
                              width: 28,
                              textAlign: "center",
                            }}
                          >
                            {mode.icon}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: 14,
                              fontWeight:
                                isAlert || isActive ? 600 : 400,
                              textAlign: "left",
                            }}
                          >
                            {mode.label}
                            {isAlert
                              ? ` (${specDrifts.length})`
                              : ""}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              color: colors.text.tertiary,
                              opacity: 0.5,
                            }}
                          >
                            →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Link
                to="/app/help"
                onClick={() => setMoreOpen(false)}
                style={{
                  fontSize: 13,
                  color: colors.text.tertiary,
                  textDecoration: "none",
                }}
              >
                Ajuda
              </Link>
              <ChefIAppSignature
                variant="powered"
                size="sm"
                tone="light"
                poweredLabel="Tecnologia"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
