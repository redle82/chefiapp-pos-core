import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTenant } from "../core/tenant/TenantContext";
import { TenantSelector } from "../core/tenant/TenantSelector";
import { GlobalLoadingView } from "../ui/design-system/components";
import styles from "./SelectTenantPage.module.css";

/**
 * Página de seleção de tenant (/app/select-tenant).
 * - 0 memberships → redirect /bootstrap
 * - 1 membership → auto-select e redirect /dashboard
 * - >1 memberships → lista (TenantSelector full); após seleção redirect /dashboard
 */
export function SelectTenantPage() {
  const { memberships, isLoading, switchTenant, tenantId } = useTenant();
  const navigate = useNavigate();
  const autoSelectDoneRef = useRef(false);

  // 1 membership: auto-select e redirect (uma vez)
  useEffect(() => {
    if (isLoading || memberships.length !== 1 || autoSelectDoneRef.current)
      return;
    autoSelectDoneRef.current = true;
    switchTenant(memberships[0].restaurant_id);
    navigate("/dashboard", { replace: true });
  }, [isLoading, memberships, switchTenant, navigate]);

  // >1 memberships: após utilizador escolher, redirect para dashboard
  useEffect(() => {
    if (memberships.length <= 1 || !tenantId) return;
    navigate("/dashboard", { replace: true });
  }, [memberships.length, tenantId, navigate]);

  if (isLoading) {
    return (
      <GlobalLoadingView
        message="A carregar..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  if (memberships.length === 0) {
    return <Navigate to="/bootstrap" replace />;
  }

  if (memberships.length === 1) {
    return (
      <GlobalLoadingView
        message="A redirecionar..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <TenantSelector compact={false} />
    </div>
  );
}
