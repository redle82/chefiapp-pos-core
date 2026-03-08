import type { ReactNode } from "react";
import { EventMonitorBootstrap } from "../../core/tasks/EventMonitorBootstrap";
import { APP_ROUTES } from "../../routes/constants/routeConstants";
import { OfflineIndicator } from "../../ui/OfflineIndicator";
import { BillingBanner } from "../../ui/billing/BillingBanner";
import { BillingBlockedView } from "../../ui/billing/BillingBlockedView";
import { CoreUnavailableBanner } from "../../ui/design-system/CoreUnavailableBanner";
import { ModeIndicator } from "../../ui/design-system/ModeIndicator";
import { GlobalBlockedView } from "../../ui/design-system/components/GlobalBlockedView";
import { DevInstallabilityResetButton } from "../../ui/dev/DevInstallabilityResetButton";
import { createAppChromeState, shouldBlockForPastDue } from "./appShellRouting";

type AppOperationalChromeProps = {
  pathname: string;
  billingStatus: string | null | undefined;
  isBillingBlocked: boolean;
  isTrialExpired: boolean;
  children: ReactNode;
};

export function AppOperationalChrome({
  pathname,
  billingStatus,
  isBillingBlocked,
  isTrialExpired,
  children,
}: AppOperationalChromeProps) {
  const {
    isBillingManagement,
    isDashboard,
    isOperationalSurface,
    shouldShowBillingBanner,
  } = createAppChromeState(pathname);

  if (isTrialExpired && !isBillingManagement) {
    return (
      <GlobalBlockedView
        title="Período de trial terminado"
        description="O teu período de trial terminou. Ativa o plano para continuar a usar o ChefIApp."
        action={{ label: "Escolher plano", to: APP_ROUTES.BILLING }}
      />
    );
  }

  if (isBillingBlocked && !isBillingManagement) {
    return <BillingBlockedView />;
  }

  if (shouldBlockForPastDue(pathname, billingStatus, isBillingManagement)) {
    return (
      <GlobalBlockedView
        title="Pagamento pendente"
        description="Regularize a faturação para continuar a usar o TPV e o KDS."
        action={{ label: "Ir à Faturação", to: APP_ROUTES.BILLING }}
      />
    );
  }

  const isStaffPath = pathname.startsWith(APP_ROUTES.STAFF);

  return (
    <>
      <EventMonitorBootstrap />
      <OfflineIndicator />
      {!isDashboard && !isOperationalSurface && shouldShowBillingBanner && (
        <BillingBanner />
      )}
      {/* Dev reset button hidden in AppStaff — terminal operacional sem elementos de dev */}
      {!isStaffPath && <DevInstallabilityResetButton />}
      <ModeIndicator />
      <CoreUnavailableBanner />
      {children}
    </>
  );
}
