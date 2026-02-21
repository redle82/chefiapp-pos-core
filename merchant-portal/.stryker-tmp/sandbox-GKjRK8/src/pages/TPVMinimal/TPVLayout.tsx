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
        backgroundColor: "#111",
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
          <Outlet context={{ searchQuery, emitKitchenPressure }} />
        </main>
        <MadeWithLoveFooter variant="default" />
      </div>
    </div>
  );
}
