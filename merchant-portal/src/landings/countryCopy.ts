/**
 * Copy por segmento (small | multi | enterprise) e por locale.
 * Ref: docs/commercial/SEGMENTED_SALES_FUNNEL.md
 */

import type { SupportedLocale } from "./countries";

export type Segment = "small" | "multi" | "enterprise";

export interface SegmentCopy {
  heroHeadline: string;
  heroSubhead: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

const SEGMENT_COPY: Record<Segment, Record<SupportedLocale, SegmentCopy>> = {
  small: {
    es: {
      heroHeadline: "Menos caos. Un sistema. Control en tiempo real.",
      heroSubhead:
        "El TPV que piensa. Pago en 2 toques. Cocina y sala en sincronía.",
      ctaPrimary: "Empezar gratis",
      ctaSecondary: "Ver cómo funciona",
    },
    "pt-BR": {
      heroHeadline: "Menos caos. Um sistema. Controle em tempo real.",
      heroSubhead:
        "O TPV que pensa. Pagamento em 2 toques. Cozinha e salão em sincronia.",
      ctaPrimary: "Começar grátis",
      ctaSecondary: "Ver como funciona",
    },
    en: {
      heroHeadline: "Less chaos. One system. Real-time control.",
      heroSubhead:
        "The POS that thinks. 2-tap payment. Kitchen and floor in sync.",
      ctaPrimary: "Start free",
      ctaSecondary: "See how it works",
    },
  },
  multi: {
    es: {
      heroHeadline: "Un comando para todas las casas. Datos en tiempo real.",
      heroSubhead:
        "Consolida ventas, turnos y tareas en un único dashboard.",
      ctaPrimary: "Agendar demo",
      ctaSecondary: "Hablar con ventas",
    },
    "pt-BR": {
      heroHeadline: "Um comando para todas as casas. Dados em tempo real.",
      heroSubhead:
        "Consolida vendas, turnos e tarefas num único dashboard.",
      ctaPrimary: "Agendar demo",
      ctaSecondary: "Falar com vendas",
    },
    en: {
      heroHeadline: "One command for all locations. Real-time data.",
      heroSubhead:
        "Consolidate sales, shifts and tasks in one dashboard.",
      ctaPrimary: "Schedule demo",
      ctaSecondary: "Talk to sales",
    },
  },
  enterprise: {
    es: {
      heroHeadline: "Orquestración de equipo a escala. Compliance y auditoría.",
      heroSubhead: "RBAC, auditoría, API documentada. Multi-tenant enterprise-ready.",
      ctaPrimary: "Hablar con ventas",
      ctaSecondary: "Ver documentación API",
    },
    "pt-BR": {
      heroHeadline: "Orquestração de equipe em escala. Compliance e auditoria.",
      heroSubhead: "RBAC, auditoria, API documentada. Multi-tenant enterprise-ready.",
      ctaPrimary: "Falar com vendas",
      ctaSecondary: "Ver documentação API",
    },
    en: {
      heroHeadline: "Workforce orchestration at scale. Compliance and audit.",
      heroSubhead: "RBAC, audit, documented API. Multi-tenant enterprise-ready.",
      ctaPrimary: "Talk to sales",
      ctaSecondary: "View API docs",
    },
  },
};

export function getSegmentCopy(
  segment: Segment,
  locale: SupportedLocale
): SegmentCopy {
  return SEGMENT_COPY[segment][locale] ?? SEGMENT_COPY[segment].en;
}
