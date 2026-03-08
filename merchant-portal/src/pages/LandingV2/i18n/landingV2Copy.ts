/**
 * Copy da LandingV2 — pt, en, es.
 * Única fonte de strings traduzíveis da landing. Ver LANDING_CANON.md.
 */

import { getCurrencySymbol } from "../../../core/currency/CurrencyService";

export type LandingLocale = "pt" | "en" | "es";

export const LANDING_LOCALES: LandingLocale[] = ["pt", "en", "es"];

const copy = {
  pt: {
    meta: {
      title: "ChefIApp™ OS — O Sistema Operacional para Restaurantes",
      description:
        "Uma verdade operacional. Sala, cozinha, bar e equipa num único sistema. Sem duct tape, sem sincronizações.",
    },
    hero: {
      navSystem: "O Sistema",
      navAudience: "Para quem",
      navPrice: "Preço",
      navFaq: "FAQ",
      navBlog: "Blog",
      badge: "Em produção real",
      headline: "O sistema operacional que gere o seu",
      headlineAccent: "restaurante inteiro.",
      subhead:
        "Uma verdade. Sala, cozinha, bar e equipa no mesmo sistema — em tempo real.",
      subhead2:
        "O dinheiro não se perde num sítio. Foge em vazamentos invisíveis — em cada serviço, em cada pico.",
      subhead3:
        "Não é protótipo. É o sistema que usamos todos os dias. Num restaurante em Ibiza.",
      ctaPrimary: "Começar 14 dias grátis",
      ctaSecondary: "Ver o sistema a operar",
      goToSystem: "Ir ao sistema",
      signIn: "Entrar",
      tryFree: "Testar grátis",
      trust14: "14 dias grátis",
      trustNoCard: "Sem cartão",
      trustCancel: "Cancela quando quiser",
    },
    ctaBanner: {
      headline: "Um sistema. Uma verdade operacional. Sem duct tape.",
      cta: "Começar 14 dias grátis",
    },
    exitBanner: {
      message: "Falta um passo — 14 dias grátis, sem cartão.",
      cta: "Começar 14 dias grátis",
      dismiss: "Fechar",
    },
    footer: {
      ctaHeadline: "Pronto para operar com",
      ctaHeadlineAccent: "uma única verdade?",
      ctaSub:
        "Regista o restaurante, monta o menu, primeira venda. Menos de 25 minutos.",
      ctaButton: "Começar 14 dias grátis",
      whatsapp: "Ou fale connosco no WhatsApp →",
      groupSystem: "O Sistema",
      groupCompany: "Empresa",
      groupSupport: "Suporte",
      groupLegal: "Legal",
      linkSystem: "O Sistema",
      linkAudience: "Para quem",
      linkPrice: "Preço",
      linkFaq: "FAQ",
      linkAbout: "Sobre",
      linkBlog: "Blog",
      linkChangelog: "Changelog",
      linkCareers: "Carreiras",
      linkWhatsApp: "WhatsApp",
      linkEmail: "Email",
      linkStatus: "Estado do sistema",
      linkPrivacy: "Privacidade",
      linkTerms: "Termos",
      linkSecurity: "Segurança",
      tagline: "Sistema operacional para restaurantes.",
      taglineBy: "Feito por quem opera.",
      taglineMission:
        "O dinheiro foge em vazamentos. O ChefIApp™ existe para os fechar.",
      copyright: "Todos os direitos reservados.",
      madeWith: "Feito com disciplina operacional.",
    },
    faq: {
      sectionLabel: "Perguntas Frequentes",
      headline: "Perguntas honestas.",
      headlineAccent: "Respostas directas.",
      anotherQuestion: "Tem outra pergunta?",
      contactUs: "Falar connosco",
      items: [
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
          a: "Pode usar só o Staff App, mas o valor real aparece quando tudo está ligado: turnos conectados à sala, pedidos que alimentam o stock e a cozinha a ver o que entra em tempo real. O ChefIApp™ OS foi desenhado para reduzir vazamentos na operação como um todo, não para ser mais uma app de tarefas isolada.",
        },
        {
          q: "Quanto custa depois do período de teste?",
          a: "{{price}} com tudo incluído. Sem módulos extras, sem taxas escondidas, sem contrato. Cancela a qualquer momento com 1 clique.",
        },
        {
          q: "Posso cancelar a qualquer momento?",
          a: "Sempre. Sem contrato, sem multa, sem período mínimo. Cancela no painel com 1 clique. Exporta todos os dados antes de sair — são seus.",
        },
        {
          q: "E se eu precisar de ajuda?",
          a: "Suporte direto por WhatsApp com a equipa fundadora. Sem tickets, sem fila de espera. Respondemos como se fosse o nosso restaurante.",
        },
        {
          q: "Funciona para mais do que um restaurante?",
          a: "Sim. O ChefIApp™ foi desenhado para crescer de um único restaurante para grupos e cadeias. Relatórios consolidados, visão central por unidade e permissões por equipa vivem na mesma infraestrutura operacional.",
        },
      ],
    },
    pricing: {
      sectionLabel: "Preço",
      headline: "Simples e",
      headlineAccent: "transparente.",
      subhead: "Um plano. Tudo incluído. Sem surpresas.",
      badge: "Plano Único",
      perMonth: "/mês",
      trustLine: "14 dias grátis · Sem cartão · Sem contrato",
      cta: "Começar 14 dias grátis",
      footerLine:
        "Sem taxa de instalação · Cancela a qualquer momento · Exporta todos os dados",
      enterpriseQuestion:
        "Precisa de funcionalidades enterprise ou multi-unidade?",
      contactUs: "Fale connosco",
      included: [
        "TPV Operacional",
        "KDS (Cozinha em tempo real)",
        "Menu Builder",
        "Staff App (mini-TPV & turnos)",
        "Reservas & Sala",
        "Analytics Operacionais",
        "Controle de Stock",
        "Monitor de Risco",
        "Página pública do restaurante",
        "Actualizações automáticas",
        "Suporte por WhatsApp",
        "Sem limite de utilizadores",
      ],
    },
    manifesto: {
      headline: "Por que isto é um",
      headlineAccent: "Sistema Operacional?",
      subhead:
        "A maioria cola 5 ferramentas e espera que funcionem juntas. Nunca funcionam.",
      beforeLabel: "A realidade de hoje",
      beforeItems: [
        "Um POS isolado",
        "Um app de reservas separado",
        "WhatsApp para a equipa",
        "Papel na cozinha",
        "Excel depois do turno",
      ],
      beforeFooter: "5 ferramentas. 5 logins. Zero ligação entre elas.",
      afterLabel: "Com o ChefIApp™ OS",
      afterHeadline: "Tudo isso vira um único cérebro operacional.",
      osReasons: [
        {
          title: "Todos os componentes partilham o mesmo cérebro",
          desc: "Um pedido afecta stock, faturação, KDS, analytics e equipa — ao mesmo tempo.",
        },
        {
          title: "Um evento afecta todo o sistema",
          desc: "Quando um empregado marca turno, sala e pedidos ajustam-se sozinhos — sem listas de tarefas paralelas para manter.",
        },
        {
          title: "Nada precisa ser integrado depois",
          desc: "Sem APIs de terceiros, sem conectores, sem sincronizações nocturnas. Tudo nasce ligado.",
        },
      ],
      callout1: "Um restaurante não precisa de 5 sistemas.",
      callout2: "Precisa de um sistema operacional.",
    },
    finalManifesto: {
      headline1: "Restaurantes com ferramentas reagem.",
      headline2: "Restaurantes com sistema operacional antecipam.",
      body1:
        "A maioria dos restaurantes cola ferramentas desconectadas e tenta controlar o caos no fim do dia. Erros, atrasos e vazamentos de margem aparecem sempre depois do serviço.",
      body2:
        "O ChefIApp™ liga sala, cozinha, stock, equipa e faturação no mesmo cérebro operacional.",
      callout: "Não organizamos o caos — impedimos que ele aconteça.",
    },
    targetAudience: {
      sectionLabel: "Para quem é",
      headline: "Feito para quem leva",
      headlineAccent: "a operação a sério.",
      audiences: [
        {
          title: "Restaurantes de Serviço Completo",
          desc: "Sala, cozinha, bar e caixa sincronizados. Gestão de mesas, reservas e turnos incluídos.",
          features: ["Mapa de mesas", "Reservas", "KDS integrado"],
        },
        {
          title: "Bares & Gastrobares",
          desc: "Atendimento rápido ao balcão. Controle de consumo por cliente e fecho de caixa simplificado.",
          features: ["Pedidos rápidos", "Conta por cliente", "Staff flexível"],
        },
        {
          title: "Dark Kitchens",
          desc: "Foco total na produção. Pedidos online, filas de preparo e analytics de velocidade.",
          features: ["Pedidos online", "KDS prioritário", "Menu digital"],
        },
        {
          title: "Operações Multi-marca",
          desc: "Vários conceitos, um sistema operacional. Cardápios distintos com dados consolidados.",
          features: [
            "Multi-restaurante",
            "Analytics unificado",
            "Equipa partilhada",
          ],
        },
      ],
    },
    comoComecer: {
      sectionLabel: "Como começar",
      headline: "3 passos. 25 minutos.",
      headlineAccent: "A operar.",
      subhead: "Sem técnico. Sem instalação. Sem espera.",
      stepLabel: "Passo",
      steps: [
        {
          num: "1",
          title: "Regista o restaurante",
          desc: "Nome, morada e tipo de operação. Sem formulários longos, sem aprovações. 2 minutos.",
        },
        {
          num: "2",
          title: "Monta o cardápio",
          desc: "Arrasta categorias, adiciona pratos, define preços e modificadores. 15 minutos.",
        },
        {
          num: "3",
          title: "Abre o TPV e vende",
          desc: "Primeiro pedido, primeira comanda na cozinha, primeiro pagamento. A operar.",
        },
      ],
      cta: "Começar agora — é grátis",
      ctaSub: "Registo em 2 minutos. Sem cartão de crédito.",
    },
    toolsAvoid: {
      sectionLabel: "O que cada ferramenta evita",
      headline1: "Não é só o que faz.",
      headline2: "É o que tira da tua cabeça e das pernas da equipa.",
      subhead:
        "Cada componente do ChefIApp™ OS existe para eliminar passos desnecessários, decisões no escuro e erros silenciosos. Não vendemos botões; fechamos vazamentos operacionais.",
      items: [
        {
          badge: "Staff App · Mini-TPV no bolso",
          title: "Evita voltas, espera e pedidos na memória.",
          body: "O pedido nasce onde o cliente está — não no balcão, não num papel, não na cabeça do empregado. Cada passo a menos é tempo recuperado; cada pedido certo é margem protegida.",
        },
        {
          badge: "KDS · Cozinha em tempo real",
          title: "Evita papel, impressoras e refações silenciosas.",
          body: "Prioridade automática e visibilidade por estação evitam tickets perdidos, falhas de impressão e discussões sala×cozinha. Cada prato que não precisa ser refeito é custo evitado.",
        },
        {
          badge: "Menu Builder",
          title: "Evita chamadas para técnico e margem fictícia.",
          body: "Preços, margens e modificadores mudam em segundos, antes do serviço começar. Evita passar um turno inteiro com preço errado ou prato desatualizado.",
        },
        {
          badge: "Comando Central · Dashboard",
          title: "Evita decisões cegas no fim do dia.",
          body: "Faturação, pedidos e risco operacional em tempo real evitam decisões baseadas apenas em feeling no fecho de caixa.",
        },
        {
          badge: "Analytics Operacionais",
          title: "Evita decidir amanhã sobre um problema de hoje.",
          body: "Ver mix de produto, canais e turnos com números reais evita decisões tardias e ajustes só na próxima época alta.",
        },
        {
          badge: "Tarefas Operacionais",
          title: "Evitam esquecimento e improviso em pico.",
          body: "Tarefas ligadas ao serviço actual ajudam a não esquecer o que é crítico naquele turno. Não é app de produtividade; é execução assistida a partir do que está a acontecer agora.",
        },
      ],
    },
    hardware: {
      sectionLabel: "Dispositivos",
      headline: "Funciona com o que",
      headlineAccent: "já tens.",
      subhead:
        "Sem hardware proprietário. Sem investimento inicial em equipamento. O teu tablet, computador ou telemóvel é o suficiente.",
      devices: [
        {
          title: "Tablet",
          desc: "iPad, Android ou qualquer tablet. Ideal para o TPV e o KDS.",
        },
        {
          title: "Computador",
          desc: "Dashboard completo no browser. Chrome, Safari, Firefox — qualquer um.",
        },
        {
          title: "Telemóvel",
          desc: "Staff App no bolso. Mini-TPV e avisos de turno no smartphone, sem novas apps de tarefas para gerir.",
        },
        {
          title: "Impressora Térmica",
          desc: "Compatível com impressoras ESC/POS. Comanda automática para cozinha e bar.",
        },
      ],
      pwaNote:
        "PWA instalável. Funciona como app nativa no tablet e telemóvel.",
    },
    // Depoimentos: só publicar com autorização explícita. featuredTestimonial: null para placeholder.
    socialProof: {
      sectionLabel: "Em Produção Real",
      headline: "Não é protótipo.",
      headlineAccent: "É o sistema real.",
      featuredTestimonial: {
        quote:
          "Montámos o menu, abrimos o TPV e na primeira noite já estávamos a operar. Sem técnico, sem instalação, sem stress. A equipa aprendeu sozinha.",
        authorName: "Sofia Gastrobar",
        authorSubline: "Powered by ChefIApp™ OS",
        authorLocation: "Ibiza, Espanha · Em produção desde 2026",
        initials: "SG",
        stats: [
          { value: "< 25 min", label: "Setup completo" },
          { value: "17", label: "Componentes activos" },
          { value: `0${getCurrencySymbol()}`, label: "Custo de setup" },
          { value: "1º dia", label: "Primeira venda" },
        ],
      },
      secondaryTestimonials: [] as {
        initials: string;
        quote: string;
        name: string;
        location: string;
      }[],
      placeholderCta:
        "O seu restaurante aqui? Fale connosco para ser o primeiro caso em destaque.",
      placeholderButton: "Falar connosco",
      trustLabels: [
        "Dados reais, não simulados",
        "Restaurante real a operar",
        "Suporte direto pelo fundador",
      ],
    },
    platform: {
      sectionLabel: "Componentes do Sistema Operacional",
      headline1: "Tudo o que o seu restaurante precisa.",
      headline2: "Num único sistema operacional.",
      subhead:
        "O ChefIApp™ OS coordena todas as áreas da operação — sem módulos separados, sem integrações externas, sem surpresas.",
      modules: [
        {
          title: "TPV Operacional",
          desc: 'Onde o serviço realmente começa: o pedido nasce certo à primeira, mesmo com equipa nova ou sazonal. Evita pré-contas perdidas, erros de digitação e pedidos lançados só "de cabeça".',
        },
        {
          title: "KDS — Cozinha em tempo real",
          desc: "Prioridades automáticas para pratos e mesas, com tempo a contar à vista de toda a equipa. Evita papel, impressoras térmicas críticas e refações silenciosas que corroem a margem em cada serviço.",
        },
        {
          title: "Menu Builder",
          desc: "Cria e altera cardápios em minutos, alinhando preços, margens e modificadores antes do turno começar. Evita chamadas para técnico, preços errados a meio do serviço e margem fictícia no Excel.",
        },
        {
          title: "Staff App",
          desc: "Mini-TPV e informação de turno no bolso do staff. Evita voltas inúteis até ao balcão, tempo de espera para usar o TPV fixo e pedidos que ficam na memória do empregado.",
        },
        {
          title: "Reservas & Sala",
          desc: "Reservas, walk-ins e no-shows ligados à sala real. Evita mesas vazias em hora de pico, overbooking destrutivo e perda de ticket médio por falta de previsibilidade.",
        },
        {
          title: "Analytics Operacionais",
          desc: "Dados de serviço real por turno, canal e produto — não apenas relatório do fim do mês. Evita decisões baseadas em feeling e correcções só na próxima época alta.",
        },
        {
          title: "Monitor de Risco",
          desc: "Sinais precoces de stock, serviço e equipa fora do normal aparecem antes do cliente reclamar. Evita surpresas operacionais e correções em modo urgência.",
        },
        {
          title: "Página Pública",
          desc: "A presença online operada pelo próprio restaurante: reservas e pedidos directos sob o mesmo sistema. Evita dependência total de plataformas externas e comissões em cima de cada serviço.",
        },
        {
          title: "Controle de Stock",
          desc: "Ingredientes, fichas técnicas e alertas automáticos ligados aos pedidos reais do turno. Evita desperdício, ruturas inesperadas e decisões de compra no improviso.",
        },
      ],
      bottomNote:
        "Todos os componentes incluídos. Um único sistema operacional. Zero surpresas.",
    },
    moneyLeaks: {
      sectionLabel: "Onde o dinheiro se perde sem ninguém ver",
      headline1: "Um restaurante não quebra num dia.",
      headline2: "Ele sangra todos os dias.",
      subhead:
        'Cada serviço parece "correto" — mas pequenos vazamentos operacionais somam milhares de euros por mês. Este é o mapa desses vazamentos. Os intervalos abaixo são estimativas de setor para ilustrar a dimensão dos vazamentos — não resultados medidos pelo ChefIApp.',
      leaks: [
        {
          label: "Erros de pedido",
          range: "2–4% da faturação",
          description:
            "Pratos refeitos, itens trocados, comandas confusas entre sala e cozinha.",
          footer: "Lucro a escorrer em silêncio.",
        },
        {
          label: "Tempo morto de mesa",
          range: "5–8% do potencial",
          description:
            "Mesas paradas à espera de pedido, sobremesa ou conta. Menos voltas por serviço.",
          footer: "Margem que desaparece sem ninguém notar.",
        },
        {
          label: "Stock mal controlado",
          range: "3–6% em desperdício",
          description:
            "Produto a mais que estraga, produto a menos que impede vender quando a casa enche.",
          footer: "Dinheiro que nunca chega ao banco.",
        },
        {
          label: "Turnos desbalanceados",
          range: "10–15% em folha e stress",
          description:
            "Gente a mais nas horas mortas, gente a menos na hora crítica. Mais erros, mais burnout.",
          footer: "Perda invisível, turno após turno.",
        },
        {
          label: "Faturação invisível durante o serviço",
          range: "Lucro sem dono",
          description:
            "O dono só vê o resultado no fim do dia. Nunca consegue corrigir a meio do serviço.",
          footer: "Lucro que se perde mês após mês.",
        },
      ],
      synthesis: {
        exampleLabel: "Cenário ilustrativo",
        revenue: `${getCurrencySymbol()}80.000 / mês`,
        revenueSub: "Restaurante em casa cheia",
        recoverable: `${getCurrencySymbol()}8.400 / mês`,
        recoverableSub: "Margem recuperável que hoje não chega ao banco.",
        body1:
          "Combinando estes vazamentos, um restaurante deste porte pode estar a perder entre",
        body1Highlight: `${getCurrencySymbol()}6.000 e ${getCurrencySymbol()}12.000 por mês`,
        body1End: "em margem que nunca aparece no fecho de caixa.",
        body2: "O ChefIApp™ OS existe para fechar estes vazamentos —",
        body2End: "durante o serviço, não depois.",
      },
    },
    metricsStrip: {
      metrics: [
        { type: "static" as const, value: "< 25 min", label: "Setup completo" },
        {
          type: "animated" as const,
          target: 9,
          label: "Componentes integrados",
        },
        {
          type: "static" as const,
          value: `0 ${getCurrencySymbol()}`,
          label: "Custo de hardware",
        },
        {
          type: "animated" as const,
          target: 79,
          suffix: ` ${getCurrencySymbol()}`,
          label: "Tudo incluído",
        },
        {
          type: "static" as const,
          value: "24/7",
          label: "Sistema operacional",
        },
      ],
    },
    rhythmBreak: {
      label: "Quando importa mesmo",
      headline:
        "Funciona quando o serviço aperta — não só no slide de apresentação.",
    },
    comparison: {
      sectionLabel: "A diferença",
      headline: "Porque mudar ",
      headlineAccent: "faz sentido.",
      subhead:
        "A maioria dos restaurantes opera com ferramentas desconectadas. O ChefIApp™ OS elimina essa fricção.",
      headerTraditional: "Modelo Tradicional",
      headerChefiapp: "ChefIApp™ OS",
      rows: [
        {
          aspect: "Setup inicial",
          traditional: "Dias ou semanas com técnico",
          chefiapp: "Pronto em menos de 25 minutos",
        },
        {
          aspect: "Sistemas",
          traditional: "POS + Staff + Stock separados",
          chefiapp: "Tudo integrado num único OS",
        },
        {
          aspect: "Suporte",
          traditional: "Ticket e espera",
          chefiapp: "WhatsApp direto",
        },
        {
          aspect: "Alterações no menu",
          traditional: "Depende de terceiros",
          chefiapp: "Você altera na hora",
        },
        {
          aspect: "Contrato",
          traditional: "Fidelização 12-24 meses",
          chefiapp: "Sem contrato. Cancela a qualquer momento.",
        },
        {
          aspect: "Custo de hardware",
          traditional: `${getCurrencySymbol()}2.000-${getCurrencySymbol()}5.000 em equipamento`,
          chefiapp: "Funciona no tablet ou PC que já tens",
        },
        {
          aspect: "Actualizações",
          traditional: "Pagas e com interrupção",
          chefiapp: "Automáticas e contínuas",
        },
      ],
    },
    operationalStories: {
      sectionLabel: "O restaurante em funcionamento",
      headline: "O que acontece na prática.",
      subhead1:
        "Imagine um serviço real. Sexta-feira. Casa cheia. Ou um hotel a 92% de ocupação: pequeno-almoço lotado, bar cheio, room service ativo. Tudo parece funcionar — até começar a falhar.",
      subhead2:
        'O cliente ou hóspede espera. A cozinha discute. O gerente pergunta "o que está a acontecer?". Ninguém tem resposta. É aqui que restaurantes e hotéis começam a sangrar dinheiro.',
      scenarioLabel: "Cenário",
      scenarios: [
        {
          num: "01",
          title: "Um pedido entra no TPV",
          intro: "Sexta-feira, 13h. Casa a encher.",
          steps: [
            "Aparece na cozinha (KDS) — instantaneamente",
            "O stock ajusta-se automaticamente",
            "A faturação actualiza em tempo real",
            "Fica associado ao empregado que serviu",
            "Entra nas estatísticas do dia",
          ],
          anchor:
            "Sem integrações. Sem sincronizações. Um único sistema operacional.",
        },
        {
          num: "02",
          title: "A cozinha vê prioridades, não papel",
          intro: "Sábado à noite. 18 mesas ocupadas.",
          steps: [
            "Pratos atrasados são sinalizados automaticamente",
            "Gargalos aparecem antes de virarem problema",
            "O ritmo do serviço ajusta-se sozinho",
            "O chef vê tempo real, não papel pendurado",
          ],
          anchor: "A cozinha opera com informação, não com suposição.",
        },
        {
          num: "03",
          title: "O gerente sabe tudo — sem perguntar",
          intro: "Ele abre o Comando Central e vê:",
          steps: [
            "Faturação em tempo real",
            "Mesas activas e tempo médio de serviço",
            "Equipa em turno — quem está, quem falta",
            "Alertas operacionais antes que o cliente reclame",
          ],
          anchor: "Tudo no Comando Central. Zero perguntas no corredor.",
        },
      ],
      closer: "Cada evento está ligado a todo o resto — automaticamente.",
    },
    problemSolution: {
      sectionLabel: "Problemas reais que fazem perder dinheiro",
      headline: "E como o sistema operacional fecha cada vazamento.",
      subhead:
        "Não é mais um software de gestão. É o cérebro operacional que liga pedidos, cozinha, stock, equipa e faturação no mesmo fluxo.",
      columnLabel: "Antes: caos silencioso · Depois: controlo em tempo real",
      labelWithout: "Sem sistema operacional",
      labelWith: "Com ChefIApp™ OS",
      problems: [
        {
          title: "Pratos atrasados na cozinha",
          lossLabel: "Perda estimada: 3–6% por serviço",
          without: [
            "Pedidos acumulam-se sem prioridade clara.",
            "Garçons pressionam a cozinha; a equipa reage, não antecipa.",
            "Cliente reclama quando o problema já aconteceu.",
          ],
          with: [
            "KDS prioriza automaticamente pratos atrasados.",
            "Alertas surgem antes do atraso virar reclamação.",
            "O ritmo de serviço ajusta-se em tempo real, não no fecho.",
          ],
        },
        {
          title: "Stock acaba sem aviso",
          lossLabel: "Perda estimada: 2–5% em vendas perdidas",
          without: [
            "Equipa descobre que acabou um item só quando o cliente ou hóspede pede.",
            "Substituições de última hora baixam ticket médio.",
            "Compras são reactivas, não planeadas.",
          ],
          with: [
            "Stock ajusta a cada pedido registado no TPV.",
            "Alertas avisam antes de esgotar um produto crítico.",
            "Dono decide durante o serviço o que priorizar, não no dia seguinte.",
          ],
        },
        {
          title: "Dono cego durante o serviço",
          lossLabel: "Perda invisível: lucro sem dono",
          without: [
            'Perguntas clássicas: "Quantos pedidos? Quanto já faturámos neste turno?"',
            "Ninguém tem resposta em tempo real, só no fecho.",
            "Problemas só aparecem quando o cliente já reclamou.",
          ],
          with: [
            "Comando Central mostra faturação, mesas e equipa em tempo real.",
            "Alertas operacionais sinalizam gargalos antes do cliente sentir.",
            "Decisões são tomadas a meio do turno, não no relatório do dia seguinte.",
          ],
        },
        {
          title: "Equipa desorganizada em turnos",
          lossLabel: "Perda estimada: 10–15% em folha + erros",
          without: [
            'Turnos feitos "de cabeça"; ninguém sabe quem é responsável por quê.',
            "Picos de serviço com gente a menos; horas mortas com gente a mais.",
            "Performance individual nunca é ligada ao que aconteceu no serviço.",
          ],
          with: [
            "Turnos e pedidos vivem no mesmo sistema operacional, em vez de folhas soltas e memória.",
            "Cada membro da equipa vê só o que precisa fazer agora, sem listas genéricas infinitas.",
            "Responsabilidade clara: pedidos e mesas ligados a quem atendeu, sem caça às bruxas no fim do turno.",
          ],
        },
      ],
    },
    insideSystem: {
      sectionLabel: "Veja o sistema em funcionamento",
      headline1: "Não é promessa.",
      headline2: "É o que você vê quando entra.",
      subhead1:
        "Estas não são maquetes genéricas. São telas reais do ChefIApp™ OS: o comando central, o TPV em serviço e a cozinha a trabalhar em tempo real sobre o mesmo cérebro operacional.",
      subhead2:
        "Telas reais em ambiente de demonstração — o mesmo sistema usado em restaurantes independentes, grupos e operações de hotelaria.",
      frames: [
        {
          statusLabel: "Online",
          imageAlt:
            "Dashboard operacional do ChefIApp™ com pedidos, receita e tempo médio em tempo real.",
          label: "Comando central",
          title: "Dashboard ao vivo por turno",
          desc: "Pedidos em curso, tempo médio de saída, receita do dia e risco operacional visíveis num só painel — durante o serviço, não no fecho de caixa.",
          liveBadge: "pedidos ativos neste turno",
        },
        {
          statusLabel: "Em serviço",
          imageAlt:
            "Ecrã do TPV do ChefIApp™ com pedido em criação, itens, totais e formas de pagamento.",
          label: "Frente de casa",
          title: "TPV a lançar pedidos em tempo real",
          desc: "Cada item lançado no TPV nasce ligado ao menu vivo — com preços, modificadores e impostos certos — pronto para seguir para cozinha sem ruído.",
        },
        {
          statusLabel: "Cozinha em fluxo",
          imageAlt:
            "Ecrã do KDS do ChefIApp™ com vários pedidos e prioridades visíveis para a equipa de cozinha.",
          label: "Cozinha e controlo",
          title: "Prioridade automática e controlo de atraso",
          desc: "A cozinha vê o que importa: ordem, status, tempo a contar e alertas visuais — seja no serviço de jantar ou num pequeno-almoço de hotel com sala cheia.",
        },
      ],
      cards: [
        {
          label: "Configuração de menu",
          title: "Menu Builder",
          desc: "Categorias, pratos, margens e modificadores em um só lugar — pronto para alimentar TPV, KDS e página pública.",
          screenshot: "menu-builder.png",
        },
        {
          label: "Turnos e equipas",
          title: "Staff & turnos",
          desc: "Perfis, papéis e horários por turno — seja equipa de sala, cozinha ou F&B de hotel com vários outlets.",
          screenshot: "staff-config.png",
        },
        {
          label: "Analytics operacional",
          title: "Gráficos e margens",
          desc: "Visão consolidada por turno, por canal e por outlet — restaurante, bar, rooftop ou room service.",
          screenshot: "analytics-ops.png",
        },
      ],
      flowLabel: "Da configuração à venda",
      flowTitle:
        "O mesmo sistema liga configuração, serviço e controlo de margem.",
      flowDesc:
        "Não são ferramentas soltas. O menu que você configura é o mesmo que aparece no TPV, que alimenta a cozinha e que fecha no dashboard do gerente.",
      steps: [
        {
          numLabel: "01 · Configuração",
          title: "Menu Builder",
          desc: "Defina preços, margens e modificadores em segundos — sem depender de técnico ou suporte externo.",
        },
        {
          numLabel: "02 · Serviço",
          title: "TPV em uso",
          desc: "O prato entra em serviço com o menu vivo — cada pedido certo à primeira, sem gambiarras na frente de casa.",
        },
        {
          numLabel: "03 · Produção",
          title: "KDS / Cozinha",
          desc: "Prioridade automática, tempo a contar e visibilidade por estação — a equipa sabe sempre qual é o próximo prato.",
        },
        {
          numLabel: "04 · Controle",
          title: "Dashboard / Analytics",
          desc: 'O turno fecha com números reais de margem, tempo e produtividade — não com sensação vaga de que "correu bem".',
        },
      ],
      ctaSub:
        "Quer ver estas telas com os seus próprios dados? Em menos de um turno já é possível testar o sistema operacional completo.",
      ctaButton: "Quero ver isto com os meus dados",
    },
  },
  en: {
    meta: {
      title: "ChefIApp™ OS — The Operating System for Restaurants",
      description:
        "One operational truth. Floor, kitchen, bar and team in one system. No duct tape, no syncs.",
    },
    hero: {
      navSystem: "The System",
      navAudience: "Who it's for",
      navPrice: "Pricing",
      navFaq: "FAQ",
      navBlog: "Blog",
      badge: "Live in production",
      headline: "The operating system that runs your",
      headlineAccent: "entire restaurant.",
      subhead:
        "One truth. Floor, kitchen, bar and team on the same system — in real time.",
      subhead2:
        "Money doesn't disappear in one place. It leaks — every service, every peak.",
      subhead3:
        "Not a prototype. The system we use every day. A restaurant in Ibiza.",
      ctaPrimary: "Start 14-day free trial",
      ctaSecondary: "See the system in action",
      goToSystem: "Go to system",
      signIn: "Sign in",
      tryFree: "Try free",
      trust14: "14-day free trial",
      trustNoCard: "No card required",
      trustCancel: "Cancel anytime",
    },
    ctaBanner: {
      headline: "One system. One operational truth. No duct tape.",
      cta: "Start 14-day free trial",
    },
    exitBanner: {
      message: "One step left — 14 days free, no card.",
      cta: "Start 14-day free trial",
      dismiss: "Dismiss",
    },
    footer: {
      ctaHeadline: "Ready to run on",
      ctaHeadlineAccent: "one truth?",
      ctaSub:
        "Register the restaurant, set up the menu, first sale. Under 25 minutes.",
      ctaButton: "Start 14-day free trial",
      whatsapp: "Or contact us on WhatsApp →",
      groupSystem: "The System",
      groupCompany: "Company",
      groupSupport: "Support",
      groupLegal: "Legal",
      linkSystem: "The System",
      linkAudience: "Who it's for",
      linkPrice: "Pricing",
      linkFaq: "FAQ",
      linkAbout: "About",
      linkBlog: "Blog",
      linkChangelog: "Changelog",
      linkCareers: "Careers",
      linkWhatsApp: "WhatsApp",
      linkEmail: "Email",
      linkStatus: "Status",
      linkPrivacy: "Privacy",
      linkTerms: "Terms",
      linkSecurity: "Security",
      tagline: "Operating system for restaurants.",
      taglineBy: "Built by operators.",
      taglineMission: "Money leaks. ChefIApp™ exists to close the leaks.",
      copyright: "All rights reserved.",
      madeWith: "Built with operational discipline.",
    },
    faq: {
      sectionLabel: "Frequently Asked Questions",
      headline: "Honest questions.",
      headlineAccent: "Straight answers.",
      anotherQuestion: "Have another question?",
      contactUs: "Contact us",
      items: [
        {
          q: "Does this replace my fiscal POS?",
          a: "No, and that's intentional. ChefIApp™ OS is the full operating system for operational management and pre-check. The fiscal POS remains responsible for the receipt. Own fiscal certification is planned for Q2 2026. Until then, both work in parallel.",
        },
        {
          q: "Do I need specific hardware?",
          a: "No. ChefIApp™ OS runs in the browser — any tablet, computer or phone works. For order printing we support standard ESC/POS thermal printers. Zero investment in proprietary hardware.",
        },
        {
          q: "Does it work offline?",
          a: "Partially. The OS handles short outages (up to 5 minutes). For critical operations like payment and till close, you need an active connection. For the rest of the operation it stays functional.",
        },
        {
          q: "Will my team be able to use it?",
          a: "Yes. Mobile-first interface designed for people who've never used a restaurant operating system. The team only sees what they need — when they need it. Real restaurants are operating without external training.",
        },
        {
          q: "Can I use just the Staff App?",
          a: "You can use just the Staff App, but the real value shows when everything is connected: shifts linked to the floor, orders feeding stock and the kitchen seeing what's coming in real time. ChefIApp™ OS was designed to reduce leaks across the whole operation, not to be another isolated task app.",
        },
        {
          q: "How much after the trial?",
          a: "{{price}} all included. No extra modules, no hidden fees, no contract. Cancel anytime with 1 click.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Always. No contract, no penalty, no minimum period. Cancel in the dashboard with 1 click. Export all your data before leaving — it's yours.",
        },
        {
          q: "What if I need help?",
          a: "Direct WhatsApp support with the founding team. No tickets, no waiting. We respond as if it were our restaurant.",
        },
        {
          q: "Does it work for more than one restaurant?",
          a: "Yes. ChefIApp™ was designed to grow from a single restaurant to groups and chains. Consolidated reports, central view per unit and team permissions live on the same operational infrastructure.",
        },
      ],
    },
    pricing: {
      sectionLabel: "Pricing",
      headline: "Simple and",
      headlineAccent: "transparent.",
      subhead: "One plan. Everything included. No surprises.",
      badge: "Single Plan",
      perMonth: "/month",
      trustLine: "14-day free trial · No card · No contract",
      cta: "Start 14-day free trial",
      footerLine: "No setup fee · Cancel anytime · Export all your data",
      enterpriseQuestion: "Need enterprise or multi-unit features?",
      contactUs: "Contact us",
      included: [
        "Operational POS",
        "KDS (Real-time kitchen)",
        "Menu Builder",
        "Staff App (mini-POS & shifts)",
        "Reservations & Floor",
        "Operational Analytics",
        "Stock Control",
        "Risk Monitor",
        "Restaurant public page",
        "Automatic updates",
        "WhatsApp support",
        "Unlimited users",
      ],
    },
    manifesto: {
      headline: "Why is this an",
      headlineAccent: "Operating System?",
      subhead:
        "Most glue 5 tools together and hope they work as one. They never do.",
      beforeLabel: "Today's reality",
      beforeItems: [
        "An isolated POS",
        "A separate reservations app",
        "WhatsApp for the team",
        "Paper in the kitchen",
        "Excel after the shift",
      ],
      beforeFooter: "5 tools. 5 logins. Zero connection between them.",
      afterLabel: "With ChefIApp™ OS",
      afterHeadline: "All of that becomes one operational brain.",
      osReasons: [
        {
          title: "Every component shares the same brain",
          desc: "One order affects stock, billing, KDS, analytics and team — at the same time.",
        },
        {
          title: "One event affects the whole system",
          desc: "When a staff member clocks in, floor and orders adjust on their own — no parallel task lists to maintain.",
        },
        {
          title: "Nothing needs to be integrated later",
          desc: "No third-party APIs, no connectors, no overnight syncs. Everything is born connected.",
        },
      ],
      callout1: "A restaurant doesn't need 5 systems.",
      callout2: "It needs one operating system.",
    },
    finalManifesto: {
      headline1: "Restaurants with tools react.",
      headline2: "Restaurants with an operating system anticipate.",
      body1:
        "Most restaurants glue disconnected tools and try to control the chaos at day's end. Errors, delays and margin leaks always show up after service.",
      body2:
        "ChefIApp™ connects floor, kitchen, stock, team and revenue in one operational brain.",
      callout: "We don't organize chaos — we prevent it.",
    },
    targetAudience: {
      sectionLabel: "Who it's for",
      headline: "Built for those who take",
      headlineAccent: "operations seriously.",
      audiences: [
        {
          title: "Full-Service Restaurants",
          desc: "Floor, kitchen, bar and till in sync. Table management, reservations and shifts included.",
          features: ["Table map", "Reservations", "Integrated KDS"],
        },
        {
          title: "Bars & Gastropubs",
          desc: "Fast counter service. Per-customer check tracking and simplified till close.",
          features: ["Quick orders", "Check per customer", "Flexible staff"],
        },
        {
          title: "Dark Kitchens",
          desc: "Full focus on production. Online orders, prep queues and speed analytics.",
          features: ["Online orders", "Priority KDS", "Digital menu"],
        },
        {
          title: "Multi-Brand Operations",
          desc: "Multiple concepts, one operating system. Distinct menus with consolidated data.",
          features: ["Multi-restaurant", "Unified analytics", "Shared team"],
        },
      ],
    },
    comoComecer: {
      sectionLabel: "How to get started",
      headline: "3 steps. 25 minutes.",
      headlineAccent: "Live.",
      subhead: "No IT. No install. No wait.",
      stepLabel: "Step",
      steps: [
        {
          num: "1",
          title: "Register the restaurant",
          desc: "Name, address and operation type. No long forms, no approvals. 2 minutes.",
        },
        {
          num: "2",
          title: "Set up the menu",
          desc: "Drag categories, add items, set prices and modifiers. 15 minutes.",
        },
        {
          num: "3",
          title: "Open the POS and sell",
          desc: "First order, first ticket to the kitchen, first payment. Live.",
        },
      ],
      cta: "Start now — it's free",
      ctaSub: "Sign up in 2 minutes. No credit card.",
    },
    toolsAvoid: {
      sectionLabel: "What each tool avoids",
      headline1: "It's not just what it does.",
      headline2: "It's what it takes off your mind and off the team's legs.",
      subhead:
        "Every ChefIApp™ OS component exists to eliminate unnecessary steps, decisions in the dark and silent errors. We don't sell buttons; we close operational leaks.",
      items: [
        {
          badge: "Staff App · Mini-POS in your pocket",
          title: "Avoids back-and-forth, wait and orders in memory.",
          body: "The order is born where the customer is — not at the till, not on paper, not in the server's head. Every step less is time recovered; every correct order is margin protected.",
        },
        {
          badge: "KDS · Real-time kitchen",
          title: "Avoids paper, printers and silent refires.",
          body: "Auto priority and visibility per station avoid lost tickets, print failures and floor×kitchen arguments. Every dish that doesn't need to be refired is cost avoided.",
        },
        {
          badge: "Menu Builder",
          title: "Avoids calls to IT and fake margin.",
          body: "Prices, margins and modifiers change in seconds, before service starts. Avoids running a full shift with wrong price or outdated item.",
        },
        {
          badge: "Command Central · Dashboard",
          title: "Avoids blind decisions at end of day.",
          body: "Billing, orders and operational risk in real time avoid decisions based only on gut feeling at till close.",
        },
        {
          badge: "Operational Analytics",
          title: "Avoids deciding tomorrow about today's problem.",
          body: "Seeing product mix, channels and shifts with real numbers avoids late decisions and fixes only next peak season.",
        },
        {
          badge: "Operational Tasks",
          title: "Avoid forgetfulness and improvisation at peak.",
          body: "Tasks linked to the current service help not forget what's critical that shift. Not a productivity app; it's execution assisted from what's happening right now.",
        },
      ],
    },
    hardware: {
      sectionLabel: "Devices",
      headline: "Works with what",
      headlineAccent: "you already have.",
      subhead:
        "No proprietary hardware. No upfront equipment investment. Your tablet, computer or phone is enough.",
      devices: [
        {
          title: "Tablet",
          desc: "iPad, Android or any tablet. Ideal for POS and KDS.",
        },
        {
          title: "Computer",
          desc: "Full dashboard in the browser. Chrome, Safari, Firefox — any.",
        },
        {
          title: "Phone",
          desc: "Staff App in your pocket. Mini-POS and shift alerts on smartphone, no extra task apps to manage.",
        },
        {
          title: "Thermal Printer",
          desc: "Compatible with ESC/POS printers. Auto ticket to kitchen and bar.",
        },
      ],
      pwaNote: "Installable PWA. Works like a native app on tablet and phone.",
    },
    socialProof: {
      sectionLabel: "In Real Production",
      headline: "Not a prototype.",
      headlineAccent: "It's the real system.",
      featuredTestimonial: {
        quote:
          "We set up the menu, opened the POS and were operating on the first night. No technician, no installation, no stress. The team learned by themselves.",
        authorName: "Sofia Gastrobar",
        authorSubline: "Powered by ChefIApp™ OS",
        authorLocation: "Ibiza, Spain · In production since 2026",
        initials: "SG",
        stats: [
          { value: "< 25 min", label: "Full setup" },
          { value: "17", label: "Active components" },
          { value: `0${getCurrencySymbol()}`, label: "Setup cost" },
          { value: "Day 1", label: "First sale" },
        ],
      },
      secondaryTestimonials: [] as {
        initials: string;
        quote: string;
        name: string;
        location: string;
      }[],
      placeholderCta:
        "Your restaurant here? Get in touch to be the first featured case.",
      placeholderButton: "Get in touch",
      trustLabels: [
        "Real data, not simulated",
        "Real restaurant operating",
        "Direct support from founder",
      ],
    },
    platform: {
      sectionLabel: "Operating System Components",
      headline1: "Everything your restaurant needs.",
      headline2: "In one operating system.",
      subhead:
        "ChefIApp™ OS coordinates every area of the operation — no separate modules, no external integrations, no surprises.",
      modules: [
        {
          title: "Operational POS",
          desc: 'Where service really starts: the order is right first time, even with new or seasonal staff. Avoids lost pre-checks, typos and orders kept only "in someone\'s head".',
        },
        {
          title: "KDS — Real-time kitchen",
          desc: "Auto priorities for dishes and tables, with time visible to the whole team. Avoids paper, critical thermal printers and silent refires that eat margin every service.",
        },
        {
          title: "Menu Builder",
          desc: "Create and change menus in minutes, aligning prices, margins and modifiers before the shift. Avoids IT calls, wrong prices mid-service and fake margin in Excel.",
        },
        {
          title: "Staff App",
          desc: "Mini-POS and shift info in staff's pocket. Avoids pointless trips to the till, wait time for the fixed POS and orders stuck in the server's memory.",
        },
        {
          title: "Reservations & Floor",
          desc: "Reservations, walk-ins and no-shows linked to the real floor. Avoids empty tables at peak, destructive overbooking and lost average ticket from lack of predictability.",
        },
        {
          title: "Operational Analytics",
          desc: "Real service data by shift, channel and product — not just end-of-month report. Avoids decisions on gut feeling and fixes only next peak season.",
        },
        {
          title: "Risk Monitor",
          desc: "Early signals for stock, service and team out of normal show up before the customer complains. Avoids operational surprises and emergency fixes.",
        },
        {
          title: "Public Page",
          desc: "Online presence run by the restaurant: reservations and direct orders on the same system. Avoids total dependence on external platforms and commission on every service.",
        },
        {
          title: "Stock Control",
          desc: "Ingredients, specs and automatic alerts linked to real shift orders. Avoids waste, unexpected stockouts and buying decisions on the fly.",
        },
      ],
      bottomNote:
        "All components included. One operating system. Zero surprises.",
    },
    moneyLeaks: {
      sectionLabel: "Where money disappears without anyone noticing",
      headline1: "A restaurant doesn't fail in one day.",
      headline2: "It bleeds every day.",
      subhead:
        'Every service looks "fine" — but small operational leaks add up to thousands per month. This is the map of those leaks. The ranges below are industry estimates to illustrate the scale of leaks — not results measured by ChefIApp.',
      leaks: [
        {
          label: "Order errors",
          range: "2–4% of revenue",
          description:
            "Refires, wrong items, tickets mixed up between floor and kitchen.",
          footer: "Profit leaking in silence.",
        },
        {
          label: "Dead table time",
          range: "5–8% of potential",
          description:
            "Tables waiting for order, dessert or check. Fewer turns per service.",
          footer: "Margin vanishing without anyone noticing.",
        },
        {
          label: "Poor stock control",
          range: "3–6% in waste",
          description:
            "Overstock that spoils, understock that blocks sales when the house is full.",
          footer: "Money that never reaches the bank.",
        },
        {
          label: "Unbalanced shifts",
          range: "10–15% in payroll and stress",
          description:
            "Too many people in dead hours, too few at crunch time. More errors, more burnout.",
          footer: "Invisible loss, shift after shift.",
        },
        {
          label: "Invisible revenue during service",
          range: "Profit with no owner",
          description:
            "The owner only sees the result at day end. Can't fix it mid-service.",
          footer: "Profit lost month after month.",
        },
      ],
      synthesis: {
        exampleLabel: "Illustrative scenario",
        revenue: `${getCurrencySymbol()}80,000 / month`,
        revenueSub: "Restaurant at full capacity",
        recoverable: `${getCurrencySymbol()}8,400 / month`,
        recoverableSub: "Recoverable margin that never reaches the bank today.",
        body1:
          "Combining these leaks, a restaurant this size can be losing between",
        body1Highlight: `${getCurrencySymbol()}6,000 and ${getCurrencySymbol()}12,000 per month`,
        body1End: "in margin that never shows up at closing.",
        body2: "ChefIApp™ OS exists to close these leaks —",
        body2End: "during service, not after.",
      },
    },
    metricsStrip: {
      metrics: [
        { type: "static" as const, value: "< 25 min", label: "Full setup" },
        {
          type: "animated" as const,
          target: 9,
          label: "Integrated components",
        },
        {
          type: "static" as const,
          value: `${getCurrencySymbol()}0`,
          label: "Hardware cost",
        },
        {
          type: "animated" as const,
          target: 79,
          suffix: ` ${getCurrencySymbol()}`,
          label: "All included",
        },
        { type: "static" as const, value: "24/7", label: "Operating system" },
      ],
    },
    rhythmBreak: {
      label: "When it really matters",
      headline: "It works when service gets busy — not just on the pitch deck.",
    },
    comparison: {
      sectionLabel: "The difference",
      headline: "Why switching ",
      headlineAccent: "makes sense.",
      subhead:
        "Most restaurants run on disconnected tools. ChefIApp™ OS removes that friction.",
      headerTraditional: "Traditional model",
      headerChefiapp: "ChefIApp™ OS",
      rows: [
        {
          aspect: "Initial setup",
          traditional: "Days or weeks with a technician",
          chefiapp: "Ready in under 25 minutes",
        },
        {
          aspect: "Systems",
          traditional: "POS + Staff + Stock separate",
          chefiapp: "Everything in one OS",
        },
        {
          aspect: "Support",
          traditional: "Tickets and wait time",
          chefiapp: "Direct WhatsApp",
        },
        {
          aspect: "Menu changes",
          traditional: "Depends on third parties",
          chefiapp: "You change it on the spot",
        },
        {
          aspect: "Contract",
          traditional: "12–24 month lock-in",
          chefiapp: "No contract. Cancel anytime.",
        },
        {
          aspect: "Hardware cost",
          traditional: `${getCurrencySymbol()}2,000–${getCurrencySymbol()}5,000 in equipment`,
          chefiapp: "Runs on the tablet or PC you already have",
        },
        {
          aspect: "Updates",
          traditional: "Paid and disruptive",
          chefiapp: "Automatic and continuous",
        },
      ],
    },
    operationalStories: {
      sectionLabel: "The restaurant in operation",
      headline: "What happens in practice.",
      subhead1:
        "Imagine a real service. Friday. House full. Or a hotel at 92% occupancy: breakfast packed, bar full, room service active. Everything seems to work — until it starts to fail.",
      subhead2:
        'The guest waits. The kitchen argues. The manager asks "what\'s going on?". Nobody has the answer. This is where restaurants and hotels start to bleed money.',
      scenarioLabel: "Scenario",
      scenarios: [
        {
          num: "01",
          title: "An order hits the POS",
          intro: "Friday, 1pm. House filling up.",
          steps: [
            "Shows in the kitchen (KDS) — instantly",
            "Stock adjusts automatically",
            "Revenue updates in real time",
            "Tied to the server who took it",
            "Feeds into the day's stats",
          ],
          anchor: "No integrations. No syncs. One operating system.",
        },
        {
          num: "02",
          title: "The kitchen sees priorities, not paper",
          intro: "Saturday night. 18 tables full.",
          steps: [
            "Late dishes are flagged automatically",
            "Bottlenecks show before they become a problem",
            "Service rhythm adjusts on its own",
            "The chef sees real time, not tickets on the rail",
          ],
          anchor: "The kitchen runs on information, not guesswork.",
        },
        {
          num: "03",
          title: "The manager knows everything — without asking",
          intro: "They open Command Central and see:",
          steps: [
            "Revenue in real time",
            "Active tables and average service time",
            "Team on shift — who's in, who's missing",
            "Operational alerts before the guest complains",
          ],
          anchor:
            "Everything in Command Central. Zero questions in the corridor.",
        },
      ],
      closer: "Every event is linked to everything else — automatically.",
    },
    problemSolution: {
      sectionLabel: "Real problems that cost money",
      headline: "And how the operating system closes each leak.",
      subhead:
        "It's not another management software. It's the operational brain that links orders, kitchen, stock, team and revenue in the same flow.",
      columnLabel: "Before: silent chaos · After: real-time control",
      labelWithout: "Without an operating system",
      labelWith: "With ChefIApp™ OS",
      problems: [
        {
          title: "Late dishes in the kitchen",
          lossLabel: "Estimated loss: 3–6% per service",
          without: [
            "Orders pile up with no clear priority.",
            "Servers push the kitchen; the team reacts, doesn't anticipate.",
            "The guest complains when the problem has already happened.",
          ],
          with: [
            "KDS automatically prioritises late dishes.",
            "Alerts show before the delay becomes a complaint.",
            "Service rhythm adjusts in real time, not at closing.",
          ],
        },
        {
          title: "Stock runs out without warning",
          lossLabel: "Estimated loss: 2–5% in lost sales",
          without: [
            "The team finds out an item is gone only when the guest orders it.",
            "Last-minute substitutions lower average ticket.",
            "Purchasing is reactive, not planned.",
          ],
          with: [
            "Stock adjusts with every order logged on the POS.",
            "Alerts warn before a critical product runs out.",
            "The owner decides during service what to prioritise, not the next day.",
          ],
        },
        {
          title: "Owner blind during service",
          lossLabel: "Invisible loss: profit with no owner",
          without: [
            'Classic questions: "How many orders? How much have we done this shift?"',
            "Nobody has the answer in real time, only at closing.",
            "Problems only show when the guest has already complained.",
          ],
          with: [
            "Command Central shows revenue, tables and team in real time.",
            "Operational alerts flag bottlenecks before the guest feels them.",
            "Decisions are made mid-shift, not in the next day's report.",
          ],
        },
        {
          title: "Disorganised team on shifts",
          lossLabel: "Estimated loss: 10–15% in payroll + errors",
          without: [
            "Shifts done \"in someone's head\"; nobody knows who's responsible for what.",
            "Peak service understaffed; dead hours overstaffed.",
            "Individual performance never linked to what happened in service.",
          ],
          with: [
            "Shifts and orders live in the same operating system, not loose sheets and memory.",
            "Each team member sees only what they need to do now, no endless generic lists.",
            "Clear responsibility: orders and tables linked to who served them, no blame game at end of shift.",
          ],
        },
      ],
    },
    insideSystem: {
      sectionLabel: "See the system in action",
      headline1: "It's not a promise.",
      headline2: "It's what you see when you log in.",
      subhead1:
        "These aren't generic mockups. They're real ChefIApp™ OS screens: command central, POS in service and the kitchen working in real time on the same operational brain.",
      subhead2:
        "Real screens in demo environment — the same system used in independent restaurants, groups and hospitality operations.",
      frames: [
        {
          statusLabel: "Online",
          imageAlt:
            "ChefIApp™ operational dashboard with orders, revenue and average time in real time.",
          label: "Command central",
          title: "Live dashboard per shift",
          desc: "Orders in progress, average turnaround, day revenue and operational risk in one panel — during service, not at closing.",
          liveBadge: "active orders this shift",
        },
        {
          statusLabel: "In service",
          imageAlt:
            "ChefIApp™ POS screen with order in progress, items, totals and payment methods.",
          label: "Front of house",
          title: "POS firing orders in real time",
          desc: "Every item logged on the POS is tied to the live menu — correct prices, modifiers and tax — ready to go to the kitchen with no noise.",
        },
        {
          statusLabel: "Kitchen in flow",
          imageAlt:
            "ChefIApp™ KDS screen with multiple orders and priorities visible to the kitchen team.",
          label: "Kitchen and control",
          title: "Auto priority and delay control",
          desc: "The kitchen sees what matters: order, status, time counting and visual alerts — whether at dinner service or a packed hotel breakfast.",
        },
      ],
      cards: [
        {
          label: "Menu configuration",
          title: "Menu Builder",
          desc: "Categories, dishes, margins and modifiers in one place — ready to feed POS, KDS and public page.",
          screenshot: "menu-builder.png",
        },
        {
          label: "Shifts and teams",
          title: "Staff & shifts",
          desc: "Profiles, roles and schedules per shift — whether floor, kitchen or hotel F&B with multiple outlets.",
          screenshot: "staff-config.png",
        },
        {
          label: "Operational analytics",
          title: "Charts and margins",
          desc: "Consolidated view by shift, channel and outlet — restaurant, bar, rooftop or room service.",
          screenshot: "analytics-ops.png",
        },
      ],
      flowLabel: "From setup to sale",
      flowTitle: "The same system links setup, service and margin control.",
      flowDesc:
        "Not loose tools. The menu you configure is the same one that appears on the POS, feeds the kitchen and closes in the manager's dashboard.",
      steps: [
        {
          numLabel: "01 · Setup",
          title: "Menu Builder",
          desc: "Set prices, margins and modifiers in seconds — no technician or external support.",
        },
        {
          numLabel: "02 · Service",
          title: "POS in use",
          desc: "The dish goes into service with the live menu — every order right first time, no workarounds on the floor.",
        },
        {
          numLabel: "03 · Production",
          title: "KDS / Kitchen",
          desc: "Auto priority, time counting and visibility per station — the team always knows the next dish.",
        },
        {
          numLabel: "04 · Control",
          title: "Dashboard / Analytics",
          desc: 'The shift closes with real margin, time and productivity numbers — not a vague feeling that "it went well".',
        },
      ],
      ctaSub:
        "Want to see these screens with your own data? In less than one shift you can try the full operating system.",
      ctaButton: "I want to see this with my data",
    },
  },
  es: {
    meta: {
      title: "ChefIApp™ OS — El Sistema Operativo para Restaurantes",
      description:
        "Una verdad operativa. Sala, cocina, bar y equipo en un solo sistema. Sin parches, sin sincronizaciones.",
    },
    hero: {
      navSystem: "El Sistema",
      navAudience: "Para quién",
      navPrice: "Precio",
      navFaq: "FAQ",
      navBlog: "Blog",
      badge: "En producción real",
      headline: "El sistema operativo que gestiona tu",
      headlineAccent: "restaurante al completo.",
      subhead:
        "Una verdad. Sala, cocina, barra y equipo en el mismo sistema — en tiempo real.",
      subhead2:
        "El dinero no se pierde en un sitio. Se fuga en fugas invisibles — en cada servicio, en cada punta.",
      subhead3:
        "No es prototipo. Es el sistema que usamos cada día. Un restaurante en Ibiza.",
      ctaPrimary: "Empezar 14 días gratis",
      ctaSecondary: "Ver el sistema en acción",
      goToSystem: "Ir al sistema",
      signIn: "Entrar",
      tryFree: "Probar gratis",
      trust14: "14 días gratis",
      trustNoCard: "Sin tarjeta",
      trustCancel: "Cancela cuando quieras",
    },
    ctaBanner: {
      headline: "Un sistema. Una verdad operativa. Sin parches.",
      cta: "Empezar 14 días gratis",
    },
    exitBanner: {
      message: "Falta un paso — 14 días gratis, sin tarjeta.",
      cta: "Empezar 14 días gratis",
      dismiss: "Cerrar",
    },
    footer: {
      ctaHeadline: "¿Listo para operar con",
      ctaHeadlineAccent: "una sola verdad?",
      ctaSub:
        "Registra el restaurante, monta la carta, primera venta. Menos de 25 minutos.",
      ctaButton: "Empezar 14 días gratis",
      whatsapp: "O escríbenos por WhatsApp →",
      groupSystem: "El Sistema",
      groupCompany: "Empresa",
      groupSupport: "Soporte",
      groupLegal: "Legal",
      linkSystem: "El Sistema",
      linkAudience: "Para quién",
      linkPrice: "Precio",
      linkFaq: "FAQ",
      linkAbout: "Sobre nosotros",
      linkBlog: "Blog",
      linkChangelog: "Changelog",
      linkCareers: "Carreras",
      linkWhatsApp: "WhatsApp",
      linkEmail: "Email",
      linkStatus: "Estado del sistema",
      linkPrivacy: "Privacidad",
      linkTerms: "Términos",
      linkSecurity: "Seguridad",
      tagline: "Sistema operativo para restaurantes.",
      taglineBy: "Hecho por quien opera.",
      taglineMission:
        "El dinero se fuga. ChefIApp™ existe para cerrar las fugas.",
      copyright: "Todos los derechos reservados.",
      madeWith: "Hecho con disciplina operativa.",
    },
    faq: {
      sectionLabel: "Preguntas Frecuentes",
      headline: "Preguntas honestas.",
      headlineAccent: "Respuestas directas.",
      anotherQuestion: "¿Otra pregunta?",
      contactUs: "Hablar con nosotros",
      items: [
        {
          q: "¿Esto sustituye mi TPV fiscal?",
          a: "No, y es intencional. ChefIApp™ OS es el sistema operativo completo de gestión operativa y pre-cuenta. El TPV fiscal sigue siendo responsable del ticket. Certificación fiscal propia prevista para Q2 2026. Hasta entonces, ambos trabajan en paralelo.",
        },
        {
          q: "¿Necesito hardware específico?",
          a: "No. ChefIApp™ OS funciona en el navegador — cualquier tablet, ordenador o móvil sirve. Para imprimir comandas, soportamos impresoras térmicas ESC/POS estándar. Cero inversión en hardware propietario.",
        },
        {
          q: "¿Funciona sin conexión?",
          a: "Parcialmente. El OS aguanta cortes breves (hasta 5 minutos). Para operaciones críticas como pago y cierre de caja hace falta conexión. Para el resto de la operación sigue siendo funcional.",
        },
        {
          q: "¿Mi equipo podrá usarlo?",
          a: "Sí. Interfaz mobile-first pensada para quien nunca ha usado un sistema operativo de restaurante. El equipo solo ve lo que necesita — cuando lo necesita. Restaurantes reales operan sin formación externa.",
        },
        {
          q: "¿Puedo usar solo la App de Equipo?",
          a: "Puedes usar solo la App de Equipo, pero el valor real aparece cuando todo está conectado: turnos ligados a la sala, pedidos que alimentan stock y cocina viendo lo que entra en tiempo real. ChefIApp™ OS se diseñó para reducir fugas en toda la operación, no para ser otra app de tareas aislada.",
        },
        {
          q: "¿Cuánto cuesta después del período de prueba?",
          a: "{{price}} todo incluido. Sin módulos extra, sin tasas ocultas, sin contrato. Cancela cuando quieras con 1 clic.",
        },
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Siempre. Sin contrato, sin multa, sin período mínimo. Cancela en el panel con 1 clic. Exporta todos tus datos antes de salir — son tuyos.",
        },
        {
          q: "¿Y si necesito ayuda?",
          a: "Soporte directo por WhatsApp con el equipo fundador. Sin tickets, sin cola. Respondemos como si fuera nuestro restaurante.",
        },
        {
          q: "¿Funciona para más de un restaurante?",
          a: "Sí. ChefIApp™ se diseñó para crecer de un restaurante a grupos y cadenas. Informes consolidados, visión central por unidad y permisos por equipo en la misma infraestructura operativa.",
        },
      ],
    },
    pricing: {
      sectionLabel: "Precio",
      headline: "Simple y",
      headlineAccent: "transparente.",
      subhead: "Un plan. Todo incluido. Sin sorpresas.",
      badge: "Plan Único",
      perMonth: "/mes",
      trustLine: "14 días gratis · Sin tarjeta · Sin contrato",
      cta: "Empezar 14 días gratis",
      footerLine:
        "Sin tasa de instalación · Cancela cuando quieras · Exporta todos los datos",
      enterpriseQuestion:
        "¿Necesitas funcionalidades enterprise o multi-unidad?",
      contactUs: "Hablar con nosotros",
      included: [
        "TPV Operativo",
        "KDS (Cocina en tiempo real)",
        "Menu Builder",
        "Staff App (mini-TPV y turnos)",
        "Reservas y Sala",
        "Analytics Operativos",
        "Control de Stock",
        "Monitor de Riesgo",
        "Página pública del restaurante",
        "Actualizaciones automáticas",
        "Soporte por WhatsApp",
        "Sin límite de usuarios",
      ],
    },
    manifesto: {
      headline: "¿Por qué esto es un",
      headlineAccent: "Sistema Operativo?",
      subhead:
        "La mayoría pega 5 herramientas y espera que funcionen juntas. Nunca funcionan.",
      beforeLabel: "La realidad de hoy",
      beforeItems: [
        "Un TPV aislado",
        "Una app de reservas separada",
        "WhatsApp para el equipo",
        "Papel en cocina",
        "Excel después del turno",
      ],
      beforeFooter:
        "5 herramientas. 5 inicios de sesión. Cero conexión entre ellas.",
      afterLabel: "Con ChefIApp™ OS",
      afterHeadline: "Todo eso se convierte en un único cerebro operativo.",
      osReasons: [
        {
          title: "Todos los componentes comparten el mismo cerebro",
          desc: "Un pedido afecta stock, facturación, KDS, analytics y equipo — al mismo tiempo.",
        },
        {
          title: "Un evento afecta todo el sistema",
          desc: "Cuando un empleado marca turno, sala y pedidos se ajustan solos — sin listas de tareas paralelas que mantener.",
        },
        {
          title: "Nada necesita integrarse después",
          desc: "Sin APIs de terceros, sin conectores, sin sincronizaciones nocturnas. Todo nace conectado.",
        },
      ],
      callout1: "Un restaurante no necesita 5 sistemas.",
      callout2: "Necesita un sistema operativo.",
    },
    finalManifesto: {
      headline1: "Restaurantes con herramientas reaccionan.",
      headline2: "Restaurantes con sistema operativo anticipan.",
      body1:
        "La mayoría pega herramientas desconectadas e intenta controlar el caos al cierre. Errores, retrasos y fugas de margen aparecen siempre después del servicio.",
      body2:
        "ChefIApp™ conecta sala, cocina, stock, equipo y facturación en un mismo cerebro operativo.",
      callout: "No organizamos el caos — lo impedimos.",
    },
    targetAudience: {
      sectionLabel: "Para quién es",
      headline: "Hecho para quien se toma",
      headlineAccent: "la operación en serio.",
      audiences: [
        {
          title: "Restaurantes de Servicio Completo",
          desc: "Sala, cocina, barra y caja sincronizados. Gestión de mesas, reservas y turnos incluidos.",
          features: ["Mapa de mesas", "Reservas", "KDS integrado"],
        },
        {
          title: "Bares y Gastrobares",
          desc: "Atención rápida en barra. Control de consumo por cliente y cierre de caja simplificado.",
          features: [
            "Pedidos rápidos",
            "Cuenta por cliente",
            "Equipo flexible",
          ],
        },
        {
          title: "Dark Kitchens",
          desc: "Foco total en producción. Pedidos online, colas de preparación y analytics de velocidad.",
          features: ["Pedidos online", "KDS prioritario", "Menú digital"],
        },
        {
          title: "Operaciones Multi-marca",
          desc: "Varios conceptos, un sistema operativo. Cartas distintas con datos consolidados.",
          features: [
            "Multi-restaurante",
            "Analytics unificado",
            "Equipo compartido",
          ],
        },
      ],
    },
    comoComecer: {
      sectionLabel: "Cómo empezar",
      headline: "3 pasos. 25 minutos.",
      headlineAccent: "En operación.",
      subhead: "Sin técnico. Sin instalación. Sin esperas.",
      stepLabel: "Paso",
      steps: [
        {
          num: "1",
          title: "Registra el restaurante",
          desc: "Nombre, dirección y tipo de operación. Sin formularios largos, sin aprobaciones. 2 minutos.",
        },
        {
          num: "2",
          title: "Monta la carta",
          desc: "Arrastra categorías, añade platos, define precios y modificadores. 15 minutos.",
        },
        {
          num: "3",
          title: "Abre el TPV y vende",
          desc: "Primer pedido, primera comanda a cocina, primer pago. En operación.",
        },
      ],
      cta: "Empezar ahora — es gratis",
      ctaSub: "Registro en 2 minutos. Sin tarjeta de crédito.",
    },
    toolsAvoid: {
      sectionLabel: "Lo que evita cada herramienta",
      headline1: "No es solo lo que hace.",
      headline2: "Es lo que quita de tu cabeza y de las piernas del equipo.",
      subhead:
        "Cada componente de ChefIApp™ OS existe para eliminar pasos innecesarios, decisiones a ciegas y errores silenciosos. No vendemos botones; cerramos fugas operativas.",
      items: [
        {
          badge: "Staff App · Mini-TPV en el bolsillo",
          title: "Evita idas y vueltas, espera y pedidos en la memoria.",
          body: "El pedido nace donde está el cliente — no en caja, no en papel, no en la cabeza del empleado. Cada paso menos es tiempo recuperado; cada pedido correcto es margen protegido.",
        },
        {
          badge: "KDS · Cocina en tiempo real",
          title: "Evita papel, impresoras y refires silenciosos.",
          body: "Prioridad automática y visibilidad por estación evitan tickets perdidos, fallos de impresión y discusiones sala×cocina. Cada plato que no hay que rehacer es coste evitado.",
        },
        {
          badge: "Menu Builder",
          title: "Evita llamadas al técnico y margen ficticio.",
          body: "Precios, márgenes y modificadores cambian en segundos, antes de que empiece el servicio. Evita pasar un turno entero con precio erróneo o plato desactualizado.",
        },
        {
          badge: "Comando Central · Dashboard",
          title: "Evita decisiones ciegas al cierre del día.",
          body: "Facturación, pedidos y riesgo operativo en tiempo real evitan decisiones basadas solo en sensación al cierre de caja.",
        },
        {
          badge: "Analytics Operativos",
          title: "Evita decidir mañana sobre un problema de hoy.",
          body: "Ver mix de producto, canales y turnos con números reales evita decisiones tardías y ajustes solo en la próxima temporada alta.",
        },
        {
          badge: "Tareas Operativas",
          title: "Evitan olvidos e improvisación en punta.",
          body: "Tareas ligadas al servicio actual ayudan a no olvidar lo crítico en ese turno. No es app de productividad; es ejecución asistida a partir de lo que está pasando ahora.",
        },
      ],
    },
    hardware: {
      sectionLabel: "Dispositivos",
      headline: "Funciona con lo que",
      headlineAccent: "ya tienes.",
      subhead:
        "Sin hardware propietario. Sin inversión inicial en equipo. Tu tablet, ordenador o móvil basta.",
      devices: [
        {
          title: "Tablet",
          desc: "iPad, Android o cualquier tablet. Ideal para TPV y KDS.",
        },
        {
          title: "Ordenador",
          desc: "Dashboard completo en el navegador. Chrome, Safari, Firefox — cualquiera.",
        },
        {
          title: "Móvil",
          desc: "Staff App en el bolsillo. Mini-TPV y avisos de turno en el smartphone, sin más apps de tareas que gestionar.",
        },
        {
          title: "Impresora Térmica",
          desc: "Compatible con impresoras ESC/POS. Comanda automática a cocina y barra.",
        },
      ],
      pwaNote: "PWA instalable. Funciona como app nativa en tablet y móvil.",
    },
    socialProof: {
      sectionLabel: "En Producción Real",
      headline: "No es un prototipo.",
      headlineAccent: "Es el sistema real.",
      featuredTestimonial: {
        quote:
          "Montamos el menú, abrimos el TPV y la primera noche ya estábamos operando. Sin técnico, sin instalación, sin estrés. El equipo aprendió solo.",
        authorName: "Sofia Gastrobar",
        authorSubline: "Powered by ChefIApp™ OS",
        authorLocation: "Ibiza, España · En producción desde 2026",
        initials: "SG",
        stats: [
          { value: "< 25 min", label: "Setup completo" },
          { value: "17", label: "Componentes activos" },
          { value: `0${getCurrencySymbol()}`, label: "Costo de setup" },
          { value: "1º día", label: "Primera venta" },
        ],
      },
      secondaryTestimonials: [] as {
        initials: string;
        quote: string;
        name: string;
        location: string;
      }[],
      placeholderCta:
        "¿Tu restaurante aquí? Contáctanos para ser el primer caso destacado.",
      placeholderButton: "Contáctanos",
      trustLabels: [
        "Datos reales, no simulados",
        "Restaurante real operando",
        "Soporte directo del fundador",
      ],
    },
    platform: {
      sectionLabel: "Componentes del Sistema Operativo",
      headline1: "Todo lo que tu restaurante necesita.",
      headline2: "En un único sistema operativo.",
      subhead:
        "ChefIApp™ OS coordina todas las áreas de la operación — sin módulos separados, sin integraciones externas, sin sorpresas.",
      modules: [
        {
          title: "TPV Operativo",
          desc: 'Donde el servicio empieza de verdad: el pedido nace bien a la primera, incluso con equipo nuevo o temporal. Evita pre-cuentas perdidas, errores de tecleo y pedidos solo "de cabeza".',
        },
        {
          title: "KDS — Cocina en tiempo real",
          desc: "Prioridades automáticas para platos y mesas, con tiempo a la vista de todo el equipo. Evita papel, impresoras térmicas críticas y refires silenciosos que corroen el margen en cada servicio.",
        },
        {
          title: "Menu Builder",
          desc: "Crea y cambia cartas en minutos, alineando precios, márgenes y modificadores antes del turno. Evita llamadas al técnico, precios erróneos a mitad de servicio y margen ficticio en Excel.",
        },
        {
          title: "Staff App",
          desc: "Mini-TPV e información de turno en el bolsillo del equipo. Evita idas inútiles al mostrador, esperas para usar el TPV fijo y pedidos que quedan en la memoria del empleado.",
        },
        {
          title: "Reservas y Sala",
          desc: "Reservas, walk-ins y no-shows ligados a la sala real. Evita mesas vacías en hora punta, overbooking destructivo y pérdida de ticket medio por falta de previsibilidad.",
        },
        {
          title: "Analytics Operativos",
          desc: "Datos de servicio real por turno, canal y producto — no solo informe de fin de mes. Evita decisiones por sensación y correcciones solo en la próxima temporada alta.",
        },
        {
          title: "Monitor de Riesgo",
          desc: "Señales tempranas de stock, servicio y equipo fuera de lo normal antes de que el cliente se queje. Evita sorpresas operativas y correcciones en modo urgencia.",
        },
        {
          title: "Página Pública",
          desc: "Presencia online gestionada por el propio restaurante: reservas y pedidos directos en el mismo sistema. Evita dependencia total de plataformas externas y comisiones en cada servicio.",
        },
        {
          title: "Control de Stock",
          desc: "Ingredientes, fichas técnicas y alertas automáticas ligadas a los pedidos reales del turno. Evita desperdicio, rupturas inesperadas y decisiones de compra al vuelo.",
        },
      ],
      bottomNote:
        "Todos los componentes incluidos. Un único sistema operativo. Cero sorpresas.",
    },
    moneyLeaks: {
      sectionLabel: "Dónde se pierde el dinero sin que nadie lo vea",
      headline1: "Un restaurante no quiebra en un día.",
      headline2: "Sangra todos los días.",
      subhead:
        'Cada servicio parece "correcto" — pero pequeños vazamentos operativos suman miles al mes. Este es el mapa de esos vazamentos. Los intervalos son estimaciones de sector para ilustrar la dimensión de los vazamentos — no resultados medidos por ChefIApp.',
      leaks: [
        {
          label: "Errores de pedido",
          range: "2–4% de la facturación",
          description:
            "Platos rehechos, items cambiados, comandas confusas entre sala y cocina.",
          footer: "Beneficio que se escapa en silencio.",
        },
        {
          label: "Tiempo muerto de mesa",
          range: "5–8% del potencial",
          description:
            "Mesas paradas esperando pedido, postre o cuenta. Menos vueltas por servicio.",
          footer: "Margen que desaparece sin que nadie note.",
        },
        {
          label: "Stock mal controlado",
          range: "3–6% en desperdicio",
          description:
            "Producto de más que se estropea, producto de menos que impide vender cuando la casa llena.",
          footer: "Dinero que nunca llega al banco.",
        },
        {
          label: "Turnos desbalanceados",
          range: "10–15% en nómina y estrés",
          description:
            "Gente de más en horas muertas, gente de menos en la hora crítica. Más errores, más burnout.",
          footer: "Pérdida invisible, turno tras turno.",
        },
        {
          label: "Facturación invisible durante el servicio",
          range: "Beneficio sin dueño",
          description:
            "El dueño solo ve el resultado al cerrar. Nunca puede corregir a mitad de servicio.",
          footer: "Beneficio que se pierde mes tras mes.",
        },
      ],
      synthesis: {
        exampleLabel: "Escenario ilustrativo",
        revenue: `80.000 ${getCurrencySymbol()} / mes`,
        revenueSub: "Restaurante a casa llena",
        recoverable: `8.400 ${getCurrencySymbol()} / mes`,
        recoverableSub: "Margen recuperable que hoy no llega al banco.",
        body1:
          "Combinando estos vazamentos, un restaurante de este tamaño puede estar perdiendo entre",
        body1Highlight: `6.000 ${getCurrencySymbol()} y 12.000 ${getCurrencySymbol()} al mes`,
        body1End: "en margen que nunca aparece en el cierre de caja.",
        body2: "ChefIApp™ OS existe para cerrar estos vazamentos —",
        body2End: "durante el servicio, no después.",
      },
    },
    metricsStrip: {
      metrics: [
        { type: "static" as const, value: "< 25 min", label: "Setup completo" },
        {
          type: "animated" as const,
          target: 9,
          label: "Componentes integrados",
        },
        {
          type: "static" as const,
          value: `0 ${getCurrencySymbol()}`,
          label: "Coste de hardware",
        },
        {
          type: "animated" as const,
          target: 79,
          suffix: ` ${getCurrencySymbol()}`,
          label: "Todo incluido",
        },
        { type: "static" as const, value: "24/7", label: "Sistema operativo" },
      ],
    },
    rhythmBreak: {
      label: "Cuando importa de verdad",
      headline:
        "Funciona cuando el servicio se pone al límite — no solo en la presentación.",
    },
    comparison: {
      sectionLabel: "La diferencia",
      headline: "Por qué cambiar ",
      headlineAccent: "tiene sentido.",
      subhead:
        "La mayoría de restaurantes opera con herramientas desconectadas. ChefIApp™ OS elimina esa fricción.",
      headerTraditional: "Modelo tradicional",
      headerChefiapp: "ChefIApp™ OS",
      rows: [
        {
          aspect: "Setup inicial",
          traditional: "Días o semanas con técnico",
          chefiapp: "Listo en menos de 25 minutos",
        },
        {
          aspect: "Sistemas",
          traditional: "TPV + Staff + Stock separados",
          chefiapp: "Todo integrado en un único OS",
        },
        {
          aspect: "Soporte",
          traditional: "Ticket y espera",
          chefiapp: "WhatsApp directo",
        },
        {
          aspect: "Cambios en la carta",
          traditional: "Depende de terceros",
          chefiapp: "Tú lo cambias al momento",
        },
        {
          aspect: "Contrato",
          traditional: "Fidelización 12-24 meses",
          chefiapp: "Sin contrato. Cancela cuando quieras.",
        },
        {
          aspect: "Coste de hardware",
          traditional: `2.000–5.000 ${getCurrencySymbol()} en equipo`,
          chefiapp: "Funciona en la tablet o PC que ya tienes",
        },
        {
          aspect: "Actualizaciones",
          traditional: "De pago y con interrupciones",
          chefiapp: "Automáticas y continuas",
        },
      ],
    },
    operationalStories: {
      sectionLabel: "El restaurante en funcionamiento",
      headline: "Lo que pasa en la práctica.",
      subhead1:
        "Imagina un servicio real. Viernes. Casa llena. O un hotel al 92% de ocupación: desayuno a tope, bar lleno, room service activo. Todo parece funcionar — hasta que empieza a fallar.",
      subhead2:
        'El cliente o huésped espera. La cocina discute. El gerente pregunta "¿qué está pasando?". Nadie tiene respuesta. Aquí es donde restaurantes y hoteles empiezan a sangrar dinero.',
      scenarioLabel: "Escenario",
      scenarios: [
        {
          num: "01",
          title: "Un pedido entra en el TPV",
          intro: "Viernes, 13h. Casa llenándose.",
          steps: [
            "Aparece en cocina (KDS) — al instante",
            "El stock se ajusta automáticamente",
            "La facturación se actualiza en tiempo real",
            "Queda asociado al empleado que sirvió",
            "Entra en las estadísticas del día",
          ],
          anchor:
            "Sin integraciones. Sin sincronizaciones. Un único sistema operativo.",
        },
        {
          num: "02",
          title: "La cocina ve prioridades, no papel",
          intro: "Sábado por la noche. 18 mesas ocupadas.",
          steps: [
            "Los platos atrasados se señalan automáticamente",
            "Los cuellos de botella aparecen antes de ser problema",
            "El ritmo del servicio se ajusta solo",
            "El chef ve tiempo real, no papel colgado",
          ],
          anchor: "La cocina opera con información, no con suposiciones.",
        },
        {
          num: "03",
          title: "El gerente lo sabe todo — sin preguntar",
          intro: "Abre el Comando Central y ve:",
          steps: [
            "Facturación en tiempo real",
            "Mesas activas y tiempo medio de servicio",
            "Equipo en turno — quién está, quién falta",
            "Alertas operativas antes de que el cliente se queje",
          ],
          anchor: "Todo en el Comando Central. Cero preguntas en el pasillo.",
        },
      ],
      closer: "Cada evento está ligado a todo lo demás — automáticamente.",
    },
    problemSolution: {
      sectionLabel: "Problemas reales que hacen perder dinero",
      headline: "Y cómo el sistema operativo cierra cada vazamento.",
      subhead:
        "No es otro software de gestión. Es el cerebro operativo que une pedidos, cocina, stock, equipo y facturación en el mismo flujo.",
      columnLabel: "Antes: caos silencioso · Después: control en tiempo real",
      labelWithout: "Sin sistema operativo",
      labelWith: "Con ChefIApp™ OS",
      problems: [
        {
          title: "Platos atrasados en cocina",
          lossLabel: "Pérdida estimada: 3–6% por servicio",
          without: [
            "Los pedidos se acumulan sin prioridad clara.",
            "Los camareros presionan cocina; el equipo reacciona, no anticipa.",
            "El cliente se queja cuando el problema ya ha pasado.",
          ],
          with: [
            "El KDS prioriza automáticamente los platos atrasados.",
            "Las alertas aparecen antes de que el retraso se convierta en queja.",
            "El ritmo del servicio se ajusta en tiempo real, no al cierre.",
          ],
        },
        {
          title: "El stock se acaba sin aviso",
          lossLabel: "Pérdida estimada: 2–5% en ventas perdidas",
          without: [
            "El equipo descubre que falta un producto solo cuando el cliente lo pide.",
            "Sustituciones de última hora bajan el ticket medio.",
            "Las compras son reactivas, no planificadas.",
          ],
          with: [
            "El stock se ajusta con cada pedido registrado en el TPV.",
            "Las alertas avisan antes de agotar un producto crítico.",
            "El dueño decide durante el servicio qué priorizar, no al día siguiente.",
          ],
        },
        {
          title: "Dueño ciego durante el servicio",
          lossLabel: "Pérdida invisible: beneficio sin dueño",
          without: [
            'Preguntas clásicas: "¿Cuántos pedidos? ¿Cuánto hemos facturado en este turno?"',
            "Nadie tiene la respuesta en tiempo real, solo al cierre.",
            "Los problemas solo aparecen cuando el cliente ya se ha quejado.",
          ],
          with: [
            "Comando Central muestra facturación, mesas y equipo en tiempo real.",
            "Las alertas operativas señalan cuellos de botella antes de que el cliente lo note.",
            "Las decisiones se toman a mitad de turno, no en el informe del día siguiente.",
          ],
        },
        {
          title: "Equipo desorganizado en turnos",
          lossLabel: "Pérdida estimada: 10–15% en nómina + errores",
          without: [
            'Turnos hechos "de cabeza"; nadie sabe quién es responsable de qué.',
            "Picos de servicio con gente de menos; horas muertas con gente de más.",
            "El rendimiento individual nunca se liga a lo que pasó en el servicio.",
          ],
          with: [
            "Turnos y pedidos viven en el mismo sistema operativo, no en hojas sueltas y memoria.",
            "Cada miembro del equipo ve solo lo que tiene que hacer ahora, sin listas genéricas infinitas.",
            "Responsabilidad clara: pedidos y mesas ligados a quien atendió, sin caza de brujas al cerrar.",
          ],
        },
      ],
    },
    insideSystem: {
      sectionLabel: "Vea el sistema en funcionamiento",
      headline1: "No es promesa.",
      headline2: "Es lo que ves cuando entras.",
      subhead1:
        "No son maquetas genéricas. Son pantallas reales del ChefIApp™ OS: el comando central, el TPV en servicio y la cocina trabajando en tiempo real sobre el mismo cerebro operativo.",
      subhead2:
        "Pantallas reales en entorno de demostración — el mismo sistema usado en restaurantes independientes, grupos y operaciones de hostelería.",
      frames: [
        {
          statusLabel: "En línea",
          imageAlt:
            "Dashboard operativo del ChefIApp™ con pedidos, ingresos y tiempo medio en tiempo real.",
          label: "Comando central",
          title: "Dashboard en vivo por turno",
          desc: "Pedidos en curso, tiempo medio de salida, ingresos del día y riesgo operativo visibles en un solo panel — durante el servicio, no al cierre.",
          liveBadge: "pedidos activos en este turno",
        },
        {
          statusLabel: "En servicio",
          imageAlt:
            "Pantalla del TPV del ChefIApp™ con pedido en creación, items, totales y formas de pago.",
          label: "Frente de casa",
          title: "TPV lanzando pedidos en tiempo real",
          desc: "Cada item registrado en el TPV nace ligado al menú vivo — con precios, modificadores e impuestos correctos — listo para ir a cocina sin ruido.",
        },
        {
          statusLabel: "Cocina en flujo",
          imageAlt:
            "Pantalla del KDS del ChefIApp™ con varios pedidos y prioridades visibles para el equipo de cocina.",
          label: "Cocina y control",
          title: "Prioridad automática y control de retraso",
          desc: "La cocina ve lo que importa: orden, estado, tiempo contando y alertas visuales — ya sea en cena o en un desayuno de hotel a tope.",
        },
      ],
      cards: [
        {
          label: "Configuración de carta",
          title: "Menu Builder",
          desc: "Categorías, platos, márgenes y modificadores en un solo lugar — listo para alimentar TPV, KDS y página pública.",
          screenshot: "menu-builder.png",
        },
        {
          label: "Turnos y equipos",
          title: "Staff y turnos",
          desc: "Perfiles, roles y horarios por turno — ya sea equipo de sala, cocina o F&B de hotel con varios outlets.",
          screenshot: "staff-config.png",
        },
        {
          label: "Analytics operativo",
          title: "Gráficos y márgenes",
          desc: "Visión consolidada por turno, canal y outlet — restaurante, bar, rooftop o room service.",
          screenshot: "analytics-ops.png",
        },
      ],
      flowLabel: "De la configuración a la venta",
      flowTitle:
        "El mismo sistema une configuración, servicio y control de margen.",
      flowDesc:
        "No son herramientas sueltas. El menú que configuras es el mismo que aparece en el TPV, alimenta la cocina y cierra en el dashboard del gerente.",
      steps: [
        {
          numLabel: "01 · Configuración",
          title: "Menu Builder",
          desc: "Define precios, márgenes y modificadores en segundos — sin depender de técnico o soporte externo.",
        },
        {
          numLabel: "02 · Servicio",
          title: "TPV en uso",
          desc: "El plato entra en servicio con el menú vivo — cada pedido bien a la primera, sin parches en la sala.",
        },
        {
          numLabel: "03 · Producción",
          title: "KDS / Cocina",
          desc: "Prioridad automática, tiempo contando y visibilidad por estación — el equipo sabe siempre cuál es el siguiente plato.",
        },
        {
          numLabel: "04 · Control",
          title: "Dashboard / Analytics",
          desc: 'El turno cierra con números reales de margen, tiempo y productividad — no con sensación vaga de que "salió bien".',
        },
      ],
      ctaSub:
        "¿Quieres ver estas pantallas con tus propios datos? En menos de un turno puedes probar el sistema operativo completo.",
      ctaButton: "Quiero ver esto con mis datos",
    },
  },
} as const;

