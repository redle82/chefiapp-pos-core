const needsLocalStorageShim =
  !globalThis.localStorage ||
  typeof globalThis.localStorage.getItem !== "function" ||
  typeof globalThis.localStorage.setItem !== "function";

if (needsLocalStorageShim) {
  const store: Record<string, string> = {};

  globalThis.localStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

// ─── i18n test setup ────────────────────────────────────────────────────────
// Initialize i18next with English translations so t() returns real strings
// instead of raw keys in components under test.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./src/locales/en/common.json";
import enConfig from "./src/locales/en/config.json";
import enDashboard from "./src/locales/en/dashboard.json";
import enKds from "./src/locales/en/kds.json";
import enOnboarding from "./src/locales/en/onboarding.json";
import enOperational from "./src/locales/en/operational.json";
import enPwa from "./src/locales/en/pwa.json";
import enReceipt from "./src/locales/en/receipt.json";
import enReservations from "./src/locales/en/reservations.json";
import enShift from "./src/locales/en/shift.json";
import enSidebar from "./src/locales/en/sidebar.json";
import enTpv from "./src/locales/en/tpv.json";
import enWaiter from "./src/locales/en/waiter.json";

void i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: [
    "common",
    "tpv",
    "kds",
    "onboarding",
    "shift",
    "receipt",
    "reservations",
    "config",
    "pwa",
    "dashboard",
    "operational",
    "waiter",
    "sidebar",
  ],
  interpolation: { escapeValue: false },
  resources: {
    en: {
      common: enCommon,
      tpv: enTpv,
      kds: enKds,
      onboarding: enOnboarding,
      shift: enShift,
      receipt: enReceipt,
      reservations: enReservations,
      config: enConfig,
      pwa: enPwa,
      dashboard: enDashboard,
      operational: enOperational,
      waiter: enWaiter,
      sidebar: enSidebar,
    },
  },
});
