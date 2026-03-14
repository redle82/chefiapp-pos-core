# Como executar `audit:billing-core`

**Objetivo:** Validar coerência entre `gm_restaurants.billing_status` e `merchant_subscriptions.status` na BD do Core.  
**Script:** `scripts/audit-billing-core.ts`  
**Comando:** `npm run audit:billing-core` (na raiz do repo).

---

## 1. Pré-requisitos

- A instância de PostgreSQL deve ter:
  - Tabela `public.gm_restaurants` com coluna `billing_status`.
  - Tabela `public.merchant_subscriptions` (migrações de billing aplicadas).

Se `merchant_subscriptions` não existir, o script termina com **exit 0** e imprime um aviso: a auditoria completa exige Core com migrações de billing (ex.: stack docker-core).

---

## 2. Executar contra a BD real (dev / staging / prod)

Defina `DATABASE_URL` e execute na raiz:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
npm run audit:billing-core
```

Exemplo para Core local (**docker-core** — Postgres na porta **54320**, DB `chefiapp_core`):

```bash
# Garantir que o stack está no ar: docker compose -f docker-core/docker-compose.core.yml up -d
export DATABASE_URL="postgresql://postgres:postgres@localhost:54320/chefiapp_core"
npm run audit:billing-core
```

Alternativa usando variáveis separadas (o script monta a URL se `DATABASE_URL` não estiver definida):

```bash
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export DB_HOST=localhost
export DB_PORT=5432
export POSTGRES_DB=postgres
npm run audit:billing-core
```

---

## 3. Interpretar o resultado

| Exit code | Significado |
|-----------|-------------|
| **0** | Nenhum DRIFT nem BAD_VALUE; ou tabela `merchant_subscriptions` ausente (auditoria skipped). |
| **1** | DRIFT ou valor inválido detectado; ou erro de conexão; ou `gm_restaurants.billing_status` ausente. |

No output:

- **OK** — restaurante com `billing_status` coerente com `merchant_subscriptions.status`.
- **NO_SUBSCRIPTION** — restaurante sem linha em `merchant_subscriptions` (esperado se ainda não tiver subscrição).
- **DRIFT** — `billing_status` não bate com o estado esperado a partir de `subscription_status`.
- **BAD_VALUE** — valor inválido em `billing_status` ou `merchant_subscriptions.status`.

Correção: ajustar dados no Core ou rever a lógica dos webhooks/RPCs que atualizam `billing_status` e `merchant_subscriptions`.

---

## 4. Integração em pipeline (CI)

O gate está ligado em `.github/workflows/ci.yml` (job `validate`): corre apenas quando o secret **`CORE_BILLING_AUDIT_DATABASE_URL`** está definido; sem secret o step é ignorado. Com secret, exit ≠ 0 falha o job. Detalhe em `docs/roadmap/WORKSPACES_ALIGNMENT.md` §5.

Para correr em CI contra uma BD de staging/prod:

1. Configurar secrets (ex.: `DATABASE_URL`) no pipeline.
2. Executar `npm run audit:billing-core` após deploy ou em schedule.
3. Falhar o job se exit code ≠ 0 (exceto se a política for “skip se merchant_subscriptions não existir”, já que nesse caso o script sai com 0).

---

**CI (C4.3):** O gate está em `.github/workflows/ci.yml` (job `validate`). Corre só quando o secret `CORE_BILLING_AUDIT_DATABASE_URL` está definido; sem secret o step é ignorado. Com secret, exit ≠ 0 falha o job. Reprodução local: `export DATABASE_URL="..."; npm run audit:billing-core`. Ver §5 em `docs/roadmap/WORKSPACES_ALIGNMENT.md`.

---

*Doc operacional — Fase 2 (endurecimento Core). C4.3: gate em pipeline documentado.*