export type FAQItem = { q: string; a: string };

export function getFAQ(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  headlineAccent: string;
  anotherQuestion: string;
  contactUs: string;
  items: FAQItem[];
} {
  const loc = copy[locale] ?? copy.pt;
  const faq = (loc as { faq: typeof copy.pt.faq }).faq;
  return {
    sectionLabel: faq.sectionLabel,
    headline: faq.headline,
    headlineAccent: faq.headlineAccent,
    anotherQuestion: faq.anotherQuestion,
    contactUs: faq.contactUs,
    items: faq.items,
  };
}

export function getPricing(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  headlineAccent: string;
  subhead: string;
  badge: string;
  perMonth: string;
  trustLine: string;
  cta: string;
  footerLine: string;
  enterpriseQuestion: string;
  contactUs: string;
  included: readonly string[];
} {
  const loc = copy[locale] ?? copy.pt;
  const pricing = (loc as { pricing: typeof copy.pt.pricing }).pricing;
  return {
    sectionLabel: pricing.sectionLabel,
    headline: pricing.headline,
    headlineAccent: pricing.headlineAccent,
    subhead: pricing.subhead,
    badge: pricing.badge,
    perMonth: pricing.perMonth,
    trustLine: pricing.trustLine,
    cta: pricing.cta,
    footerLine: pricing.footerLine,
    enterpriseQuestion: pricing.enterpriseQuestion,
    contactUs: pricing.contactUs,
    included: pricing.included,
  };
}

