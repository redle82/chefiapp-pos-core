# P0 Soberano — Smoke flow repetível por superfície

**Data:** 2026-03-10  
**Objetivo:** Transformar a validação P0 num fluxo repetível e endurecido por superfície (Admin, TPV, KDS, AppStaff), com critérios objetivos e evidência verificável.

---

## 1. Estado atual por superfície

| Superfície | Fonte de `restaurant_id` | Evidência objetiva | Critério de sucesso | Smoke check mínimo |
|------------|---------------------------|--------------------|----------------------|--------------------|
| **Admin** | `runtime.restaurant_id` (useRestaurantRuntime / useRestaurantIdentity) | `localStorage.getItem('chefiapp_restaurant_id')` = ID do seed | Topbar mostra nome do restaurante; consola sem 400 em gm_* | Abrir `/admin/config/general` → consola: valor igual ao esperado |
| **TPV** | useTPVRestaurantId(): device > runtime.restaurant_id > seed | Mesmo localStorage (runtime propaga) | TPV carrega com categorias/pedidos do mesmo restaurante | Abrir `/op/tpv` → consola: mesmo valor |
| **KDS** | KDSMinimal: instalado > runtime?.restaurant_id > TabIsolated > default | Mesmo localStorage + runtime | Lista pedidos do mesmo restaurante | Abrir `/op/kds` → consola: mesmo valor |
| **AppStaff** | identity.id \|\| getTabIsolated('chefiapp_restaurant_id') (identity do runtime) | Mesmo localStorage | Launcher no mesmo tenant | Abrir `/app/staff/home` → consola: mesmo valor |

Todas as superfícies consomem o mesmo id após FlowGate selar o tenant (setActiveTenant → localStorage + evento → runtime refresh).

---

## 2. Riscos remanescentes

| Risco | Mitigação |
|-------|------------|
| Device TPV/KDS instalado com outro `restaurant_id` | useTPVRestaurantId / KDS dão prioridade ao device; para smoke sem device, o runtime deve prevalecer. Com device instalado, o pairing deve ser feito para o mesmo restaurante do seed. |
| Bypass em dev (SUPABASE_SKIP_RESTAURANT_API=true) | Primeira carga pode usar seed; após evento tenant-sealed o runtime atualiza. Smoke: validar **após** navegar para uma rota app (FlowGate corre e sela). |
| Schema Supabase (400 em gm_restaurant_members) | Aplicar migrations `disabled_at` e `NOTIFY pgrst, 'reload schema';`; ou usar bypass e confiar no tenant-sealed após login. |
| e2e-creds.json sem restaurant_id (seed antigo) | Correr de novo o seed; o seed passa a gravar `restaurant_id` (e `user_id`) em e2e-creds.json. |

Nenhuma superfície tem código que leia `restaurant_id` de fonte diferente do runtime/storage após as alterações P0; o risco é apenas ambiental (device, schema, bypass).

---

## 3. Implementação executada

1. **Seed**  
   No final do seed, grava em `tests/e2e/e2e-creds.json` o payload completo: `email`, `password`, `name`, `user_id`, `restaurant_id`. Assim o script de smoke e qualquer E2E podem ler o restaurant_id esperado.

2. **Script smoke-sovereign-p0**  
   `merchant-portal/scripts/smoke-sovereign-p0.ts`:
   - Lê `tests/e2e/e2e-creds.json` (ou `E2E_RESTAURANT_ID` / `SOVEREIGN_RESTAURANT_ID` por env).
   - Imprime o restaurant_id esperado, checklist passo a passo e one-liner para colar na consola do browser e verificar se o valor é o esperado.

3. **Runbook operacional**  
   Este documento: tabela por superfície, comandos exatos, evidências e troubleshooting.

4. **Validação automática (P2 + P3 + P4)**  
   Teste Playwright `tests/e2e/core/sovereign-restaurant-id.spec.ts` (projeto `sovereign`):
   - **P2 (tenant):** Em cada superfície compara `localStorage.getItem('chefiapp_restaurant_id')` com o `restaurant_id` do seed.
   - **P3 (funcional):** Em cada superfície verifica evidência funcional mínima (UI carregada no contexto do restaurante), ver §4.1.
   - **P4 (integração visual):** Nome do restaurante no Admin = nome no TPV, ver §4.3.
   - **P4.1 (TPV→KDS):** Criar pedido e ver ticket; **P4.2:** OPEN→IN_PREP; **P4.3:** IN_PREP→READY; **P4.4:** pedido sai da lista (mensagem "todos prontos ou fechados"). Ver §4.3. Requer seed com SERVICE_KEY (cria categoria + produto).
   - **P5 (origens Supabase puro):** **Web → KDS**, **QR Mesa → KDS**; **roteamento (isolado):** E2E Burger → Cozinha, E2E Drink → Bar; **pedido misto:** TPV, Web, QR Mesa e **Garçom/Comandeiro** (P5 Pedido misto Garçom, via `/app/waiter/table/:tableId?mode=trial`). Requer seed com E2E Burger + E2E Drink + mesa 1 + **table_id** em e2e-creds.

