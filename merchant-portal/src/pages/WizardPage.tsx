// @ts-nocheck
// ⚠️ INTERNAL DEV TOOL
// Not part of customer-facing product
// This is a legacy debug tool for internal use only
//
// REAL ONBOARDING WIZARD: /app/setup/* (SetupLayout + Steps)
// This page should NEVER be used in production or by end users
//
// eslint-disable-file
// This file intentionally uses minimal Design System and legacy patterns.
// It's a dev tool, not product code. Lint rules are relaxed here.

import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ApiError, fetchJson, internalHeaders } from "../api";
import { CONFIG } from "../config";
import { sendPulse } from "../core/adapter/empire-pulse";
import { isDebugMode } from "../core/debugMode";
import { Button } from "../ui/design-system/primitives/Button";
import { Card } from "../ui/design-system/primitives/Card";
import { Input } from "../ui/design-system/primitives/Input";
import { Stepper } from "../ui/design-system/primitives/Stepper";
import { Text } from "../ui/design-system/primitives/Text";
import { colors } from "../ui/design-system/tokens/colors";
import { spacing } from "../ui/design-system/tokens/spacing";

export function WizardPage() {
  const envInternalToken =
    typeof import.meta.env.VITE_INTERNAL_API_TOKEN === "string"
      ? import.meta.env.VITE_INTERNAL_API_TOKEN
      : undefined;
  const envRestaurantId =
    typeof import.meta.env.VITE_RESTAURANT_ID === "string"
      ? import.meta.env.VITE_RESTAURANT_ID
      : undefined;
  const envDefaultSlug =
    (typeof import.meta.env.VITE_DEFAULT_SLUG === "string" &&
      import.meta.env.VITE_DEFAULT_SLUG) ||
    (typeof import.meta.env.VITE_SLUG === "string" &&
      import.meta.env.VITE_SLUG) ||
    undefined;
  const envMenuItemId =
    typeof import.meta.env.VITE_MENU_ITEM_ID === "string"
      ? import.meta.env.VITE_MENU_ITEM_ID
      : undefined;

  // Empire Pulse Integration
  useEffect(() => {
    sendPulse().catch(console.error);
    const interval = setInterval(() => {
      sendPulse().catch(console.error);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const [showDevConfig, setShowDevConfig] = useState(false);
  const initialApiBase = CONFIG.API_BASE;
  const [apiBase, setApiBase] = useState<string>(initialApiBase);
  const [internalToken, setInternalToken] = useState<string>(
    envInternalToken ?? "dev-token",
  );
  const [restaurantId, setRestaurantId] = useState<string>(
    envRestaurantId ?? "",
  );
  const [slug, setSlug] = useState<string>(envDefaultSlug ?? "sofia-gastrobar");

  const [_identityName, _setIdentityName] = useState("Sofia Gastrobar");
  const [_identityTagline, _setIdentityTagline] = useState("Menu online");
  const [_identityPhone, _setIdentityPhone] = useState("+351000000000");
  const [_identityAddress, _setIdentityAddress] = useState("Lisboa");
  const [_identityHours, _setIdentityHours] = useState("12h–23h");
  const [_googlePlaceId, _setGooglePlaceId] = useState("ChIJ_TEST_PLACE_ID");
  const [_importUrl, _setImportUrl] = useState("https://example.com");

  const [_menuCategoryName, _setMenuCategoryName] = useState("Destaques");
  const [_menuItemName, _setMenuItemName] = useState("Hambúrguer da Casa");
  const [_menuItemPriceCents, _setMenuItemPriceCents] = useState(1290);
  const [_menuItemCategoryId, _setMenuItemCategoryId] = useState("");

  const [_stripePk, _setStripePk] = useState(
    import.meta.env.VITE_STRIPE_PK || "",
  );
  const [_stripeSk, _setStripeSk] = useState(
    import.meta.env.VITE_STRIPE_SK || "",
  );
  const [_stripeWhsec, _setStripeWhsec] = useState(
    import.meta.env.VITE_STRIPE_WHSEC || "",
  );

  const [_designLevel, _setDesignLevel] = useState<
    "BASIC" | "PRO" | "EXPERIENCE"
  >("PRO");
  const [_designTheme, _setDesignTheme] = useState<
    "minimal" | "light" | "dark"
  >("minimal");
  const [designSlug, _setDesignSlug] = useState(
    envDefaultSlug ?? "sofia-gastrobar",
  );

  const [_testMenuItemId, _setTestMenuItemId] = useState(envMenuItemId ?? "");
  const [_testQty, _setTestQty] = useState<number>(1);
  const [_testOrderJson, _setTestOrderJson] = useState<any>(null);

  const [stateJson, setStateJson] = useState<any>(null);
  const [_menuJson, _setMenuJson] = useState<any>(null);
  const [_stripeStatusJson, _setStripeStatusJson] = useState<any>(null);
  const [_publishJson, _setPublishJson] = useState<any>(null);
  const [lastError, setLastError] = useState<any>(null);
  const [busy, setBusy] = useState<string>("");

  const step = {
    identity: Boolean(stateJson?.identity_complete),
    menu: Boolean(stateJson?.menu_complete),
    payments: Boolean(stateJson?.payments_complete),
    design: Boolean(stateJson?.design_complete),
    publishable: Boolean(stateJson?.can_publish),
    published: String(stateJson?.profile?.status || "") === "published",
  };

  const gates = {
    ok: stateJson?.gates?.ok,
    tier: stateJson?.gates?.tier,
    addons: stateJson?.gates?.addons,
    error: stateJson?.gates?.error,
    message: stateJson?.gates?.message,
  };

  const _showCommercialCtas = useMemo(() => {
    if (gates.ok === false) return true;
    const errStatus = Number(lastError?.raw?.status || 0);
    const errCode = String(lastError?.raw?.body?.error || "");
    return errStatus === 402 && errCode === "FEATURE_BLOCKED";
  }, [gates.ok, lastError]);

  const stepState = useMemo(() => {
    const completed = new Set<number>(
      (Array.isArray(stateJson?.completed_steps)
        ? stateJson.completed_steps
        : []
      ).map((n: any) => Number(n)),
    );
    const current = Number(stateJson?.current_step || 1);
    const gatesBlocked = gates.ok === false;

    function s(n: number): "completed" | "current" | "blocked" | "pending" {
      if (n === 5 && step.published) return "completed";
      if (completed.has(n)) return "completed";
      if (gatesBlocked && (n === 4 || n === 5)) return "blocked";
      if (current === n) return "current";
      return "pending";
    }

    return { s };
  }, [stateJson, gates.ok, step.published]);

  // Stepper steps for Design System (primitives/Stepper format)
  const stepperSteps = useMemo(() => {
    const completed = new Set<number>(
      (Array.isArray(stateJson?.completed_steps)
        ? stateJson.completed_steps
        : []
      ).map((n: any) => Number(n)),
    );
    const current = Number(stateJson?.current_step || 1);

    return [
      {
        id: "1",
        label: "Identidade",
        isCompleted: completed.has(1) || step.identity,
        isActive: current === 1,
      },
      {
        id: "2",
        label: "Menu",
        isCompleted: completed.has(2) || step.menu,
        isActive: current === 2,
      },
      {
        id: "3",
        label: "Pagamentos",
        isCompleted: completed.has(3) || step.payments,
        isActive: current === 3,
      },
      {
        id: "4",
        label: "Design",
        isCompleted: completed.has(4) || step.design,
        isActive: current === 4,
      },
      {
        id: "5",
        label: "Publish",
        isCompleted: completed.has(5) || step.published,
        isActive: current === 5,
      },
    ];
  }, [stateJson, step, stepState]);

  function formatApiError(err: ApiError) {
    const body = err.body || {};
    const code = String(body.error || body.code || "");
    const msg = String(body.message || err.message || "");

    if (err.status === 402 && code === "FEATURE_BLOCKED") {
      const webLevel = body.web_level ? String(body.web_level) : null;
      const feature = body.feature ? String(body.feature) : null;
      return {
        title: "Recurso bloqueado pelo plano",
        message: webLevel
          ? `Este nível(${webLevel}) requer upgrade do plano.`
          : feature
          ? `Este recurso(${feature}) requer upgrade do plano.`
          : "Este recurso requer upgrade do plano.",
        detail: msg || "Upgrade necessário para continuar.",
        raw: { status: err.status, body },
      };
    }

    if (err.status === 403 && code === "WEB_LEVEL_BLOCKED") {
      const webLevel = body.web_level ? String(body.web_level) : null;
      return {
        title: "Nível de design bloqueado",
        message: webLevel
          ? `O nível ${webLevel} não está disponível no seu plano.`
          : "Este nível não está disponível no seu plano.",
        detail: msg || "Faz upgrade para desbloquear.",
        raw: { status: err.status, body },
      };
    }

    if (err.status === 409 && code === "GATEWAY_NOT_CONFIGURED") {
      return {
        title: "Pagamentos não configurados",
        message:
          "Liga o Stripe (Passo 3) para conseguir criar pedidos com pagamento.",
        detail: 'Depois, volta aqui e clica novamente em "Criar pedido teste".',
        raw: { status: err.status, body },
      };
    }

    if (err.status === 400) {
      const selling = {
        IDENTITY_INCOMPLETE:
          "Completa a Identidade (Passo 1) antes de publicar.",
        MENU_INCOMPLETE: "Adiciona pelo menos 1 item no Menu (Passo 2).",
        PAYMENTS_INCOMPLETE: "Liga o Stripe (Passo 3) para aceitar pagamentos.",
        CONFIRM_REQUIRED: "Confirma a publicação para continuar.",
        MENU_ITEM_NOT_FOUND:
          "O item do menu não existe (confere o MENU_ITEM_ID do seed).",
        MIXED_CURRENCY_NOT_SUPPORTED:
          "O pedido tem moedas diferentes. Usa apenas EUR no trial.",
      } as const;
      const hint = (selling as any)[code];
      if (hint) {
        return {
          title: "Ainda falta um passo",
          message: hint,
          detail: msg || code,
          raw: { status: err.status, body },
        };
      }
    }

    return {
      title: "Erro",
      message: msg || `HTTP_${err.status} `,
      detail: "",
      raw: { status: err.status, body },
    };
  }

  const publicUrl = useMemo(() => {
    const s = (slug || designSlug || "").trim();
    if (!s) return "";
    const base = String(apiBase || "").replace(/\/$/, "");
    return base
      ? `${base}/public/${encodeURIComponent(s)}`
      : `/public/${encodeURIComponent(s)}`;
  }, [apiBase, slug, designSlug]);

  const publicEnabledReason = useMemo(() => {
    if (!stateJson) return "Carrega o estado para validar publicação e gates.";
    if (!step.published) return "Ainda está em draft — publica primeiro.";
    if (gates.ok === false)
      return "Bloqueado pelo plano — faz upgrade para abrir ao público.";
    return "";
  }, [stateJson, step.published, gates.ok]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setLastError(null);
    try {
      await fn();
    } catch (e: any) {
      if (e instanceof ApiError) {
        setLastError(formatApiError(e));
      } else {
        setLastError({ message: String(e?.message || e) });
      }
    } finally {
      setBusy("");
    }
  }

  // Ferramenta interna: só acessível com ?debug=1
  if (!isDebugMode()) {
    return <Navigate to="/app/setup" replace />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: colors.surface.base,
        color: colors.text.primary,
        padding: spacing.lg,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 9999,
          backgroundColor: "#ff6b35",
          color: "#fff",
          padding: "16px 24px",
          marginBottom: "24px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "16px",
          lineHeight: "1.5",
        }}
      >
        ⚠️ FERRAMENTA INTERNA (debug) — NÃO É PRODUTO ⚠️
        <div
          style={{
            fontSize: "13px",
            fontWeight: "normal",
            marginTop: "4px",
            opacity: 0.95,
          }}
        >
          Wizard real:{" "}
          <code
            style={{
              background: "rgba(0,0,0,0.2)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            /app/setup
          </code>
        </div>
      </div>

      {/* HEADER */}
      <header
        style={{
          marginBottom: spacing.xl,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: spacing.md,
        }}
      >
        <div>
          <Text
            size="xs"
            color="tertiary"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: spacing.xs,
            }}
          >
            Merchant Portal v0 • Web Wizard
          </Text>
          <Text size="2xl" weight="bold" style={{ marginBottom: spacing.xs }}>
            Criar a tua página web
          </Text>
          <Text size="sm" color="secondary">
            Configurar • Stripe • Publicar
          </Text>
        </div>
        <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
          <Button
            variant="outline"
            disabled={!!busy}
            loading={busy === "load_state"}
            onClick={() =>
              run("load_state", async () => {
                if (!restaurantId) throw new Error("RESTAURANT_ID_REQUIRED");
                const r = await fetchJson(
                  apiBase,
                  `/internal/wizard/${encodeURIComponent(restaurantId)}/state`,
                  {
                    method: "GET",
                    headers: internalHeaders(internalToken),
                  },
                );
                setStateJson(r);
                if (r?.profile?.slug) setSlug(String(r.profile.slug));
              })
            }
          >
            {busy === "load_state" ? "A carregar…" : "Atualizar estado"}
          </Button>
          {publicUrl &&
            (publicEnabledReason ? (
              <Button variant="outline" disabled title={publicEnabledReason}>
                Abrir página pública
              </Button>
            ) : (
              <Button
                variant="outline"
                as="a"
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir página pública
              </Button>
            ))}
        </div>
      </header>

      {/* PROGRESS STEPPER */}
      <Card style={{ marginBottom: spacing.lg }}>
        <Text size="lg" weight="semibold" style={{ marginBottom: spacing.md }}>
          Progresso
        </Text>
        <Stepper steps={stepperSteps} />
      </Card>

      {/* Config section (só em modo debug) */}
      {isDebugMode() && (
        <Card style={{ marginBottom: spacing.lg }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              marginBottom: showDevConfig ? spacing.md : 0,
            }}
            onClick={() => setShowDevConfig(!showDevConfig)}
          >
            <Text size="lg" weight="semibold">
              Config
            </Text>
            <Text size="sm" color="secondary">
              {showDevConfig ? "▼" : "▶"}
            </Text>
          </div>
          {showDevConfig && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: spacing.md,
              }}
            >
              <Input
                label="API Base"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder="http://localhost:4320"
              />
              <Input
                label="Token"
                value={internalToken}
                onChange={(e) => setInternalToken(e.target.value)}
                placeholder="dev-token"
              />
              <Input
                label="Restaurant ID"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                placeholder="sofia-gastrobar"
              />
              <Input
                label="Slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="sofia-gastrobar"
              />
            </div>
          )}
        </Card>
      )}

      {/* IDENTITY STEP (Placeholder - full implementation in IdentityStep.tsx) */}
      <Card style={{ marginBottom: spacing.lg }}>
        <Text size="lg" weight="semibold" style={{ marginBottom: spacing.md }}>
          Passo 1 - Identidade
        </Text>
        <Button
          variant="primary"
          onClick={() =>
            run("identity_manual", async () => {
              // Placeholder - full logic in IdentityStep.tsx
            })
          }
        >
          Guardar
        </Button>
      </Card>

      {/* Debug section */}
      {isDebugMode() && (
        <Card>
          <Text
            size="lg"
            weight="semibold"
            style={{ marginBottom: spacing.md }}
          >
            Debug
          </Text>
          <pre
            style={{
              fontSize: "11px",
              maxHeight: "400px",
              overflow: "auto",
              background: colors.surface.layer1,
              padding: spacing.md,
              borderRadius: "8px",
              border: `1px solid ${colors.surface.border}`,
              fontFamily: "monospace",
            }}
          >
            {JSON.stringify(
              {
                lastError: lastError
                  ? {
                      title: lastError.title,
                      message: lastError.message,
                      detail: lastError.detail,
                      raw: lastError.raw
                        ? {
                            status: lastError.raw.status,
                            body: lastError.raw.body,
                          }
                        : null,
                    }
                  : null,
                stateJson: stateJson
                  ? {
                      identity_complete: stateJson.identity_complete,
                      menu_complete: stateJson.menu_complete,
                      payments_complete: stateJson.payments_complete,
                      design_complete: stateJson.design_complete,
                      can_publish: stateJson.can_publish,
                      profile: stateJson.profile
                        ? {
                            status: stateJson.profile.status,
                            slug: stateJson.profile.slug,
                          }
                        : null,
                      gates: stateJson.gates,
                    }
                  : null,
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            )}
          </pre>
        </Card>
      )}
    </div>
  );
}
