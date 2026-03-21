# coreBillingApi — Mapeamento 32 Branches Restantes

**Objetivo:** Fechar coreBillingApi a ~100% (0 ou ≤5 residual).

**Total uncovered:** 30 (coverage varia 30–32 entre runs).

---

## Mapa por linha e função

| Linha | Tipo | Função | Descrição | Risco |
|-------|------|--------|-----------|-------|
| L27 | if | REST (load) | base.endsWith("/rest") vs base.endsWith("/rest/v1") vs default | Baixo |
| L111 | if | getRestaurantBillingCurrency | country fallback quando currency inválido | Baixo |
| L205 | if | getRestaurantStatus | typeof window !== "undefined" | Médio |
| L242 | binary-expr | getRestaurantStatus | text.trim() && !ct.includes("application/json") | Baixo |
| L247 | cond-expr | getRestaurantStatus | text ? JSON.parse(text) : [] | Baixo |
| L291 | if | getBillingConfig | res.status === 404 \|\| 406 | Baixo |
| L296 | cond-expr | getBillingConfig | Array.isArray(data) && data.length > 0 | Baixo |
| L324 | if | setBillingConfig | res.ok && res.status !== 409 | Já coberto |
| L418 | if | getBillingPlanPrice | res.ok → null | Baixo |
| L421 | cond-expr | getBillingPlanPrice | catch | Baixo |
| L455 | if | getBillingPlans | res.ok → [] | Baixo |
| L458 | cond-expr | getBillingPlans | Array.isArray ? data : [] | Baixo |
| L492 | if | getBillingInvoices | res.ok → [] | Baixo |
| L495 | cond-expr | getBillingInvoices | Array.isArray ? data : [] | Baixo |
| L520 | binary-expr | createSaasPortalSession | text ? JSON.parse : {} | Baixo |
| L525 | cond-expr | createSaasPortalSession | !data?.url | Já coberto |
| L573 | binary-expr | createCheckoutSession | e.message.includes("fetch") | Médio |
| L586 | binary-expr | createCheckoutSession | text \|\| fallback | Baixo |
| L589 | if | createCheckoutSession | j?.message | Baixo |
| L597 | cond-expr | createCheckoutSession | text ? JSON.parse : {} | Baixo |
| L622 | binary-expr | createCheckoutSession | res.status === 404 | Já coberto |
| L627 | binary-expr | createCheckoutSession | j?.message.includes(...) | Baixo |
| L641 | cond-expr | createCheckoutSession | text ? JSON.parse : {} | Baixo |
| L668 | binary-expr | ensureStripeCustomer | !apiBase \|\| !token | Já coberto |
| L669 | binary-expr | ensureStripeCustomer | isEdgeGateway path | Baixo |
| L672 | binary-expr | ensureStripeCustomer | 127.0.0.1:4320 | Baixo |
| L686 | binary-expr | ensureStripeCustomer | text \|\| fallback | Baixo |
| L689 | if | ensureStripeCustomer | json?.message | Baixo |
| L698 | cond-expr | ensureStripeCustomer | text ? JSON.parse : {} | Baixo |
| L711 | cond-expr | ensureStripeCustomer | error instanceof Error | Baixo |

---

## Clusters prioritizados

### Cluster 1 — REST URL (L27)
- **Cenário:** CONFIG.CORE_URL com `/rest` (sem v1) ou sem `/rest` — IIFE executa no load.
- **Teste:** vi.doMock CONFIG com CORE_URL variantes, vi.resetModules, import.
- **Risco:** Mock de CONFIG no load é sensível; pode exigir ficheiro de teste dedicado.

### Cluster 2 — getRestaurantBillingCurrency (L111)
- **Cenário:** row.currency presente mas não em BILLING_CURRENCIES, row.country em COUNTRY_CURRENCY.
- **Teste:** Mock fetch com [{ currency: "XXX", country: "BR" }] → "BRL".

### Cluster 3 — getRestaurantStatus (L205, 242, 247)
- **L205:** window undefined → não entrar no pilot (Node default).
- **L242:** text vazio → não retornar null por Content-Type.
- **L247:** text "" → data = [].
- **Testes:** Sem stub window; text ""; data [].

### Cluster 4 — getBillingConfig (L291, 296)
- **L291:** status 405 (outro) → throw.
- **L296:** data = [] → null.
- **Testes:** 405 throw; data [] → null.

### Cluster 5 — getBillingPlanPrice, getBillingPlans, getBillingInvoices (L418, 455, 492 + cond-expr)
- res.ok false, catch, Array.isArray false.
- **Testes:** Já temos res.ok false; adicionar catch (res.json throws) e data não-array.

### Cluster 6 — createSaasPortalSession (L520)
- text "" → data = {}.
- **Teste:** res.ok true, text "".

### Cluster 7 — createCheckoutSession (L573, 586, 589, 597, 627, 641)
- L573: TypeError com message.includes("fetch") mas não "Failed to fetch".
- L586: text "" em res.ok false.
- L589: j sem message.
- L597/L641: text "".
- L627: j.message inclui "create_checkout_session" mas code !== "PGRST202".

### Cluster 8 — ensureStripeCustomer (L669, 672, 686, 689, 698, 711)
- isEdgeGateway true, 127.0.0.1:4320, text "" fallback, json?.message, text "" parse, fetch throw non-Error.

---

## Mini-plano de 8 testes

| # | Teste | Função(ões) | Linhas |
|---|-------|-------------|--------|
| 1 | getRestaurantBillingCurrency: currency inválido, country fallback | getRestaurantBillingCurrency | L111 |
| 2 | getRestaurantStatus: text vazio, data = [] | getRestaurantStatus | L242, 247 |
| 3 | getBillingConfig: status 405 throw, data [] null | getBillingConfig | L291, 296 |
| 4 | getBillingPlanPrice: res.json throws | getBillingPlanPrice | L421 |
| 5 | getBillingPlans/getBillingInvoices: data não-array | getBillingPlans, getBillingInvoices | L458, 495 |
| 6 | createSaasPortalSession: text "" | createSaasPortalSession | L520 |
| 7 | createCheckoutSession: TypeError message includes "fetch"; text ""; j.message create_checkout_session | createCheckoutSession | L573, 586, 589, 627 |
| 8 | ensureStripeCustomer: isEdgeGateway, 127.0.0.1, text "", json.message, fetch throw string | ensureStripeCustomer | L669, 672, 686, 689, 698, 711 |

---

## REST L27 — Nota

REST é IIFE no load do módulo. Para cobrir base.endsWith("/rest") e o default, é preciso:
- vi.doMock("../../config", () => ({ CONFIG: { CORE_URL: "http://localhost:3001/rest", ... } }));
- vi.resetModules();
- import coreBillingApi (REST será recalculado).

Alternativa: aceitar 1–2 branches residuais (REST) como custo de manutenção vs. complexidade de mock no load.
