import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isDebugMode } from "../core/debugMode";
import {
  getOperationalStateBlockReason,
  hasActiveOperationalState,
} from "../core/gate/OperationalStateGuard";
import { Logger } from "../core/logger";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";
import { useTenant } from "../core/tenant/TenantContext";
import { getActiveTenant } from "../core/tenant/TenantResolver";
import { OrderProvider } from "../pages/TPV/context/OrderContextReal";
import { TableProvider } from "../pages/TPV/context/TableContext";
import { LoadingState } from "../ui/design-system/components/LoadingState";
// DOCKER CORE: Kernel removido - acesso direto ao Core via PostgREST/RPCs
// import { KernelProvider } from '../core/kernel/KernelContext'; // REMOVIDO
import { TerminalHeartbeatGuard } from "../components/terminal/TerminalHeartbeatGuard";
import { ContextEngineProvider } from "../core/context";
import { FiscalQueue } from "../core/fiscal/FiscalQueueWorker";
import { useShiftLock } from "../hooks/useShiftLock";
import { OfflineOrderProvider } from "../pages/TPV/context/OfflineOrderContext";

interface Props {
  children: ReactNode;
}

class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            color: "red",
            background: "white",
            zIndex: 9999,
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
        >
          <h1>💥 Critical Render Error</h1>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ fontSize: 12 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * AppDomainWrapper
 *
 * 🏛️ SOVEREIGN DOMAIN WRAPPER
 *
 * This component bridges the Gate layer (TenantContext) with the Domain layer
 * (OrderContext, TableContext). It MUST be rendered inside TenantProvider.
 *
 * LAW: Domain modules receive tenantId from Gate, they do NOT query storage.
 *
 * P0.2 GUARD: Blocks tenant switch if there's active operational state.
 * Uses centralized OperationalStateGuard for consistency.
 *
 * Hierarchy:
 * - TenantProvider (Gate - provides tenantId)
 *   - AppDomainWrapper (this component)
 *     - OrderProvider (Domain - receives tenantId)
 *       - TableProvider (Domain - receives tenantId)
 */

function ShiftLockGuard({ children }: { children: ReactNode }) {
  useShiftLock();
  return <>{children}</>;
}

