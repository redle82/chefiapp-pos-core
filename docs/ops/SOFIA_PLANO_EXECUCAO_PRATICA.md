# Sofia Gastrobar — Plano de execução prática (ambiente vivo completo)

**Objetivo:** Plano executável para abrir e validar em simultâneo todas as superfícies do Sofia Gastrobar no Docker/Core, com o mesmo dono, mesma sessão, mesmo tenant e ciclo operacional completo (pedidos multi-origem, tarefas, pagamento, relatórios).

**Base:** [SOFIA_FULL_DAY_DEMO_RUNBOOK.md](./SOFIA_FULL_DAY_DEMO_RUNBOOK.md), [SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md), [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md), [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md).

**Verificação no código:** Valores abaixo confirmados em `merchant-portal/src` (AuthProvider, FlowGate, operationalRestaurant, routes, readers).

---

## 1. Estado verificado

| Item | Fonte (código / doc) | Valor / estado |
|------|----------------------|----------------|
| **restaurant_id oficial** | `operationalRestaurant.ts`, `AuthProvider.tsx`, `RESTAURANTE_OFICIAL_VALIDACAO.md` | `00000000-0000-0000-0000-000000000100` (Sofia Gastrobar). Em Docker considerado operacional (`hasOperationalRestaurant` true para SOFIA_RESTAURANT_ID). |
| **Dono (user_id)** | `AuthProvider.tsx`, `getCoreSession.ts`: `PILOT_USER_UUID` | `00000000-0000-0000-0000-000000000002`. Mock pilot = owner em `gm_restaurant_members` para restaurant 100. |
| **Sessão ativa** | `AuthProvider`: mock user quando `VITE_ALLOW_MOCK_AUTH=true`; `VITE_DEBUG_DIRECT_FLOW=true` ativa AUTO-PILOT e grava `chefiapp_restaurant_id` = SOFIA_RESTAURANT_ID em localStorage. | Uma única sessão “pilot” = dono do 100. Topbar mostra “Sofia Gastrobar” e utilizador ativo. Validado: menu de sessão do Admin identifica DONO; frente Admin/topbar fechada. |
| **Tenant ativo** | `FlowGate.tsx`: usa `SOFIA_RESTAURANT_ID` quando pilot mode + `chefiapp_restaurant_id`; fallback seed 100 em vários readers (TPV, KDS, RuntimeReader). | Com runbook Sofia aplicado (.env.local), o tenant ativo é sempre 100 em todas as superfícies que usam runtime/identity. |
| **Slug do restaurante** | Core / doc validação | `sofia-gastrobar` (Web pública e QR Mesa usam este slug). |
| **Mesas** | Seed `seeds_dev.sql` / gm_tables | Mesas 1–10 para restaurant_id 100. |
| **Catálogo** | Admin escreve em `gm_products`; TPV, AppStaff, Web, QR leem `gm_products` / `gm_menu_categories` (RestaurantReader). | Produtos criados no Admin refletem em TPV, mini TPV/AppStaff, Web, QR Mesa sem publish adicional. |
| **Tarefas** | Fonte canónica `gm_tasks`; AppStaff usa `createTaskRpc`, `readOpenTasks`, `resolveTask` (TaskWriter/TaskReader). | Criação e conclusão no AppStaff refletem em gm_tasks; Admin pode listar tarefas do 100. |
| **Relatórios** | Auditoria Passo 6; ReportsService e páginas usam `restaurantId` do runtime (useRestaurantId / identity). | Sales by period, Operational activity e demais usam restaurant_id do contexto (100 quando sessão Sofia). |

---

## 2. Superfícies e URLs

Base URL: **`http://localhost:5175`** (ou o porto do dev server). Todas as URLs são relativas a esta base.

