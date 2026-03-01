/**
 * CookieConsentBanner — GDPR-compliant cookie consent with 3 categories.
 *
 * Categories:
 *   - necessary (always on, cannot be toggled off)
 *   - analytics (opt-in, default off)
 *   - marketing (opt-in, default off)
 *
 * Actions: Accept All | Reject Non-Essential | Manage Preferences
 *
 * Persists granular preferences in localStorage.
 * Records legal consent via audit trail.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { recordLegalConsent } from "../core/audit/legalConsent";
import { getTabIsolated } from "../core/storage/TabIsolatedStorage";

// ── Storage keys ────────────────────────────────────────────────────────────
const CONSENT_STORAGE_KEY = "chefiapp_cookie_consent_accepted";
const CONSENT_PREFS_KEY = "chefiapp_cookie_preferences";
const LEGAL_CONSENT_KEY = "chefiapp_legal_consent_v1";

export interface CookiePreferences {
  necessary: true; // always true
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const DEFAULT_PREFS: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
};

function getStoredPreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

/** Read current cookie consent preferences (null if not yet answered). */
export function getCookiePreferences(): CookiePreferences | null {
  return getStoredPreferences();
}

function hasConsent(): boolean {
  if (typeof window === "undefined") return true;
  if (localStorage.getItem(CONSENT_STORAGE_KEY) === "true") return true;
  if (getTabIsolated(LEGAL_CONSENT_KEY)) return true;
  return false;
}

// ── Component ───────────────────────────────────────────────────────────────

export function CookieConsentBanner() {
  const { t } = useTranslation("common");
  // NOTE: This component renders at App root, OUTSIDE TenantProvider.
  // Use getTabIsolated for best-effort tenant ID in the audit trail.
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setVisible(!hasConsent());
  }, []);

  const persistConsent = useCallback(async (prefs: CookiePreferences) => {
    try {
      const restaurantId =
        getTabIsolated("chefiapp_restaurant_id") ?? undefined;
      await recordLegalConsent({
        restaurantId,
        source: "cookie_banner",
        termsUrl: "/legal/terms",
        privacyUrl: "/legal/privacy",
        meta: {
          analytics: prefs.analytics,
          marketing: prefs.marketing,
        },
      });
    } catch {
      // best-effort audit
    }
    localStorage.setItem(CONSENT_STORAGE_KEY, "true");
    localStorage.setItem(CONSENT_PREFS_KEY, JSON.stringify(prefs));
    setVisible(false);
  }, []);

  const handleAcceptAll = () =>
    persistConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });

  const handleReject = () =>
    persistConsent({ ...DEFAULT_PREFS, timestamp: new Date().toISOString() });

  const handleSavePreferences = () =>
    persistConsent({
      necessary: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    });

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookieBannerAria")}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#1a1a24] border-t border-white/10 text-white px-4 py-3 shadow-lg"
    >
      <div className="container mx-auto max-w-4xl flex flex-col gap-3">
        {/* ── Main message ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/90 flex-1 min-w-[200px]">
            {t("cookieBannerPrefix")}
            <Link
              to="/legal/terms"
              className="underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("termsLink")}
            </Link>
            {t("cookieBannerMiddle")}
            <Link
              to="/legal/privacy"
              className="underline hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("privacyLink")}
            </Link>
            {t("cookieBannerSuffix")}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReject}
              className="px-3 py-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t("reject")}
            </button>
            <button
              type="button"
              onClick={() => setShowPrefs((p) => !p)}
              className="px-3 py-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t("managePreferences")}
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors text-sm"
            >
              {t("accept")}
            </button>
          </div>
        </div>

        {/* ── Preferences panel ────────────────────────────────────────── */}
        {showPrefs && (
          <div className="border-t border-white/10 pt-3 pb-1 flex flex-col gap-3">
            {/* Necessary — always on */}
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked
                disabled
                className="accent-amber-500 w-4 h-4"
              />
              <span>
                <strong>{t("cookieNecessary")}</strong>
                <span className="text-white/50 ml-2 text-xs">
                  {t("cookieNecessaryDesc")}
                </span>
              </span>
            </label>

            {/* Analytics */}
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="accent-amber-500 w-4 h-4"
              />
              <span>
                <strong>{t("cookieAnalytics")}</strong>
                <span className="text-white/50 ml-2 text-xs">
                  {t("cookieAnalyticsDesc")}
                </span>
              </span>
            </label>

            {/* Marketing */}
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="accent-amber-500 w-4 h-4"
              />
              <span>
                <strong>{t("cookieMarketing")}</strong>
                <span className="text-white/50 ml-2 text-xs">
                  {t("cookieMarketingDesc")}
                </span>
              </span>
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium rounded-lg transition-colors"
              >
                {t("savePreferences")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
