# AUDITORIA DE REPRESENTAÇÃO FORTE (Forensic Audit)

**Date:** 2026-01-14
**Auditor:** Antigravity (Representation Forensics Mode)
**Target:** ChefIApp POS Core
**Verdict:** **[ BLOCK ]**

---

## 1. EXECUTIVE SUMMARY

A auditoria forense identificou uma falha crítica de integridade (**P0**) na camada de banco de dados, onde **Triggers de Imutabilidade** falham silenciosamente devido a inconsistências de Casing (Maiúscula/Minúscula). Isso permite que ordens finalizadas (`DELIVERED`/`CANCELED`) sejam alteradas, violando o princípio de "Terminal State" do sistema.

**Representation Score:** 65/100

- **P0 Findings:** 1 (Trigger Bypass)
- **P1 Findings:** 2 (Status Casing Inconsistency, Redundant RLS)
- **P2 Findings:** 1 (Unreachable Columns)

---

## 2. CRITICAL FINDINGS (P0/P1)

### [P0] TRIGGER BYPASS (Terminal State Mutation)

**Location:** Triggers da tabela `gm_orders`.
**Evidência:**

```sql
prevent_terminal_order_mutation_trigger ... 
WHEN (old.status = ANY (ARRAY['delivered'::text, 'canceled'::text])) -- LOWERCASE
```

**Realidade do Schema:**
`gm_orders.status` é do tipo `TEXT` com default `'OPEN'` (Uppercase).
RPCs e Indexes usam UPPERCASE (`'PENDING'`, `'OPEN'`, `'PAID'`).
**Impacto:**
Se uma ordem atinge o status `'DELIVERED'` (Upper), o trigger **NÃO DISPARA**, permitindo que qualquer usuário com permissão de escrita modifique o pedido (adicionar items, mudar status) mesmo após a entrega. Isso quebra a garantia fiscal e operacional.

### [P1] STATUS CASING CHAOS

**Evidência:**

- **DB Enum (`public.order_status`):** `{pending, preparing, delivered...}` (Lower)
- **DB Table (`gm_orders.status`):** `TEXT` (Upper default)
- **DB Indexes:** `... WHERE status = 'OPEN'` (Upper)
- **Triggers:** `... WHEN status = 'delivered'` (Lower)
- **RPC (`create_order_atomic`):** Insere `'PENDING'` (Upper)
**Impacto:**
Queries que buscam `'open'` (Lower) falharão em usar os índices parciais (que filtram `'OPEN'`). Funções que assumem um padrão podem falhar silenciosamente.

---

## 3. INVENTÁRIO & MATRIX

### 3.1 Backend & RPC vs Frontend

| Capability | Backend/RPC | DB Support | Frontend UI | Gate/Auth | Status |
|---|---|---|---|---|---|
| **Create Order** | `create_order_atomic` | `gm_orders` | `TPV` / `useOrder` | ✅ RLS + Check Interno | **PASS** |
| **Pay Order** | `process_order_payment` | `gm_payments` | `TPV` Payment Modal | ✅ RLS + Check Interno | **PASS** |
| **Delivery Ingest** | `webhook_handler` | `integration_orders` | N/A (Backend) | ✅ Service Role | **PASS** |
| **OAuth Flow** | `GlovoOAuth` | N/A | `ConnectorSettings` | ⚠️ **BLOCKED** (Browser Secret) | **P1** |
| **Fiscal Emit** | `InvoiceXpressServer` | `fiscal_event_store` | `TPV` (Auto) | ✅ Internal | **PASS** |
| **Order Lock** | Trigger Logic | `status`='LOCKED' | N/A | ❌ Trigger Bypass | **FAIL** |

### 3.2 Gaps de Representação

**DB_ONLY (Phantom Power):**

- Columns: `gm_orders.origin`, `gm_orders.version` (usado internamente, ok).
- Tables: `integration_orders` (Buffer puro, visível via query mas sem UI dedicada de gestão de falhas).

**FRONTEND_ONLY (Lies):**

- `ConnectorSettings` -> Tenta autenticar Glovo via Client Credentials no browser (Bloqueado por patch recente).

---

## 4. SECURITY PROOF (RPCs)

**`create_order_atomic`**

- **Receives:** `p_restaurant_id`
- **Membership Check:**

```sql
IF NOT EXISTS (
    SELECT 1 FROM public.gm_restaurants WHERE id = p_restaurant_id AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM public.gm_restaurant_members WHERE restaurant_id = p_restaurant_id AND user_id = auth.uid()
) THEN RAISE EXCEPTION ...
```

- **Result:** **SECURE (Fail-closed)**

**`process_order_payment`**

- **Receives:** `p_restaurant_id`
- **Membership Check:**

```sql
IF NOT EXISTS ( ... same check ... )
```

- **Result:** **SECURE (Fail-closed)**

---

## 5. DELIVERY & DEDUPLICATION

**Tabela:** `integration_orders`

- **Constraint:** `UNIQUE(external_id, source)`
- **Policy:** Service Role Full, Owners View.
- **Verdict:** **SECURE** contra duplicidade de ingestão.

**Tabela:** `gm_webhook_events`

- **Constraint:** `UNIQUE(provider, event_id)`
- **Verdict:** **SECURE** contra replay attacks de webhook.

---

## 6. RECOMMENDATIONS

### Immediate Fixes (Blocking Soft Launch)

1. **Uniformizar Casing para UPPERCASE:**
    - Alterar triggers para checar `ANY (ARRAY['DELIVERED', 'CANCELED', 'CLOSED'])`.
    - Alterar trigger `prevent_terminal_order_mutation` e `prevent_update_closed_orders`.
    - Garantir que `gm_orders.status` só receba Uppercase.

2. **Backup Enum:**
    - Se o tipo Enum `public.order_status` não é usado na coluna (é `TEXT`), considerar removê-lo ou atualizá-lo para evitar confusão futura.

### Future Improvements

- Criar UI para `integration_orders` (Dead Letter Queue de delivery).

---

**FINAL VERDICT:** O sistema é seguro estruturalmente (RPCs, RLS), mas **frágil logicamente** devido ao Trigger Casing. Um patch simples resolverá o bloqueio.
