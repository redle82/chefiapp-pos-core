# Contrato de Erro de API (fetch layer)

**Propósito:** Garantir que quando o backend devolve HTML em vez de JSON (ex.: página 404, proxy, erro de rede), a aplicação nunca quebra com `Unexpected token '<', "<!doctype"... is not valid JSON`. O fetch layer deve devolver um erro tipado e a UI deve mostrar estado "backend indisponível" ou estado vazio, nunca ecrã em branco nem crash.

**Fonte de verdade:** Este documento. Implementação: `merchant-portal/src/core/infra/dockerCoreFetchClient.ts` (e qualquer outro cliente fetch que chame APIs do Core).

---

## 1. Problema

- Erro recorrente: `Unexpected token '<', "<!doctype"... is not valid JSON`.
- Causa: o servidor responde com HTML (página de erro, 404, proxy, etc.) e o cliente faz `JSON.parse(responseText)` sem verificar `Content-Type`.
- Consequência: exceção não tratada, UI pode quebrar ou mostrar erro genérico.

---

## 2. Regra (guard padrão)

- **Antes de fazer `JSON.parse(text)`:** verificar se a resposta é JSON.
- **Critério:** `Content-Type` da resposta inclui `application/json` (ou `application/json; charset=...`). Caso contrário, **não** fazer parse.
- **Ação quando NÃO é JSON:** devolver erro tipado, **nunca** lançar.
  - Código de erro sugerido: `BACKEND_UNAVAILABLE` ou `INVALID_RESPONSE`.
  - Mensagem utilizável para o utilizador: "Backend indisponível" ou "Resposta inválida do servidor".
- **Na UI:** tratar este erro como "dados indisponíveis": mostrar estado vazio honesto ou mensagem humana ("Não foi possível carregar. Tente novamente."), **nunca** ecrã em branco nem stack trace.

---

## 3. Forma do erro tipado

- No cliente fetch (ex.: PostgrestResponse): `{ data: null, error: { message: string, code?: string } }`.
- Códigos recomendados:
  - `BACKEND_UNAVAILABLE` — resposta não é JSON (HTML ou outro).
  - `NETWORK_ERROR` — fetch falhou (rede, timeout, CORS).
  - Manter códigos existentes do PostgREST quando a resposta for JSON e vier `error` do servidor.

---

## 4. Onde aplicar

- **dockerCoreFetchClient.ts:** em `run()` e em `rpc()`:
  - Após `const text = await res.text()`:
  - Se `res.headers.get('Content-Type')` não incluir `application/json`, e houver corpo (`text` não vazio) que seria parseado, **não** chamar `JSON.parse(text)`; devolver `{ data: null, error: { message: 'Backend indisponível', code: 'BACKEND_UNAVAILABLE' } }`.
  - Para `res.ok === false` com corpo não-JSON, usar a mesma regra: não parsear; devolver erro tipado com mensagem a partir de `text` ou genérica.
- Qualquer outro cliente que faça `fetch` + `response.json()` ou `response.text()` + `JSON.parse()` para APIs do Core deve seguir o mesmo contrato.

---

## 5. Nunca

- Fazer `JSON.parse(text)` sem garantir que a resposta é JSON (via Content-Type ou try/catch com fallback para erro tipado).
- Deixar a exceção "Unexpected token '<'" propagar até à UI sem ser convertida em erro tipado.
- Mostrar ecrã em branco ou stack trace ao utilizador quando o backend devolve HTML ou falha.

---

## 6. Comportamento esperado em dev (404 em RPCs)

Em setups locais em que o **Docker Core** está a correr mas o PostgREST **não expõe** as funções RPC `get_operational_metrics` e `get_shift_history`, é **esperado**:

- **404 (Not Found)** nas chamadas a `/rest/v1/rpc/get_operational_metrics` e `/rest/v1/rpc/get_shift_history`.
- A aplicação **não deve crashar**: o fetch layer devolve erro tipado (ex.: `BACKEND_UNAVAILABLE` quando a resposta não é JSON, ou tratamento de 404 conforme implementação).
- Na UI: secções "métricas operacionais" e "histórico de turnos" mostram **estado vazio** (sem dados), não mensagem de erro alarmante.
- Contrato: `useOperationalMetrics` e `useShiftHistory` tratam erro com `code: "BACKEND_UNAVAILABLE"` (ou equivalente) como "sem dados" e renderizam estado vazio.

Quem desenvolve ou faz piloto deve saber que estes 404 são **esperados** em certos setups até as RPCs serem implementadas/expostas no Core (porta 3001). A UI está correcta ao mostrar estado vazio.

---

## 7. Referências

- **CoreFlow / rotas:** [ROUTES_WEB_VS_OPERATION.md](ROUTES_WEB_VS_OPERATION.md) — UI nunca return null na web.
- **Implementação:** `merchant-portal/src/core/infra/dockerCoreFetchClient.ts`.
- **Início local:** [FASE_5_COMO_INICIAR_1_MINUTO.md](FASE_5_COMO_INICIAR_1_MINUTO.md) — 404 esperados e FlowGate timeout (5s) quando o backend está lento ou ausente.

Última atualização: 2026-02-01.