| # | Superfície | URL exata | Papel na demo |
|---|------------|-----------|----------------|
| 1 | **Admin** | `/admin` ou `/admin/reports/overview` | Dono: topbar, config, relatórios, pessoas. |
| 2 | **TPV central** (apoio dev; oficial = instalável/Electron) | `/op/tpv` | Caixa/dono: vendas por mesa; origem CAIXA. Para validação oficial do TPV ver §8 e §9. |
| 3 | **KDS (Todas / Cozinha / Bar)** | `/op/kds` | Cozinha/bar: pedidos ativos; abas Todas, Cozinha (KITCHEN), Bar (BAR). |
| 4 | **KDS só Cozinha** | `/op/kds?station=KITCHEN` | Segundo ecrã opcional: só itens KITCHEN. |
| 5 | **KDS só Bar** | `/op/kds?station=BAR` | Segundo ecrã opcional: só itens BAR. |
| 6 | **AppStaff web** | `/app/staff/home` | Dono, gerente, funcionários: Launcher → pessoas → Comandeiro / Tarefas. |
| 7 | **AppStaff Android** (emulador) | WebView: `http://10.0.2.2:5175/app/staff/home` | Mesmo AppStaff no emulador; requer no host `VITE_CORE_URL=http://10.0.2.2:3001` (e portal acessível em 10.0.2.2:5175). |
| 8 | **Web pública** | `/public/sofia-gastrobar` | Cliente: menu; pedidos com origem WEB. |
| 9 | **QR Mesa** | `/public/sofia-gastrobar/mesa/<1–10>` (ex.: mesa 1 → `/public/sofia-gastrobar/mesa/1`) | Cliente na mesa; origem QR_MESA. |

**Como abrir em simultâneo:** Admin, TPV, KDS, AppStaff web, Web pública e QR Mesa em abas/janelas do mesmo browser (partilham sessão). Web pública e QR Mesa podem ser abas anónimas se quiser simular cliente sem sessão. AppStaff Android noutro processo (emulador).

---

## 3. Sessão / dono / tenant oficial

| Conceito | Valor / mecanismo |
|----------|-------------------|
| **Sessão oficial** | Mock user (pilot) com `id = 00000000-0000-0000-0000-000000000002`. Ativada com `VITE_ALLOW_MOCK_AUTH=true`. |
| **Dono oficial** | Mesmo UUID; em `gm_restaurant_members`: `user_id = 00000000-0000-0000-0000-000000000002`, `restaurant_id = 100`, `role = owner`. |
| **Tenant ativo** | `restaurant_id = 00000000-0000-0000-0000-000000000100`. Garantido por: (1) `VITE_DEBUG_DIRECT_FLOW=true` → AUTO-PILOT grava `chefiapp_restaurant_id = SOFIA_RESTAURANT_ID`; (2) FlowGate e readers usam esse valor ou fallback seed 100. |
| **Como garantir que o tenant é sempre o Sofia** | (1) Usar `.env.local` com `VITE_ALLOW_MOCK_AUTH=true` e `VITE_DEBUG_DIRECT_FLOW=true`. (2) Abrir primeiro `/admin` ou `/app/staff/home` para estabelecer sessão e tenant. (3) Não limpar `localStorage` (chefiapp_restaurant_id, chefiapp_pilot_mode). (4) Core acessível em 3001 (localhost ou 10.0.2.2 no caso do emulador). |

---

## 4. Sequência operacional da demo

| Fase | Ação | Detalhe |
|------|------|---------|
| **A. Abrir ambiente** | Subir Core (3001) e portal (5175); `.env.local` Sofia; abrir `/admin` e confirmar topbar “Sofia Gastrobar” e sessão ativa. | Ver [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md). Admin/topbar já validado. |
| **B. Abrir superfícies** | Abrir em abas: Admin, `/op/tpv`, `/op/kds`, `/app/staff/home`, `/public/sofia-gastrobar`, `/public/sofia-gastrobar/mesa/1` (ou 2, 3). Opcional: emulador Android com AppStaff. | Manter KDS visível para ver pedidos a aparecer. |
| **C. Criar pedidos por múltiplas origens** | (1) TPV: mesa 1, itens, confirmar → CAIXA. (2) AppStaff: pessoa (ex. Alex) → Comandeiro, mesa 2, itens → SALÃO. (3) Web: `/public/sofia-gastrobar`, carrinho, enviar → WEB. (4) QR Mesa: `/public/sofia-gastrobar/mesa/3`, itens, enviar → QR MESA. (5) Opcional: AppStaff como dono/gerente, mesa 4 → DONO/GERENTE. | Ver §5. |
| **D. Confirmar pedidos no KDS** | Em `/op/kds` ver cada pedido com badge de origem correta (CAIXA, SALÃO, WEB, QR MESA, DONO/GERENTE); abas Cozinha/Bar com itens por estação. | Polling ~5–30 s; refrescar se necessário. |
| **E. Criar e concluir tarefas** | AppStaff → Tarefas: criar 1 tarefa manual, concluir; opcional tarefa “Limpar Mesa” se houver pedido pago. | Reflexo em gm_tasks (RESOLVED) e na lista do AppStaff. |
| **F. Confirmar pagamento** | TPV: fechar venda (mesa 1) como paga. AppStaff: ação “Cobrar”/“Pagar” num pedido (ex. mesa 2), método dinheiro/cartão simulado. | Sem Stripe ativo, “pagamento feito” = estado pago no Core via TPV/AppStaff. |
| **G. Abrir relatórios** | Admin → Relatórios: **Sales by period** (`/admin/reports/sales`), **Operational activity** (`/admin/reports/operations`). Período que inclua o dia da demo; confirmar dados do restaurante 100. | Ver §7. |
| **H. Fechar execução** | Resumir: pedidos por origem no KDS, tarefas concluídas, pagamento(s), relatórios com dados 100. Opcional: registar no “Registo de execução” do checklist Fase 3 §6. | — |

