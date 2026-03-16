/**
 * TPVLayout — Layout do TPV: sidebar esquerda, header topo, área principal (Outlet).
 * Rotas: /op/tpv (index = POS), /op/tpv/orders, /op/tpv/settings.
 * Inclui TPVInstallPrompt para instalar PWA e usar sem barra do navegador.
 *
 * Integração Operacional:
 * - OperationalHeader: KPIs em tempo real (receita, pedidos, cozinha, impressora).
 */

import { Component, type ReactNode, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";
import { OperationalHeader } from "../../components/pos/OperationalHeader";
import { TPVHeader } from "./components/TPVHeader";
import { TPVNotificationBar } from "./components/TPVNotificationBar";
import { TPVSidebar } from "./components/TPVSidebar";
import { useTPVEventBridge } from "./hooks/useTPVEventBridge";

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
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { alerts, dismissAlert, dismissAll, emitKitchenPressure } =
    useTPVEventBridge();

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
        <TPVHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => {}}
        />
        <OperationalHeaderBoundary>
          <OperationalHeader />
        </OperationalHeaderBoundary>
        <TPVNotificationBar
          alerts={alerts}
          onDismiss={dismissAlert}
          onDismissAll={dismissAll}
        />
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
        <MadeWithLoveFooter variant="default" />
      </div>
    </div>
  );
}
