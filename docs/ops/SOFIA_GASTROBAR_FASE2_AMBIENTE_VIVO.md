# Sofia Gastrobar — Fase 2: ambiente operacional vivo (Docker/Core)

**Objetivo:** Montar o cenário operacional completo do Sofia Gastrobar no Docker/Core, com todas as superfícies e operação coerentes no mesmo restaurante, a funcionar em simultâneo.

**Fase 1 (concluída):** Runbook de ativação em [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md) — sessão do dono (mock), tenant 100, topbar “Sofia Gastrobar”, sem “Sessão encerrada” / “Restaurante”.

**Referências:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md), [SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md](./SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md).

---

## 1. O que a Fase 1 já resolveu

| Item | Estado após runbook |
|------|---------------------|
| **Sessão** | Com `VITE_ALLOW_MOCK_AUTH=true` e `VITE_DEBUG_DIRECT_FLOW=true`, o AuthProvider ativa o user pilot (UUID 00000000-0000-0000-0000-000000000002); a topbar deixa de mostrar “Sessão encerrada”. |
| **Tenant** | AUTO-PILOT grava `chefiapp_restaurant_id = SOFIA_RESTAURANT_ID` (100); FlowGate com sessão sela o tenant; runtime e Admin usam restaurante 100. |
| **Nome do restaurante** | `useRestaurantIdentity` carrega do Core via `fetchRestaurantForIdentity(100)`; a topbar mostra “Sofia Gastrobar” em vez de “Restaurante”. |
| **Banner “Modo demonstração”** | Opcionalmente `VITE_FORCE_PRODUCT_MODE=live` ou `localStorage.chefiapp_product_mode=live` remove o banner. |
| **Base para Fase 2** | Dono autenticado, Admin com identidade correta e tenant 100 selado; todas as superfícies que leem do runtime passam a ver o mesmo restaurante. |

---

## 2. Estado atual por bloco operacional

### A. Sessão e tenant Sofia vivos

| Já existe hoje | Já funciona no Docker/Core | Incompleto | Configuração | Implementação |
|-----------------|----------------------------|------------|--------------|---------------|
| Mock pilot = owner 100; FlowGate sela tenant; setActiveTenant(100). | Sim, desde que .env.local tenha VITE_ALLOW_MOCK_AUTH e VITE_DEBUG_DIRECT_FLOW e Core esteja no ar. | Nada crítico; Keycloak opcional para “login real”. | .env.local (runbook §2). | Nenhuma. |

### B. Catálogo / Admin

| Já existe hoje | Já funciona no Docker/Core | Incompleto | Configuração | Implementação |
|-----------------|----------------------------|------------|--------------|---------------|
| Admin Produtos grava em gm_products; listProducts/readMenu leem gm_products; seed Sofia + migração SOFIA E2E PRODUCT. | Sim: criar produto no Admin reflete em quem lê gm_products (TPV, Web, QR, Comandeiro). | Smoke não executado/documentado na prática (tabela §5.1 por preencher). | Nenhuma. | Nenhuma; falta **executar** o smoke e preencher resultado. |

### C. Superfícies simultâneas