---

## 5. Pedidos multi-origem e KDS

| Origem | Onde criar | Badge esperado no KDS | Incluído neste ciclo? |
|--------|------------|------------------------|------------------------|
| **TPV** | `/op/tpv` | CAIXA | Sim. |
| **Comandeiro/AppStaff** (salão) | `/app/staff/home` → pessoa → Comandeiro | SALÃO (ou APPSTAFF) | Sim. |
| **Web pública** | `/public/sofia-gastrobar` | WEB | Sim. |
| **QR Mesa** | `/public/sofia-gastrobar/mesa/<n>` | QR MESA | Sim. |
| **Dono/gerente no AppStaff** | AppStaff como owner ou gerente → Comandeiro | DONO / GERENTE | Sim (opcional). |
| **Uber Eats / Glovo** | Adapters + RPC delivery-proxy ou OrderIngestionPipeline; origem DELIVERY/UBER/GLOVO. | UBER / GLOVO | **Fora deste ciclo.** Dependem de delivery-proxy e configuração específica; não fazem parte do plano de execução prática atual. Documentado em [SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md](./SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md). |

**KDS:** Um ecrã `/op/kds` com abas **Todas | Cozinha | Bar**. Cozinha = itens `station = KITCHEN`; Bar = `station = BAR`. **Entrega:** não existe vista separada “Entrega” no KDS; na demo usar aba “Todas” ou considerar como próxima fase. Segundo ecrã opcional: `/op/kds?station=KITCHEN` e `/op/kds?station=BAR`.

---

## 6. Tarefas e equipa

| Item | Estado verificado |
|------|-------------------|
| **5 funcionários** | Seed + migração (ex.: 20260416_sofia_five_staff); `gm_restaurant_people` e `gm_staff` com 5 pessoas para restaurant 100. Admin e AppStaff listam as 5. |
| **Dono e gerente operacionais** | Dono = pilot (owner no membership). Gerente: se existir role manager em `gm_restaurant_people`/membership, AppStaff permite entrar como gerente e pedidos com origem GERENTE. |
| **Criação e conclusão de tarefas** | AppStaff usa `createTaskRpc` (gm_tasks); conclusão via `resolveTask` (complete_task). Tipo MODO_INTERNO para tarefas manuais. |
| **Reflexo em gm_tasks** | Tarefas criadas e resolvidas aparecem em `gm_tasks` com status OPEN → RESOLVED. |
| **Reflexo no Admin/AppStaff** | AppStaff lista tarefas abertas (readOpenTasks) e mostra concluídas; Admin pode consumir mesma fonte (gm_tasks) para relatórios/lista. |

---

## 7. Relatórios

| Relatório | Rota Admin | Fonte de restaurant_id | Coerência com Sofia (100) |
|-----------|------------|-------------------------|----------------------------|
| **Sales by period** | `/admin/reports/sales` | Runtime (useRestaurantId / identity) | Sim; dados de gm_orders filtrados por restaurant_id. |
| **Operational activity** | `/admin/reports/operations` | Idem | Sim; eventos/agregados por restaurante. |
| **Demais (overview, daily closing, staff, multiunit, etc.)** | `/admin/reports/overview`, etc. | Idem ou `current_user_restaurants()` (multiunit) | Auditados no Passo 6; coerentes com 100 em contexto single-tenant. Multiunit pode depender de membership real. |

Relatórios usam `restaurantId` do runtime; com sessão Sofia o valor é 100.