**Origens de pedido:** Auditoria em `docs/ops/SOBERANO_ORIGENS_E_SUPERFICIES_AUDITORIA.md`. **Smoke manual e E2E por origem:** `docs/ops/SMOKE_POR_ORIGEM_RUNBOOK.md` — tabela manual vs automatizado; TPV, Web e QR Mesa com E2E; Garçom apenas manual; Uber/Glovo dependem de delivery-proxy.

---

## 4. Validação de tenant (P2), funcional (P3), integração visual (P4) e integração operacional (P4.1)

| Camada | O que prova | Como |
|--------|-------------|------|
| **Tenant (P2)** | O mesmo `restaurant_id` está presente em todas as superfícies (localStorage). | Leitura de `localStorage.getItem('chefiapp_restaurant_id')` após navegação a cada URL; comparação com o valor do seed. |
| **Funcional (P3)** | Cada superfície mostra UI operacional no contexto desse restaurante (config, catálogo, KDS, launcher). | Asserções no mesmo E2E: após verificar o tenant id, espera-se um elemento visível que confirme que a página carregou (cards Admin, conteúdo TPV, heading KDS, tiles AppStaff). |
| **Integração visual (P4)** | Coerência de contexto entre superfícies: o que uma mostra (ex.: nome do restaurante) é o que outra mostra. | No mesmo E2E: em Admin lê-se o texto de `[data-testid="sovereign-restaurant-name"]`; em TPV compara-se com o mesmo testid; espera-se igualdade (normalizada para TEST/Sandbox). |
| **Integração operacional (P4.1)** | Ação no TPV gera reflexo observável no KDS: ticket aparece. | Teste E2E: login → TPV → adicionar produto → Enviar cozinha → KDS → pelo menos um `kds-order-card` visível. |
| **Transição no KDS (P4.2)** | OPEN → IN_PREP com evidência no UI. | No mesmo teste: clicar "Iniciar preparo" (`kds-start-preparation`); card mostra "IN_PREP". |
| **Transição no KDS (P4.3)** | IN_PREP → READY: marcar item pronto. | Clicar "Item pronto" (`kds-item-ready`); pedido com 1 item → READY. |
| **Fechar ciclo no KDS (P4.4)** | Após READY o pedido sai da lista de ativos. | KDS exclui READY/CLOSED de `activeOnly`; assertar mensagem `kds-all-ready-message` visível ("todos prontos ou fechados"). |

O primeiro teste cobre P2, P3 e P4; o segundo (P4.1–P4.4) cobre TPV→KDS e ciclo completo até saída da lista.

### 4.1 Evidências funcionais por superfície (P3)

| Superfície | Evidência funcional automatizada |
|------------|----------------------------------|
| **Admin** | Heading "Identidade do Restaurante" ou "Idioma e localização" visível (config geral carregada). |
| **TPV** | Product card, conteúdo com data-testid/class tpv/pos, ou texto "sem produtos" / "menu vazio" (TPV carregado). |
| **KDS** | Heading "KDS" / "Pedidos ativos" ou texto "sem pedidos" / "cozinha" / "bootstrap" (interface KDS carregada). |
| **AppStaff** | Botão "Operação", "Turno", "TPV", "Cozinha" ou "Equipa", ou texto equivalente (launcher visível). |

Se uma superfície não tiver dados ainda (ex.: KDS sem pedidos), a asserção aceita tanto o conteúdo principal como o estado vazio (ex.: "sem pedidos"), desde que a UI do contexto do restaurante esteja presente. Evidência futura opcional: número de produtos no TPV, número de pedidos no KDS, nome do operador no AppStaff.

### 4.3 Integração entre superfícies (P4 visual, P4.1 operacional)

