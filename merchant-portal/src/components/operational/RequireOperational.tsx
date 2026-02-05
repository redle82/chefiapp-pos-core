/**
 * RequireOperational - Gate de Segurança para Apps de Operação
 *
 * Quando surface é passado, usa ORE (useOperationalReadiness) como fonte única de verdade.
 * Quando surface não é passado, mantém comportamento legado (isPublished apenas) para rotas genéricas.
 *
 * TRIAL_TO_PAID_CONTRACT: trial não bloqueia operação; billing não é pré-requisito para operar.
 * Só bloqueia quando billing_status é past_due ou suspended/canceled (BILLING_SUSPENSION_CONTRACT).
 *
 * @see docs/contracts/TRIAL_TO_PAID_CONTRACT.md
 * @see docs/bootstrap/OPERATIONAL_READINESS_ENGINE.md
 * @see docs/architecture/BILLING_SUSPENSION_CONTRACT.md
 */

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";
import type { Surface } from "../../core/readiness";
import { BlockingScreen, useOperationalReadiness } from "../../core/readiness";
import { GlobalLoadingView } from "../../ui/design-system/components";

interface Props {
  children: React.ReactNode;
  /** Quando definido, usa ORE para esta superfície (TPV, KDS, DASHBOARD). */
  surface?: Surface;
}

function RequireOperationalORE({
  surface,
  children,
}: {
  surface: Surface;
  children: React.ReactNode;
}) {
  const readiness = useOperationalReadiness(surface);
  if (readiness.loading) {
    return (
      <GlobalLoadingView
        message="Verificando estado operacional..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }
  if (!readiness.ready && readiness.uiDirective === "SHOW_BLOCKING_SCREEN") {
    return (
      <BlockingScreen
        reason={readiness.blockingReason}
        redirectTo={readiness.redirectTo}
      />
    );
  }
  if (
    !readiness.ready &&
    readiness.uiDirective === "REDIRECT" &&
    readiness.redirectTo
  ) {
    return <Navigate to={readiness.redirectTo} replace />;
  }
  return <>{children}</>;
}

function RequireOperationalLegacy({ children }: { children: React.ReactNode }) {
  const context = useContext(RestaurantRuntimeContext);
  const runtime = context?.runtime;

  if (!context || runtime?.loading) {
    return (
      <GlobalLoadingView
        message="Verificando estado operacional..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  if (!runtime.isPublished) {
    return <BlockingScreen reason="NOT_PUBLISHED" redirectTo="/dashboard" />;
  }

  return <>{children}</>;
}

/** Billing statuses that block operation. Trial is NOT included (TRIAL_TO_PAID: trial does not block). */
const BILLING_BLOCKED_STATUSES = ["past_due", "suspended", "canceled"] as const;

export function RequireOperational({ children, surface }: Props) {
  const context = useContext(RestaurantRuntimeContext);
  const runtime = context?.runtime;

  // BILLING_SUSPENSION_CONTRACT: block TPV/KDS when past_due or suspended
  if (runtime && !runtime.loading) {
    const billingStatus = runtime.billing_status ?? null;
    if (billingStatus && BILLING_BLOCKED_STATUSES.includes(billingStatus as (typeof BILLING_BLOCKED_STATUSES)[number])) {
      const reason = billingStatus === "past_due" ? "BILLING_PAST_DUE" : "BILLING_SUSPENDED";
      return <BlockingScreen reason={reason} redirectTo="/app/billing" />;
    }
  }

  if (surface) {
    return (
      <RequireOperationalORE surface={surface}>
        {children}
      </RequireOperationalORE>
    );
  }
  return <RequireOperationalLegacy>{children}</RequireOperationalLegacy>;
}
