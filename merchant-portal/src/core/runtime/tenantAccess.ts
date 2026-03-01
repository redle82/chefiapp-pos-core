import { readTenantIdWithLegacyFallback } from "../tenant/TenantResolver";
import { useLaunchContext } from "./LaunchContextContext";

export interface TenantIdSources {
  launchContextTenantId?: string | null;
  explicitTenantId?: string | null;
  activeTenantId?: string | null;
  storageTenantId?: string | null;
}

export function resolveTenantIdFromSources({
  launchContextTenantId,
  explicitTenantId,
  activeTenantId,
  storageTenantId,
}: TenantIdSources): string | null {
  return (
    launchContextTenantId ||
    explicitTenantId ||
    activeTenantId ||
    storageTenantId ||
    null
  );
}

export function getTenantIdFromRuntime(
  launchContextTenantId?: string | null,
  explicitTenantId?: string | null,
): string | null {
  return resolveTenantIdFromSources({
    launchContextTenantId,
    explicitTenantId,
    activeTenantId: readTenantIdWithLegacyFallback(),
  });
}

export function useTenantId(explicitTenantId?: string | null): string | null {
  const launchContext = useLaunchContext();
  return getTenantIdFromRuntime(launchContext?.tenantId, explicitTenantId);
}