export type ManifestoReason = { title: string; desc: string };

export function getManifesto(locale: LandingLocale): {
  headline: string;
  headlineAccent: string;
  subhead: string;
  beforeLabel: string;
  beforeItems: readonly string[];
  beforeFooter: string;
  afterLabel: string;
  afterHeadline: string;
  osReasons: readonly ManifestoReason[];
  callout1: string;
  callout2: string;
} {
  const loc = copy[locale] ?? copy.pt;
  const m = (loc as { manifesto: typeof copy.pt.manifesto }).manifesto;
  return {
    headline: m.headline,
    headlineAccent: m.headlineAccent,
    subhead: m.subhead,
    beforeLabel: m.beforeLabel,
    beforeItems: m.beforeItems,
    beforeFooter: m.beforeFooter,
    afterLabel: m.afterLabel,
    afterHeadline: m.afterHeadline,
    osReasons: m.osReasons,
    callout1: m.callout1,
    callout2: m.callout2,
  };
}

export type TargetAudienceItem = {
  title: string;
  desc: string;
  features: readonly string[];
};

export function getTargetAudience(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  headlineAccent: string;
  audiences: readonly TargetAudienceItem[];
} {
  const loc = copy[locale] ?? copy.pt;
  const ta = (loc as { targetAudience: typeof copy.pt.targetAudience })
    .targetAudience;
  return {
    sectionLabel: ta.sectionLabel,
    headline: ta.headline,
    headlineAccent: ta.headlineAccent,
    audiences: ta.audiences,
  };
}

