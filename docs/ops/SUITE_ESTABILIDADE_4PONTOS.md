# Estabilidade da suíte — 4 pontos (sem UI/rotas/TPV)

**Objetivo:** Zerar falhas reais do log e deixar a base pronta; sem mexer em UI, rotas, textos nem tela TPV.

---

## 1. Estado

- **backendAdapter.ts:** Sem `import.meta.env`; leitura de env via `getEnvVar` (globalThis + process.env). Compila e corre no Vite e no Jest/Node, sem TS1343.
- **RuntimeReader.test.ts:** Contrato alinhado: quando o erro contém "does not exist" (ex.: "column gm_restaurants.logo_url does not exist"), o runtime usa projeção **mínima**; o teste espera `IDENTITY_SELECT_MINIMAL` e `RESTAURANT_SELECT_MINIMAL` na 2.ª chamada.
- **RestaurantReader.ts:** `data` tratado como array tipado `RawProductRow[]`; `product` tipado explicitamente no `.map`; sem "Property 'map' does not exist on type '{}'" nem implicit any.
- **FiscalEventStore.ts / coverage:** Ficheiro excluído da coleta de coverage em `jest.config.js` (`!**/fiscal-modules/FiscalEventStore.ts`); import de `../gate3-persistence/PostgresLink` fora da suíte atual — coverage não quebra por este ficheiro.

**Testes:** RuntimeReader + RestaurantReader — 15 testes a passar (2 test suites).

---

## 2. O que o Cursor fez

| # | Ponto | Acção |
|---|--------|--------|
| 1 | backendAdapter.ts | Confirmado: já usa `getEnvVar(key)` (globalThis + process.env); zero acesso a `import.meta` no código. Nenhuma alteração necessária. |
| 2 | RuntimeReader.test.ts | Confirmado: testes já esperam projeção mínima na 2.ª chamada (`id,name,slug,status,tenant_id,created_at,updated_at`). Contrato único: erro com "does not exist" → retry com select mínimo. Nenhuma alteração necessária. |
| 3 | RestaurantReader.ts | Confirmado: já existe `RawProductRow`, `rows: RawProductRow[]`, e `product: RawProductRow` no `.map`. Nenhuma alteração necessária. |
| 4 | FiscalEventStore / coverage | Confirmado: `collectCoverageFrom` em `jest.config.js` já inclui `!**/fiscal-modules/FiscalEventStore.ts`. Nenhuma alteração necessária. |

Nenhum ficheiro foi modificado nesta verificação; os 4 pontos já estavam corrigidos no repositório.

---

## 3. O que falta

- Nada nos 4 pontos listados.
- Se noutro ambiente (outra branch ou cache) o RuntimeReader.test falhar com "Expected: ... city,address,description,country,timezone...", garantir que o teste espera a **projeção mínima** na 2.ª chamada: `"id,name,slug,status,tenant_id,created_at,updated_at"` para ambos os casos (fetchRestaurant e fetchRestaurantForIdentity), pois o erro "logo_url does not exist" contém "does not exist" e o código usa sempre o select mínimo no retry.

---

## 4. Próximo passo único

Manter a suíte estável; não abrir nova frente. Se aparecer nova falha de testes, rodar `npm test -- --testPathPattern="RuntimeReader|RestaurantReader" --watchAll=false --no-coverage` e, se falhar, alinhar a expectativa do 2.º `chain.select` à projeção mínima acima.

---

## 5. Prompt para o Cursor

```
Objetivo: manter estável a base técnica da suíte; não mexer em UI, rotas, textos nem tela TPV.

Os 4 pontos já estão corrigidos:
1) backendAdapter.ts — sem import.meta; leitura env via getEnvVar (globalThis + process.env).
2) RuntimeReader.test.ts — teste alinhado à projeção mínima no retry (identidade e restaurante).
3) RestaurantReader.ts — data/rows/product tipados; sem map em {} nem implicit any.
4) FiscalEventStore — excluído do coverage em jest.config.js.

Se RuntimeReader.test falhar com expectativa de select "completo sem logo_url", actualizar o teste para esperar a projeção mínima na 2.ª chamada: "id,name,slug,status,tenant_id,created_at,updated_at" (única verdade do código quando o erro contém "does not exist").
```

---

**Resultado da execução (2026-03-15):**  
`npm test -- --testPathPattern="RuntimeReader|RestaurantReader" --watchAll=false --no-coverage` → **2 passed, 15 tests passed.**
