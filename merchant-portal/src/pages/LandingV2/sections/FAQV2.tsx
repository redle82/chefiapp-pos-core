/**
 * FAQ V2 — Strategic objection killer
 *
 * Toast-style: every FAQ kills a purchase objection.
 * Accordion pattern with hover interaction.
 */
import { useState } from "react";
import { CANONICAL_MONTHLY_PRICE_LABEL } from "../../../core/pricing/canonicalPrice";

const FAQS = [
  {
    q: "Isso substitui o meu POS fiscal?",
    a: "Não, e isso é intencional. O ChefIApp™ OS é o sistema operacional completo de gestão operacional + pré-conta. O POS fiscal continua responsável pela nota. Certificação fiscal própria está prevista para Q2 2026. Até lá, os dois trabalham em paralelo.",
  },
  {
    q: "Preciso de hardware específico?",
    a: "Não. O ChefIApp™ OS funciona no browser — qualquer tablet, computador ou telemóvel serve. Para imprimir comandas, suportamos impressoras térmicas ESC/POS padrão. Zero investimento em hardware proprietário.",
  },
  {
    q: "Funciona offline?",
    a: "Parcialmente. O OS aguenta interrupções curtas (até 5 minutos). Para operações críticas como pagamento e fecho de caixa, precisa de internet ativa. Para o resto da operação, continua funcional.",
  },
  {
    q: "A minha equipa vai conseguir usar?",
    a: "Sim. Interface mobile-first pensada para quem nunca usou um sistema operacional de restaurante. A equipa só vê o que precisa — quando precisa. Restaurantes reais estão a operar sem formação externa.",
  },
  {
    q: "Posso usar só o Staff App?",
    a: "Pode, mas não recomendamos. A força do OS está na integração total: turnos conectados à sala, tarefas ligadas ao stock, pedidos que chegam à cozinha. Usar tudo junto é onde o valor está.",
  },
  {
    q: "Quanto custa depois do período de teste?",
    a: `${CANONICAL_MONTHLY_PRICE_LABEL} com tudo incluído. Sem módulos extras, sem taxas escondidas, sem contrato. Cancela a qualquer momento com 1 clique.`,
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sempre. Sem contrato, sem multa, sem período mínimo. Cancela no painel com 1 clique. Exporta todos os dados antes de sair — são seus.",
  },
  {
    q: "E se eu precisar de ajuda?",
    a: "Suporte direto por WhatsApp com a equipa fundadora. Sem tickets, sem fila de espera. Respondemos como se fosse o nosso restaurante.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border-b border-white/5 transition-colors ${
        open ? "bg-neutral-900/30" : "hover:bg-neutral-900/20"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 px-6 text-left"
      >
        <span className="text-base font-semibold text-white pr-4">{q}</span>
        <span
          className={`text-neutral-500 transition-transform duration-200 shrink-0 ${
            open ? "rotate-45" : ""
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-6">
          <p className="text-sm text-neutral-400 leading-relaxed max-w-3xl">
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

export const FAQV2 = () => {
  return (
    <section id="faq" className="py-24 md:py-32 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            Perguntas Frequentes
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Perguntas honestas.{" "}
            <span className="text-amber-500">Respostas directas.</span>
          </h2>
        </div>

        <div className="rounded-2xl border border-white/5 overflow-hidden">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-neutral-500 text-sm mb-4">Tem outra pergunta?</p>
          <a
            href="mailto:contacto@chefiapp.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>{" "}
            Falar connosco
          </a>
        </div>
      </div>
    </section>
  );
};