export type ComoComecerStep = { num: string; title: string; desc: string };

export function getComoComecer(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  headlineAccent: string;
  subhead: string;
  stepLabel: string;
  steps: readonly ComoComecerStep[];
  cta: string;
  ctaSub: string;
} {
  const loc = copy[locale] ?? copy.pt;
  const cc = (loc as { comoComecer: typeof copy.pt.comoComecer }).comoComecer;
  return {
    sectionLabel: cc.sectionLabel,
    headline: cc.headline,
    headlineAccent: cc.headlineAccent,
    subhead: cc.subhead,
    stepLabel: cc.stepLabel,
    steps: cc.steps,
    cta: cc.cta,
    ctaSub: cc.ctaSub,
  };
}

export type ToolsAvoidItem = { badge: string; title: string; body: string };

export function getToolsAvoid(locale: LandingLocale): {
  sectionLabel: string;
  headline1: string;
  headline2: string;
  subhead: string;
  items: readonly ToolsAvoidItem[];
} {
  const loc = copy[locale] ?? copy.pt;
  const ta = (loc as { toolsAvoid: typeof copy.pt.toolsAvoid }).toolsAvoid;
  return {
    sectionLabel: ta.sectionLabel,
    headline1: ta.headline1,
    headline2: ta.headline2,
    subhead: ta.subhead,
    items: ta.items,
  };
}

