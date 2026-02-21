/**
 * Copy do Onboarding 5 minutos (9 telas).
 * Fonte de verdade: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

export const ONBOARDING_5MIN_COPY = {
  promise:
    "Em menos de 5 minutos, o teu restaurante estará pronto para vender. Antes, isto levava dias.",

  intro: {
    headline:
      "Criar um restaurante costumava levar dias. Agora leva menos de 5 minutos.",
    bullets: [
      "Estrutura legal: nome, tipo, país",
      "Moeda e idioma",
      "Produtos e menu",
      "Caixa e turno",
      "TPV pronto para vender",
    ],
    cta: "Começar configuração",
  },

  identity: {
    headline: "Identidade do teu restaurante",
    cta: "Seguinte",
  },

  location: {
    headline: "Onde e como contactar",
    cta: "Seguinte",
  },

  dayProfile: {
    headline: "Como funciona o teu dia a dia",
    cta: "Seguinte",
  },

  shiftSetup: {
    headline: "Turno e caixa",
    description:
      "Cada dia de trabalho começa com um turno aberto e uma caixa inicial. Quando fechares o turno, o sistema faz o fecho de caixa. Aqui defines o valor padrão sugerido para abertura de turnos (será usado para pré-preencher no dia a dia e no ritual; podes alterar depois).",
    openingLabel: "Valor padrão sugerido para abertura de turnos (€)",
    cta: "Seguinte",
  },

  products: {
    headline: "Primeiro produto (ou exemplos)",
    cta: "Seguinte",
    ctaSkip: "Continuar sem adicionar",
  },

  tpvPreview: {
    headline: "TPV — Pré-visualização",
    message: "Este é um exemplo. As vendas reais começam quando abrires o turno.",
    cta: "Continuar configuração",
    linkRitual: "Abrir turno quando estiver pronto",
  },

  planTrial: {
    headline: "Trial ativo",
    cta: "Seguinte",
  },

  ritual: {
    headline: "O teu restaurante está pronto.",
    message: "Quando abrires o turno, as vendas serão reais.",
    caixaLabel: "Quanto tens hoje no caixa? (€)",
    caixaHelpDefault: "Valor sugerido na configuração.",
    caixaHelpWithValue: (eur: number) => `Sugerido: ${eur} € (definido na configuração).`,
    ctaOpen: "Abrir turno agora",
    ctaPanel: "Ir para o painel",
  },
} as const;
