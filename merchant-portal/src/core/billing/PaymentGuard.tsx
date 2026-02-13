import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { GlobalBlockedView, GlobalLoadingView } from "../../ui/design-system/components";
import { getTabIsolated } from "../storage/TabIsolatedStorage";
import { getBillingStatusWithTrial, type BillingStatus } from "./coreBillingApi";

interface PaymentGuardProps {
  children: React.ReactNode;
}

export const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  const [status, setStatus] = useState<BillingStatus | "loading">("loading");
  const [trialExpired, setTrialExpired] = useState(false);
  const location = useLocation();

  const checkBilling = async () => {
    try {
      const rId = getTabIsolated("chefiapp_restaurant_id");
      if (!rId) {
        setStatus("active");
        setTrialExpired(false);
        return;
      }

      const withTrial = await getBillingStatusWithTrial(rId);

      if (withTrial == null) {
        console.warn(
          "[PaymentGuard] Failed to check status, defaulting to safe (trial).",
        );
        setStatus("trial");
        setTrialExpired(false);
        return;
      }

      setStatus(withTrial.trial_expired ? "past_due" : withTrial.status);
      setTrialExpired(withTrial.trial_expired);
    } catch (err) {
      console.error("[PaymentGuard] Critical Check Error:", err);
      setStatus("active");
      setTrialExpired(false);
    }
  };

  useEffect(() => {
    // Initial Check
    checkBilling();

    // Polling (Every 5 minutes)
    const interval = setInterval(checkBilling, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (status === "loading") {
    return (
      <GlobalLoadingView
        message="A verificar subscrição..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  // 2. The Rules (Law)

  // Safe Harbor (Law #5): Allow Console/Billing even if canceled
  if (
    location.pathname.startsWith("/app/console") ||
    location.pathname.startsWith("/app/setup") ||
    location.pathname.startsWith("/app/billing")
  ) {
    return <>{children}</>;
  }

  if (status === "canceled") {
    return (
      <GlobalBlockedView
        title="Subscrição necessária"
        description="A tua subscrição foi cancelada. Para continuar a usar o ChefIApp Pro, reativa o plano na página de faturação."
        action={{ label: "Reativar plano", to: "/app/billing" }}
      />
    );
  }

  if (status === "past_due" && trialExpired) {
    return (
      <GlobalBlockedView
        title="Período de trial terminado"
        description="O teu período de trial terminou. Ativa o plano para continuar a usar o ChefIApp."
        action={{ label: "Escolher plano", to: "/app/billing" }}
      />
    );
  }

  if (status === "past_due") {
    return (
      <>
        <div className="w-full bg-amber-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-3 flex-wrap">
          <span>⚠️ Pagamento pendente. Regularize para evitar a suspensão.</span>
          <a
            href="/app/billing"
            className="underline font-semibold hover:opacity-90"
          >
            Escolher plano
          </a>
        </div>
        {children}
      </>
    );
  }

  // Active / Trial -> Pass
  return <>{children}</>;
};
