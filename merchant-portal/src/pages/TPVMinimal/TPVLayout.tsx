/**
 * TPVLayout — Layout do TPV: sidebar esquerda, header topo, area principal (Outlet).
 * Rotas: /op/tpv (index = POS), /op/tpv/orders, /op/tpv/settings.
 * Inclui TPVInstallPrompt para instalar PWA e usar sem barra do navegador.
 *
 * Integracao Operacional:
 * - OperationalHeader: KPIs em tempo real (receita, pedidos, cozinha, impressora).
 * - Auto-lock: 3-tier idle protection (dim -> lock -> expire).
 */

import { Component, type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../core/auth/useAuth";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";
import { SkipLinks } from "../../components/common/SkipLinks";
import { LiveRegion } from "../../components/common/LiveRegion";
import { OperationalHeader } from "../../components/pos/OperationalHeader";
import { IdleDimOverlay } from "./components/IdleDimOverlay";
import { StationLockScreen } from "./components/StationLockScreen";
import { TPVHeader } from "./components/TPVHeader";
import { TPVLockScreen } from "./components/TPVLockScreen";
import { TPVNotificationBar } from "./components/TPVNotificationBar";
import { TPVSidebar } from "./components/TPVSidebar";
import { TPVActivationChecklist } from "../../components/tpv/TPVActivationChecklist";
import { useOperationalActivation } from "../../core/setup/useOperationalActivation";
import { OperatorProvider, useOperator } from "./context/OperatorContext";
import { useAutoLock } from "./hooks/useAutoLock";
import { useTPVEventBridge } from "./hooks/useTPVEventBridge";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

/** Error boundary local: se o header operacional falhar, o TPV continua a carregar. */
class OperationalHeaderBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[TPV] OperationalHeader error (TPV continues):", error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Error boundary para conteudo principal (KDS, POS, etc). Mostra fallback em vez de tela branca. */
class ContentBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: unknown }
> {
  state: { hasError: boolean; error: unknown } = { hasError: false, error: null };
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown) {
    console.error("[TPV] Content crash (showing fallback):", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "#fafafa",
            padding: 32,
          }}
        >
          <span style={{ fontSize: 48 }}>&#x26A0;&#xFE0F;</span>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Erro na visualizacao
          </span>
          <span style={{ fontSize: 14, color: "#8a8a8a", textAlign: "center" }}>
            Ocorreu um erro. Tente recarregar a pagina.
          </span>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "#f97316",
              color: "#0a0a0a",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function TPVLayout() {
  const restaurantId = useTPVRestaurantId();

  return (
    <OperatorProvider restaurantId={restaurantId}>
      <TPVLayoutInner />
    </OperatorProvider>
  );
}

// ---------------------------------------------------------------------------
// Routes exempt from auto-lock (KDS, customer display)
// ---------------------------------------------------------------------------

const EXEMPT_PATTERNS = ["/kitchen", "/screen/", "/customer-display"];

function isAutoLockExempt(pathname: string): boolean {
  return EXEMPT_PATTERNS.some((p) => pathname.includes(p));
}

// ---------------------------------------------------------------------------
// Inner layout with auto-lock integration
// ---------------------------------------------------------------------------

