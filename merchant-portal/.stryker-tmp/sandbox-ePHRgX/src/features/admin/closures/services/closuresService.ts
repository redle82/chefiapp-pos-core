// @ts-nocheck
import type { CierreTemporal } from "../types";

/** Mock: lista vazia por defeito. TODO: integrar com backend (reservas, TPV, auditoria). */
const store: CierreTemporal[] = [];

export async function getClosures(locationId: string): Promise<CierreTemporal[]> {
  await delay(200);
  return store.filter((c) => c.locationId === locationId);
}

export interface CreateClosureInput {
  type: CierreTemporal["type"];
  scope: CierreTemporal["scope"];
  startAt: string;
  endAt: string;
  locationId: string;
  reason?: string;
  notifyClients?: boolean;
}

function deriveStatus(startAt: string, endAt: string): CierreTemporal["status"] {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (now < start) return "SCHEDULED";
  if (now > end) return "EXPIRED";
  return "ACTIVE";
}

export async function createClosure(
  input: CreateClosureInput
): Promise<CierreTemporal> {
  await delay(300);
  const id = `closure_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const status = deriveStatus(input.startAt, input.endAt);
  const closure: CierreTemporal = {
    id,
    type: input.type,
    scope: input.scope,
    startAt: input.startAt,
    endAt: input.endAt,
    locationId: input.locationId,
    reason: input.reason,
    status,
    notifyClients: input.notifyClients ?? false,
  };
  store.push(closure);
  return closure;
}

export async function cancelClosure(
  id: string,
  _locationId: string
): Promise<void> {
  await delay(150);
  const idx = store.findIndex((c) => c.id === id);
  if (idx >= 0) store.splice(idx, 1);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
