# FISCAL ENGINE PROOF — Defesa Técnica (25/03/2026)

**Documento:** Defesa técnica e de conformidade operacional do motor fiscal/offline/sync do ChefIApp POS.
**Data-base:** 2026-02-23
**Escopo:** criação de orders, pagamentos, emissão fiscal, sincronização offline, integridade auditável.
**Ambiente de prova:** Docker Core + Postgres real (não simulado).

---

## 1. Objetivo e tese de defesa

Este documento demonstra, com evidência executável, que o sistema:

1. evita duplicação financeira por retry;
2. mantém invariantes de imutabilidade fiscal;
3. preserva cadeia de integridade (hash chain);
4. mantém consistência sob operação offline/sync;
5. oferece rastreabilidade técnica para auditoria e defesa comercial.

---

## 2. Arquitetura de garantias

### 2.1 Idempotência de criação de order

- Backend: `create_order_atomic` com `p_idempotency_key`.
- Frontend/sync: `SyncEngine` gera chave estável por item de fila e encaminha ao Core via `CoreOrdersApi`.
- Resultado esperado: retries não criam ordem duplicada.

### 2.2 Idempotência de pagamento

- RPC de pagamento usa chave idempotente para deduplicação.
- Resultado esperado: segunda chamada com a mesma chave não duplica pagamento.

### 2.3 Motor fiscal imutável

- `gm_fiscal_documents` protegido por gatilhos de mutação.
- Emissão fiscal com RPC idempotente por ordem/chave.
- Resultado esperado: sem alteração indevida após emissão.

### 2.4 Integridade criptográfica

- Hash chain em `event_store` com cálculo automático.
- Verificação de integridade por função de auditoria.
- Resultado esperado: mutação/tampering bloqueada ou detectada.

### 2.5 Offline/sync safety

- Queue local IndexedDB → SyncEngine → Core.
- Conflito por versão (`gm_orders.version`) e política de resolução.
- PrintQueue dependente de existência da order no Core.

---

## 3. Evidência de execução

### 3.0 Gate operacional oficial e stress

Execuções adicionais realizadas em 2026-02-23:

```bash
pnpm run audit:release:portal
bash scripts/flows/validate-critical-flow-full.sh
bash scripts/truth-stress.sh
```

Resultados observados (último snapshot 2026-02-23):

- `audit:release:portal`: **PASS** (exit 0; `83 files; 431 pass, 2 skip` na suíte `merchant-portal` + validação de leis em PASS).
- `validate-system-laws.sh`: **PASS** (`✅ SISTEMA CONFORME COM AS LEIS`, incluindo `External ID retry implementado`).
- `validate-critical-flow-full`: **PASS** (`7 passed, 0 failed`, com SKIP esperado em etapas sem tabela order no fluxo MVP).
- `truth-stress`: **FAIL** (última execução conhecida com exit code 1; `380 failed`, `80 passed`, `40 skipped`; timeouts Playwright em `page.textContent('h1')` nas rotas Entry/Payments/Publish e locks truth/banner/gating/health).

### 3.1 Prova fiscal/offline automatizada

Comando:

```bash
bash scripts/flows/proof_fiscal_offline.sh
```

Resultado observado (2026-02-23):

- `proof_fiscal_offline.sh`: **26 passed | 0 failed | 0 skipped**
- `run-fiscal-sync-rehearsal.sh`: **35 passed | 0 failed | 0 skipped**

Cobertura da prova:

- inventário de triggers fiscais/event store;
- bloqueio de UPDATE/DELETE em estruturas imutáveis;
- hash chain e integridade;
- idempotência de order/payment/fiscal;
- validação de invariantes de conflito/versionamento.

### 3.2 Testes críticos de aplicação

Execuções confirmadas:

```bash
pnpm --filter merchant-portal exec vitest run src/core/sync/SyncEngine.test.ts src/pages/TPV/components/PaymentModal.test.tsx src/core/print/PrintQueueProcessor.test.ts
pnpm --filter merchant-portal exec vitest run src/core/infra/CoreOrdersApi.integration.test.ts
```

