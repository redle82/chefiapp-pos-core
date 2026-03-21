# coreBillingApi — Plano de Testes (ROI Coverage)

**Objetivo:** Cobrir 60–100 branches em `core/billing/coreBillingApi.ts` com 8–12 testes agrupados por cluster lógico.

**Contexto:** 170 uncovered, 187 total. Meta: +0.6pp a +1pp global.

---

## Dependências confirmadas

| Dependência | Uso |
|-------------|-----|
| **backendAdapter** | `getBackendType` → `requireCore()` lança se ≠ docker |
| **invokeRpc** | Não usa |
| **fetch** | Raw `fetch` em todas as chamadas REST/RPC |
| **getDockerCoreFetchClient** | Só em `getSubscription()` (merchant_subscriptions) |
| **CONFIG** | CORE_URL, CORE_ANON_KEY, API_BASE, INTERNAL_API_TOKEN, isEdgeGateway |
| **localStorage** | Pilot mock em `getRestaurantStatus` (`chefiapp_pilot_mock_restaurant`) |
| **window** | `typeof window !== "undefined"` antes do pilot mock |
| **billingStateMachine** | ACTIVE_STATES, ALL_BILLING_STATES, BILLING_STATES, isBillingState |

**Estratégia de mock:**
- `vi.mock("../infra/backendAdapter")` — `getBackendType` retorna docker por default
- `vi.mock("../../config")` — CONFIG estático
- `vi.mock("../infra/dockerCoreFetchClient")` — só para testes que chamam `getSubscription`
- `globalThis.fetch` — stub em cada teste
- `vi.stubGlobal("window", ...)` e `localStorage.getItem` para pilot mock

---

## Clusters lógicos e branches alvo

### Cluster 1 — requireCore (L39–45)
- **Branches:** `getBackendType() !== BackendType.docker` → throw
- **Teste:** Chamar qualquer função que use `requireCore()` com `getBackendType` → `none`; esperar `throw`.

### Cluster 2 — getRestaurantBillingCurrency (L90–115)
- **Branches:** `res.ok` false → "EUR"; `row` null → "EUR"; `currency` válido; `country` fallback; `catch` → "EUR"
- **Teste 2a:** `res.ok = false` → retorna "EUR"
- **Teste 2b:** `data = []` → retorna "EUR"
- **Teste 2c:** `row.currency = "USD"` → retorna "USD"
- **Teste 2d:** `row.country = "BR"` (sem currency) → retorna "BRL"
- **Teste 2e:** `res.json()` throws → retorna "EUR"

### Cluster 3 — getBillingStatus / getBillingStatusWithTrial (L133–173)
- **Já coberto parcialmente** por `coreBillingApi.trial.test.ts` (trial_expired, getBillingStatus past_due)
- **Branches restantes:** `res.ok` false → null; `row` null; `!isBillingState(status)`; `status !== trialState` ou `trial_ends_at == null` ou `now <= trial_ends_at`
- **Teste 3a:** `res.ok = false` → null
- **Teste 3b:** `data = []` → null
- **Teste 3c:** `billing_status` inválido → null
- **Teste 3d:** getBillingStatus com `withTrial = null` → null

### Cluster 4 — getRestaurantStatus (L197–263)
- **Branches:** pilot mock (window, localStorage, JSON parse, id match); fetch path; `res.ok` false; Content-Type non-JSON; `!row`; `validStatus` true/false; catch
- **Teste 4a:** Pilot mock válido, `id === restaurantId` → retorna row do localStorage
- **Teste 4b:** Pilot mock inválido (outro id) → segue para fetch
- **Teste 4c:** `res.ok = false` → null
- **Teste 4d:** Content-Type sem `application/json` e body não vazio → null
- **Teste 4e:** `data = []` → null
- **Teste 4f:** `billing_status` inválido → `billing_status: null`
- **Teste 4g:** catch (JSON.parse fail) → null

### Cluster 5 — getBillingConfig / setBillingConfig (L281–327)
- **getBillingConfig:** `res.ok` false + status 404/406 → null; status outro → throw
- **setBillingConfig:** `res.ok` false + status 409 → `{ error: null }`; outro → `{ error: "..." }`
- **Teste 5a:** getBillingConfig 404 → null
- **Teste 5b:** getBillingConfig 500 → throw
- **Teste 5c:** setBillingConfig 409 → `{ error: null }`
- **Teste 5d:** setBillingConfig 400 → `{ error: "400 ..." }`

### Cluster 6 — getSubscription (L355–369)
- **Branches:** `getDockerCoreFetchClient`, `error` → null; `data` vazio → null
- **Teste 6a:** `error` presente → null
- **Teste 6b:** `data = []` → null
- **Teste 6c:** `data` com row → retorna row

### Cluster 7 — getBillingPlanPrice / getBillingPlans / getBillingInvoices (L401–383)
- **Branches:** `res.ok` false; `catch`; array vazio vs preenchido
- **Teste 7a:** getBillingPlanPrice `res.ok = false` → null
- **Teste 7b:** getBillingPlans `res.ok = false` → []
- **Teste 7c:** getBillingInvoices `catch` → []

