/**
 * Conteúdo do Modo Demo Explicativo (MODO_DEMO_EXPLICATIVO_SPEC).
 * Padrão: O que é / Por que existe / Como se conecta / Quando ativado.
 */

export type DemoExplicativoModuleId =
  | "tpv"
  | "kds"
  | "dashboard"
  | "backoffice"
  | "modos"
  | "tarefas"
  | "cardapio"
  | "equipe";

export interface DemoExplicativoBloco {
  titulo: string;
  oQueE: string;
  porQueExiste: string;
  comoSeConecta: string;
  quandoAtivado: string;
}

export const DEMO_EXPLICATIVO_CONTENT: Record<
  DemoExplicativoModuleId,
  DemoExplicativoBloco
> = {
  tpv: {
    titulo: "Vendas / Caixa",
    oQueE: "Aqui entram os pedidos, os pagamentos e o fluxo de caixa.",
    porQueExiste:
      "É o ponto onde a operação vira venda: o garçom ou o cliente registra o pedido e o pagamento. Sem isso, não há fechamento financeiro.",
    comoSeConecta:
      "O TPV fala com o KDS (cozinha vê o pedido), com o estado das mesas e com o tempo real da operação. No ChefIApp, o caixa não é isolado — faz parte do mesmo sistema que a cozinha e as mesas.",
    quandoAtivado:
      "Em piloto ou ao vivo, funciona com dados reais: pedidos reais, pagamentos reais, relatórios reais.",
  },
  kds: {
    titulo: "Cozinha (KDS)",
    oQueE:
      "O painel onde a cozinha vê os pedidos, os tempos e o que está pronto para servir.",
    porQueExiste:
      "A cozinha precisa de uma vista clara do que fazer agora: o que acabou de chegar, o que está em preparo e o que já pode sair para a mesa.",
    comoSeConecta:
      "Recebe pedidos do TPV e do pedido web/QR. Atualiza estados (em preparo, pronto) que o salão e o TPV usam. O tempo de espera e os alertas nascem daqui.",
    quandoAtivado:
      "A cozinha opera com pedidos reais e tempos reais; os alertas e sugestões passam a refletir a operação.",
  },
  dashboard: {
    titulo: "Visão geral",
    oQueE:
      "A tela principal depois que o restaurante está publicado. Mostra os módulos disponíveis e o estado do sistema (demo, piloto ou ao vivo).",
    porQueExiste:
      "O dono ou gerente precisa de um único lugar para ver o que está ativo, o que pode ativar e o que fazer a seguir — sem entrar em cada módulo à toa.",
    comoSeConecta:
      "É a porta de entrada para TPV, KDS, tarefas, equipe, etc. O estado do sistema (demo/piloto/ao vivo) define o que está bloqueado ou liberado.",
    quandoAtivado:
      "Em piloto ou ao vivo, os módulos passam a abrir operação real; em demo, tudo é explicativo e sem impacto financeiro.",
  },
  backoffice: {
    titulo: "Configuração / Setup",
    oQueE:
      "O lugar onde se configura cardápio, mesas, equipe, horários, pagamentos e preferências.",
    porQueExiste:
      "Antes de vender, o restaurante precisa estar configurado: o que vende, onde senta, quem opera e como paga.",
    comoSeConecta:
      "Alimenta o Core com dados que o TPV, o KDS e os relatórios usam. As mudanças aqui refletem em toda a operação.",
    quandoAtivado:
      "As configurações passam a valer para a operação real (piloto ou ao vivo).",
  },
  modos: {
    titulo: "Demo / Piloto / Ao vivo",
    oQueE:
      "Três estados do restaurante: demonstração (sem dados reais), piloto (operação real controlada) e ao vivo (operação oficial).",
    porQueExiste:
      "Permite testar e demonstrar sem risco, depois pilotar com limites e, por fim, operar ao vivo quando o contrato/pagamento estiver ativo.",
    comoSeConecta:
      "O modo define o que o TPV e o KDS fazem (bloqueado em demo, liberado em piloto/ao vivo) e como os pedidos são marcados (ex.: piloto = pedidos de teste no Core).",
    quandoAtivado:
      "As transições são raras e contratuais (ex.: billing ativa ao vivo); o dono vê o estado atual no Dashboard e no Backoffice.",
  },
  tarefas: {
    titulo: "Tarefas",
    oQueE:
      "Lista de tarefas operacionais geradas pelo sistema (ex.: mesa esperando pagamento, pedido atrasado).",
    porQueExiste:
      "O sistema observa o contexto e sugere a próxima ação — em vez de o operador ter de lembrar de tudo.",
    comoSeConecta:
      "Usa dados do TPV, do KDS e das mesas para criar tarefas prioritárias. Faz parte do sistema que organiza decisões.",
    quandoAtivado:
      "As tarefas passam a refletir a operação real e a prioridade de verdade.",
  },
  cardapio: {
    titulo: "Cardápio / Menu",
    oQueE:
      "Onde se define produtos, categorias, preços e o que aparece no TPV e no pedido web.",
    porQueExiste:
      "Sem cardápio não há venda. É a base do que o restaurante oferece.",
    comoSeConecta:
      "O TPV e o pedido público consomem o cardápio; alterações aqui afetam imediatamente o que pode ser vendido.",
    quandoAtivado: "Alterações valem para a operação real.",
  },
  equipe: {
    titulo: "Equipe / Pessoas",
    oQueE: "Cadastro de funcionários, funções e escalas.",
    porQueExiste:
      "Para saber quem opera, quem acessa o quê e como organizar turnos.",
    comoSeConecta:
      "Pode alimentar permissões, relatórios e o Mentor IA. Em versões futuras, integra com ponto e desempenho.",
    quandoAtivado: "Dados reais de equipe e escalas.",
  },
};
