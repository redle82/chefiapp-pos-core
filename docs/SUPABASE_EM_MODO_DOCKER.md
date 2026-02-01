# Por que ainda aparece "Supabase" em modo Docker

**Objetivo:** Esclarecer por que o código ainda referencia `supabase` e o que isso significa quando o backend é Docker.

---

## Resposta curta

Em **modo Docker**, o app **não** usa o cliente real do Supabase. O que existe é um **shim** (`core/supabase/index.ts`) que **lança erro** em qualquer uso (`supabase.from()`, `supabase.auth.getUser()`, etc.) com a mensagem _"Supabase client forbidden in Docker mode"_.

Ou seja: em Docker, "usar supabase" = **não usar** — é uma proteção para forçar o uso de `dockerCoreClient` ou mock.

---

## O que existe hoje

1. **`core/supabase/index.ts`**

   - Em Docker: exporta um objeto **shim** que não chama PostgREST nem auth; só chama `assertSupabaseAllowed()` e lança.
   - **Não** importa `@supabase/supabase-js`; é código puro que falha em uso.

2. **`core/infra/supabaseClient.ts`**

   - Cria o cliente **real** com `createClient(@supabase/supabase-js)`.
   - **Nenhum outro ficheiro** importa `getSupabaseClient()`; esse ficheiro não entra no fluxo da app em Docker.

3. **Muitos ficheiros** ainda fazem `import { supabase } from '../supabase'` e chamam `supabase.from()`, `supabase.auth.getSession()`, etc.
   - Em backend **Supabase**: esses imports poderiam ser trocados por um cliente real (hoje não são, porque o entrypoint é o shim).
   - Em backend **Docker**: essas chamadas atingem o shim e **lançam**. Por isso, em Docker só devem ser executados os fluxos que já foram migrados para Core/mock ou protegidos com `getBackendType() === BackendType.docker`.

---

## Por que o pacote `@supabase/supabase-js` continua no projeto

- Está em `package.json` porque `supabaseClient.ts` usa `createClient`.
- Como nada importa `supabaseClient.ts` na app, o bundler pode excluir esse módulo (e a lib) do bundle em Docker.
- Manter o pacote permite, no futuro, usar o cliente real quando o backend for Supabase, sem adicionar dependência nova.

---

## O que já foi ajustado para Docker

- **FinancialEngine**: em Docker não chama `supabase`; retorna mock (lista vazia, saldo zero).
- **TaskAnalytics.analyze**: em Docker usa `readTasksForAnalytics` (Core).
- **useRealtimeMetrics**: em Docker usa `readOrdersForAnalytics` (Core).
- **TaskDetailCoreTODO.updateTaskStatus**: em Docker usa `TaskWriter` (Core).
- **PurchasesDashboardPage, ReservationsDashboardPage**: corrigidos imports/dependências; engines de purchases/reservations são mock e não usam Supabase.
- **RestaurantRuntimeContext**: em Docker usa RuntimeReader/RuntimeWriter (Core); setup_status e active_modules em demo não dependem de Supabase.
- **useSupabaseAuth**: em Docker não chama Supabase Auth; retorna `session: null`, `user: null`, `loading: false`.
- **FlowGate**: em Docker não chama `supabase.auth.getSession()` no fallback.
- **BootstrapPage**: em Docker não chama `supabase.auth.getSession()`; trata como sem sessão e segue fluxo demo/redirect.
- **ConfigModulesPage**: em Docker não chama auth nem `supabase.from`; usa `useRestaurantId()` e lista de módulos vazia.

---

## O que ainda chama o shim (e falha se correr em Docker)

Qualquer fluxo que **execute** um destes em modo Docker vai lançar "Supabase client forbidden":

- Auth: `supabase.auth.getSession()`, `supabase.auth.getUser()`, `supabase.auth.signInWithPassword()`, `supabase.auth.signOut()`
  (ex.: FlowGate, BootstrapPage, ConfigModulesPage, PulseList, Waiter/TablePanel, AdminSidebar)
- Tabelas/RPC: `supabase.from(...)`, `supabase.rpc(...)`
  (ex.: LocationSection, StaffContext, ReflexEngine, TPV.tsx, WebOrderingService, FiscalQueueWorker, Logger, etc.)

Por isso, em **demo com backend Docker**, deve-se usar apenas as rotas e fluxos já migrados ou que não disparem esses códigos (Dashboard, System Tree, TPV v2, Tasks, Purchases, Financial, Reservations, Groups, etc.).

---

## Resumo

| Pergunta                                                 | Resposta                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O app usa o Supabase real em Docker?                     | **Não.** Usa um shim que proíbe e lança erro.                                                                                                                             |
| Por que há tantos `import { supabase }`?                 | Código legado; migração é gradual; em Docker muitos desses caminhos não devem ser executados.                                                                             |
| O pacote `@supabase/supabase-js` é necessário em Docker? | Só se algum módulo importar `supabaseClient.ts`; hoje nenhum importa, então pode ficar fora do bundle.                                                                    |
| Como evitar o erro em Docker?                            | Usar apenas fluxos que já usam `dockerCoreClient` ou mock, ou adicionar `getBackendType() === BackendType.docker` e retorno mock/early return antes de chamar `supabase`. |

Para detalhe de contrato e estado da app layer, ver **[STATE_PURE_DOCKER_APP_LAYER.md](STATE_PURE_DOCKER_APP_LAYER.md)**.
