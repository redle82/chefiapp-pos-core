# Supreme E2E + Stress Simulation — Runbook

**Propósito:** Validar o sistema por evidência: fluxos end-to-end entre terminais com Docker Financial Core como autoridade. Supabase, se presente, é tolerado apenas para auth/sessão durante o piloto; não é autoridade para pedidos/totais/caixa/reconciliação.

**Referências:** [CLOSED_PILOT_CONTRACT.md](../architecture/CLOSED_PILOT_CONTRACT.md), [CORE_FAILURE_MODEL.md](../architecture/CORE_FAILURE_MODEL.md), [CORE_KDS_CONTRACT.md](../architecture/CORE_KDS_CONTRACT.md).

---

## 1. Comando único (local)

```bash
make supreme-e2e
# ou
npm run supreme:e2e
```

Este comando:

1. Executa `make contract-gate` (falha se .md vazios ou links quebrados).
2. Sobe o Docker Core (`docker-core/docker-compose.core.yml`).
3. Espera Postgres e PostgREST saudáveis.
4. Executa o seed determinístico (`scripts/supreme-seed.ts`).
5. (Opcional) Inicia o Merchant Portal em background.
6. Executa a suíte E2E Playwright (Web Pública, TPV, KDS, Command Center, tarefas).
7. Executa testes de carga k6 (ordens + tarefas).
8. Recolhe logs em `./logs/` ou `/tmp/chefiapp-audit-logs`.
9. Imprime resumo **PASS/FAIL** com razões exactas.

---

## 2. Parâmetros do seed

| Parâmetro | Variável | Default | Descrição |
|-----------|----------|---------|-----------|
| Restaurantes | `SUPREME_SEED_RESTAURANTS` | 10 | Número de restaurantes (máx. 1000 em stress). |
| Staff por restaurante | `SUPREME_SEED_STAFF_PER_RESTAURANT` | 9 | Staff total ≈ N × M (máx. 9000 em stress). |
| Pedidos totais | `SUPREME_SEED_ORDERS` | 500 | Pedidos a criar (mín. 5000 para critério de carga). |
| Tarefas totais | `SUPREME_SEED_TASKS` | 200 | Tarefas a criar. |
| Cleanup antes | `SUPREME_SEED_CLEANUP` | true | Limpar dados de teste antes de inserir. |

O script regista os parâmetros e um **seed hash** (hash dos parâmetros + timestamp de execução) em stdout e, se existir, em `docs/audit/SUPREME_LOAD_RESULTS_<date>.md`.

**Exemplo:**

```bash
SUPREME_SEED_RESTAURANTS=100 SUPREME_SEED_ORDERS=5000 npx tsx scripts/supreme-seed.ts
```

---

## 3. Saídas esperadas

- **contract-gate:** Exit 0.
- **Docker Core:** Containers `chefiapp-core-postgres`, `chefiapp-core-postgrest`, `chefiapp-core-realtime` (e nginx) a correr; Postgres healthy.
- **Seed:** Mensagem `Seed complete` com contagens (restaurantes, staff, produtos, mesas, pedidos, tarefas) e seed hash.
- **E2E Playwright:** Todos os specs em `tests/e2e/specs/` passam (ou falha explícita com motivo).
- **Load k6:** Relatório em `docs/audit/SUPREME_LOAD_RESULTS_<date>.md` (ou JSON em `docs/audit/`); sem corrupção de dados (imutabilidade respeitada).
- **Resumo final:** Uma linha `PASS` ou `FAIL` e lista de razões (ex.: "E2E: 2 failed", "Load: 5000 orders OK", "Contract gate: OK").

---

## 4. Estações visuais (opcional)

Para observação humana durante a simulação:

```bash
./scripts/supreme-stations.sh
```

Abre em separadores/janelas:

- Command Center (web)
- TPV (web/PWA)
- KDS (web/PWA)
- Web Pública / QR mesa (web)
- (Opcional) AppStaff: `npx expo run:ios` e `npx expo run:android` ou `expo start` — manual ou via script conforme disponibilidade.

Porta base do portal: `PORT=5175` (ou `VITE_PORT`).

---

## 5. Critérios de aceitação (brutais, mensuráveis)

| Critério | Como validar |
|----------|----------------|
| Pedido criado em qualquer terminal → Core atribui `order_id` canónico | E2E: criar pedido via Web Pública, TPV, AppStaff; verificar resposta/UI com `order_id` do Core. |
| KDS vê o pedido em X segundos | E2E KDS: após criar pedido, verificar que o KDS mostra o pedido (poll ou realtime). |
| Transições de status canónicas (OPEN → IN_PREP → READY) | E2E KDS: simular transições e validar na UI e no Core. |
| Web Pública vê estado correcto | E2E Web Pública: após mudança de status, verificar página de estado do pedido. |
| Dono/Gerente cria tarefa de cozinha → KDS mostra | E2E tarefas: criar tarefa como manager; verificar KDS ou painel de tarefas. |
| Staff só executa, não cria | E2E: tentar criar tarefa como staff; deve falhar ou não existir opção. |
| Core indisponível → UI mostra degradação (não sucesso falso) | E2E falha: simular Core down; validar mensagem/estado de degradação (CORE_FAILURE_MODEL). |
| Falha crítica → dead-letter ou erro explícito | E2E: validar que erros críticos não são silenciados. |
| ≥ 5000 pedidos sem corrupção | Load: k6 cria 5000+ pedidos; assertions de integridade (sem duplicados, totais correctos). |
| contract-gate verde antes e depois | `make contract-gate` no início e no fim do run. |

---

## 6. Logs e relatórios

- **Logs:** `./logs/` (ou `LOG_DIR=/tmp/chefiapp-audit-logs`). Inclui logs do Docker Core e, se configurado, do aplicativo.
- **Relatórios k6:** `docs/audit/SUPREME_LOAD_RESULTS_<YYYY-MM-DD>.md` e, opcionalmente, JSON para análise.
- **Playwright:** `test-results/` e `playwright-report/` (configurável no `playwright.config.ts`).

---

## 7. Ambiente

- **Core:** Postgres em `localhost:54320`, base `chefiapp_core`. PostgREST em `http://localhost:3001` (REST em `/` e `/rest/v1/`). Realtime em `ws://localhost:4000`.
- **Merchant Portal:** `http://localhost:5175` (Vite). Deve apontar para o Core (ex.: `VITE_SUPABASE_URL=http://localhost:3001` ou variável equivalente para PostgREST).
- **Variáveis:** `DATABASE_URL=postgresql://postgres:postgres@localhost:54320/chefiapp_core` para seed e scripts que falem com o banco.

---

## 8. Troubleshooting

| Problema | Acção |
|----------|--------|
| contract-gate falha | Corrigir .md vazios ou links quebrados; garantir que novos .md em docs/architecture e docs/contracts estão indexados. |
| Docker Core não sobe | `cd docker-core && docker compose -f docker-compose.core.yml logs`; verificar portas 54320, 3001, 4000 livres. |
| Seed falha | Verificar `DATABASE_URL` e que as migrações do Core estão aplicadas; executar `docker-core/make validate`. |
| E2E falha (timeout) | Aumentar timeout no Playwright; garantir que o portal está a correr e a apontar para o Core. |
| k6 falha | Verificar que o Core está acessível em `http://localhost:3001`; reduzir VUs ou duração para debug. |

---

*Fim do runbook.*
