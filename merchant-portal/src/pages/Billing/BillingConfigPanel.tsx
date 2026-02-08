/**
 * BillingConfigPanel — Painel Billing no Command Center (SystemTree)
 *
 * CORE_BILLING_AND_PAYMENTS_CONTRACT: NO SUPABASE. Load/save via Core API (coreBillingApi).
 * Separação: (1) Billing SaaS (ChefIApp → /app/billing), (2) Billing restaurante (gateways).
 * Core nunca processa pagamento; credenciais = referência cifrada.
 */

import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  space,
  spacing,
  tapTarget,
} from "@chefiapp/core-design-system";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  getBillingConfig,
  setBillingConfig,
  type BillingConfigRow,
} from "../../core/billing/coreBillingApi";
import { BackendType, getBackendType } from "../../core/infra/backendAdapter";

const GATEWAYS = [
  { id: "stripe" as const, label: "Stripe", region: "Global" },
  { id: "sumup" as const, label: "SumUp", region: "Europa" },
  { id: "pix" as const, label: "Pix", region: "Brasil" },
  { id: "custom" as const, label: "Outro", region: "Plugável" },
] as const;

const CURRENCIES = ["EUR", "USD", "BRL"] as const;

type Provider = BillingConfigRow["provider"];
type Currency = BillingConfigRow["currency"];

