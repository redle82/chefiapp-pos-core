/**
 * TPVLayout — Layout do TPV: sidebar esquerda, header topo, área principal (Outlet).
 * Rotas: /op/tpv (index = POS), /op/tpv/orders, /op/tpv/settings.
 * Inclui TPVInstallPrompt para instalar PWA e usar sem barra do navegador.
 *
 * Integração Operacional:
 * - OperationalHeader: KPIs em tempo real (receita, pedidos, cozinha, impressora).
 */

import { Component, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../core/auth/useAuth";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";
import { OperationalHeader } from "../../components/pos/OperationalHeader";
import { TPVHeader } from "./components/TPVHeader";
import { TPVLockScreen } from "./components/TPVLockScreen";
import { TPVNotificationBar } from "./components/TPVNotificationBar";
import { TPVSidebar } from "./components/TPVSidebar";
import { OperatorProvider, useOperator } from "./context/OperatorContext";
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

/** Error boundary para conteúdo principal (KDS, POS, etc). Mostra fallback em vez de tela branca. */
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
          <span style={{ fontSize: 48 }}>⚠️</span>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Erro na visualização
          </span>
          <span style={{ fontSize: 14, color: "#8a8a8a", textAlign: "center" }}>
            Ocorreu um erro. Tente recarregar a página.
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

function TPVLayoutInner() {
  const { t } = useTranslation("tpv");
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { alerts, dismissAlert, dismissAll, emitKitchenPressure } =
    useTPVEventBridge();
  const { user } = useAuth();
  const { identity } = useRestaurantIdentity();
  const restaurantId = useTPVRestaurantId();
  const { operator, isLocked, unlock, lock } = useOperator();

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

  // KDS mode: esconde header do TPV, KPIs, notificações e footer
  const isKitchen = location.pathname.includes("/kitchen");

  // Non-POS sub-views: hide search bar + filter (irrelevant for these pages)
  const NON_POS_SUFFIXES = [
    "/screens", "/tables", "/settings", "/shift", "/orders",
    "/handoff", "/production", "/tasks", "/reservations",
    "/web-editor", "/expo", "/customer-display", "/delivery",
  ];
  const hideSearch = NON_POS_SUFFIXES.some((s) => location.pathname.endsWith(s));

  // Operator identity from lock screen selection (not hardcoded anymore)
  const staffName = operator?.name ?? "Dono";
  const staffRole = operator?.role ?? "owner";
  const staffId = user?.email ?? (user ? "—" : t("layout.owner"));
  const staffAvatarUrl = operator?.avatarUrl ?? null;

  return (
    <div
      className="tpv-layout"
      style={{
        display: "flex",
        flex: 1,
        minHeight: "100%",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fafafa",
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
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ContentBoundary>
            <Outlet context={{ searchQuery, emitKitchenPressure }} />
          </ContentBoundary>
        </main>
        {!isKitchen && <MadeWithLoveFooter variant="default" />}
      </div>
    </div>
  );
}
