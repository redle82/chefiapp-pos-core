# Modo Trial Explicativo — Especificação

**Data:** 2026-01-29
**Status:** Decisão + especificação + implementado.
**Objetivo:** Reposicionar o System Tree como modo de leitura/explicação (não tela principal) e definir o Modo Trial como narrativa explicativa (não só bloqueio).

**Implementado:** Card explicativo (Opção A) em TPV e KDS; passo "Como tudo se conecta" no Demo Guide (Opção C); System Tree removido do Dashboard e NAV; links "Entender o sistema" / "Como tudo se conecta" apontam para /trial-guide; copy na Landing atualizada.

---

## 1. Regra definitiva

**O System Tree NÃO é uma tela principal.**

- Não é item de menu principal.
- Não é feature para todo mundo.
- Não é algo que "se usa" no dia a dia.

**O System Tree é:**

- Modo explicativo (como o sistema está organizado e por quê).
- Modo de entendimento (para dono / gerente técnico).
- Modo diagnóstico / onboarding (para "entender o sistema").

O sistema inteiro já é organizado em árvore lógica; tratar o "System Tree" como coisa à parte é redundante e confuso. O próprio sistema é o mapa.

---

## 2. Onde o System Tree some e onde reaparece

### Onde some (deixar de ser destaque)

| Local                           | Situação atual                                                               | Decisão                                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**                   | Card "System Tree" na lista de sistemas (zona 2 ou 3)                        | Remover como card principal; não aparecer como sistema ao lado de TPV, KDS, etc.                                                               |
| **NAV_SECTIONS (Dashboard)**    | Item "System Tree" em "Restaurante" (Visão Geral, System Tree, Configuração) | Remover "System Tree" da navegação principal; substituir por "Entender o sistema" (ver abaixo) ou ocultar em pilot/live.                       |
| **SetupSidebar (onboarding)**   | Botão/link "Ver System Tree"                                                 | Trocar para "Como tudo se conecta" ou remover; se manter, levar para vista explicativa (não para a tela atual do System Tree como mapa solto). |
| **ConfigSidebar**               | Item "System Tree"                                                           | Mover para subsecção "Ajuda" / "Entender o sistema" ou remover do fluxo principal.                                                             |
| **PublishSection (onboarding)** | Botão "System Tree"                                                          | Alinhar ao novo posicionamento: "Ver como tudo se conecta" e abrir modo explicativo ou página dedicada de explicação.                          |
| **Landing**                     | Copy "System Tree: mapa vivo..."                                             | Trocar para "Como tudo se conecta" (sem citar "System Tree" como produto).                                                                     |

### Onde reaparece (modo explicativo)

| Contexto         | Como aparece                                                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Demo Guide**   | "Como tudo se conecta" — vista ou passo do Demo Guide dentro do trial que mostra a organização do sistema (árvore simples, lista encadeada ou breadcrumb) + texto humano, sem jargão. Pode ser overlay, toggle "Modo explicativo" ou passo do walkthrough após os 3 passos atuais. |
| **Pilot / Live** | "Entender o sistema" ou "Visão do sistema" — link secundário (footer, menu de ajuda, ou dentro de Config) para dono/gerente. Nunca para garçom. Leva à mesma vista explicativa (não à tela atual do System Tree como feature).                                                     |

---

## 3. Modo Trial Explicativo — estrutura

**Trial = Sistema + Narração.**

Em modo trial, cada seção do sistema (ou cada bloco que o usuário encontra) tem:

1. **Estado visual:** cinza / bloqueado / trial (já existe em parte via ModeGate).
2. **Bloco explicativo fixo:** texto curto que explica o que é, por que existe, com o que se conecta e o que acontece quando está ativo.

Não basta "indisponível no modo trial". Tem que explicar: "isso faz X", "existe por Y", "conecta com Z", "quando ativado resolve tal problema".

---

## 4. Lista de seções e texto explicativo (copy)

Cada bloco abaixo é o texto que acompanha a seção em modo trial. Pode ser usado em card, banner ou overlay.

---

### TPV (Vendas / Caixa)

**O que é:** Aqui entram os pedidos, os pagamentos e o fluxo de caixa.

**Por que existe:** É o ponto onde a operação vira venda: o garçom ou o cliente registra o pedido e o pagamento. Sem isso, não há fechamento financeiro.