export function BillingConfigPanel() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const isCore = getBackendType() === BackendType.docker;

  const [provider, setProvider] = useState<Provider>("stripe");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState<
    BillingConfigRow | null | "pending"
  >("pending");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "ok" | "err"
  >("idle");

  const loadConfig = useCallback(async () => {
    if (!restaurantId || !isCore) {
      setConfigLoaded(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const config = await getBillingConfig(restaurantId);
      setConfigLoaded(config ?? null);
      if (config) {
        setProvider(config.provider);
        setCurrency(config.currency);
        setEnabled(config.enabled);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setConfigLoaded(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, isCore]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = useCallback(async () => {
    if (!restaurantId || !isCore) {
      setError("Billing config requires Core (Docker).");
      return;
    }
    setSaveStatus("saving");
    setError(null);
    try {
      const { error: err } = await setBillingConfig(restaurantId, {
        provider,
        currency,
        enabled,
        credentials_ref: null,
      });
      if (err) {
        setSaveStatus("err");
        setError(err);
      } else {
        setSaveStatus("ok");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (e) {
      setSaveStatus("err");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [restaurantId, isCore, provider, currency, enabled]);

  return (
    <div
      data-chefiapp-os="billing-config"
      style={{
        fontFamily: fontFamily.sans,
        color: colors.textPrimary,
        maxWidth: 560,
      }}
    >
      <h1
        style={{
          margin: "0 0 8px 0",
          fontSize: `${fontSize.xl}px`,
          fontWeight: fontWeight.bold,
          color: colors.textPrimary,
        }}
      >
        Billing e Pagamentos
      </h1>
      <p
        style={{
          margin: "0 0 " + space.lg + "px 0",
          fontSize: `${fontSize.sm}px`,
          color: colors.textSecondary,
        }}
      >
        Subscrição ChefIApp (SaaS) e gateways de pagamento do restaurante
        (clientes finais). O Core valida e reconcilia; não processa dinheiro.
      </p>

      {/* SaaS: link para /app/billing */}
      <section
        style={{
          marginBottom: space.lg,
          padding: space.lg,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: `${fontSize.base}px`,
            fontWeight: fontWeight.semibold,
            color: colors.textPrimary,
          }}
        >
          Subscrição ChefIApp (SaaS)
        </h2>
        <p
          style={{
            margin: "0 0 " + space.md + "px 0",
            fontSize: `${fontSize.sm}px`,
            color: colors.textSecondary,
          }}
        >
          Gerir plano, faturação e método de pagamento da sua conta ChefIApp.
        </p>
        <button
          type="button"
          onClick={() => navigate("/app/billing")}
          style={{
            padding: "12px 24px",
            minHeight: tapTarget.min,
            fontSize: `${fontSize.sm}px`,
            fontWeight: fontWeight.semibold,
            color: colors.textInverse,
            backgroundColor: colors.accent,
            border: "none",
            borderRadius: radius.md,
            cursor: "pointer",
          }}
        >
          Abrir Billing (Stripe)
        </button>
      </section>

      {/* Restaurant billing: gateway selection */}
      <section
        style={{
          marginBottom: space.lg,
          padding: space.lg,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: `${fontSize.base}px`,
            fontWeight: fontWeight.semibold,
            color: colors.textPrimary,
          }}
        >
          Pagamentos do restaurante (clientes finais)
        </h2>
        <p
          style={{
            margin: "0 0 " + space.md + "px 0",
            fontSize: `${fontSize.sm}px`,
            color: colors.textSecondary,
          }}
        >
          Gateway inactivo → TPV bloqueia cobrança. O restaurante escolhe; o
          Core valida e reconcilia.
        </p>
        {!loading &&
          configLoaded === null &&
          !error &&
          isCore &&
          restaurantId && (
            <p
              style={{
                margin: "0 0 " + space.md + "px 0",
                fontSize: `${fontSize.sm}px`,
                color: colors.textMuted,
                fontStyle: "italic",
              }}
            >
              Configuração de faturação ainda não definida.
            </p>
          )}

        <div style={{ marginBottom: space.md }}>
          <label
            style={{
              display: "block",
              marginBottom: space.xs,
              fontSize: `${fontSize.sm}px`,
              fontWeight: fontWeight.medium,
              color: colors.textSecondary,
            }}
          >
            Gateway
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            disabled={!isCore || loading}
            style={{
              width: "100%",
              maxWidth: 280,
              padding: "10px 12px",
              fontSize: `${fontSize.sm}px`,
              color: colors.textPrimary,
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
            }}
            aria-label="Selecionar gateway de pagamento"
          >
            {GATEWAYS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label} — {g.region}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: space.md }}>
          <label
            style={{
              display: "block",
              marginBottom: space.xs,
              fontSize: `${fontSize.sm}px`,
              fontWeight: fontWeight.medium,
              color: colors.textSecondary,
            }}
          >
            Moeda
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            disabled={!isCore || loading}
            style={{
              width: "100%",
              maxWidth: 120,
              padding: "10px 12px",
              fontSize: `${fontSize.sm}px`,
              color: colors.textPrimary,
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
            }}
            aria-label="Selecionar moeda"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: space.md }}>
          <label
            style={{
              display: "block",
              marginBottom: space.xs,
              fontSize: `${fontSize.sm}px`,
              fontWeight: fontWeight.medium,
              color: colors.textSecondary,
            }}
          >
            Credenciais (referência cifrada)
          </label>
          <input
            type="password"
            placeholder="Configurado no backend — placeholder"
            readOnly
            style={{
              width: "100%",
              maxWidth: 320,
              padding: "10px 12px",
              fontSize: `${fontSize.sm}px`,
              color: colors.textMuted,
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
            }}
            aria-label="Credenciais (placeholder)"
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: space.sm,
            marginBottom: space.md,
          }}
        >
          <input
            type="checkbox"
            id="billing-enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={!isCore || loading}
            aria-label="Gateway activo"
          />
          <label
            htmlFor="billing-enabled"
            style={{
              fontSize: `${fontSize.sm}px`,
              color: colors.textSecondary,
            }}
          >
            Gateway activo (TPV permite cobrança)
          </label>
        </div>
        {isCore && restaurantId && (
          <div
            style={{ display: "flex", alignItems: "center", gap: spacing[3] }}
          >
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saveStatus === "saving"}
              style={{
                padding: "10px 20px",
                minHeight: tapTarget.min,
                fontSize: `${fontSize.sm}px`,
                fontWeight: fontWeight.semibold,
                color: colors.textInverse,
                backgroundColor: colors.accent,
                border: "none",
                borderRadius: radius.md,
                cursor:
                  loading || saveStatus === "saving"
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {saveStatus === "saving"
                ? "A guardar…"
                : saveStatus === "ok"
                ? "Guardado"
                : "Guardar"}
            </button>
            {error && (
              <span
                style={{ fontSize: `${fontSize.sm}px`, color: colors.error }}
              >
                {error}
              </span>
            )}
          </div>
        )}
      </section>

      <p
        style={{
          margin: 0,
          fontSize: `${fontSize.xs}px`,
          color: colors.textMuted,
        }}
      >
        Contrato: CORE_BILLING_AND_PAYMENTS_CONTRACT. Core nunca guarda dados de
        cartão; pagamento offline proibido.
      </p>
    </div>
  );
}
