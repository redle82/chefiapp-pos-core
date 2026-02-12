/**
 * Pricing V2 — Transparent, Toast-style
 *
 * Single plan, clear price, no hidden fees.
 * Uses canonical price from single source of truth.
 */
import { Link } from "react-router-dom";
import { CANONICAL_MONTHLY_PRICE_EUR } from "../../../core/pricing/canonicalPrice";

const INCLUDED = [
  "TPV Operacional",
  "KDS (Cozinha em tempo real)",
  "Menu Builder",
  "Staff App (turnos & tarefas)",
  "Reservas & Sala",
  "Analytics Operacionais",
  "Controle de Stock",
  "Monitor de Risco",
  "Página pública do restaurante",
  "Actualizações automáticas",
  "Suporte por WhatsApp",
  "Sem limite de utilizadores",
];

export const PricingV2 = () => {
  return (
    <section id="preco" className="py-24 md:py-32 bg-neutral-950">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            Preço
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Simples e <span className="text-amber-500">transparente.</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Um plano. Tudo incluído. Sem surpresas.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border border-amber-500/20 bg-[#0a0a0a] overflow-hidden relative">
            {/* Glow */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl" />

            <div className="relative p-8 md:p-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                  Plano Único
                </span>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl md:text-6xl font-black text-white">
                    {CANONICAL_MONTHLY_PRICE_EUR}€
                  </span>
                  <span className="text-neutral-500 text-lg">/mês</span>
                </div>
                <p className="text-emerald-400 text-sm font-medium">
                  14 dias grátis · Sem cartão · Sem contrato
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-10">
                {INCLUDED.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-emerald-500 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-neutral-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                to="/auth"
                className="block w-full text-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
              >
                Começar 14 dias grátis
              </Link>

              <p className="text-center text-xs text-neutral-600 mt-4">
                Sem taxa de instalação · Cancela a qualquer momento · Exporta
                todos os dados
              </p>
            </div>
          </div>
        </div>

        {/* Extra trust */}
        <div className="mt-12 text-center">
          <p className="text-neutral-600 text-sm">
            Precisa de funcionalidades enterprise ou multi-unidade?{" "}
            <a
              href="mailto:contacto@chefiapp.com"
              className="text-amber-500 hover:underline"
            >
              Fale connosco
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