export type HardwareDevice = { title: string; desc: string };

export function getHardware(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  headlineAccent: string;
  subhead: string;
  devices: readonly HardwareDevice[];
  pwaNote: string;
} {
  const loc = copy[locale] ?? copy.pt;
  const hw = (loc as { hardware: typeof copy.pt.hardware }).hardware;
  return {
    sectionLabel: hw.sectionLabel,
    headline: hw.headline,
    headlineAccent: hw.headlineAccent,
    subhead: hw.subhead,
    devices: hw.devices,
    pwaNote: hw.pwaNote,
  };
}

export type PlatformModule = { title: string; desc: string };

export function getPlatform(locale: LandingLocale): {
  sectionLabel: string;
  headline1: string;
  headline2: string;
  subhead: string;
  modules: readonly PlatformModule[];
  bottomNote: string;
} {
  const loc = copy[locale] ?? copy.pt;
  const pl = (loc as { platform: typeof copy.pt.platform }).platform;
  return {
    sectionLabel: pl.sectionLabel,
    headline1: pl.headline1,
    headline2: pl.headline2,
    subhead: pl.subhead,
    modules: pl.modules,
    bottomNote: pl.bottomNote,
  };
}

export type MoneyLeaksSynthesis = {
  exampleLabel: string;
  revenue: string;
  revenueSub: string;
  recoverable: string;
  recoverableSub: string;
  body1: string;
  body1Highlight: string;
  body1End: string;
  body2: string;
  body2End: string;
};