function TPVLayoutInner() {
  const { t } = useTranslation("tpv");
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { alerts, dismissAlert, dismissAll, emitKitchenPressure } =
    useTPVEventBridge();
  const { user } = useAuth();
  const { identity } = useRestaurantIdentity();
  const restaurantId = useTPVRestaurantId();
  const { operator, isLocked, isSessionLocked, unlock, lock, lockSession, unlockSession } = useOperator();

  // Operational activation: show checklist overlay when restaurant is not yet operational
  const { isOperational: isRestaurantOperational } = useOperationalActivation();
  const [activationSkipped, setActivationSkipped] = useState(false);
  const showActivation = !isRestaurantOperational && !activationSkipped;

  // Auto-lock: exempt KDS / customer display routes
  const exempt = isAutoLockExempt(location.pathname);
  const { idleState, resetIdle } = useAutoLock({
    enabled: !exempt && !isLocked,
  });

  // React to idle state transitions
  useEffect(() => {
    if (idleState === "locked" && !isSessionLocked) {
      lockSession();
    }
  }, [idleState, isSessionLocked, lockSession]);

  useEffect(() => {
    if (idleState === "expired") {
      lock();
    }
  }, [idleState, lock]);

  // When session is unlocked (PIN entered), reset idle timer
  useEffect(() => {
    if (!isSessionLocked && idleState === "locked") {
      resetIdle();
    }
  }, [isSessionLocked, idleState, resetIdle]);

  // Announcements for screen readers (status changes)
  const [a11yAnnouncement, setA11yAnnouncement] = useState("");

  // Lock screen: no operator selected yet
  if (isLocked) {
    return (
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: "100%",
          backgroundColor: "#0a0a0a",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#fafafa",
        }}
      >
        <TPVLockScreen onUnlock={unlock} restaurantId={restaurantId} />
      </div>
    );
  }

  // KDS mode: esconde header do TPV, KPIs, notificacoes e footer
  const isKitchen = location.pathname.includes("/kitchen");

  // Non-POS sub-views: hide search bar + filter (irrelevant for these pages)
  const NON_POS_SUFFIXES = [
    "/screens", "/tables", "/settings", "/shift", "/orders",
    "/handoff", "/production", "/tasks", "/reservations",
    "/web-editor", "/expo", "/customer-display", "/delivery",
    "/printers", "/dashboard", "/qr-codes",
  ];
  const hideSearch = NON_POS_SUFFIXES.some((s) => location.pathname.endsWith(s));

  // Operator identity from lock screen selection (not hardcoded anymore)
  const staffName = operator?.name ?? "Dono";
  const staffRole = operator?.role ?? "owner";
  const staffId = user?.email ?? (user ? "\u2014" : t("layout.owner"));
  const staffAvatarUrl = operator?.avatarUrl ?? null;

  const restaurantName =
    identity?.name ?? t("sidebar.restaurantName", "Restaurante");

  // Expose announcement setter via outlet context so child pages can announce
  const announceStatus = (msg: string) => setA11yAnnouncement(msg);

  return (
    <div
      className="tpv-layout"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: "100%",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fafafa",
      }}
    >
      {/* Skip navigation links for keyboard users */}
      <SkipLinks />

      {/* Operational activation checklist — shown before TPV is operational */}
      {showActivation && (
        <TPVActivationChecklist
          onSkip={() => setActivationSkipped(true)}
          onAction={(key) => {
            if (key === "open-shift") {
              // Will be handled by the shift opening flow
              setActivationSkipped(true);
            } else if (key === "test-order") {
              setActivationSkipped(true);
            }
          }}
        />
      )}

      {/* ARIA live region for dynamic announcements */}
      <LiveRegion message={a11yAnnouncement} />

      {/* Tier 1: Dim overlay */}
      {idleState === "dimmed" && !isSessionLocked && (
        <IdleDimOverlay
          onDismiss={resetIdle}
          restaurantName={restaurantName}
          restaurantId={restaurantId}
        />
      )}

      {/* Tier 2: Station lock screen */}
      {isSessionLocked && operator && (
        <StationLockScreen
          operator={operator}
          restaurantId={restaurantId}
          onUnlockSession={unlockSession}
          onLock={lock}
        />
      )}

      {/* Header full-width — above sidebar + content */}
      {!isKitchen && (
        <TPVHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hideSearch={hideSearch}
          staffName={staffName}
          staffId={staffId}
          staffRole={staffRole}
          staffAvatarUrl={staffAvatarUrl}
          onLock={lock}
        />
      )}

      {/* Sidebar + content area — below header */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
        }}
      >
        <TPVSidebar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          }}
        >
          {!isKitchen && (
            <OperationalHeaderBoundary>
              <OperationalHeader />
            </OperationalHeaderBoundary>
          )}
          {!isKitchen && (
            <TPVNotificationBar
              alerts={alerts}
              onDismiss={dismissAlert}
              onDismissAll={dismissAll}
            />
          )}
          <main
            id="main-content"
            style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ContentBoundary>
              <Outlet context={{ searchQuery, emitKitchenPressure, announceStatus }} />
            </ContentBoundary>
          </main>
          {!isKitchen && <MadeWithLoveFooter variant="default" />}
        </div>
      </div>
    </div>
  );
}
