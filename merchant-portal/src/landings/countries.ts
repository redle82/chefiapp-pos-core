/**
 * Mapa de países para landings localizadas (gateway-first).
 * Apenas BR, ES, GB, US. Ref: docs/commercial/GATEWAY_DEPLOYMENT_MATRIX.md
 */

export type CountryCode = "br" | "es" | "gb" | "us" | "pt";

export type SupportedCurrency = "EUR" | "USD" | "BRL" | "GBP";

export type SupportedLocale = "es" | "pt-BR" | "en";

export interface CountryConfig {
  code: CountryCode;
  locale: SupportedLocale;
  currency: SupportedCurrency;
  /** WhatsApp number without + (e.g. "351912345678"). Empty = no WhatsApp CTA. */
  whatsAppNumber: string;
  /** Pre-filled message for WhatsApp. URL-encoded in component. */
  whatsAppMessage: string;
  meta: {
    title: string;
    description: string;
  };
  hero: {
    h1: string;
    h1Accent?: string;
    subhead: string;
  };
  /** Delivery integration messaging by region. */
  deliveryMessage: string;
}

/** Preços por moeda (cents → display). Ref: docs/commercial/PRICING_AND_PACKAGES.md */
export const PRICING_BY_CURRENCY: Record<
  SupportedCurrency,
  { starter: number; pro: number; enterprise: number; symbol: string }
> = {
  EUR: { starter: 29, pro: 59, enterprise: 99, symbol: "€" },
  USD: { starter: 32, pro: 65, enterprise: 110, symbol: "$" },
  BRL: { starter: 149, pro: 299, enterprise: 499, symbol: "R$" },
  GBP: { starter: 26, pro: 52, enterprise: 88, symbol: "£" },
};

/** Countries config — add new country here. Gateway-first: only BR, ES, GB, US. */
export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  es: {
    code: "es",
    locale: "es",
    currency: "EUR",
    whatsAppNumber: "34912345678",
    whatsAppMessage: "¡Hola! Me gustaría saber más sobre ChefIApp.",
    meta: {
      title: "ChefIApp España | POS + Orquestración de Equipo para Restaurantes",
      description:
        "Sistema operativo para restaurantes. Pago rápido, KDS inteligente, tareas automáticas. Prueba gratis 14 días. Empieza en minutos.",
    },
    hero: {
      h1: "ChefIApp OS — El sistema operativo para restaurantes en España",
      subhead:
        "Pago en 2 toques. Cocina y sala en sincronía. Prueba 14 días gratis.",
    },
    deliveryMessage:
      "Integración delivery: modo manual asistido hoy. Agregadores en roadmap.",
  },
  br: {
    code: "br",
    locale: "pt-BR",
    currency: "BRL",
    whatsAppNumber: "5521999999999",
    whatsAppMessage: "Olá! Gostaria de saber mais sobre o ChefIApp.",
    meta: {
      title: "ChefIApp Brasil | POS + Orquestração de Equipe para Restaurantes",
      description:
        "Sistema operacional para restaurantes. Pagamento rápido, KDS inteligente, tarefas automáticas. Teste grátis 14 dias. Comece em minutos.",
    },
    hero: {
      h1: "ChefIApp OS — O sistema operacional para restaurantes brasileiros",
      subhead:
        "Pagamento em 2 toques. Cozinha e salão em sincronia. Teste 14 dias grátis.",
    },
    deliveryMessage:
      "Delivery: modo manual assistido hoje. iFood, Rappi, Uber Eats via agregador em roadmap.",
  },
  us: {
    code: "us",
    locale: "en",
    currency: "USD",
    whatsAppNumber: "",
    whatsAppMessage: "Hi! I'd like to learn more about ChefIApp.",
    meta: {
      title: "ChefIApp USA | POS + Workforce Orchestration for Restaurants",
      description:
        "Restaurant operating system. Fast payment, smart KDS, automatic tasks. 14-day free trial. Start in minutes.",
    },
    hero: {
      h1: "ChefIApp OS — The Operating System for Restaurants",
      subhead: "2-tap payment. Kitchen and floor in sync. 14-day free trial.",
    },
    deliveryMessage:
      "Delivery: manual-assisted mode today. Aggregators (DoorDash, Uber Eats) on roadmap.",
  },
  pt: {
    code: "pt",
    locale: "pt-BR",
    currency: "EUR",
    whatsAppNumber: "351912345678",
    whatsAppMessage: "Olá! Gostaria de saber mais sobre o ChefIApp.",
    meta: {
      title: "ChefIApp Portugal | POS + Orquestração de Equipa para Restaurantes",
      description:
        "Sistema operativo para restaurantes. Pagamento rápido, KDS inteligente, tarefas automáticas. Teste grátis 14 dias.",
    },
    hero: {
      h1: "ChefIApp OS — O sistema operativo para restaurantes em Portugal",
      subhead:
        "Pagamento em 2 toques. Cozinha e sala em sincronia. Teste 14 dias grátis.",
    },
    deliveryMessage:
      "Integração delivery: modo manual assistido. Agregadores em roadmap.",
  },
  gb: {
    code: "gb",
    locale: "en",
    currency: "GBP",
    whatsAppNumber: "441234567890",
    whatsAppMessage: "Hi! I'd like to learn more about ChefIApp.",
    meta: {
      title: "ChefIApp UK | POS + Workforce Orchestration for Restaurateurs",
      description:
        "Restaurant operating system. Fast payment, smart KDS, automatic tasks. 14-day free trial. Start in minutes.",
    },
    hero: {
      h1: "ChefIApp OS — The Operating System for UK Restaurants",
      subhead: "2-tap payment. Kitchen and floor in sync. 14-day free trial.",
    },
    deliveryMessage:
      "Delivery: manual-assisted mode today. Aggregators on roadmap.",
  },
};

export const COUNTRY_ROUTES: CountryCode[] = ["br", "es", "gb", "us", "pt"];

export function getCountryConfig(code: string | undefined): CountryConfig | null {
  if (!code || typeof code !== "string") return null;
  const lower = code.toLowerCase();
  return (COUNTRIES as Record<string, CountryConfig>)[lower] ?? null;
}

export function isValidCountryCode(code: string): code is CountryCode {
  return COUNTRY_ROUTES.includes(code as CountryCode);
}