---

## 8. Lacunas reais

| Lacuna | Impacto | Próxima fase (não abrir agora) |
|--------|---------|---------------------------------|
| **Vista KDS “Entrega”** | Não existe vista separada; entrega usa aba “Todas” ou filtro futuro. | Adicionar vista/filtro Entrega no KDS se necessário. |
| **AppStaff Android e browser no mesmo host** | Com `VITE_CORE_URL=http://10.0.2.2:3001` o browser no host também usa 10.0.2.2; pode falhar se Core estiver só em localhost. | Rodar demo Android em bloco dedicado ou segundo ambiente; ou usar IP da máquina e rede local. |
| **Uber Eats / Glovo** | Fora do ciclo; dependem de delivery-proxy. | Integração delivery-proxy e adapters em ambiente configurado. |
| **Stripe / pagamento real** | Demo usa “marcar como pago” no TPV/AppStaff; não há cobrança real. | Configuração Stripe e fluxo comercial quando necessário. |
| **Multi-restaurante / refactor / desfragmentação** | Não fazem parte do plano atual. | Próximas fases de produto. |

Nenhuma peça crítica em falta no código para executar o plano: sessão, tenant, URLs, catálogo, tarefas e relatórios estão cobertos. Config mínima: `.env.local` Sofia (runbook ambiente); para Android, trocar temporariamente `VITE_CORE_URL` para `10.0.2.2:3001`.

### Checkpoint TPV oficial — próximo passo único

A **superfície oficial** do TPV para o Sofia é o **TPV instalável/Electron** (controlo de rede, impressora e periféricos). A rota web `http://localhost:5175/op/tpv` é **apenas apoio técnico e de desenvolvimento** (entrega do SPA, verificação de fluxo); **não** constitui validação oficial do TPV.

**Validação do TPV oficial** exige: (1) contexto Sofia — `restaurant_id = 00000000-0000-0000-0000-000000000100`; (2) sessão coerente do dono (herdada ou autenticada no cliente instalável); (3) operação sob contrato de hardware/rede/impressão. Até essa validação no ambiente instalável/Electron, o checkpoint do TPV oficial permanece em aberto. Usar `/op/tpv` na demo ou em dev é permitido para pedidos/origem CAIXA e integração com KDS, mas não fecha o checkpoint da superfície oficial. **Checklist executável:** [SOFIA_TPV_OFICIAL_VALIDACAO_RUNBOOK.md](./SOFIA_TPV_OFICIAL_VALIDACAO_RUNBOOK.md).

---

## 9. Próximo passo único

**Checkpoint da próxima superfície oficial:** Validar o **TPV instalável/Electron** no contexto do Sofia: `restaurant_id = 00000000-0000-0000-0000-000000000100`, sessão coerente do dono, operação sob contrato de hardware/rede/impressão. A rota `/op/tpv` é apenas apoio técnico/dev e **não** substitui essa validação oficial. Seguir o runbook [SOFIA_TPV_OFICIAL_VALIDACAO_RUNBOOK.md](./SOFIA_TPV_OFICIAL_VALIDACAO_RUNBOOK.md) para executar o checklist.

**Executar a demo** (dev/browser) seguindo o [SOFIA_FULL_DAY_DEMO_RUNBOOK.md](./SOFIA_FULL_DAY_DEMO_RUNBOOK.md) e esta sequência (§4): ativar ambiente (A), abrir superfícies (B), criar os 4–5 pedidos por origem (C), confirmar no KDS (D), criar e concluir tarefa (E), fechar pelo menos um pagamento (F), abrir Sales by period e Operational activity (G), fechar execução (H). Opcional: registar no “Registo de execução” do checklist Fase 3 §6 como “OK (demo full day)” com data.

Para **validação rápida** (sem demo completa): usar o [checklist Sofia operacional](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md) §6 e a [rotina](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md).

---

## Referências cruzadas

- **Runbook demo dia inteiro:** [SOFIA_FULL_DAY_DEMO_RUNBOOK.md](./SOFIA_FULL_DAY_DEMO_RUNBOOK.md)
- **Ativar ambiente:** [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md)
- **Checklist e registo:** [SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md) §6
- **Rotina do checklist:** [SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md)
- **Validação oficial:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md)
- **AppStaff Android:** [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md)
- **Origens (Uber/Glovo fora do ciclo):** [SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md](./SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md)