export function AppDomainWrapper({ children }: Props) {
  const { tenantId, isLoading, memberships, restaurant } = useTenant();
  const location = useLocation();

  // Start Fiscal Worker Lifecycle
  useEffect(() => {
    FiscalQueue.start();
    return () => FiscalQueue.stop();
  }, []);

  // Extract Role for Context Engine
  const currentMembership = memberships.find(
    (m) => m.restaurant_id === tenantId,
  );

  // Extract Infrastructure (hasTPV) from Topology
  // Default to TRUE (Satellite Mode) if undefined for legacy compatibility.
  // Explicit false in topology triggers Standalone Mode.
  const hasTPV = restaurant?.topology?.hasTPV !== false;

  const navigate = useNavigate();
  const previousTenantRef = useRef<string | null>(null);
  const [tenantSwitchBlocked, setTenantSwitchBlocked] = useState(false);
  const [_blockReason, setBlockReason] = useState<string | null>(null);

  // =========================================================================
  // FAIL-CLOSED: If Gate did not seal tenantId, force user back to Tenant Gate.
  // Prevents "Contexto operacional não disponível" limbo + stops mount/unmount loops.
  // DEV_STABLE_MODE: Não redirecionar se já estiver em /app/select-tenant (é o estado esperado).
  // =========================================================================
  useEffect(() => {
    if (isLoading) return;

    // Exempt routes that don't require tenant
    const exemptRoutes = [
      "/app/select-tenant",
      "/app/access-denied",
      "/app/paused",
      "/app/suspended",
      "/app/operation-status",
    ];

    if (exemptRoutes.some((route) => location.pathname.startsWith(route))) {
      return;
    }

    // Bypass: TPV/KDS/Waiter sem tenant só com pedido explícito (?debug=1)
    if (
      isDebugMode() &&
      (location.pathname.includes("/tpv") ||
        location.pathname.includes("/kds") ||
        location.pathname.includes("/waiter"))
    ) {
      return;
    }

    // Don't redirect when tenant is already sealed in storage (FlowGate will handle 404 and redirect to bootstrap)
    const sealedOrStored =
      getActiveTenant() || getTabIsolated("chefiapp_restaurant_id");
    if (!tenantId && location.pathname.startsWith("/app/") && !sealedOrStored) {
      // Only redirect if not already on select-tenant (prevent redirect loops)
      if (location.pathname !== "/app/select-tenant") {
        // Save the original route so we can return to it after tenant selection
        try {
          sessionStorage.setItem("chefiapp_return_to", location.pathname);
          console.log(
            "[AppDomainWrapper] Saved return route before redirect:",
            location.pathname,
          );
        } catch (_e) {
          // Ignore storage errors
        }
        console.warn(
          "[AppDomainWrapper] No tenantId - redirecting to /app/select-tenant",
          {
            path: location.pathname,
          },
        );
        // Use navigate instead of window.location.assign to preserve sessionStorage
        navigate("/app/select-tenant", { replace: true });
      }
    }
  }, [tenantId, isLoading, location.pathname]);

  // =========================================================================
  // P0.2 GUARD: Block tenant switch with active operational state
  // Risk: R-023 (🔴 Critical → ✅ FIXED)
  // Uses centralized OperationalStateGuard
  // =========================================================================
  useEffect(() => {
    // Skip if first mount or still loading
    if (isLoading || !tenantId) return;

    const previousTenant = previousTenantRef.current;

    // Detect tenant change
    if (previousTenant && previousTenant !== tenantId) {
      // Check for active operational state using centralized guard
      if (hasActiveOperationalState()) {
        const reason = getOperationalStateBlockReason();

        Logger.warn("TENANT_SWITCH_BLOCKED", {
          previousTenant,
          attemptedTenant: tenantId,
          reason: reason || "Active operational state",
        });

        setBlockReason(reason);
        setTenantSwitchBlocked(true);

        console.error(
          `[P0.2 GUARD] Tenant switch blocked: ${previousTenant} → ${tenantId}. ` +
            `Reason: ${reason}`,
        );
        return;
      }

      Logger.info("TENANT_SWITCH_ALLOWED", {
        previousTenant,
        newTenant: tenantId,
        reason: "No active operational state",
      });
    }

    // Update ref for next check
    previousTenantRef.current = tenantId;
    setTenantSwitchBlocked(false);
    setBlockReason(null);
  }, [tenantId, isLoading]);

  // P0.2: Block render if tenant switch was blocked
  if (tenantSwitchBlocked) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          color: "#ff4444",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            ⚠️ Troca de restaurante bloqueada
          </p>
          <p
            style={{ fontSize: "0.9rem", color: "#999", marginBottom: "1rem" }}
          >
            Existe um pedido ativo ou operações pendentes. Finalize ou cancele
            antes de trocar.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#333",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  // GATE ENFORCEMENT: Wait for tenant to be resolved
  // DEV_STABLE_MODE: Não mostrar loading na tela de seleção de tenant
  // A tela de seleção é justamente o mecanismo para obter tenantId
  const exemptRoutes = [
    "/app/select-tenant",
    "/app/access-denied",
    "/app/paused",
    "/app/suspended",
    "/app/operation-status",
  ];
  const isExemptRoute = exemptRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  // Bypass loading: TPV/KDS/Waiter com ?debug=1 ou ?mode=trial
  const params = new URLSearchParams(location.search);
  const isTrial = params.get("mode") === "trial";
  const isTPVBypass =
    isDebugMode() &&
    (location.pathname.includes("/tpv") ||
      location.pathname.includes("/kds") ||
      location.pathname.includes("/waiter") ||
      isTrial);

  if (isLoading && !isExemptRoute && !isTPVBypass) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
        }}
      >
        <LoadingState
          variant="spinner"
          spinnerSize="lg"
          message="Resolvendo contexto operacional..."
        />
      </div>
    );
  }

  /**
   * 🔒 GATE EXEMPTION (Select Tenant)
   * A tela de seleção é justamente o mecanismo para obter tenantId.
   * Portanto, ela precisa renderizar mesmo quando tenantId ainda é null.
   * DEV_STABLE_MODE: Esta é a única entrada permitida quando não há tenant selado.
   */
  if (
    location.pathname.startsWith("/app/select-tenant") ||
    location.pathname.startsWith("/app/access-denied")
  ) {
    return <>{children}</>;
  }

  // GATE ENFORCEMENT: No tenant = no domain access
  if (!tenantId) {
    // Bypass: TPV/KDS/Waiter com mock tenantId só com ?debug=1 ou ?mode=trial
    if (
      isDebugMode() &&
      (location.pathname.includes("/tpv") ||
        location.pathname.includes("/kds") ||
        location.pathname.includes("/waiter") ||
        isTrial)
    ) {
      const DEV_TENANT_ID =
        import.meta.env.VITE_DEV_DEFAULT_TENANT ||
        "6d676ae5-2375-42d2-8db3-e4e80ddb1b76";
      // Render with mock tenantId
      return (
        <ErrorBoundary>
          <ContextEngineProvider
            userRole={"waiter"} // Lowercase
            hasTPV={true}
          >
            <OfflineOrderProvider>
              <OrderProvider restaurantId={DEV_TENANT_ID}>
                <ShiftLockGuard>
                  <TableProvider restaurantId={DEV_TENANT_ID}>
                    {children}
                  </TableProvider>
                </ShiftLockGuard>
              </OrderProvider>
            </OfflineOrderProvider>
          </ContextEngineProvider>
        </ErrorBoundary>
      );
    }

    // This should not happen if FlowGate is working correctly
    // No-tenant warning is logged via useEffect above to comply with React 19

    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          color: "#ff4444",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p>⚠️ Contexto operacional não disponível</p>
          <p style={{ fontSize: "0.8rem", color: "#666" }}>
            Tente recarregar a página ou selecionar um restaurante.
          </p>
        </div>
      </div>
    );
  }

  // SOVEREIGN INJECTION: Pass tenantId to Domain providers
  // DOCKER CORE: KernelProvider removido - acesso direto ao Core
  return (
    <ContextEngineProvider
      userRole={(currentMembership?.role?.toLowerCase() as any) || "waiter"} // Map to lowercase UserRole
      hasTPV={hasTPV}
    >
      <TerminalHeartbeatGuard restaurantId={tenantId}>
        <OfflineOrderProvider>
          <OrderProvider restaurantId={tenantId}>
            <ShiftLockGuard>
              <TableProvider restaurantId={tenantId}>{children}</TableProvider>
            </ShiftLockGuard>
          </OrderProvider>
        </OfflineOrderProvider>
      </TerminalHeartbeatGuard>
    </ContextEngineProvider>
  );
}
