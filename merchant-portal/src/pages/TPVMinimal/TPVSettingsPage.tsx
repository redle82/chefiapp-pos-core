/**
 * TPVSettingsPage — Definições do TPV (rota /op/tpv/settings).
 *
 * Active settings:
 * - Language selector (i18next)
 * - Currency selector (localStorage + reload)
 * - Tax rate selector (localStorage)
 * - Payment methods toggles (localStorage)
 * - Printer status (read-only from localStorage)
 * - Shift close behavior (read-only from localStorage)
 * - About / Version info
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../core/currency/useCurrency";
import type { CurrencyCode } from "../../core/currency/CurrencyService";
import { SUPPORTED_CURRENCIES } from "../../core/currency/CurrencyService";
import { Card } from "../../ui/design-system/Card";

const AVAILABLE_LANGUAGES = [
  { code: "pt-BR", label: "Portugues (Brasil)" },
  { code: "pt-PT", label: "Portugues (Portugal)" },
  { code: "en", label: "English" },
  { code: "es", label: "Espanol" },
] as const;

const AVAILABLE_CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "BRL", label: `BRL (${SUPPORTED_CURRENCIES.BRL.symbol})` },
  { code: "EUR", label: `EUR (${SUPPORTED_CURRENCIES.EUR.symbol})` },
  { code: "USD", label: `USD (${SUPPORTED_CURRENCIES.USD.symbol})` },
];

const TAX_PRESETS = [
  { label: "0% (Isento)", value: "0" },
  { label: "5%", value: "0.05" },
  { label: "6% (IVA reduzida PT)", value: "0.06" },
  { label: "13% (IVA intermédia PT)", value: "0.13" },
  { label: "23% (IVA normal PT)", value: "0.23" },
  { label: "custom", value: "custom" },
] as const;

interface PaymentMethodConfig {
  id: string;
  labelKey: string;
  defaultEnabled: boolean;
  /** If set, only show when currency matches */
  currencyOnly?: CurrencyCode;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: "cash", labelKey: "settings.methodCash", defaultEnabled: true },
  { id: "card", labelKey: "settings.methodCard", defaultEnabled: true },
  { id: "mbway", labelKey: "settings.methodMBWay", defaultEnabled: false },
  { id: "multibanco", labelKey: "settings.methodMultibanco", defaultEnabled: false },
  { id: "pix", labelKey: "settings.methodPIX", defaultEnabled: false, currencyOnly: "BRL" },
];

const selectStyle: React.CSSProperties = {
  background: "var(--surface-elevated, #1a1a1a)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle, #333)",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 14,
  minWidth: 220,
  cursor: "pointer",
  outline: "none",
};

const statusDotStyle = (
  color: string,
): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: color,
  display: "inline-block",
  flexShrink: 0,
});

const sectionTitleStyle: React.CSSProperties = {
  color: "var(--text-primary)",
  margin: "0 0 8px 0",
  fontSize: 16,
  fontWeight: 600,
};

const descriptionStyle: React.CSSProperties = {
  color: "var(--text-tertiary, #666)",
  fontSize: 12,
  marginTop: 6,
};

const inputStyle: React.CSSProperties = {
  background: "var(--surface-elevated, #1a1a1a)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle, #333)",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 14,
  width: 80,
  outline: "none",
};

/* ── Toggle switch (iOS-style, 44x24) ── */
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? "#22c55e" : "var(--border-subtle, #333)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}

