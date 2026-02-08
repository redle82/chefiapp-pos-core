# Rate Limiting e Validação de Entrada — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [THREAT_MODEL.md](./THREAT_MODEL.md) · [THREAT_MODEL_MITIGATION_MATRIX.md](./THREAT_MODEL_MITIGATION_MATRIX.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md)  
**Propósito:** Registo dos controles de rate limiting e validação de entrada (E2 Onda 3). Onde estão implementados, dono e gaps.

---

## 1. Rate limiting

### 1.1 Onde está implementado

| Camada | Local | Limite (exemplo) | Dono | Estado |
|--------|--------|-------------------|------|--------|
| **Docker Core (API)** | `_legacy_isolation/server/web-module-api-server.ts` + `middleware/security.ts` | 500 req/min por IP (api), 10 (auth), 100 (webhook), 1000 (global) | Engenharia | ✅ |
| **Cliente (Merchant Portal)** | `merchant-portal/src/core/services/OrderProtection.ts` | Rate limit por restaurante (tab-isolated) antes de submeter pedido | Engenharia | ✅ |
| **Supabase (Postgres RPC)** | — | Não há rate limit à escala de Postgres; RLS + auth limitam abuso por tenant | — | 🟡 |

### 1.2 Comportamento

- **Core:** Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`; resposta 429 quando excedido.
- **Cliente:** Evita spam de pedidos no mesmo restaurante; não substitui rate limit no servidor.
- **Supabase:** Chamadas diretas ao Postgres (RPC) passam por Auth; rate limit adicional pode ser aplicado via Edge Functions ou proxy (futuro).

### 1.3 Gaps e próximos passos

- Definir SLO e alertas para taxa de 429 (Onda 3 G2/G3).
- Se houver APIs públicas expostas via Edge Functions, aplicar rate limit por IP ou por API key nessa camada.

---

## 2. Validação de entrada (input validation)

### 2.1 Onde está implementado (E2 Onda 3)

| RPC / ponto de entrada | Validação | Migração | Estado |
|------------------------|-----------|----------|--------|
| **create_order_atomic** | `p_items`: array não nulo, 1–500 elementos; por item: `product_id` (UUID), `name` 1–500 chars, `quantity` 1–9999, `unit_price` ≥ 0; `p_payment_method` ∈ {cash, card, other, split} | `20260201130000_e2_input_validation_rpcs.sql` | ✅ |
| **process_order_payment** | `p_amount_cents` > 0; `p_method` ∈ {cash, card, other, split} | `20260201130000_e2_input_validation_rpcs.sql` | ✅ |

### 2.2 Princípios

- Rejeitar entradas inválidas **antes** da autorização e da lógica de negócio (fail-fast).
- Mensagens de erro genéricas para o cliente (evitar leak de estrutura); detalhe em logs internos se necessário.
- Queries parametrizadas e sem concatenação de SQL com input do utilizador (já garantido pelo uso de RPC e Supabase client).

### 2.3 Gaps e próximos passos

- Estender validação a outros RPCs sensíveis (ex.: export, DSR, start_turn) conforme prioridade.
- Alinhar OWASP_ASVS_CHECKLIST (5.1.x) e marcar itens como ✅ onde aplicável.

---

## 3. Registo no Threat Model

- **THREAT_MODEL.md** §4/5: Rate limiting e validação de entrada são mitigações para DDoS/abuso (§3.4) e integridade/injeção (§3.3).
- **THREAT_MODEL_MITIGATION_MATRIX.md**: Atualizar estado "Rate limiting" e "Validação entrada" conforme este documento.

---

**Referências:** [THREAT_MODEL.md](./THREAT_MODEL.md) · [THREAT_MODEL_MITIGATION_MATRIX.md](./THREAT_MODEL_MITIGATION_MATRIX.md) · [OWASP_ASVS_CHECKLIST.md](./OWASP_ASVS_CHECKLIST.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md).