| Integração | O que valida | Implementação |
|------------|---------------|----------------|
| **Admin → TPV (P4)** | Nome do restaurante visível no Admin (topbar) = nome no TPV (header). | `data-testid="sovereign-restaurant-name"` em RestaurantHeader (Admin) e no span do TPVHeader; no E2E, leitura em Admin e comparação em TPV (normalizada para TEST/Sandbox). |
| **TPV → KDS (P4.1)** | Criar pedido no TPV → ticket visível no KDS (mesmo restaurante). | Seed cria "E2E Burger"; E2E: TPV → produto → Enviar cozinha → KDS → `kds-order-card` visível. |
| **Transição KDS (P4.2)** | OPEN → IN_PREP. | Clicar "Iniciar preparo" (`kds-start-preparation`); card mostra "IN_PREP". |
| **Transição KDS (P4.3)** | IN_PREP → READY. | Clicar "Item pronto" (`kds-item-ready`); pedido com 1 item → READY. |
| **Fechar ciclo (P4.4)** | READY → pedido sai da lista. | KDS não mostra READY/CLOSED em `activeOnly`; mensagem `kds-all-ready-message` ("todos prontos ou fechados") visível. |

**Próximo recorte ideal (opcional):** READY → CLOSED/PAID via TPV (pagamento) e ver pedido fora de `readActiveOrders`; ou Admin → alterar config e ver reflexo noutra superfície.

---

## 4.4 Validação manual vs automatizada

| Tipo | Quando usar | Como |
|------|-------------|------|
| **Manual** | Debug, primeira vez, ou quando o E2E não está disponível (ex.: backend não Supabase). | Seed → dev → login → abrir cada superfície → colar one-liner na consola (ou verificar topbar/nome). |
| **Automatizada** | CI, regressão, ou para validar rapidamente que as quatro superfícies usam o mesmo `restaurant_id` após alterações. | Seed → dev a correr → `npx playwright test sovereign-restaurant-id.spec.ts --project=sovereign`. |

A automação cobre: (1) P2/P3/P4 (tenant, funcional, nome Admin=TPV); (2) P4.1–P4.4: TPV → ticket → OPEN→IN_PREP→READY → pedido sai da lista (mensagem "todos prontos ou fechados"). Qualquer falha de id, UI, nome ou transição faz o respetivo teste falhar.

---

## 5. Como validar cada superfície

### Comandos exatos (ordem)

```bash
# 1. Seed (uma vez; gera e2e-creds.json com restaurant_id)
cd merchant-portal
pnpm tsx scripts/seed-e2e-user.ts
# Guardar o Restaurant ID do output (ou usar e2e-creds.json)

# 2. Smoke checklist (imprime valor esperado + one-liner)
pnpm tsx scripts/smoke-sovereign-p0.ts

# 3. Portal em dev
pnpm --filter merchant-portal run dev
# Abrir http://localhost:5175
```

### Sequência manual (após portal aberto)

1. **Login**  
   Ir a `http://localhost:5175/auth` (ou `/auth/login`).  
   Inserir email e password do seed (ou de `e2e-creds.json`).  
   **Evidência:** Consola mostra `[TenantResolver] 🔒 Tenant Sealed: <restaurant_id> [ACTIVE]`.

2. **Admin**  
   Ir a `http://localhost:5175/admin/config/general` (ou `/admin/modules`).  
   **Evidência:** Topbar com nome do restaurante (ex. "Sovereign Burger Hub").  
   **Smoke:** Na consola: `localStorage.getItem('chefiapp_restaurant_id')` → deve ser o Restaurant ID do seed.

3. **TPV**  
   Ir a `http://localhost:5175/op/tpv`.  
   **Evidência:** Página TPV carrega (produtos/categorias ou estado vazio do mesmo restaurante).  
   **Smoke:** Mesmo one-liner na consola.

4. **KDS**  
   Ir a `http://localhost:5175/op/kds`.  
   **Evidência:** KDS carrega; pedidos (se existirem) do mesmo restaurante.  
   **Smoke:** Mesmo one-liner na consola.

5. **AppStaff**  
   Ir a `http://localhost:5175/app/staff/home`.  
   **Evidência:** Launcher/operador no mesmo tenant.  
   **Smoke:** Mesmo one-liner na consola.

### One-liner de verificação (substituir `<RESTAURANT_ID>` pelo valor do seed)

```js
localStorage.getItem('chefiapp_restaurant_id') === '<RESTAURANT_ID>' ? '✅ OK' : '❌ divergente: ' + localStorage.getItem('chefiapp_restaurant_id')
```

O script `smoke-sovereign-p0.ts` imprime esta linha já preenchida.

### Validação automatizada (E2E)

Pré-requisitos: seed executado (`e2e-creds.json` com `email`, `password`, `restaurant_id`), portal em dev com backend Supabase.

```bash
cd merchant-portal
# Com portal já a correr em http://localhost:5175:
E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/core/sovereign-restaurant-id.spec.ts --project=sovereign
```

