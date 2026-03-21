# dockerCoreFetchClient — Matriz Branch → Teste

**Objetivo:** Maximizar ROI de testes. Cada teste mapeado para branches concretos.

**Contexto:** 76 branches não cobertos. Meta: +25–40 branches com 12 testes.

---

## BLOCO 1 — HTTP Error Handling

| # | Teste | Branches activados | Linhas |
|---|-------|--------------------|--------|
| 1 | 404 + JSON body com code 42P01 → markTableUnavailable | `!res.ok`, `JSON.parse` ok, `err.code === "42P01"`, `markTableUnavailable` | 314–334 |
| 2 | 404 + segundo request à mesma table → short-circuit | `isTableUnavailable` true, return early | 196–217 |
| 3 | 500 + Content-Type JSON mas body inválido → err fallback | `!res.ok`, `JSON.parse` catch, `err = text \|\| statusText` | 316–325 |
| 4 | 404 + body HTML → markTableUnavailable + BACKEND_UNAVAILABLE | `text.trim() && !isJson`, `res.status === 404`, `markTableUnavailable` | 296–305 |

---

## BLOCO 2 — Success Path Edge Cases

| # | Teste | Branches activados | Linhas |
|---|-------|--------------------|--------|
| 5 | 200 GET + body vazio → `{ data: [], error: null }` | `text === ""`, `state.method !== "DELETE"` | 337–340 |
| 6 | DELETE success → `{ data: null, error: null }` | `state.method === "DELETE"`, `markTableAvailable` | 337–340 |
| 7 | 409 Conflict + upsert onConflict → `{ data: null, error: null }` | `res.status === 409`, `POST`, `upsertOpts?.onConflict` | 306–313 |
| 8 | POST insert com select cols → select em query | `state.selectCols && state.selectCols !== "*"` | 245–247 |

---

## BLOCO 3 — Optional / RPC

| # | Teste | Branches activados | Linhas |
|---|-------|--------------------|--------|
| 9 | RPC 404 optional (get_multiunit_overview) → markRpcUnavailable | `!res.ok`, `404`, `OPTIONAL_RPCS.includes` | 441–445 |
| 10 | RPC segundo request optional → short-circuit | `isRpcUnavailable` true, return FUNCTION_UNAVAILABLE | 416–424 |
| 11 | update (PATCH) com body | `state.method === "PATCH"`, `init.body` | 277–280 |
| 12 | upsert com onConflict → Prefer header | `state.upsertOpts?.onConflict`, `resolution=merge-duplicates` | 254–256, 273–276 |

---

## Já cobertos (não duplicar)

- 4xx/5xx JSON válido
- Non-JSON response (Content-Type)
- Fetch throw
- single() no rows
- maybeSingle empty
- single() multiple rows
- range() header
- JSON parse failure (200 body)
- rpc 204 empty
- is(null), order(ascending: false)

---

## Estimativa de ganho

| Bloco | Testes | Branches estimados |
|-------|--------|--------------------|
| 1 | 4 | ~12–16 |
| 2 | 4 | ~8–12 |
| 3 | 4 | ~10–14 |
| **Total** | **12** | **~30–42** |
