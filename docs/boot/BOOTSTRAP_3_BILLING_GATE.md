# Bootstrap 3 — Billing Gate Boot

Ninguém entra no modo operacional sem estar no regime certo. Trial cria plano e estado TRIAL_ACTIVE; entitlements e limites. Saída: **o sistema sabe se pode funcionar ou não**.

---

## Purpose

Garantir que o Billing Gate existe e que o runtime (TPV, KDS, integrações) só é acessível quando o estado de billing é válido (ex.: TRIAL_ACTIVE, plano activo). Billing aqui é **controlo de acesso ao runtime**, não só cobrança.

---

## Inputs

- **Boot 1** — Schema com tabelas de billing (billing_configs, plans, entitlements, ou equivalente).
- **Boot 2** — Tenant e restaurante existem; identidade conhecida.

---

## Outputs

- Estado de billing definido para o tenant/restaurante (ex.: TRIAL_ACTIVE, NO_CHARGE).
- Entitlements claros: o que o trial permite (ex.: 1 loja, N utilizadores, sem integrações pagas).
- Limites (se houver): número de lojas, utilizadores, integrações.
- **Saída semântica:** “o sistema sabe se pode funcionar ou não”.

---

## Invariants

- Nenhum runtime operacional (Boot 5) sem estado de billing válido. Se billing for inválido → utilizador é enviado para Upgrade / Fix Billing (ver [FLOW_LANDING_TRIAL_BILLING_RUNTIME.md](../strategy/FLOW_LANDING_TRIAL_BILLING_RUNTIME.md)).
- TRIAL_ACTIVE é um estado explícito; não é “sem billing”.

---

## Commands

Dependem da implementação actual: seeds em [docker-core/schema/](../../docker-core/schema/) (ex.: billing_configs, migrations de billing), ou configuração via backoffice/API. Em desenvolvimento, um seed que associa o restaurante piloto a TRIAL_ACTIVE é suficiente.

Exemplo conceptual (SQL):

```sql
-- Exemplo: inserir plano trial para o restaurante seed
INSERT INTO billing_configs (restaurant_id, plan, status)
VALUES ('00000000-0000-0000-0000-000000000100', 'TRIAL', 'TRIAL_ACTIVE');
```

(Adaptar aos nomes reais de tabelas/colunas do schema.)

---

## Smoke tests

1. **Tabela de billing existe** — Se o schema tiver billing_configs (ou equivalente), `SELECT * FROM ... LIMIT 1` não falha.
2. **Restaurante seed tem estado de billing** — Para o restaurante piloto, existe uma linha que indica TRIAL_ACTIVE ou equivalente.
3. **UI não entra em TPV/KDS sem billing válido (se implementado)** — Em modo trial, o portal permite acesso ao runtime; se billing for invalidado, o fluxo redirecciona para upgrade/fix (conforme produto).
4. **Entitlements documentados** — Doc ou comentário no código indica o que o trial permite (lojas, users, integrações).
