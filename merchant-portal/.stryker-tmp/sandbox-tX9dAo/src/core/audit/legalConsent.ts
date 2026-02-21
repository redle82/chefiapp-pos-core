import { GlobalEventStore } from "../events/EventStore";
import { SystemEvents } from "../events/SystemEvents";
import { setTabIsolated } from "../storage/TabIsolatedStorage";
import { logAuditEvent } from "./logAuditEvent";

const CONSENT_KEY = "chefiapp_legal_consent_v1";

export type LegalConsentRecord = {
  acceptedAt: string;
  restaurantId?: string;
  source: string;
  termsUrl: string;
  privacyUrl: string;
  version: "v1";
  meta?: Record<string, unknown>;
};

export async function recordLegalConsent(input: {
  restaurantId?: string;
  source: string;
  termsUrl?: string;
  privacyUrl?: string;
  meta?: Record<string, unknown>;
}): Promise<LegalConsentRecord> {
  const record: LegalConsentRecord = {
    acceptedAt: new Date().toISOString(),
    restaurantId: input.restaurantId,
    source: input.source,
    termsUrl: input.termsUrl ?? "/legal/terms",
    privacyUrl: input.privacyUrl ?? "/legal/privacy",
    version: "v1",
    ...(input.meta ? { meta: input.meta } : {}),
  };

  try {
    setTabIsolated(CONSENT_KEY, JSON.stringify(record));
  } catch {
    // Non-blocking: consent logging must not stop the flow.
  }

  SystemEvents.emit("legal:consent", record);

  try {
    await GlobalEventStore.append({
      eventId: crypto.randomUUID(),
      type: "LEGAL_CONSENT_ACCEPTED",
      payload: record,
      meta: {
        timestamp: Date.now(),
        actorId: record.restaurantId ?? "anonymous",
        sessionId: "legal-consent",
        version: 1,
      },
    });
  } catch {
    // Non-blocking: audit logging must never break the flow.
  }

  try {
    await logAuditEvent({
      action: "legal_consent_accepted",
      resourceEntity: "gm_restaurants",
      resourceId: record.restaurantId,
      metadata: {
        source: record.source,
        termsUrl: record.termsUrl,
        privacyUrl: record.privacyUrl,
        acceptedAt: record.acceptedAt,
        version: record.version,
      },
    });
  } catch {
    // Non-blocking.
  }

  return record;
}