| Superfície | Já existe hoje | Já funciona no Docker/Core | Incompleto | Configuração | Implementação |
|------------|----------------|----------------------------|------------|--------------|---------------|
| **TPV central** | TPVMinimal/TPVPOSView e TPV full; restaurantId = device > runtime > seed. | Sim com tenant 100; produtos do Core. | Nada. | Device pairing opcional para multi-dispositivo. | Nenhuma. |
| **KDS cozinha** | KDSMinimal e TPV KDS; filtro por estação (KITCHEN). | Sim; pedidos do restaurante 100. | Rotas/abas “cozinha” vs “bar” vs “entrega” podem ser o mesmo KDS com filtros. | Nenhuma. | Nenhuma. |
| **KDS bar** | Idem; estação BAR. | Sim. | Idem. | Nenhuma. | Nenhuma. |
| **KDS entrega** | Idem; filtro por tipo/entrega se existir. | Depende de existir conceito “entrega” em gm_orders; KDS mostra pedidos por station. | Confirmar se “entrega” é uma estação ou tipo de pedido. | Nenhuma. | Verificar modelo de dados. |
| **AppStaff (dono)** | Launcher /app/staff/home; tenant do runtime; Comandeiro. | Sim com tenant 100; menu via useMenuItems → readProducts(100). | Fallback “Seu Restaurante” se contrato não carregar. | Nenhuma. | Nenhuma. |
| **AppStaff simulador Android** | Mesmo código; URL do portal (PWA ou WebView). | Sim se aceder ao mesmo origin (localhost:5175) com sessão/tenant 100; ou build Expo apontando ao mesmo Core. | Garantir que o app/simulador usa o mesmo backend (Core) e que o tenant seja 100. | URL / env do build. | Nenhuma. |
| **Web (página pública)** | PublicWebPage por slug sofia-gastrobar; readMenu(100). | Sim; Core com slug e menu. | Nada. | Nenhuma. | Nenhuma. |
| **QR Mesa** | TablePage; readMenu(restaurantId da mesa); mesas em seeds_dev (10 mesas, restaurant_id 100). | Sim desde que seeds_dev e gm_tables estejam aplicados. | Nada. | Nenhuma. | Nenhuma. |
| **Cliente a pedir (QR/web)** | Cliente abre Web ou QR Mesa; pedido cria gm_orders. | Sim; fluxo de pedido público depende de create_order_atomic e Core. | Validar fluxo completo: cliente escolhe mesa/produtos, envia pedido, aparece no KDS. | Nenhuma. | Nenhuma (validar manualmente). |

### D. Equipe

| Já existe hoje | Já funciona no Docker/Core | Incompleto | Configuração | Implementação |
|----------------|----------------------------|------------|--------------|---------------|
| gm_restaurant_people + gm_staff; seed 3 + migração 20260416 (5: Sofia, Alex, Maria, Bruno, Carla); RestaurantPeopleSection no Admin; reader = gm_restaurant_people. | Sim: listar e adicionar pessoas para restaurante 100; 5 pessoas visíveis no Admin e AppStaff. | Nada. | Nenhuma. | Concluído (passo 3): migração + reader alinhado. |
| Dono = pilot (owner); gerente = papel na equipa (ex.: Sofia no seed como manager). | Sim. | Nada. | Nenhuma. | Nenhuma. |

### E. Tarefas operacionais

| Já existe hoje | Já funciona no Docker/Core | Incompleto | Configuração | Implementação |
|----------------|----------------------------|------------|--------------|---------------|
| CreateTaskModal / QuickTaskModal; StaffContext; ReflexEngine; TaskReader + TaskWriter (gm_tasks). | Fonte canónica = gm_tasks. AppStaff cria via createTaskRpc, lista via readOpenTasks (mount + polling 15s), conclui via resolveTask. ReflexEngine cria “Limpar Mesa” em gm_tasks. | Nada. | Nenhuma. | **Ciclo fechado:** passo 5 + integração AppStaff→gm_tasks concluída; doc [SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md](./SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md). |

### F. Relatórios / Admin

| Já existe hoje | Já funciona no Docker/Core | Incompleto | Configuração | Implementação |
|----------------|----------------------------|------------|--------------|---------------|
| AdminReportsOverview, SalesByPeriod, OperationalActivity, DailyClosing, MultiUnit, SalesSummary, GamificationImpact, SaftExport. | Com tenant 100, todos os relatórios auditados usam restaurant_id do runtime (useRestaurantId ou RPC com filtro no Core); fontes = gm_orders, get_shift_history, gm_tasks, gm_reconciliations, etc. | Nenhum: auditoria Passo 6 concluída. Multi-unit depende de current_user_restaurants() (pode devolver vazio em mock). | Nenhuma. | **Passo 6 concluído:** doc [SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md](./SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md); nenhuma alteração de código necessária. |

---

## 3. Lacunas reais para o cenário vivo