O primeiro teste faz login, visita cada superfície, verifica tenant (P2), funcional (P3) e nome Admin=TPV (P4). O segundo teste (P4.1–P4.4) faz login → TPV → pedido → KDS; espera `kds-order-card` (P4.1); "Iniciar preparo" → IN_PREP (P4.2); "Item pronto" → READY (P4.3); asserta mensagem `kds-all-ready-message` visível — pedido saiu da lista (P4.4). Requer seed com "E2E Burger" (1 item). Se faltar `e2e-creds.json` ou `restaurant_id`, os testes são ignorados (skip).

---

## 6. Evidências objetivas por superfície

| Superfície | O que ver | O que executar na consola | Resultado esperado |
|------------|------------|----------------------------|--------------------|
| **Admin** | Topbar: nome do restaurante + operador | `localStorage.getItem('chefiapp_restaurant_id')` | UUID igual ao Restaurant ID do seed |
| **TPV** | TPV carregado (op/tpv) | Idem | Idem |
| **KDS** | KDS carregado (op/kds) | Idem | Idem |
| **AppStaff** | Launcher / staff home | Idem | Idem |

Em todas as superfícies o localStorage é partilhado; após FlowGate selar o tenant, o valor é único. A consola pode ainda mostrar o log `Tenant Sealed: <id>` na primeira rota app após o login.

---

## 7. Troubleshooting

| Sintoma | Ação |
|--------|------|
| `localStorage.getItem('chefiapp_restaurant_id')` é null ou outro UUID | Confirmar que fez login com o user do seed; navegar para uma rota app (ex. /admin/modules) para o FlowGate correr e selar o tenant. |
| 400 em gm_restaurant_members ou gm_restaurants | Aplicar migrations (ex. disabled_at) no Supabase; executar `NOTIFY pgrst, 'reload schema';` no SQL Editor. |
| Smoke script diz "Nenhum restaurant_id disponível" | Correr `pnpm tsx scripts/seed-e2e-user.ts` com SUPABASE_SERVICE_ROLE_KEY; ou definir E2E_RESTAURANT_ID=<uuid>. |
| TPV/KDS mostram outro restaurante | Se houver device instalado, o device pode ter outro restaurant_id; para smoke sem device, limpar localStorage e fazer login de novo (runtime prevalece quando não há device). |
| e2e-creds.json sem restaurant_id | Reexecutar o seed (versão que grava user_id e restaurant_id no final). |

---

## 8. Estado final do P1 (manual) e P2 (automatizado)

- **P1 (manual):** Seed grava `user_id` e `restaurant_id` em `e2e-creds.json`. Script `smoke-sovereign-p0.ts` imprime checklist e one-liner. Runbook com comandos e troubleshooting. Critério único: mesmo `restaurant_id` em todas as superfícies, verificado manualmente com o one-liner.
- **P2 (tenant, automatizado):** Mesmo teste verifica `localStorage.getItem('chefiapp_restaurant_id')` em cada superfície.
- **P3 (funcional, automatizado):** No mesmo teste, evidência funcional mínima por superfície (Admin: cards de config; TPV: produto ou empty state; KDS: heading ou empty state; AppStaff: launcher tiles).
- **P4 (integração visual, automatizado):** Nome do restaurante no Admin = nome no TPV.
- **P4.1 (integração operacional, automatizado):** Criar pedido no TPV → ver pelo menos um ticket no KDS.
- **P4.2 (transição no KDS, automatizado):** Clicar "Iniciar preparo" → card mostra "IN_PREP".
- **P4.3 (transição no KDS):** Clicar "Item pronto" → pedido READY (1 item).
- **P4.4 (fechar ciclo no KDS):** Após READY o pedido sai da lista de ativos; assertar mensagem "todos prontos ou fechados" (`kds-all-ready-message`).

Nenhuma superfície exige validação manual em exclusivo: a automação cobre tenant + funcional + Admin→TPV + TPV→KDS (ticket + OPEN→IN_PREP→READY + saída da lista). O manual continua útil para debug ou quando o E2E não corre.

---

## 9. Referências

- `docs/ops/P0_SOBERANO_VALIDACAO_FIM_A_FIM.md` — Validação P0 e bootstrap.
- `docs/ops/FLUXO_SOBERANO_AUDITORIA_E_ROADMAP.md` — Fontes de restaurant_id e implementação.
- `merchant-portal/scripts/smoke-sovereign-p0.ts` — Script do smoke checklist (manual).
- `merchant-portal/tests/e2e/core/sovereign-restaurant-id.spec.ts` — Validação automática do mesmo restaurant_id (projeto Playwright `sovereign`).
