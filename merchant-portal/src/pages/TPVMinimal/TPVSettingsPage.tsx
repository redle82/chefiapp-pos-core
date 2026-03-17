/**
 * TPVSettingsPage — Definições do TPV (rota /op/tpv/settings).
 *
 * Active settings:
 * - Language selector (i18next)
 * - Currency selector (localStorage + reload)
 * - Printer status (read-only from localStorage)
 * - Shift close behavior (read-only from localStorage)
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

export function TPVSettingsPage() {
  const { t, i18n } = useTranslation("tpv");
  const { currency, setCurrency, symbol } = useCurrency();

  const [currentLang, setCurrentLang] = useState(
    () => i18n.language || localStorage.getItem("chefiapp_locale") || "pt-BR",
  );

  const printerConfigured = Boolean(
    localStorage.getItem("chefiapp_printer_config"),
  );

  const shiftAutoClose =
    localStorage.getItem("chefiapp_shift_auto_close") !== "false";

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
      </div>
    </div>
  );
}