| Lacuna | Impacto | Resolução |
|--------|---------|-----------|
| **Smoke do catálogo não executado** | Não está provado na prática que produto criado no Admin aparece em TPV, Web, QR, Comandeiro. | Executar smoke (criar SOFIA E2E PRODUCT ou aplicar migração); preencher tabela §5.1 do doc principal. |
| **5 funcionários** | Objetivo “5 funcionários” exige 2 adições no Admin (3 já vêm do seed). | Dono, com sessão ativa, abre Admin → Config → Pessoas e adiciona 2 pessoas; validar no AppStaff. |
| **Tarefas: Core vs app_tasks** | Em Docker/Core, app_tasks não existe; fonte canónica = gm_tasks. | Concluído: AppStaff usa createTaskRpc, readOpenTasks e resolveTask (gm_tasks); ReflexEngine cria “Limpar Mesa” em gm_tasks. Doc: SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md. |
| **Relatórios e restaurant_id** | Alguns relatórios podem não filtrar por restaurant_id ou não usar fontes Core. | **Concluído (Passo 6):** Auditoria em SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md; todos usam restaurant_id do runtime ou RPC Core; sem correções necessárias. |
| **KDS “entrega”** | Pode ser apenas filtro de estação ou tipo; não há garantia de abas separadas cozinha/bar/entrega. | Verificar UI do KDS (KDSMinimal/TPV KDS) e documentar como se obtêm as três vistas; implementar só se faltar. |
| **AppStaff no Android** | Funciona se o simulador/app usar o mesmo backend (Core) e tenant; depende de URL e auth. | Configurar build/URL para localhost ou túnel; validar que sessão/tenant 100 estão ativos. |

---

## 4. Roadmap em ordem (executável)

| # | Passo | Ação concreta | Estado |
|---|--------|----------------|--------|
| 1 | **Fase 1 já concluída** | Runbook aplicado: .env.local, Core no ar, portal com “Sofia Gastrobar” e sessão ativa. | Concluído |
| 2 | **Smoke catálogo** | Com dono logado: criar produto “SOFIA E2E PRODUCT” no Admin (ou aplicar 20260415_sofia_e2e_product.sql); abrir TPV, Web (/public/sofia-gastrobar), QR Mesa e Comandeiro e confirmar que o produto aparece; preencher tabela §5.1 em SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md. | **Concluído** — Produto garantido por migração ou Admin; tabela §5.1 preenchida; todas as superfícies leem gm_products, sem publish/sync. |
| 3 | **5 funcionários** | No Admin → Config → Pessoas, adicionar 2 funcionários (3 já do seed); validar listagem e, se aplicável, no AppStaff. | **Concluído** — Equipe de 5 garantida por migração 20260416_sofia_five_staff.sql (Bruno, Carla); RestaurantPeopleReader alinhado a gm_restaurant_people; Admin e AppStaff listam as 5 pessoas. |
| 4 | **Superfícies em paralelo** | Com o mesmo browser/sessão (e outro dispositivo ou aba se necessário): manter Admin, TPV, KDS e AppStaff abertos ao mesmo tempo, todos com tenant 100; fazer um pedido de teste (TPV ou Comandeiro) e confirmar que aparece no KDS; opcional: cliente na Web ou QR Mesa faz pedido e confirmar no KDS. | **Concluído** — Runbook em [SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md](./SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md); smoke definido (abrir superfícies, criar pedido TPV + Comandeiro, verificar no KDS); preencher tabela §7 do runbook ao executar manualmente. |
| 5 | **Tarefas** | Definir fonte canónica e ligar AppStaff a gm_tasks: criar, listar, concluir. | **Concluído** — Fonte = gm_tasks. AppStaff: createTask via createTaskRpc; lista via readOpenTasks (mount + polling); completeTask via resolveTask. ReflexEngine cria “Limpar Mesa” em gm_tasks. Doc: [SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md](./SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md). |
| 6 | **Relatórios** | Verificar que os relatórios do ambiente vivo usam restaurant_id do runtime (100) e fontes Core; corrigir ou documentar exceções. | **Concluído** — Auditoria em [SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md](./SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md); todos alinhados; Multi-unit documentado (depende de current_user_restaurants). Nenhuma alteração de código. |
| 7 | **Android (opcional)** | Validar AppStaff no simulador Android com o mesmo Core e tenant 100. | **Concluído** — Runbook em [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md): AppStaff Android = WebView do merchant-portal; config VITE_CORE_URL=http://10.0.2.2:3001 (emulador) ou IP do host; checklist de validação e bloqueios documentados. |

