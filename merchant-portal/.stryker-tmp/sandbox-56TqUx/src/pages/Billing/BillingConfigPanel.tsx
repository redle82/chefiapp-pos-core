/**
 * BillingConfigPanel — Painel Billing no Command Center (SystemTree)
 *
 * CORE_BILLING_AND_PAYMENTS_CONTRACT: NO SUPABASE. Load/save via Core API (coreBillingApi).
 * Separação: (1) Billing SaaS (ChefIApp → /app/billing), (2) Billing restaurante (gateways).
 * Core nunca processa pagamento; credenciais = referência cifrada.
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  getBillingConfig,
  setBillingConfig,
  type BillingConfigRow,
} from "../../core/billing/coreBillingApi";
import { BackendType, getBackendType } from "../../core/infra/backendAdapter";
import styles from "./BillingConfigPanel.module.css";

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
    <div data-chefiapp-os="billing-config" className={styles.root}>
      <h1 className={styles.title}>Billing e Pagamentos</h1>
      <p className={styles.subtitle}>
        Subscrição ChefIApp (SaaS) e gateways de pagamento do restaurante
        (clientes finais). O Core valida e reconcilia; não processa dinheiro.
      </p>

      {/* SaaS: link para /app/billing */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Subscrição ChefIApp (SaaS)</h2>
        <p className={styles.sectionText}>
          Gerir plano, faturação e método de pagamento da sua conta ChefIApp.
        </p>
        <button
          type="button"
          onClick={() => navigate("/app/billing")}
          className={styles.primaryButton}
        >
          Abrir Billing (Stripe)
        </button>
      </section>

      {/* Restaurant billing: gateway selection */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Pagamentos do restaurante (clientes finais)
        </h2>
        <p className={styles.sectionText}>
          Gateway inactivo → TPV bloqueia cobrança. O restaurante escolhe; o
          Core valida e reconcilia.
        </p>
        {!loading &&
          configLoaded === null &&
          !error &&
          isCore &&
          restaurantId && (
            <p className={styles.emptyConfigText}>
              Configuração de faturação ainda não definida.
            </p>
          )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Gateway</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            disabled={!isCore || loading}
            className={styles.selectGateway}
            aria-label="Selecionar gateway de pagamento"
          >
            {GATEWAYS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label} — {g.region}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Moeda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            disabled={!isCore || loading}
            className={styles.selectCurrency}
            aria-label="Selecionar moeda"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Credenciais (referência cifrada)
          </label>
          <input
            type="password"
            placeholder="Configurado no backend — placeholder"
            readOnly
            className={styles.inputCredentials}
            aria-label="Credenciais (placeholder)"
          />
        </div>

        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="billing-enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={!isCore || loading}
            aria-label="Gateway activo"
          />
          <label htmlFor="billing-enabled" className={styles.checkboxLabel}>
            Gateway activo (TPV permite cobrança)
          </label>
        </div>
        {isCore && restaurantId && (
          <div className={styles.saveRow}>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saveStatus === "saving"}
              className={`${styles.saveButton} ${
                loading || saveStatus === "saving"
                  ? styles.saveButtonDisabled
                  : ""
              }`}
            >
              {saveStatus === "saving"
                ? "A guardar…"
                : saveStatus === "ok"
                ? "Guardado"
                : "Guardar"}
            </button>
            {error && <span className={styles.errorText}>{error}</span>}
          </div>
        )}
      </section>

      <p className={styles.footerNote}>
        Contrato: CORE_BILLING_AND_PAYMENTS_CONTRACT. Core nunca guarda dados de
        cartão; pagamento offline proibido.
      </p>
    </div>
  );
}