export type MoneyLeakItem = {
  label: string;
  range: string;
  description: string;
  footer: string;
};

export function getMoneyLeaks(locale: LandingLocale): {
  sectionLabel: string;
  headline1: string;
  headline2: string;
  subhead: string;
  leaks: readonly MoneyLeakItem[];
  synthesis: MoneyLeaksSynthesis;
} {
  const loc = copy[locale] ?? copy.pt;
  const ml = (loc as { moneyLeaks: typeof copy.pt.moneyLeaks }).moneyLeaks;
  return {
    sectionLabel: ml.sectionLabel,
    headline1: ml.headline1,
    headline2: ml.headline2,
    subhead: ml.subhead,
    leaks: ml.leaks,
    synthesis: ml.synthesis,
  };
}

export type MetricsStripItem =
  | { type: "static"; value: string; label: string }
  | {
      type: "animated";
      target: number;
      suffix?: string;
      prefix?: string;
      label: string;
    };

export function getMetricsStrip(locale: LandingLocale): {
  metrics: readonly MetricsStripItem[];
} {
  const loc = copy[locale] ?? copy.pt;
  const ms = (loc as { metricsStrip: typeof copy.pt.metricsStrip })
    .metricsStrip;
  return { metrics: ms.metrics };
}

export function getRhythmBreak(locale: LandingLocale): {
  label: string;
  headline: string;
} {
  const loc = copy[locale] ?? copy.pt;
  const rb = (loc as { rhythmBreak: typeof copy.pt.rhythmBreak }).rhythmBreak;
  return { label: rb.label, headline: rb.headline };
}

