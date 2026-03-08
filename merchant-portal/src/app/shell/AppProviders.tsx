import type { ReactNode } from "react";
import { GlobalUIStateProvider } from "../../context/GlobalUIStateContext";
import { RestaurantRuntimeProvider } from "../../context/RestaurantRuntimeContext";
import { FlowGate } from "../../core/flow/FlowGate";
import { RoleProvider } from "../../core/roles";
import { ShiftProvider } from "../../core/shift/ShiftContext";
import { ShiftGuard } from "../../core/shift/ShiftGuard";
import { TenantProvider } from "../../core/tenant/TenantContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <RestaurantRuntimeProvider>
      <ShiftProvider>
        <GlobalUIStateProvider>
          <RoleProvider>
            <TenantProvider>
              <FlowGate>
                <ShiftGuard>{children}</ShiftGuard>
              </FlowGate>
            </TenantProvider>
          </RoleProvider>
        </GlobalUIStateProvider>
      </ShiftProvider>
    </RestaurantRuntimeProvider>
  );
}