**Como se conecta:** O TPV fala com o KDS (cozinha vê o pedido), com o estado das mesas e com o tempo real da operação. No ChefIApp, o caixa não é isolado — faz parte do mesmo sistema que a cozinha e as mesas.

**Quando ativado (piloto ou ao vivo):** Funciona com dados reais: pedidos reais, pagamentos reais, relatórios reais.

---

### KDS (Cozinha)

**O que é:** O painel onde a cozinha vê os pedidos, os tempos e o que está pronto para servir.

**Por que existe:** A cozinha precisa de uma vista clara do que fazer agora: o que acabou de chegar, o que está em preparo e o que já pode sair para a mesa.

**Como se conecta:** Recebe pedidos do TPV e do pedido web/QR. Atualiza estados (em preparo, pronto) que o salão e o TPV usam. O tempo de espera e os alertas nascem daqui.

**Quando ativado:** A cozinha opera com pedidos reais e tempos reais; os alertas e sugestões passam a refletir a operação.

---

### Dashboard (Visão geral)

**O que é:** A tela principal depois que o restaurante está publicado. Mostra os módulos disponíveis e o estado do sistema (trial, piloto ou ao vivo).

**Por que existe:** O dono ou gerente precisa de um único lugar para ver o que está ativo, o que pode ativar e o que fazer a seguir — sem entrar em cada módulo à toa.

**Como se conecta:** É a porta de entrada para TPV, KDS, tarefas, equipe, etc. O "estado do sistema" (trial/piloto/ao vivo) define o que está bloqueado ou liberado.

**Quando ativado:** Em piloto ou ao vivo, os módulos passam a abrir operação real; em trial, tudo é explicativo e sem impacto financeiro.

---

### Backoffice (Configuração / Setup)

**O que é:** O lugar onde se configura cardápio, mesas, equipe, horários, pagamentos e preferências.

**Por que existe:** Antes de vender, o restaurante precisa estar configurado: o que vende, onde senta, quem opera e como paga.

**Como se conecta:** Alimenta o Core com dados que o TPV, o KDS e os relatórios usam. As mudanças aqui refletem em toda a operação.

**Quando ativado:** As configurações passam a valer para a operação real (piloto ou ao vivo).

---

### Sistema de modos (Trial / Piloto / Ao vivo)

**O que é:** Três estados do restaurante: trial (sem dados reais), piloto (operação real controlada) e ao vivo (operação oficial).

**Por que existe:** Permite testar e demonstrar sem risco, depois pilotar com limites e, por fim, operar ao vivo quando o contrato/pagamento estiver ativo.

**Como se conecta:** O modo define o que o TPV e o KDS fazem (bloqueado em trial, liberado em piloto/ao vivo) e como os pedidos são marcados (ex.: piloto = pedidos de teste no Core).

**Quando ativado:** As transições são raras e contratuais (ex.: billing ativa "ao vivo"); o dono vê o estado atual no Dashboard e no Backoffice.

---

### Tarefas

**O que é:** Lista de tarefas operacionais geradas pelo sistema (ex.: mesa esperando pagamento, pedido atrasado).

**Por que existe:** O sistema observa o contexto e sugere a próxima ação — em vez de o operador ter de lembrar de tudo.

**Como se conecta:** Usa dados do TPV, do KDS e das mesas para criar tarefas prioritárias. Faz parte do "sistema que organiza decisões".

**Quando ativado:** As tarefas passam a refletir a operação real e a prioridade de verdade.

---

### Cardápio / Menu

**O que é:** Onde se define produtos, categorias, preços e o que aparece no TPV e no pedido web.

**Por que existe:** Sem cardápio não há venda. É a base do que o restaurante oferece.

**Como se conecta:** O TPV e o pedido público consomem o cardápio; alterações aqui afetam imediatamente o que pode ser vendido.

**Quando ativado:** Alterações valem para a operação real.

---

### Equipe / Pessoas

**O que é:** Cadastro de funcionários, funções e escalas.

**Por que existe:** Para saber quem opera, quem acessa o quê e como organizar turnos.

**Como se conecta:** Pode alimentar permissões, relatórios e o Mentor IA. Em versões futuras, integra com ponto e desempenho.

