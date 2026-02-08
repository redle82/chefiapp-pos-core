# Badge Core — Por que vermelho e quando fica verde

**Onde está:** Sidebar do dashboard (`/dashboard`), entre "Sistema pronto" e "Faturação".

---

## Três estados

| Badge | Estado        | Significado                                                                       |
| ----- | ------------- | --------------------------------------------------------------------------------- |
| 🟢    | Core ativo    | Backend operacional conectado.                                                    |
| 🟡    | Core instável | Ligação instável. Algumas ações podem falhar.                                     |
| 🔴    | Core offline  | Servidor operacional offline ou health check falhou.                              |
| 🟡    | A verificar…  | Primeiro carregamento: a verificar ligação (não mostra vermelho antes de falhar). |

**Quando é carregado:** O badge monta com a sidebar do dashboard. O health check corre **logo ao montar** (primeiro `check()` imediato) e depois em polling (ex.: cada 60 s quando UP). Enquanto o estado for `UNKNOWN`, mostra-se 🟡 "A verificar…" em vez de 🔴; assim, ao abrir com o Core up, o badge passa a verde assim que o primeiro check responder.

---

## Por que está vermelho (🔴)?

O badge fica **vermelho** quando **qualquer** destas condições se verifica:

1. **`coreReachable = false`**
   Ao carregar o restaurante, a app tentou falar com o **Docker Core (porta 3001)** e falhou (timeout, connection refused, erro na resposta). Ou o backend configurado não é Docker e o runtime veio de fallback.

2. **Health check falhou**
   O hook `useCoreHealth` chama `fetchHealth()`. Em **modo Docker** (local), o health faz um GET a `{base}/rest/v1/` no Core (porta 3001); em **modo Supabase**, usa a Edge Function `supabase.functions.invoke('health')`. Se a chamada falhar ou não devolver sucesso, o estado é DOWN → badge vermelho.

**Resumo:** Vermelho = Core não alcançável **ou** health check (função Supabase) a falhar.

---

## O que é preciso para ficar verde (🟢)?

1. **Docker Core a correr**

   ```bash
   docker compose -f docker-core/docker-compose.core.yml up -d
   ```

   A app tem de conseguir falar com o Core na porta 3001 (ou via proxy configurado).

2. **Backend = Docker**
   No `.env` do merchant-portal:
   `VITE_SUPABASE_URL=http://localhost:3001` (ou URL que aponte para o Core).

3. **Runtime carrega do Core**
   O `RestaurantRuntimeContext` chama o Core (ex.: `fetchRuntimeStateFromCore`). Se isso não der erro, `coreReachable` fica `true`.

4. **Health check a devolver OK**
   `fetchHealth()` tem de devolver `'ok'`. Em **modo Docker** (local), o health faz GET a `http://localhost:3001/rest/v1/` — se o Core estiver up, responde 2xx e o badge fica verde. Em **modo Supabase**, usa a Edge Function `health`.

---

## Deveria estar verde?

- **Se estás em local com Docker Core:**

  - Se o Core está up e a app está configurada para `localhost:3001`, o vermelho pode ser só o **health check** (função `health` inexistente ou inacessível no Core).
  - Nesse caso, o “Core” em si pode estar a funcionar (dados a carregar), mas o badge fica vermelho até o health responder OK.

- **Se o Docker Core não está a correr:**
  - É esperado estar vermelho. Sobe o Core com o comando acima e recarrega a página; se o health também funcionar, o badge pode passar a verde.

---

## Resumo técnico

- **Vermelho:** `!coreReachable` **ou** health ≠ UP (DOWN/UNKNOWN).
- **Verde:** `coreReachable === true` **e** health === UP.
- **Amarelo:** `coreReachable === true` **e** health === DEGRADED.

O estado atual é vermelho porque ou o Core não foi alcançado ao carregar o runtime, ou o health check (Supabase `health`) está a falhar. Para estar verde, o Core tem de estar up, a app configurada para ele, e o health check a devolver ok.