/* ── Helper: read payment methods from localStorage ── */
function readPaymentMethods(): string[] {
  try {
    const raw = localStorage.getItem("chefiapp_payment_methods");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  // Default: cash + card enabled
  return PAYMENT_METHODS.filter((m) => m.defaultEnabled).map((m) => m.id);
}

export function TPVSettingsPage() {
  const { t, i18n } = useTranslation("tpv");
  const { currency, setCurrency, symbol } = useCurrency();

  const [currentLang, setCurrentLang] = useState(
    () => i18n.language || localStorage.getItem("chefiapp_locale") || "pt-BR",
  );

  // Tax rate state
  const [taxRate, setTaxRate] = useState(() => {
    return localStorage.getItem("chefiapp_tax_rate") || "0.05";
  });
  const [customTaxInput, setCustomTaxInput] = useState(() => {
    const stored = localStorage.getItem("chefiapp_tax_rate") || "0.05";
    const isPreset = TAX_PRESETS.some((p) => p.value === stored && p.value !== "custom");
    return isPreset ? "" : String(Math.round(parseFloat(stored) * 100));
  });
  const isCustomTax = !TAX_PRESETS.some(
    (p) => p.value === taxRate && p.value !== "custom",
  );

  // Payment methods state
  const [enabledMethods, setEnabledMethods] = useState<string[]>(readPaymentMethods);

  const printerConfigured = Boolean(
    localStorage.getItem("chefiapp_printer_config"),
  );

  const shiftAutoClose =
    localStorage.getItem("chefiapp_shift_auto_close") !== "false";

  // About section data
  const backendType = localStorage.getItem("chefiapp_backend_type") || "supabase";
  const buildMode = import.meta.env.MODE;

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      setCurrentLang(lang);
      localStorage.setItem("chefiapp_locale", lang);
      i18n.changeLanguage(lang);
    },
    [i18n],
  );

  const handleCurrencyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const code = e.target.value as CurrencyCode;
      setCurrency(code);
    },
    [setCurrency],
  );

  const handleTaxPresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === "custom") {
        // Switch to custom mode, keep current rate in input
        const currentPercent = String(Math.round(parseFloat(taxRate) * 100));
        setCustomTaxInput(currentPercent);
        setTaxRate(taxRate); // keep current
      } else {
        setTaxRate(val);
        localStorage.setItem("chefiapp_tax_rate", val);
      }
    },
    [taxRate],
  );

  const handleCustomTaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, "");
      setCustomTaxInput(raw);
      const num = parseFloat(raw);
      if (!Number.isNaN(num) && num >= 0 && num <= 100) {
        const decimal = (num / 100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
        setTaxRate(decimal);
        localStorage.setItem("chefiapp_tax_rate", decimal);
      }
    },
    [],
  );

  const handleTogglePaymentMethod = useCallback(
    (methodId: string) => {
      setEnabledMethods((prev) => {
        const next = prev.includes(methodId)
          ? prev.filter((id) => id !== methodId)
          : [...prev, methodId];
        localStorage.setItem("chefiapp_payment_methods", JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <h1
        style={{
          color: "var(--text-primary)",
          marginBottom: 24,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {t("settings.title")}
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Language */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("settings.language")}</h3>
          <select
            value={currentLang}
            onChange={handleLanguageChange}
            style={selectStyle}
          >
            {AVAILABLE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          <p style={descriptionStyle}>{t("settings.languageHint")}</p>
        </Card>

        {/* Currency */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("settings.currency")}</h3>
          <select
            value={currency}
            onChange={handleCurrencyChange}
            style={selectStyle}
          >
            {AVAILABLE_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <p style={descriptionStyle}>
            {t("settings.currencyHint", { symbol })}
          </p>
        </Card>

        {/* Tax Rate */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("settings.taxRate")}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select
              value={isCustomTax ? "custom" : taxRate}
              onChange={handleTaxPresetChange}
              style={selectStyle}
            >
              {TAX_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.value === "custom"
                    ? t("settings.taxCustom")
                    : preset.label}
                </option>
              ))}
            </select>
            {isCustomTax && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customTaxInput}
                  onChange={handleCustomTaxChange}
                  placeholder="0"
                  style={inputStyle}
                  aria-label={t("settings.taxCustomPercent")}
                />
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  %
                </span>
              </div>
            )}
          </div>
          <p style={descriptionStyle}>{t("settings.taxHint")}</p>
        </Card>

        {/* Payment Methods */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("settings.paymentMethods")}</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {PAYMENT_METHODS
              .filter((m) => !m.currencyOnly || m.currencyOnly === currency)
              .map((method) => (
                <div
                  key={method.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 14,
                    }}
                  >
                    {t(method.labelKey)}
                  </span>
                  <ToggleSwitch
                    checked={enabledMethods.includes(method.id)}
                    onChange={() => handleTogglePaymentMethod(method.id)}
                  />
                </div>
              ))}
          </div>
          <p style={descriptionStyle}>{t("settings.paymentMethodsHint")}</p>
        </Card>

        {/* Printer */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("settings.printer")}</h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            <span
              style={statusDotStyle(printerConfigured ? "#22c55e" : "#ef4444")}
            />
            <span>
              {printerConfigured
                ? t("settings.printerConfigured")
                : t("settings.printerNotConfigured")}
            </span>
          </div>
          {!printerConfigured && (
            <p style={descriptionStyle}>{t("settings.printerConfigureHint")}</p>
          )}
        </Card>

        {/* Shift close behavior */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("settings.shiftClose")}</h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            <span
              style={statusDotStyle(shiftAutoClose ? "#22c55e" : "#f59e0b")}
            />
            <span>
              {shiftAutoClose
                ? t("settings.shiftAutoCloseActive")
                : t("settings.shiftManualClose")}
            </span>
          </div>
          <p style={descriptionStyle}>{t("settings.shiftCloseHint")}</p>
        </Card>

        {/* About / Version */}
        <Card surface="layer1" padding="md">
          <h3 style={sectionTitleStyle}>{t("settings.about")}</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--text-secondary)",
              }}
            >
              <span>{t("settings.aboutVersion")}</span>
              <span
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontFamily: "monospace",
                }}
              >
                ChefIApp™ OS v1.0.1
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--text-secondary)",
              }}
            >
              <span>{t("settings.aboutBuild")}</span>
              <span
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "monospace",
                }}
              >
                {buildMode}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--text-secondary)",
              }}
            >
              <span>{t("settings.aboutBackend")}</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={statusDotStyle(
                    backendType === "docker" ? "#3b82f6" : "#a855f7",
                  )}
                />
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "monospace",
                  }}
                >
                  {backendType === "docker" ? "Docker Core" : "Supabase"}
                </span>
              </div>
            </div>
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid var(--border-subtle, #333)",
              }}
            >
              <a
                href="https://goldmonkey.studio"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--text-tertiary, #666)",
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                goldmonkey.studio
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
