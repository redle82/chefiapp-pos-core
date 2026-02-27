/**
 * OSCopy.ts
 *
 * The Single Source of Truth for all operational text in ChefIApp.
 * This file enforces the "Sovereign" tone: direct, calm, secure, and industrial.
 *
 * Rules:
 * 1. No "Oops", "Sorry", or "Success!".
 * 2. Use specific operational terms (e.g., "Command", "Shift", "Protocol").
 * 3. Empty states must explain the *operational void*, not just "no data".
 */

import { SUPPORTED_CURRENCIES } from "../../../core/currency/CurrencyService";

// Inline overlay string to avoid TDZ and export compatibility across branches.
// Uses SUPPORTED_CURRENCIES (always exported) rather than getCurrencySymbol.
const CANONICAL_OVERLAY = `79 ${SUPPORTED_CURRENCIES.EUR.symbol}/mês após 14 dias grátis`;

export const OSCopy = {
  auth: {
    loginTitle: "Entrar no Sistema",
    loginSubtitle: "Sem senhas. Sem complicação.",
    loginJustBorn: "Conta criada. Entre para ativar.",
    googleButton: "Entrar com Google",
    privacyNote:
      "Usamos apenas seu email para criar sua conta. Nada é publicado.",
    technicalAccess: "Acesso Técnico (Legado)",
    restrictedArea: "Acesso restrito ao ecossistema Soberano.",
  },
  landing: {
    // Copy aprovado Onda 4 — docs/pilots/COPY_LANDING_ONDA_4_FINAL.md
    heroTitle: "Primeira venda em menos de 5 minutos.",
    heroSubtitle: "Sala, cozinha e caixa a falar a mesma língua.",
    heroDescription:
      "Regista o restaurante, cria o primeiro produto, abre o TPV e faz a primeira venda. Sem instalações complexas. Funciona hoje.",
    heroDescriptionShort:
      "Regista o restaurante, cria o primeiro produto, abre o TPV e faz a primeira venda. Sem instalações complexas. Funciona hoje.",
    ctaPrimary: "Testar 14 dias no meu restaurante",
    ctaSecondary: "Já tenho acesso",
    ctaComecarAgora: "Testar 14 dias no meu restaurante",
    ctaQueroInstalar: "Quero instalar no meu restaurante",
    ctaEntrarSistema: "Entrar no sistema",
    ctaIrAoSistema: "Ir ao sistema",
    ctaOperar: "Operar meu restaurante",
    ctaExplorarTrialGuide: "Ver Demo Guide (3 min)",
    ctaVerTrialGuide: "Abrir Demo Guide",
    ctaVerSistema3Min: "Ver o sistema a funcionar (3 min)",
    ctaExplorarPrimeiro: "Explorar primeiro",
    ctaJaTenhoAcesso: "Já tenho acesso",
    overlayPrice: CANONICAL_OVERLAY,
    trialPriceCopy:
      "O período de teste é gratuito durante 14 dias. Se fizer sentido, escolhes um plano depois. Se não, paras sem compromisso.",
    pilotPriceCopy:
      "A fase piloto é gratuita durante 14 dias. Sem cartão, sem compromisso. Se fizer sentido, escolhes um plano depois.",
    pilotCtaPrimary: "Testar 14 dias no meu restaurante",
    pilotCtaSecondary: "Agendar Demo Guide",
    modoTrial: "Modo: Free Trial",
    modoContaAtiva: "Modo: Conta ativa",
    badge: "CHEFIAPP™ OS",
    problemTitle: "🔥 Se você vive isto todos os dias...",
    problemSubtitle:
      "Você não precisa de mais um app. Você precisa de disciplina operacional.",
    problemSubtitleHighlight: "Você precisa de disciplina operacional.",
    /** Lista de dores (única fonte de verdade para Problem.tsx). */
    problemItems: [
      {
        title: "Turnos bagunçados",
        desc: "Ninguém sabe quem trabalhou quantas horas",
      },
      { title: "Stock que some", desc: "Ingrediente acaba no meio do serviço" },
      {
        title: "Tarefas esquecidas",
        desc: '"Esqueci de repor cerveja", "Ninguém limpou a cozinha"',
      },
      {
        title: "Papel e planilha",
        desc: "Informação perdida, nada automatizado",
      },
      { title: "Equipa perdida", desc: "Cada um pergunta o que fazer" },
    ],
    /** Porque falar connosco: piloto real, suporte, primeiro caso. */
    whyContactUs:
      "Piloto real com primeiro restaurante em produção (Sofia Gastrobar, Ibiza). Suporte directo por WhatsApp. Zero intermediários.",
    /** O que acontece ao clicar no CTA principal. */
    whatHappensNext:
      "Clicas → entras no sistema → 14 dias grátis a operar → no dia 15 decides se ficas (79 €/mês) ou cancelas.",
    cycleTitle: "Um ciclo completo, sem intermediários.",
    audienceTitle: "Para quem é",
    audienceSubtitle: "Feito para quem leva a operação a sério.",
    /** Prova social: primeiro restaurante em produção. */
    proofSocialSofia: "Em teste real no Sofia Gastrobar, Ibiza.",
  },
  dashboard: {
    title: "Comando Central",
    /** Identity Layer: título da página = "{restaurantName} — Comando Central". Fallback quando não há nome. */
    pageTitle: "ChefIApp OS — Comando Central",
    /** Template para construir título: usar com restaurantName. Ex: `${restaurantName} — ${OSCopy.dashboard.comandoCentral}` */
    pageTitleTemplate: "{restaurantName} — Comando Central",
    comandoCentral: "Comando Central",
    subtitle: "Visão Geral da Operação",
    operation: "Operação Agora",
    priority: "PRIORIDADE IMEDIATA",
    /** Design Contract v1: copy declarativa. */
    stateOfRoom: "Estado da sala",
    stateOfSeats: "Estado dos asientos",
    pulseOfOperation: "Pulso da operação",
    errorLoad: "Não foi possível carregar o Comando Central. Tente de novo.",
    retry: "Tente de novo",
  },
  navigation: {
    dashboard: "Comando Central",
    settings: "Ajustes do Núcleo",
    tpv: "TPV (Caixa)",
    kds: "KDS (Cozinha)",
    menu: "Cardápio",
    team: "Equipa",
    reports: "Analisar",
    logout: "Encerrar Turno",
  },
  actions: {
    save: "Gravar Alterações",
    cancel: "Cancelar",
    delete: "Eliminar",
    confirm: "Confirmar Procedimento",
    loading: "Processando...",
  },
  emptyStates: {
    generic: {
      title: "Vazio Operacional",
      description: "Nenhuma atividade registrada neste setor até o momento.",
    },
    primeiroProduto: {
      titulo: "Próximo passo: criar primeiro produto",
      descricao:
        "Adicione um produto ao cardápio para começar a vender no TPV.",
      cta: "Criar primeiro produto",
    },
    orders: {
      title: "Sem Ordens Ativas",
      description:
        "O sistema aguarda entrada de novos pedidos via TPV ou Canais.",
    },
    team: {
      title: "Equipa não Alocada",
      description: "Nenhum operador registado no turno atual.",
    },
  },
  errors: {
    generic: "Interrupção de Serviço",
    network: "Conexão Instável. Verifique o link.",
    permission: "Acesso Negado pelo Protocolo.",
    actionFailed: "Erro ao executar ação.",
  },
  trialGuide: {
    badgeActive: "Demo Guide Active",
    exploreSystem: "Ver o sistema (guia 3 min)",
    exploreTpv: "Explorar TPV (guia)",
    startTrial: "Ativar Free Trial",
    modeTrial: "Free Trial",
    modeTrialLabel: "Modo: Free Trial",
    backToLanding: "Voltar à landing",
    backToGuide: "Voltar ao Demo Guide",
    createAccountOperate: "Criar conta e operar de verdade",
    ctaStartTrialNow: "Começar agora (14 dias grátis)",
  },
  research: {
    hubTitle: "RESEARCH HUB",
    hubSubtitle: "Cognitive TPV",
    accessAction: "Acessar Sistema",
    footer: "ChefIApp Research • Cognitive TPV",
  },
  modules: {
    notFoundTitle: "Módulo Não Identificado",
    notFoundDesc:
      "O caminho que seguiu não está mapeado no manifesto soberano.",
    phaseLabel: "Fase Atual",
    dependenciesLabel: "Dependências Críticas",
    observationActive: "Protocolo de Observação Ativo",
    observationDesc:
      "Este módulo está no radar de desenvolvimento. Dados exploratórios já estão sendo coletados para calibração.",
    backToCommand: "← Voltar ao Comando Central",
  },
  operations: {
    hubTitle: "OperationalHub",
    hubSubtitle:
      "Gestão completa de operações — Fast Mode, Stock, Fichaje, Delivery, Analytics",
    createTask: "Criar Tarefa",
    analytics: {
      title: "Hoje",
      sales: "Vendas",
      orders: "Pedidos",
      avgTicket: "Ticket Médio",
    },
    fastMode: {
      title: "Fast Mode",
      active: "Ativo",
      inactive: "Inativo",
      description: "Modo de venda ultrarrápida para Fast Service.",
      notConfigured: "Status: Offline / Não Configurado.",
    },
    stock: {
      title: "Estoque Baixo",
      allGood: "Níveis de estoque normais. Nenhuma ação requerida.",
    },
    shifts: {
      title: "Turnos Ativos",
      none: "Turno Operacional Inativo.",
    },
    delivery: {
      title: "Delivery",
      none: "Canais de Delivery Inativos.",
    },
    tasks: {
      title: "Tarefas",
      none: "Fila de tarefas limpa. Nenhuma prioridade pendente.",
      status: {
        pending: "Pendentes",
        focused: "Em foco",
        done: "Concluídas",
        all: "Todas",
      },
      priority: {
        critical: "Crítica",
        urgent: "Urgente",
        attention: "Atenção",
        background: "Background",
        all: "Todas prioridades",
      },
    },
  },
  governance: {
    title: "GovernManage",
    subtitle: "Inteligência de reviews e gestão de reputação.",
    runPipeline: "Executar Pipeline",
    processing: "Processando...",
    pipelineExecuted: "Pipeline executado com sucesso!",
    pipelineFailed: "Falha na execução do pipeline.",
    sections: {
      runningActions: "Ações em execução",
      rating: "Avaliação Média",
      alerts: "Alertas",
      churn: "Principais Motivos de Insatisfação",
      recommended: "Ações Recomendadas",
      noPending: "Governança em dia. Nenhuma recomendação pendente.",
    },
    topics: {
      price: "Preço",
      cleanliness: "Limpeza",
      service: "Atendimento",
      food: "Comida",
      ambience: "Ambiente",
      wait_time: "Tempo de Espera",
      value: "Custo-benefício",
    },
  },
  menu: {
    title: "Gestão do Menu",
    subtitle: "Organize categorias, produtos e preços.",
    emptyTitle: "Menu Não Configurado",
    emptyDesc: "Nenhum produto cadastrado no Kernel. Inicie a configuração.",
    draftBanner:
      "Visibilidade Restrita (Rascunho). Ative para publicação pública.",
    modeDraft: "MODO RASCUNHO",
    actions: {
      activate: "Ativar Restaurante",
      autoCreator: "Iniciar Automação",
      startZero: "Começar do Zero",
      addCategory: "+ Categoria",
      addProduct: "+ Produto",
      edit: "✏️ Editar",
      lock: "🔒 Travar Edição",
      save: "Salvar",
      cancel: "Cancelar",
      add: "Adicionar",
    },
    labels: {
      catName: "NOME DA CATEGORIA",
      prodName: "NOME DO PRODUTO",
      price: "PREÇO (€)",
      category: "CATEGORIA",
      catPlaceholder: "Ex: Bebidas...",
      prodPlaceholder: "Ex: Burger...",
      pricePlaceholder: "0.00",
    },
    feedback: {
      catCreated: "Categoria criada.",
      prodCreated: "Produto registado.",
      prodUpdated: "Produto atualizado.",
      prodDeleted: "Produto eliminado.",
      selectCat: "Seleção de categoria obrigatória.",
      errorLoad: "Falha na leitura do Kernel de Menu.",
      errorCreateCat: "Falha ao persistir categoria.",
      errorSaveProd: "Falha ao persistir dados no Kernel.",
      errorDeleteProd: "Operação rejeitada pelo sistema.",
    },
    airlock: {
      viewMenu: "Consultar Cardápio",
      viewMenuDesc: "Acesso público ao inventário disponível.",
      staffArea: "Acesso Restrito",
      staffAreaDesc: "Área exclusiva para Operadores autorizados.",
      info: "Informações",
      infoDesc: "Dados de contato e localização.",
    },
  },
} as const;