### Cluster 8 — resolveStripePriceId (L327–335)
- **Função pura.** 3 ramos: `planPriceRow?.stripe_price_id`; `plan.stripe_price_id`; `plan.tier`
- **Teste 8a:** planPriceRow com stripe_price_id → retorna esse
- **Teste 8b:** plan.stripe_price_id (sem planPriceRow) → retorna esse
- **Teste 8c:** fallback plan.tier

### Cluster 9 — createSaasPortalSession (L387–417)
- **Branches:** `res.ok` false; `text` JSON parse fail; `!data?.url`
- **Teste 9a:** `res.ok = false` → `{ url: "", error: "..." }`
- **Teste 9b:** JSON inválido → `{ url: "", error: "Invalid JSON from Core" }`
- **Teste 9c:** `data` sem url → `{ url: "", error: "Core did not return portal URL" }`
- **Teste 9d:** success → `{ url: "https://..." }`

### Cluster 10 — createCheckoutSession (L425–498)
- **Gateway path:** apiBase+token; isLocalGateway; isEdgeGateway; fetch catch (TypeError, message); res.ok false; JSON error message; invalid JSON; !data.url
- **Core path:** requireCore; res.ok false; 404 + PGRST202 special; invalid JSON; !data.url
- **Teste 10a:** Gateway path — apiBase+token definidos, fetch ok → url + sessionId
- **Teste 10b:** Gateway path — fetch throws TypeError "Failed to fetch" → error sobre dev:gateway
- **Teste 10c:** Gateway path — res.ok false, JSON com message → errorMessage = j.message
- **Teste 10d:** Core path — apiBase ausente, requireCore, fetch ok → url
- **Teste 10e:** Core path — res.status 404, PGRST202 → mensagem migração

### Cluster 11 — ensureStripeCustomerForRestaurant (L505–555)
- **Branches:** !apiBase ou !token → ok: false; isLocalGateway; isEdgeGateway; res.ok false; JSON parse error; catch (Error vs other)
- **Teste 11a:** apiBase ausente → `{ ok: false, error: "API_BASE/INTERNAL_API_TOKEN..." }`
- **Teste 11b:** res.ok false → `{ ok: false, error: message }`
- **Teste 11c:** JSON inválido → `{ ok: false, error: "Invalid JSON..." }`
- **Teste 11d:** fetch throws Error → `error: e.message`
- **Teste 11e:** fetch throws não-Error → `error: "Network error..."`

---

## Plano de 12 testes (ordem de execução)

| # | Teste | Cluster | Função(ões) | Est. branches |
|---|-------|---------|-------------|---------------|
| 1 | requireCore lança quando backend !== docker | 1 | qualquer | ~2 |
| 2 | getRestaurantBillingCurrency — res.ok false, empty, currency, country, catch | 2 | getRestaurantBillingCurrency | ~8 |
| 3 | getBillingStatusWithTrial — res.ok false, null row, invalid status | 3 | getBillingStatusWithTrial, getBillingStatus | ~6 |
| 4 | getRestaurantStatus — pilot mock válido + fetch paths | 4 | getRestaurantStatus | ~12 |
| 5 | getBillingConfig 404/406 vs 500 | 5 | getBillingConfig | ~4 |
| 6 | setBillingConfig 409 vs 400 | 5 | setBillingConfig | ~4 |
| 7 | getSubscription — error, empty, success | 6 | getSubscription | ~4 |
| 8 | resolveStripePriceId — 3 ramos | 8 | resolveStripePriceId | ~3 |
| 9 | getBillingPlanPrice / getBillingPlans / getBillingInvoices — ok false, catch | 7 | 3 funções | ~6 |
| 10 | createSaasPortalSession — fail, invalid JSON, no url, success | 9 | createSaasPortalSession | ~8 |
| 11 | createCheckoutSession — gateway path + Core path | 10 | createCheckoutSession | ~25 |
| 12 | ensureStripeCustomerForRestaurant — config, res, JSON, fetch | 11 | ensureStripeCustomerForRestaurant | ~12 |

**Total estimado:** 60–95 branches.

---

## Setup de testes (comum)

```ts
vi.mock("../../config", () => ({
  CONFIG: {
    CORE_URL: "http://localhost:3001/rest/v1",
    CORE_ANON_KEY: "test-anon-key",
    API_BASE: "",
    INTERNAL_API_TOKEN: "",
    get isEdgeGateway() { return false; },
  },
}));

vi.mock("../infra/backendAdapter", () => ({
  getBackendType: vi.fn(),
  BackendType: { docker: "docker", none: "none" },
}));

vi.mock("../infra/dockerCoreFetchClient", () => ({
  getDockerCoreFetchClient: vi.fn(),
}));
```

Para testes com gateway: `CONFIG.API_BASE = "http://localhost:4320"`, `CONFIG.INTERNAL_API_TOKEN = "token"`.

Para pilot mock: `vi.stubGlobal("window", {}); (globalThis as any).localStorage = { getItem: vi.fn() };`

---

## Prioridade

1. **Alta:** Clusters 1–4 (requireCore, currency, billing status, restaurant status)
2. **Média:** Clusters 5–8 (config, subscription, plans, resolveStripePriceId)
3. **Alta:** Clusters 9–11 (portal, checkout, ensure customer) — muitos branches em checkout

Recomendação: executar testes 1–6 primeiro, medir delta, depois 7–12.
