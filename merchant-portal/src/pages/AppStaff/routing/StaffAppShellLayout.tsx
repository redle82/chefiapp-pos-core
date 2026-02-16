/**
 * StaffAppShellLayout — App container. Shell manda no scroll; único content scroller; sem duplicar layout.
 * Contrato: docs/architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md (Visual Canon). Lei Final: docs/architecture/APPSTAFF_VISUAL_CANON.md.
 * TopBar fixa + área central (ÚNICO scroll) + Bottom Nav fixa. PROIBIDO: sidebar, portal/dashboard.
 *
 * "Ser app" = abrir sem browser (PWA instalado). Quando em browser, mostramos como abrir como app.
 */

import React, { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCoreHealth } from "../../../core/health/useCoreHealth";
import { colors } from "../../../ui/design-system/tokens/colors";
import { ChefIAppSignature } from "../../../ui/design-system/sovereign/ChefIAppSignature";
import { OfflineIndicator } from "../../../ui/OfflineIndicator";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";
import { AppStaffBootScreen } from "../AppStaffBootScreen";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
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

/** Design Contract v1: mesma cor de acção (dourado) que o dashboard para "estou no mesmo sistema". */
const actionAccent = colors.modes.dashboard.action;
const BOOT_SESSION_KEY = "chefiapp_staff_boot_shown";

