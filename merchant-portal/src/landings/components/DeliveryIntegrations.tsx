/**
 * DeliveryIntegrations — Nível 1 (manual) e Nível 2 (agregadores roadmap).
 * Ref: docs/commercial/COUNTRY_DEPLOYMENT_SYSTEM.md
 */
import type { CountryConfig } from "../countries";

export interface DeliveryIntegrationsProps {
  country: CountryConfig;
}

export function DeliveryIntegrations({ country }: DeliveryIntegrationsProps) {
  const locale = country.locale;

  const level1Label =
    locale === "en"
      ? "Manual-assisted mode"
      : locale === "es"
        ? "Modo manual asistido"
        : "Modo manual assistido";

  const level2Label =
    locale === "en" ? "Aggregators" : locale === "es" ? "Agregadores" : "Agregadores";

  const level1Desc =
    locale === "en"
      ? "Today: import orders from tablet with one click. Works without API approval."
      : locale === "es"
        ? "Hoy: importar pedidos del tablet con un clic. Funciona sin aprobación API."
        : "Hoje: importar pedidos do tablet com 1 clique. Funciona sem aprovação de API.";

  const level2Desc =
    locale === "en"
      ? "Deliverect, Otter, etc. Multiple platforms with one integration. On roadmap."
      : locale === "es"
        ? "Deliverect, Otter, etc. Varias plataformas con una integración. En roadmap."
        : "Deliverect, Otter, etc. Várias plataformas com uma integração. Em roadmap.";

  return (
    <section
      id="integracoes"
      className="py-24 bg-neutral-950 px-6 border-t border-white/5"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
          {locale === "en"
            ? "Delivery integration"
            : locale === "es"
              ? "Integración delivery"
              : "Integração delivery"}
        </h2>
        <p className="text-neutral-400 text-center mb-12">
          {country.deliveryMessage}
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/50 p-6">
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              {level1Label}
            </span>
            <p className="text-sm text-neutral-300">{level1Desc}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/50 p-6">
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
              {level2Label}
            </span>
            <p className="text-sm text-neutral-300">{level2Desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
