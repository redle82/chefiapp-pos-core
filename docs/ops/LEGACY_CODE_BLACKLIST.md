# Blacklist de código legado (kill-switch)

**Propósito:** Lista explícita de módulos, flags, rotas e padrões **proibidos** de reintrodução. Se alguém (ou revisão daqui a meses) tentar reintroduzir → alerta imediato.

**Contexto:** [AUDITORIA_RITUAL_CORTE.md](../plans/AUDITORIA_RITUAL_CORTE.md); [OPERATIONAL_NAVIGATION_SOVEREIGNTY.md](../contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md).

**Uso:** Em revisão de código ou script: verificar que nenhuma alteração reintroduz entradas desta lista. Pode ser checklist em PR ou script que faz grep contra as secções abaixo.

---

## 1. Padrões proibidos

| Padrão | Motivo | Contrato |
|--------|--------|----------|
| Import de `@supabase/supabase-js` em merchant-portal/src | Backend único = Docker Core (PostgREST fetch) | DOCKER_CORE_ONLY |
| Chamada a `getSupabaseClient()` ou `createClient()` em merchant-portal/src | Usar getCoreClient() / getDockerCoreFetchClient() | DOCKER_CORE_ONLY |
| Novo redirect para `"/"` (landing) sem passar por `resolveDestination` em FlowGate quando em contexto app | Soberania de navegação: em OPERATIONAL_OS destino canónico é `/app/dashboard` | OPERATIONAL_NAVIGATION_SOVEREIGNTY |
| `safeNavigate("/")` ou `navigate("/")` em rotas app (/*) quando `CONFIG.UI_MODE === "OPERATIONAL_OS"` | Nunca redirecionar para Landing em OPERATIONAL_OS | OPERATIONAL_NAVIGATION_SOVEREIGNTY |
| Guard ou middleware que redireccione para `/` ou `/landing` com base em "trial", "first-sale" ou "demo" sem respeitar OPERATIONAL_OS | DEMO_MODE não controla navegação em OPERATIONAL_OS | OPERATIONAL_NAVIGATION_SOVEREIGNTY |
| Nova fonte de verdade para "core health" fora do CoreHealth singleton / useCoreHealth | Kernel é única fonte | OPERATIONAL_KERNEL_CONTRACT |
| Nova fonte de verdade para "preflight" fora de usePreflightOperational | Kernel é única fonte | OPERATIONAL_KERNEL_CONTRACT |
| Nova decisão de redirect para rotas app fora de FlowGate + ORE | Uma única autoridade de navegação | OPERATIONAL_NAVIGATION_SOVEREIGNTY |

---

## 2. Módulos / ficheiros proibidos de reintrodução (após corte)

*Lista preenchida após refactor pós-freeze (FASE 1).*

| Caminho ou módulo | Motivo |
|-------------------|--------|
| merchant-portal/src/pages/Demo/DemoTourPage.tsx | Dead code; nunca referenciado em rotas. |
| merchant-portal/src/components/DemoExplicativo/ (Card, content, index) | Só "explica"; substituído por mensagem mínima em KDS/TPV. |
| merchant-portal/src/cinematic/ (directório inteiro) | Fluxo explicativo; não executa ritual operacional; dependentes migrados para core-boundary/PublicMenuContext. |
| merchant-portal/src/ui/design-system/components/GlobalPilotBanner.tsx | Banner piloto removido da UI; contrato. |
| merchant-portal/src/pages/Demo/DemoGuiadoPage.tsx | Rota /demo-guiado redirecciona para /auth. |
| merchant-portal/src/core/flow/OperationGate.tsx | Guard fora de FlowGate+ORE; não usado nas rotas. |
| merchant-portal/src/core/flow/OperationGate.test.tsx | Teste do OperationGate; morre junto. |
| merchant-portal/src/core/bootstrap/BootstrapComposer.tsx | Legado; não usado em nenhuma árvore de rotas; dependia de cinematic. |
| merchant-portal/src/core/crm/ (CustomerService) | Helper genérico não referenciado por contrato nem consumido. |
| merchant-portal/src/core/social/ (SocialMediaService) | Não referenciado. |
| merchant-portal/src/core/marketing/ (PixelService, SEOHead) | Não referenciado. |
| merchant-portal/src/core/archive/ (README) | Candidato a remoção; pasta vazia. |
| merchant-portal/src/core/leak-map/ (LeakMapTypes, LeakRegistry) | Não consumido; apenas import comentado em FinancialExport. |

---

## 3. Flags proibidas (env / config)

| Flag ou env | Motivo |
|-------------|--------|
| Nova flag que duplique decisão do Kernel (ex.: "skip preflight", "ignore core health") sem contrato | OPERATIONAL_KERNEL_CONTRACT |
| Flag temporária sem data de remoção e contrato associado | Política de freeze |
| VITE_DEBUG_DIRECT_FLOW | Temporário; documentada data de remoção TBD em config.ts; desligar em produção. |
| VITE_LLM_VISION_ENDPOINT | Legado; remover após confirmação de não uso. |

---

## 4. Rotas / comportamentos proibidos

| Comportamento | Motivo |
|---------------|--------|
| Redirect de `/app/install` para `/` ou `/landing` em contexto operacional | /app/install é rota operacional; OPERATIONAL_NAVIGATION_SOVEREIGNTY |
| Redirect de `/dashboard` ou `/app/dashboard` para `/` quando utilizador tem org e OPERATIONAL_OS | Destino canónico é /app/dashboard |
| Comportamento de landing que force saída de área app sem passar por FlowGate | Soberania única |

---

## 4.1 Fluxo de pedido (FASE 1 — order-flow-freeze-v1)

| Padrão / comportamento | Motivo |
|-------------------------|--------|
| Alterar `gm_orders.status` diretamente (PostgREST `.from("gm_orders").update(...)`) fora de `CoreOrdersApi.updateOrderStatus` / RPC `update_order_status` | Única via de mudança de estado é RPC; auditabilidade e logs centralizados. Ver FLUXO_DE_PEDIDO_OPERACIONAL. |
| Usar `addOrderItem` / `removeOrderItem` / `updateOrderItemQty` (CoreOrdersApi) **após** confirmação do pedido (pedido já em `confirmedOrderIdsRef`) | Imutabilidade pós-confirmação; Fase 1 não usa mutação de itens após confirmar. |

---

## 5. Processo de alerta

1. **Em PR:** Checklist "Nenhuma alteração reintroduz entradas de [LEGACY_CODE_BLACKLIST.md](LEGACY_CODE_BLACKLIST.md)".
2. **Script opcional:** Grep nos diffs por padrões listados (ex.: `navigate("/")`, `safeNavigate("/")`, novos ficheiros cujo path está em "Módulos proibidos").
3. **CI:** Se viável, passo que falha se ficheiros listados em §2 forem adicionados ou se padrões de §1 aparecerem em código novo.

---

Última actualização: Kill-switch legado; estrutura e entradas iniciais a partir da auditoria.
