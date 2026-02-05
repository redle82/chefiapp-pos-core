# Estado Lei → Enforcement → Código (por contrato)

**Propósito:** Tabela de status que fecha o ciclo Lei → Enforcement → Código → Runtime. Referência: [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md).

**Última atualização:** 2026-02-03.

---

## Soberania Financeira (CORE_FINANCIAL_SOVEREIGNTY_CONTRACT)

| Domínio      | Status                    | Enforcement (código)                                                                                                                                                                                                  |
| ------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orders**   | ✅ Enforced (Docker Core) | OrderProjection, CoreOrdersApi, OrderEngine, WebOrderingService, SyncEngine; escrita/leitura via DbWriteGate / getTableClient / Core RPC. Nenhuma escrita em gm_orders ou gm_order_items via Supabase em modo Docker. |
| **Stock**    | ✅ Enforced (Docker Core) | InventoryProjection, AutomatedInventoryService; leituras via getTableClient. Sem `supabase.from("inventory_*")` nem gm_products para domínio em modo Docker.                                                          |
| **Fiscal**   | ✅ Enforced (Docker Core) | FiscalService usa getTableClient para gm_restaurants, gm_orders, gm_order_items, fiscal_event_store.                                                                                                                  |
| **Billing**  | ✅ Enforced (Docker Core) | coreBillingApi Core-only; throw se não Docker.                                                                                                                                                                        |
| **Supabase** | Documentado               | **Auth temporário permitido**, isolado em `core/auth/useSupabaseAuth.ts` e `core/infra/supabaseClient.ts`. Serviços lab/legado: **Bloqueados em Docker / fora do caminho crítico**; shim em `merchant-portal/src/core/supabase/index.ts` impede uso de `supabase.from`/`supabase.rpc` em modo Docker. |

---

## Legenda

- **✅ Enforced:** Regra aplicada no código; domínio financeiro não passa por Supabase em modo Docker.
- **Documentado:** Uso permitido ou explícito (Auth temporário; lab/legado bloqueados pelo shim).

Este documento não reescreve contratos; apenas reflete o estado atual de implementação.