export function StaffAppShellLayout({
  children,
}: { children?: ReactNode } = {}) {
  const { activeRole, shiftState, activeLocation, specDrifts, tasks } =
    useStaff();
  const { identity } = useRestaurantIdentity();
  const { status: coreStatus } = useCoreHealth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

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

  const isLauncher =
    pathname === "/app/staff/home" ||
    pathname === "/app/staff" ||
    pathname === "/app/staff/";
  const currentMode = getModeByPath(pathname);
  const fullScreen = isFullScreenMode(pathname);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const profile = getOperatorProfile(activeRole ?? undefined);

  // Bottom nav: mapa explícito por papel + modos visíveis fora do rodapé ("Mais")
  const navRole = activeRole ?? "manager";
  const bottomNavItems = BOTTOM_NAV_BY_ROLE[navRole];
  const _allModeIds: StaffModeId[] = [
    "operation",
    "tpv",
    "kds",
    "tasks",
    "turn",
    "team",
    "alerts",
    "profile",
  ];
  const maisItems = _allModeIds.filter(
    (id) =>
      canSeeMode(navRole, id) &&
      !(bottomNavItems as readonly string[]).includes(id),
  );

  const [isStandalone, setIsStandalone] = useState(false);
  const [openAsAppDismissed, setOpenAsAppDismissed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<{
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);

  useEffect(() => {
    const standalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(!!standalone);
    try {
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("chefiapp_staff_open_as_app_dismissed") === "1"
      ) {
        setOpenAsAppDismissed(true);
      }
    } catch {
      // ignore
    }
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const ev = e as unknown as {
        prompt(): Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      setInstallPrompt(ev);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", onBeforeInstall);
      return () =>
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    }
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setIsStandalone(true);
    setInstallPrompt(null);
  };

  const operationalLabel = React.useMemo(() => {
    const alertCount = specDrifts.length;
    const taskCount = tasks.length;
    if (coreStatus !== "UP") return "—";
    if (taskCount === 0 && alertCount === 0) return "OK";
    const parts: string[] = [];
    if (taskCount > 0)
      parts.push(`${taskCount} tarefa${taskCount !== 1 ? "s" : ""}`);
    if (alertCount > 0)
      parts.push(`${alertCount} alerta${alertCount !== 1 ? "s" : ""}`);
    return parts.join(" · ");
  }, [coreStatus, tasks.length, specDrifts.length]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dayStr = now.toLocaleDateString("pt-PT", { weekday: "short" });

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
      {/* TopBar mínima — contextual, não menu */}
      <header
        style={{
          flexShrink: 0,
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          backgroundColor: colors.surface.layer1,
          borderBottom: `1px solid ${colors.border.subtle}`,
          columnGap: 8,
        }}
      >
        {/* Esquerda: navegação + modo atual */}
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
                padding: 6,
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ←
            </button>
          )}
          <RestaurantLogo logoUrl={identity.logoUrl} name={(identity.name || activeLocation?.name) ?? "Restaurante"} size={28} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {activeLocation?.name ?? "Restaurante"} —{" "}
            {isLauncher
              ? profile?.roleLabel ?? "Staff"
              : currentMode?.label ?? "Staff"}
          </span>
        </div>

        {/* Centro: restaurante + hora */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
            minWidth: 0,
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: colors.text.secondary,
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {activeLocation?.name ?? "Restaurante"} • {dayStr} {timeStr}
          </span>
        </div>

        {/* Direita: estado do turno + estado operacional + dropdown ⋯ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 6,
            flexWrap: "nowrap",
            minWidth: 0,
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 999,
              backgroundColor:
                shiftState === "active"
                  ? "rgba(34, 197, 94, 0.14)"
                  : colors.surface.layer2,
              color:
                shiftState === "active"
                  ? colors.success.base
                  : colors.text.tertiary,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              flexShrink: 0,
            }}
          >
            {shiftState === "active"
              ? "TURNO ATIVO"
              : shiftState === "closing"
              ? "A ENCERRAR"
              : "SEM TURNO"}
          </span>
          {isLauncher && (
            <span
              style={{
                fontSize: 11,
                color: colors.text.tertiary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 140,
              }}
            >
              {operationalLabel}
            </span>
          )}
        </div>
      </header>

      <OfflineIndicator />

      {/* Só no browser: indica como abrir como app (sem barra de URL/abas). Instalado = standalone = não mostra. */}
      {isLauncher && !isStandalone && !openAsAppDismissed && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "6px 12px",
            backgroundColor: colors.surface.layer2,
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          <span style={{ fontSize: 11, color: colors.text.tertiary }}>
            Para abrir como aplicativo (sem browser): adicione ao ecrã inicial.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: actionAccent.text,
                  backgroundColor: actionAccent.base,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Adicionar ao ecrã
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpenAsAppDismissed(true);
                try {
                  localStorage.setItem(
                    "chefiapp_staff_open_as_app_dismissed",
                    "1",
                  );
                } catch {
                  // ignore
                }
              }}
              style={{
                background: "none",
                border: "none",
                color: colors.text.tertiary,
                cursor: "pointer",
                padding: 2,
                fontSize: 14,
                lineHeight: 1,
              }}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Área central — Shell manda no scroll. Único content scroller. Fundo contínuo (surface.base) em toda a largura para não haver faixa lateral. */}
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
            paddingTop: fullScreen || isLauncher ? 0 : 16,
            paddingBottom: fullScreen || isLauncher ? 0 : 96,
          }}
        >
          {children ?? <Outlet />}
        </div>
      </main>

      {/* Bottom Bar — painel de ação imediata por papel (BOTTOM_NAV_BY_ROLE) */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          minHeight: 56,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 8px",
          paddingBottom: "env(safe-area-inset-bottom)",
          backgroundColor: colors.surface.layer1,
          borderTop: `1px solid ${colors.border.subtle}`,
        }}
      >
        {bottomNavItems.map((item) => {
          if (item === "home") {
            return (
              <Link
                key="home"
                to={`/app/staff/home/${navRole}`}
                className="staff-bottom-nav-link"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  padding: "8px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: isLauncher
                    ? actionAccent.text
                    : colors.text.secondary,
                  backgroundColor: isLauncher
                    ? actionAccent.base
                    : "transparent",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 24 }}>🏠</span>
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
              className="staff-bottom-nav-link"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "8px 10px",
                borderRadius: 10,
                textDecoration: "none",
                color: isActive ? actionAccent.text : colors.text.secondary,
                backgroundColor: isActive ? actionAccent.base : "transparent",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 24 }}>{mode.icon}</span>
              {mode.shortLabel ?? mode.label}
            </Link>
          );
        })}
        {/* Mais — só quando há modos visíveis fora do rodapé */}
        {maisItems.length > 0 && (
          <button
            type="button"
            className="staff-bottom-nav-link"
            onClick={() => setMoreOpen(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "8px 10px",
              borderRadius: 10,
              border: "none",
              backgroundColor: moreOpen ? colors.surface.layer2 : "transparent",
              color: colors.text.secondary,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 24 }}>⋯</span>
            Mais
          </button>
        )}
      </nav>

      {/* Sheet "Mais" — modos visíveis que não estão no rodapé */}
      {moreOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            backgroundColor: "rgba(0,0,0,0.5)",
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
              backgroundColor: colors.surface.layer1,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 16,
              boxShadow: "0 -12px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 999,
                backgroundColor: colors.surface.layer2,
                margin: "0 auto 12px",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {maisItems.map((id) => {
                const mode = getModeById(id);
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
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 4px",
                      border: "none",
                      background: "none",
                      color:
                        id === "alerts" && specDrifts.length > 0
                          ? colors.destructive.base
                          : colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{mode.icon}</span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight:
                            id === "alerts" && specDrifts.length > 0
                              ? 600
                              : 500,
                        }}
                      >
                        {id === "alerts" && specDrifts.length > 0
                          ? `${mode.label} (${specDrifts.length})`
                          : mode.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 16, color: colors.text.tertiary }}>
                      →
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: `1px solid ${colors.border.subtle}`,
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
                  fontSize: 14,
                  color: colors.text.secondary,
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
