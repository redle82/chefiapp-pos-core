/**
 * LeadCaptureModal — Email capture with validation.
 * POSTs to /api/public/lead-capture for real persistence.
 */
import { useCallback, useState } from "react";
import {
  buildLeadPayload,
  commercialTracking,
  detectDevice,
  isCommercialTrackingEnabled,
} from "../../commercial/tracking";
import { CONFIG } from "../../config";
import type { CountryCode } from "../countries";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LeadCaptureModalProps {
  open: boolean;
  onClose: () => void;
  country: CountryCode;
  placement?: string;
  locale?: string;
}

export interface SubmitLeadResponse {
  ok: boolean;
  lead_id?: string;
  signup_url?: string;
}

async function submitLead(
  email: string,
  country: CountryCode,
  placement: string,
): Promise<SubmitLeadResponse> {
  const payload = buildLeadPayload({
    country,
    segment: "small",
    source: "lead_email",
    landing_version: "country-v1",
    conversion_path:
      typeof window !== "undefined" ? window.location.pathname : "",
    placement,
    email,
  });
  const base =
    CONFIG.API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${base.replace(/\/$/, "")}/api/public/lead-capture`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      country: payload.country,
      segment: payload.segment,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      source: payload.source,
      placement: payload.placement,
      device: payload.device,
      landing_version: payload.landing_version,
      conversion_path: payload.conversion_path,
      user_agent: payload.user_agent,
      referrer: payload.referrer,
      session_event_count: payload.session_event_count,
    }),
  });
  const json = (await res.json()) as SubmitLeadResponse;
  if (!res.ok) {
    throw new Error(
      (json as { error?: string; message?: string }).message ?? "Failed to save lead",
    );
  }
  return json;
}

export function LeadCaptureModal({
  open,
  onClose,
  country,
  placement = "modal",
  locale = "en",
}: LeadCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [signupUrl, setSignupUrl] = useState<string | null>(null);

  const validate = useCallback((e: string) => {
    if (!e.trim()) return false;
    return EMAIL_REGEX.test(e.trim());
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!validate(email)) {
        setError(
          locale === "es"
            ? "Introduce un email válido"
            : locale === "pt-BR"
              ? "Introduza um e-mail válido"
              : "Enter a valid email"
        );
        return;
      }
      setSubmitting(true);
      try {
        const result = await submitLead(email.trim(), country, placement);
        if (isCommercialTrackingEnabled()) {
          commercialTracking.track({
            timestamp: new Date().toISOString(),
            country,
            segment: "small",
            landing_version: "country-v1",
            device: detectDevice(),
            path: typeof window !== "undefined" ? window.location.pathname : "",
            event: "lead_email_submit",
            email: email.trim(),
            placement,
          });
        }
        setDone(true);
        setEmail("");
        if (result.signup_url) setSignupUrl(result.signup_url);
      } catch {
        setError(
          locale === "es"
            ? "Error al enviar"
            : locale === "pt-BR"
              ? "Erro ao enviar"
              : "Error submitting"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, country, placement, locale, validate]
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: "90%",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="lead-modal-title" style={{ margin: "0 0 12px", fontSize: "1.25rem" }}>
          {locale === "es"
            ? "Recibe más información"
            : locale === "pt-BR"
              ? "Receba mais informações"
              : "Get more info"}
        </h2>
        {done ? (
          <div>
            <p style={{ color: "#22c55e", margin: "0 0 12px" }}>
              {locale === "es"
                ? "¡Gracias! Te contactaremos pronto."
                : locale === "pt-BR"
                  ? "Obrigado! Entraremos em contacto em breve."
                  : "Thanks! We'll be in touch soon."}
            </p>
            {signupUrl && (
              <a
                href={signupUrl}
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "#f59e0b",
                  color: "#000",
                  fontWeight: 600,
                  textDecoration: "none",
                  marginTop: 8,
                }}
              >
                {locale === "es"
                  ? "Iniciar trial"
                  : locale === "pt-BR"
                    ? "Iniciar trial"
                    : "Start trial"}
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                locale === "es"
                  ? "tu@email.com"
                  : locale === "pt-BR"
                    ? "seu@email.com"
                    : "you@email.com"
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "#0a0a0a",
                color: "white",
                fontSize: "1rem",
                marginBottom: 8,
              }}
            />
            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0 0 8px" }}>
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f59e0b",
                  color: "#000",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? "..."
                  : locale === "es"
                    ? "Enviar"
                    : locale === "pt-BR"
                      ? "Enviar"
                      : "Submit"}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {locale === "en" ? "Close" : locale === "es" ? "Cerrar" : "Fechar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
