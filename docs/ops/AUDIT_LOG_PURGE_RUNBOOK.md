# Runbook: Purge de gm_audit_logs (conforme RETENTION_POLICY)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [RETENTION_POLICY.md](../architecture/RETENTION_POLICY.md) · [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md)  
**Propósito:** Processo autorizado de purge de registos de auditoria além do período de retenção. F3 Onda 3.

---

## 1. Política de retenção

| Categoria | Retenção (referência) | Nota |
|-----------|------------------------|------|
| **Logs de auditoria (gm_audit_logs)** | Mínimo 2 anos (eventos de segurança); até 7 anos (eventos financeiros) conforme jurisdição | Confirmar prazos com jurídico/DPO |

- **Purge:** Apenas o Core (processo autorizado) executa purge; nenhum terminal ou UI pode purgar.
- **Imutabilidade:** Registos não podem ser alterados; DELETE apenas via job autorizado conforme este runbook.

---

## 2. Quando executar

- **Agendado:** Recomendado job periódico (ex.: mensal ou trimestral) que apaga registos com `created_at` anterior ao corte definido pela política (ex.: `now() - interval '2 years'`).
- **Manual:** Quando exigido por operações ou conformidade (ex.: após confirmação jurídica de fim de retenção).

---

## 3. Como executar

### 3.1 Via RPC (recomendado)

O RPC `purge_audit_logs_older_than(p_cutoff timestamptz)` remove todos os registos em `gm_audit_logs` com `created_at < p_cutoff`.

**Requisitos:**

- Chamada com **service_role** (chave de serviço Supabase). `anon` e `authenticated` não têm permissão.
- `p_cutoff` deve ser **pelo menos 1 ano atrás** (proteção contra purge acidental de dados recentes).

**Exemplo (Supabase SQL ou cliente com service_role):**

```sql
-- Purge registos com mais de 2 anos (ajustar conforme política)
SELECT purge_audit_logs_older_than(now() - interval '2 years');
-- Retorna o número de linhas apagadas.
```

**Exemplo (Node/TS com @supabase/supabase-js e SUPABASE_SERVICE_ROLE_KEY):**

```ts
const { data, error } = await supabase.rpc('purge_audit_logs_older_than', {
  p_cutoff: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
});
// data = número de linhas apagadas
```

### 3.2 Agendamento (pg_cron ou externo)

- **Supabase:** Se disponível pg_cron, agendar chamada ao RPC com o corte definido (ex.: 2 anos).
- **Externo:** Cron job (GitHub Actions, worker, etc.) que chama a API Supabase com service_role e invoca o RPC com o mesmo critério.

---

## 4. Verificação antes/depois

- **Antes:** Consultar volume com `SELECT count(*), min(created_at), max(created_at) FROM gm_audit_logs;`.
- **Depois:** Confirmar que o número apagado é o esperado e que não restam registos com `created_at < p_cutoff`.

---

## 5. Responsável e aprovação

- **Quem:** Ops ou processo automatizado com credenciais service_role.
- **Aprovação:** Purge manual deve ser aprovado conforme política interna; purge agendado deve usar corte alinhado a [RETENTION_POLICY.md](../architecture/RETENTION_POLICY.md).

---

## 6. Referências

- [RETENTION_POLICY.md](../architecture/RETENTION_POLICY.md) — Política de retenção
- [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](../architecture/CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) — Contrato Core
- [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) — Especificação do audit log
- Migração: `supabase/migrations/20260228150000_f3_audit_log_purge_policy.sql`
