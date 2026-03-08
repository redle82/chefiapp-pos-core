/**
 * ManagementAdvisor - Orientação de Gestão (GloriaFood Model)
 *
 * Ao contrário do RequireOnboarding, este componente NUNCA bloqueia o acesso.
 * Ele apenas observa o estado do ciclo de vida e exibe alertas/banners
 * se o restaurante ainda não estiver publicado.
 */

import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { OnboardingProvider } from "../../context/OnboardingContext";
import { RestaurantRuntimeContext } from "../../context/RestaurantRuntimeContext";

interface Props {
  children: React.ReactNode;
}

export function ManagementAdvisor({ children }: Props) {
  const context = useContext(RestaurantRuntimeContext);
  const runtime = context?.runtime;
  const { t } = useTranslation("sidebar");

  // Don't show anything during initial load or if already published
  if (!runtime || runtime.loading || runtime.isPublished) {
    return <OnboardingProvider>{children}</OnboardingProvider>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner de Advisor - Não Bloqueante */}
      <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center gap-2 font-medium text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <strong>{t("advisor.title")}</strong> {t("advisor.description")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/config/general"
            className="text-xs font-bold underline hover:no-underline"
          >
            {t("advisor.completeChecklist")}
          </Link>
          <button
            onClick={() => (window.location.href = "/admin/config/general")}
            className="bg-black text-white px-3 py-1 rounded text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            {t("advisor.publishNow")}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        <OnboardingProvider>{children}</OnboardingProvider>
      </main>
    </div>
  );
}
