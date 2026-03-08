import type { IncomingHttpHeaders } from "http";

export interface MobileActivationRouteInput {
  method: string;
  path: string;
  headers: IncomingHttpHeaders;
  body: string;
  ip: string;
}

export interface MobileActivationRouteResult {
  handled: boolean;
  status: number;
  json: Record<string, unknown>;
}

// Compatibility shim: keep integration-gateway compile/runtime stable
// until mobile activation routes are implemented in a dedicated module.
export async function handleMobileActivationRoute(
  _input: MobileActivationRouteInput,
): Promise<MobileActivationRouteResult> {
  return {
    handled: false,
    status: 404,
    json: {
      error: "not_found",
      message: "Mobile route not found",
    },
  };
}
