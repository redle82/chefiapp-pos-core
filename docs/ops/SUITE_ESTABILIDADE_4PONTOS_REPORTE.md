# Estabilidade da suíte — 4 pontos — Reporte

## 1. Estado

- **Suíte Jest:** 77 test suites passed, 1 failed (TableManagement), 2 skipped — 78 of 80 total. 860 tests passed, 9 failed (todos em TableManagement.test.ts), 11 skipped.
- **Os 4 pontos do plano estão estáveis:** backendAdapter sem import.meta e com getEnvVar; RestaurantReader com array tipado e product tipado; RuntimeReader.test com expectativa de projeção mínima em ambos os testes de logo_url; FiscalEventStore excluído do coverage e PostgresLink mockado no projecto node. Sem TS1343 nem erros de tipo nos ficheiros alvo.

## 2. O que o Cursor fez

- **Ponto 1 (backendAdapter.ts):** Confirmado: não há `import.meta` no código; existe helper `getEnvVar(key)` (globalThis + process.env). main_debug.tsx importa env-bootstrap em primeiro lugar. Nenhuma alteração necessária.
- **Ponto 2 (RestaurantReader.ts):** Confirmado: `readProducts` usa `RawProductRow[]`, `rows = Array.isArray(data) ? (data as RawProductRow[]) : []` e `product: RawProductRow` no `.map`. Nenhuma alteração necessária.
- **Ponto 3 (RuntimeReader + teste):** Confirmado: ambos os testes do describe "logo_url backwards compatibility" esperam a projeção mínima `"id,name,slug,status,tenant_id,created_at,updated_at"` na 2.ª chamada. Nenhuma alteração necessária.
- **Ponto 4 (FiscalEventStore/coverage):** Confirmado: jest.config.js tem `!**/fiscal-modules/FiscalEventStore.ts` em collectCoverageFrom e o projecto node tem moduleNameMapper para gate3-persistence/PostgresLink. Nenhuma alteração necessária.

Nenhum ficheiro foi modificado; os 4 pontos já estavam conformes ao plano.

## 3. O que falta

- **TableManagement.test.ts (9 testes):** Falham em Node porque o fluxo chama getCoreSessionAsync → getKeycloakSession; em Node não há sessionStorage, a sessão é null, e o cliente/OrderEngine acaba por lançar OrderEngineError. Este ficheiro está fora do âmbito dos 4 pontos (plano não mexe em TPV/AppStaff).

## 4. Próximo passo único

Se quiseres que os 9 testes de TableManagement passem: mockar getCoreSessionAsync (ou getKeycloakSession) em TableManagement.test.ts para devolver uma sessão válida em Node, ou executar esse ficheiro no projecto jsdom com sessionStorage definido. Caso contrário, manter como está e considerar a suíte estável para os 4 pontos.

## 5. Prompt para o Cursor

```
Objetivo: manter estável a base técnica da suíte; não mexer em UI, rotas, textos, TPV, AppStaff nem Electron.

Os 4 pontos estão fechados:
1) backendAdapter.ts — sem import.meta; leitura env via getEnvVar (globalThis + process.env); env-bootstrap importado primeiro no entry.
2) RestaurantReader.ts — data tratado como array tipado RawProductRow[]; product tipado no .map; sem "map on {}" nem implicit any.
3) RuntimeReader + RuntimeReader.test.ts — contrato único: quando o erro contém "does not exist", o retry usa projeção mínima; o teste espera "id,name,slug,status,tenant_id,created_at,updated_at" na 2.ª chamada para fetchRestaurant e fetchRestaurantForIdentity.
4) FiscalEventStore — excluído da coleta de coverage em jest.config.js; PostgresLink mockado no projecto node.

Se RuntimeReader.test falhar com expectativa de select "completo sem logo_url", actualizar a expectativa do 2.º chain.select para "id,name,slug,status,tenant_id,created_at,updated_at". Não alterar RuntimeReader.ts.
```