export type SocialProofFeaturedTestimonial = {
  quote: string;
  authorName: string;
  authorSubline: string;
  authorLocation: string;
  initials: string;
  stats: readonly { value: string; label: string }[];
};
export type SocialProofSecondaryTestimonial = {
  initials: string;
  quote: string;
  name: string;
  location: string;
};

export function getSocialProof(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  headlineAccent: string;
  featuredTestimonial: SocialProofFeaturedTestimonial | null;
  secondaryTestimonials: readonly SocialProofSecondaryTestimonial[];
  placeholderCta: string;
  placeholderButton: string;
  trustLabels: readonly string[];
} {
  const loc = copy[locale] ?? copy.pt;
  const sp = (loc as { socialProof: typeof copy.pt.socialProof }).socialProof;
  return {
    sectionLabel: sp.sectionLabel,
    headline: sp.headline,
    headlineAccent: sp.headlineAccent,
    featuredTestimonial: sp.featuredTestimonial ?? null,
    secondaryTestimonials: sp.secondaryTestimonials ?? [],
    placeholderCta: sp.placeholderCta,
    placeholderButton: sp.placeholderButton,
    trustLabels: sp.trustLabels,
  };
}

export type ComparisonRow = {
  aspect: string;
  traditional: string;
  chefiapp: string;
};