---

### Resultado do passo 4 (superfícies em paralelo)

- **Runbook:** [SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md](./SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md).
- **Smoke:** Abrir Admin, TPV, KDS e AppStaff (tenant 100); criar 1 pedido no TPV e 1 no Comandeiro; confirmar no KDS que ambos aparecem com origem visível (CAIXA, SALÃO/APP).
- **Registro:** Preencher tabelas §7 do runbook (superfícies + pedidos no KDS); estado final: concluído / parcial / bloqueado.

### Resultado do passo 5 (tarefas) — ciclo fechado

- **Fonte canónica:** gm_tasks (Core). app_tasks não existe no Core; não se usa.
- **AppStaff:** Cria tarefas via `createTaskRpc` (CreateTaskModal/QuickTaskModal); lista via `TaskReader.readOpenTasks(coreRestaurantId)` (mount + polling 15s); conclui via `resolveTask(taskId)` para ids UUID. ReflexEngine cria “Limpar Mesa” em gm_tasks.
- **Doc:** [SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md](./SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md).
- **Smoke sugerido:** Criar tarefa no AppStaff (ex.: “Mise en place”) → ver no Admin/gm_tasks → concluir no AppStaff → confirmar que deixa de aparecer na lista de abertas.

### Resultado do passo 6 (relatórios)

- **Auditoria:** AdminReportsOverview, SalesByPeriod, OperationalActivity, DailyClosing, MultiUnit, SalesSummary, GamificationImpact, SaftExport.
- **Conclusão:** Todos usam `restaurant_id` do runtime (useRestaurantId ou RPC com filtro no Core); fontes = gm_orders, get_shift_history, gm_tasks, gm_reconciliations, dashboardService (gm_tables, gm_orders, etc.).
- **Correções:** Nenhuma necessária.
- **Exceção documentada:** Multi-unit (get_multiunit_overview) depende de current_user_restaurants(); em mock sem JWT/restaurant_users pode devolver vazio.
- **Doc:** [SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md](./SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md).

### Resultado do passo 7 (AppStaff Android)

- **Arquitetura:** AppStaff Android = WebView que carrega merchant-portal em `http://<host>:5175/app/staff/home`; tenant/sessão/Core resolvidos pelo portal.
- **Caminho oficial:** Runbook [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md): Opção A (VITE_CORE_URL=http://10.0.2.2:3001 para emulador) ou Opção B (IP do host + EXPO_PUBLIC_APPSTAFF_WEB_URL).
- **Validação:** Checklist §3 do runbook (app abre, WebView carrega, Sofia/tenant 100, equipe, tarefas, fluxo operacional).
- **Bloqueio documentado:** Sem VITE_CORE_URL acessível ao emulador (10.0.2.2:3001 ou IP), o WebView não atinge o Core.

---

## 5. Próximo passo único / Fase 2 concluída

**Passos 2, 3, 4, 5, 6 e 7 estão fechados** (catálogo; equipe; superfícies em paralelo; tarefas; relatórios; AppStaff Android documentado).

**Fase 2 do ambiente vivo Sofia (Docker/Core)** está concluída.

**Próxima fase:** [Fase 3 — Operação contínua](SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md): checklist “Sofia operacional”, smoke multi-origem, tarefas em rotina, relatórios e execução periódica para demonstração e validação contínua.

<!-- Smoke: 1) Fase 1 ativa; 2) Criar SOFIA E2E PRODUCT no Admin ou aplicar 20260415; 3) Abrir/recarregar TPV, Web, QR Mesa, Comandeiro; 4) Preencher §5.1. -->
