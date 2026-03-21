# coreBillingApi — Plano Checkout (createCheckoutSession)

**Objetivo:** Cobrir 55–75 branches em `createCheckoutSession` com 12–14 testes organizados por árvore (Gateway vs Core).

**Contexto:** Checkout é a zona mais sensível de billing. Duas árvores independentes: Gateway Path e Core Path.

---

## Árvore de decisão (resumo)

| Condição raiz | Resultado |
|---------------|-----------|
| `apiBase && CONFIG.INTERNAL_API_TOKEN` | → Gateway Path |
| else | → Core Path (requireCore + REST RPC) |

**Não usa `getBackendType()`** para escolher gateway vs core — só CONFIG.API_BASE e INTERNAL_API_TOKEN.

---

## BLOCO A — Gateway Path (7–8 testes)

### A1 — Seleção de URL (isLocalGateway)
- `apiBase === "http://localhost:4320"` ou `127.0.0.1:4320` → `gatewayUrl = /${path}` (relativa)
- outro host → `gatewayUrl = ${apiBase}/${path}`

**Teste A1:** Table-driven: localhost:4320 vs https://api.example.com — assert fetch recebe URL correta.

### A2 — Edge vs Internal path (CONFIG.isEdgeGateway)
- `isEdgeGateway = true` → path `billing-create-checkout-session`
- `false` → path `internal/billing/create-checkout-session`

**Teste A2:** Dois cenários: isEdgeGateway true e false — assert path no fetch.

### A3 — Fetch catch matrix
| # | Tipo | Condição | Error retornado |
|---|------|----------|-----------------|
| 1 | TypeError "Failed to fetch" | isNetworkError true | mensagem dev:gateway |
| 2 | Error("Custom") | isNetworkError false, instanceof Error | "Custom" |
| 3 | throw "string" | não Error | "Erro de ligação ao servidor de checkout." |

**Teste A3:** Três asserts — fetch mock rejeita com cada tipo.

### A4 — !res.ok (gateway)
- JSON com `{ message }` → errorMessage = j.message
- JSON inválido (catch) → mantém errorMessage = text
- text vazio → errorMessage = `Checkout: ${res.status}`

**Teste A4a:** res.ok false, body `{ "message": "Stripe error" }` → error inclui "Stripe error"
**Teste A4b:** res.ok false, body "not json" → error inclui status ou "not json"

### A5 — JSON parse inválido (response body)
- res.ok true
- body não é JSON válido
→ `"Resposta inválida do gateway."`

**Teste A5:** res.ok true, text "{" (truncado) → error = "Resposta inválida do gateway."

### A6 — data sem url
- JSON válido `{}` ou `{ session_id: "x" }` sem `url`
→ `"O gateway não devolveu o URL de checkout."`

**Teste A6:** res.ok true, body `{}` → error = "O gateway não devolveu o URL de checkout."

### A7 — Success gateway
- `{ url: "https://checkout.stripe.com/...", session_id: "cs_xxx" }`
→ `{ url, sessionId }`

**Teste A7:** success → assert url e sessionId presentes, error ausente.

---

## BLOCO B — Core Path (5–6 testes)

**Pré-condição:** `CONFIG.API_BASE` vazio ou `INTERNAL_API_TOKEN` vazio → Core path.

### B1 — requireCore falha
- `getBackendType() !== BackendType.docker`
→ throw "Billing requires Core (Docker)"

**Teste B1:** getBackendType = none → expect throw.

### B2 — 404 especial (PGRST202)
- res.status 404
- JSON `{ code: "PGRST202" }` ou `{ message: "...create_checkout_session..." }`
→ errorMessage = mensagem de migração

**Teste B2:** 404 + PGRST202 → error inclui "migração" ou "MIGRATIONS.md"

### B3 — 404 outro erro
- res.status 404
- JSON sem code PGRST202 nem message com create_checkout_session
→ errorMessage normal (text ou genérico)

**Teste B3:** 404 + body `{ error: "not found" }` → error não inclui migração.

### B4 — JSON inválido
- res.ok true
- body não JSON válido
→ `"Invalid JSON from Core"`

**Teste B4:** res.ok true, text "x" → error = "Invalid JSON from Core"

### B5 — !data.url
- res.ok true
- JSON `{}` ou sem `url`
→ `"Core did not return checkout URL"`

**Teste B5:** success response body `{}` → error = "Core did not return checkout URL"

### B6 — Success Core
- res.ok true
- JSON `{ url: "https://...", session_id?: "cs_xxx" }`
→ `{ url, sessionId }`

**Teste B6:** success → assert url presente.

---

## Setup técnico

### CONFIG mutável (getter pattern)

```ts
const configState = vi.hoisted(() => ({
  API_BASE: "",
  INTERNAL_API_TOKEN: "",
  isEdgeGateway: false,
}));

vi.mock("../../config", () => ({
  CONFIG: {
    CORE_URL: "http://localhost:3001/rest/v1",
    CORE_ANON_KEY: "test-anon-key",
    get API_BASE() { return configState.API_BASE; },
    get INTERNAL_API_TOKEN() { return configState.INTERNAL_API_TOKEN; },
    get isEdgeGateway() { return configState.isEdgeGateway; },
  },
}));
```

- **Gateway tests:** `configState.API_BASE = "http://localhost:4320"`, `configState.INTERNAL_API_TOKEN = "token"`
- **Core tests:** `configState.API_BASE = ""`, `configState.INTERNAL_API_TOKEN = ""`

### Estrutura do ficheiro

```ts
describe("createCheckoutSession", () => {
  describe("Gateway path", () => {
    beforeEach(() => {
      configState.API_BASE = "http://localhost:4320";
      configState.INTERNAL_API_TOKEN = "token";
      configState.isEdgeGateway = false;
    });
    // A1–A7
  });

  describe("Core path", () => {
    beforeEach(() => {
      configState.API_BASE = "";
      configState.INTERNAL_API_TOKEN = "";
    });
    // B1–B6
  });
});
```

### Mocks adicionais
- `vi.mock("../infra/backendAdapter")` — getBackendType (só relevante no Core path)
- `globalThis.fetch` — stub em cada teste

---

## Ordem de execução recomendada

1. B1 (requireCore) — valida Core path entry
2. B2, B3, B4, B5, B6 — Core path completo
3. A1, A2 — Gateway entry + path
4. A3 (fetch catch) — 3 branches
5. A4, A5, A6, A7 — Gateway response handling

---

## Expectativa de branches

| Bloco | Estimativa |
|-------|------------|
| Gateway (A1–A7) | 35–45 |
| Core (B1–B6) | 20–30 |
| **Total** | **55–75** |

**Projeção global:** 46.65% → ~47.4% – 48.2%