export type OperationalStoryScenario = {
  num: string;
  title: string;
  intro: string;
  steps: readonly string[];
  anchor: string;
};

export type ProblemSolutionBlock = {
  title: string;
  lossLabel: string;
  without: readonly string[];
  with: readonly string[];
};

export type InsideSystemFrame = {
  statusLabel: string;
  imageAlt: string;
  label: string;
  title: string;
  desc: string;
  liveBadge?: string;
};
export type InsideSystemCard = {
  label: string;
  title: string;
  desc: string;
  screenshot: string;
};
export type InsideSystemStep = {
  numLabel: string;
  title: string;
  desc: string;
};

export function getInsideSystem(locale: LandingLocale): {
  sectionLabel: string;
  headline1: string;
  headline2: string;
  subhead1: string;
  subhead2: string;
  frames: readonly InsideSystemFrame[];
  cards: readonly InsideSystemCard[];
  flowLabel: string;
  flowTitle: string;
  flowDesc: string;
  steps: readonly InsideSystemStep[];
  ctaSub: string;
  ctaButton: string;
} {
  const loc = copy[locale] ?? copy.pt;
  const is = (loc as { insideSystem: typeof copy.pt.insideSystem })
    .insideSystem;
  return {
    sectionLabel: is.sectionLabel,
    headline1: is.headline1,
    headline2: is.headline2,
    subhead1: is.subhead1,
    subhead2: is.subhead2,
    frames: is.frames,
    cards: is.cards,
    flowLabel: is.flowLabel,
    flowTitle: is.flowTitle,
    flowDesc: is.flowDesc,
    steps: is.steps,
    ctaSub: is.ctaSub,
    ctaButton: is.ctaButton,
  };
}

export function getProblemSolution(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  subhead: string;
  columnLabel: string;
  labelWithout: string;
  labelWith: string;
  problems: readonly ProblemSolutionBlock[];
} {
  const loc = copy[locale] ?? copy.pt;
  const ps = (loc as { problemSolution: typeof copy.pt.problemSolution })
    .problemSolution;
  return {
    sectionLabel: ps.sectionLabel,
    headline: ps.headline,
    subhead: ps.subhead,
    columnLabel: ps.columnLabel,
    labelWithout: ps.labelWithout,
    labelWith: ps.labelWith,
    problems: ps.problems,
  };
}

export function getOperationalStories(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  subhead1: string;
  subhead2: string;
  scenarioLabel: string;
  scenarios: readonly OperationalStoryScenario[];
  closer: string;
} {
  const loc = copy[locale] ?? copy.pt;
  const os = (loc as { operationalStories: typeof copy.pt.operationalStories })
    .operationalStories;
  return {
    sectionLabel: os.sectionLabel,
    headline: os.headline,
    subhead1: os.subhead1,
    subhead2: os.subhead2,
    scenarioLabel: os.scenarioLabel,
    scenarios: os.scenarios,
    closer: os.closer,
  };
}

export function getComparison(locale: LandingLocale): {
  sectionLabel: string;
  headline: string;
  headlineAccent: string;
  subhead: string;
  headerTraditional: string;
  headerChefiapp: string;
  rows: readonly ComparisonRow[];
} {
  const loc = copy[locale] ?? copy.pt;
  const comp = (loc as { comparison: typeof copy.pt.comparison }).comparison;
  return {
    sectionLabel: comp.sectionLabel,
    headline: comp.headline,
    headlineAccent: comp.headlineAccent,
    subhead: comp.subhead,
    headerTraditional: comp.headerTraditional,
    headerChefiapp: comp.headerChefiapp,
    rows: comp.rows,
  };
}

function getNested<K extends string>(
  obj: Record<string, unknown>,
  path: K,
): string {
  const value = path
    .split(".")
    .reduce(
      (acc: unknown, key) => (acc as Record<string, unknown>)?.[key],
      obj,
    );
  return typeof value === "string" ? value : "";
}

export function getLandingCopy(locale: LandingLocale, key: string): string {
  const localeCopy = copy[locale] ?? copy.pt;
  return (
    getNested(localeCopy as Record<string, unknown>, key) ||
    getNested(copy.pt as Record<string, unknown>, key) ||
    key
  );
}

export { copy };