Resultados observados:

- suíte focada: **28/28** testes aprovados;
- integração CoreOrdersApi: **7/7** aprovados.

---

## 4. Garantias formais derivadas da evidência

1. **No Duplicate Order by Retry**
   Se a chave idempotente se mantém, retries de criação retornam ordem existente sem inserir duplicata.

2. **No Duplicate Payment by Retry**
   Repetição da mesma transação idempotente não gera segunda linha de pagamento.

3. **Fiscal Immutability After Emission**
   Tentativas de UPDATE/DELETE em documento fiscal são bloqueadas por regra de banco.

4. **Audit Chain Integrity**
   Eventos mantêm ligação criptográfica sequencial; adulteração é bloqueada/inválida.

5. **Offline Safety with Eventual Consistency**
   Escritas offline são enfileiradas e reconciliadas sem duplicação no backend.

---

## 5. Limites e risco residual (honesto)

Riscos remanescentes não são de modelagem fiscal do código, mas operacionais:

- impressão física (hardware/driver/spool);
- rede local do restaurante;
- disciplina operacional no dia da abertura;
- treinamento da equipe para cenários de fallback.

Mitigação: checklist de abertura e runbooks operacionais em `docs/ops`.

---

## 6. Matriz de rastreabilidade (prova → artefato)

| Garantia             | Evidência executável                                | Artefato                                                                                         |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Idempotência order   | `proof_fiscal_offline.sh` (step order idempotency)  | `docker-core/schema/migrations/20260223_add_idempotency_to_create_order_atomic.sql`              |
| Idempotência payment | `proof_fiscal_offline.sh` (payment idempotency)     | `process_order_payment` (Core RPC)                                                               |
| Imutabilidade fiscal | `proof_fiscal_offline.sh` (fiscal mutation blocked) | triggers em `gm_fiscal_documents`                                                                |
| Hash chain           | `proof_fiscal_offline.sh` (event_store chain)       | trigger/hash verification functions                                                              |
| Offline dedup        | testes SyncEngine + integração API                  | `merchant-portal/src/core/sync/SyncEngine.ts`, `merchant-portal/src/core/infra/CoreOrdersApi.ts` |
| Print safety         | testes PrintQueueProcessor                          | `merchant-portal/src/core/print/PrintQueueProcessor.ts`                                          |
| Version conflict     | prova e lógica de resolver                          | `docker-core/schema/migrations/20260325_gm_orders_version.sql`                                   |

---

## 7. Critério de aceitação para 25/03

Para aceite formal de abertura:

1. `pnpm run audit:release:portal` em PASS;
2. stress operacional definido em PASS;
3. `proof_fiscal_offline.sh` em PASS sem regressão;
4. checklist final de abertura aprovado e assinado.

**Status atual do critério (2026-02-23):**

- Item 1: **atendido** (gate oficial em PASS).
- Item 2: **não atendido** (última execução de stress truth em FAIL).
- Item 3: **atendido** (`proof_fiscal_offline` PASS).
- Item 4: **pendente** (aguarda fechamento dos bloqueantes acima).

Nota técnica importante: apesar do **truth-stress** seguir em FAIL neste snapshot, as provas fiscais, de idempotência, de imutabilidade e de integridade de cadeia de eventos encontram-se 100% em PASS, sem regressão detectada.

---

## 8. Conclusão técnica

Com as evidências executadas até esta data, o sistema apresenta propriedades de robustez fiscal e transacional acima do padrão comum de POS SMB:

- idempotência ponta-a-ponta;
- imutabilidade fiscal efetiva;
- trilha de auditoria verificável;
- operação offline com reconciliação segura.

Recomendação técnica: **NO-GO para abertura formal com critério de stress obrigatório**, apesar de o núcleo fiscal/offline estar comprovadamente robusto e do gate oficial estar em PASS.

Condição para retorno a GO:

1. manter `audit:release:portal` em PASS (já atingido no snapshot atual);
2. estabilizar suite `truth-stress` (timeouts Playwright e readiness de páginas) e comprovar novo PASS.