**Quando ativado:** Dados reais de equipe e escalas.

---

### Outros módulos (Saúde, Alertas, Mentor IA, Compras, Financeiro, Reservas, etc.)

**Padrão para todos:**

- **O que é:** Uma frase.
- **Por que existe:** Uma frase.
- **Como se conecta:** Uma frase (TPV, KDS, Dashboard, Core).
- **Quando ativado:** "Em piloto ou ao vivo, funciona com dados reais."

(Os textos acima podem ser replicados e adaptados por módulo; esta spec fixa o padrão e os exemplos principais.)

---

## 5. Comportamento visual do Modo Trial Explicativo

### Opção A — Card explicativo por seção (recomendada para primeiro passo)

- Em modo trial, ao entrar numa rota que seria bloqueada (ex.: /tpv, /kds-minimal), em vez de só o fallback "indisponível no modo trial":
  - Mostrar um **card ou banner no topo** com o bloco explicativo (TPV, KDS, etc.) em 4 linhas: O que é / Por que existe / Como se conecta / Quando ativado.
- O restante da área pode continuar cinza ou bloqueado; o foco é o texto.

### Opção B — Overlay "Modo explicativo"

- Toggle ou botão "Explicar" que, em trial, abre um overlay com a lista de seções e o texto de cada uma (accordion ou lista).
- O usuário pode fechar e voltar ao fluxo normal (landing → trial guide → dashboard).

### Opção C — Passo extra no Demo Guide (Como tudo se conecta)

- Após os 3 passos atuais (Observe, Pense, Sugira), um **quarto passo** ou **subpágina**: "Como tudo se conecta".
- Conteúdo: árvore simples ou lista encadeada (Dashboard → TPV, KDS, Tarefas, Backoffice, Modos) + texto humano por nó, sem jargão.
- É aqui que o "System Tree" **dissolve**: não é mais uma tela separada chamada "System Tree", é o passo do Demo Guide que explica a organização.

**Recomendação:** Implementar primeiro a **Opção A** (card explicativo nas rotas bloqueadas em trial) e a **Opção C** (passo "Como tudo se conecta" no fluxo do Demo Guide). A Opção B pode vir depois como "Ajuda avançada".

---

## 6. Resumo executivo

| O quê                           | Decisão                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| System Tree como tela principal | Removido. Não é card do Dashboard nem item principal de navegação.                                                                         |
| System Tree como conceito       | Vira "Como tudo se conecta" — modo explicativo, não feature.                                                                               |
| Onde aparece no Demo Guide      | Como passo ou vista do Demo Guide (ex.: passo 4 ou subpágina após os 3 passos).                                                            |
| Onde aparece em Pilot/Live      | Link secundário "Entender o sistema" ou "Visão do sistema" (ajuda/diagnóstico), para dono/gerente.                                         |
| Modo Trial                      | Explicativo: cada seção (TPV, KDS, Dashboard, etc.) tem bloco de texto (o quê, por quê, conecta com quê, quando ativado). Não só bloqueio. |
| Comportamento visual            | Card/banner por seção em trial (Opção A); passo "Como tudo se conecta" no Demo Guide (Opção C).                                            |

---

## 7. Próximos passos de implementação (fora do escopo desta spec)

1. **Código / UX:** Remover o card "System Tree" do array SYSTEMS no Dashboard; remover ou renomear "System Tree" em NAV_SECTIONS para "Entender o sistema" (e apontar para rota de vista explicativa).
2. **Demo Guide:** Adicionar passo ou subpágina "Como tudo se conecta" na página do Demo Guide (ou nova rota /trial-guide#conecta) com árvore/lista + textos desta spec.
3. **ModeGate / fallback:** Onde hoje só aparece "indisponível no modo trial", acrescentar o card explicativo correspondente (TPV, KDS, etc.) usando os blocos da secção 4.
4. **Config / Onboarding:** Trocar links "System Tree" por "Como tudo se conecta" ou "Entender o sistema" e fazer apontar para a nova vista explicativa (ou para /trial-guide#conecta).
5. **Landing:** Ajustar copy que menciona "System Tree" para "Como tudo se conecta" (sem nome de feature).

Esta spec não implementa código; define a decisão, os textos e o comportamento para implementação posterior.
