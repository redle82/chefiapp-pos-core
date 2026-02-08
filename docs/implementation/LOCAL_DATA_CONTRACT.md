# Contrato de Dados Local (UI → Core → Dados)

**Propósito:** Definir quais tabelas/dados existem localmente, quais rotas leem/escrevem, o que é efémero vs persistente, o que será sincronizado no futuro e o que nunca sai do restaurante. Fecha o triângulo UI → Core → Dados e evita ambiguidade quando se implementa ou escala o backend.

**Fonte de verdade do fluxo:** [ROUTES_WEB_VS_OPERATION.md](ROUTES_WEB_VS_OPERATION.md). Fonte de verdade financeira: [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](../architecture/CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) (Docker Core).

---

## 1. O que existe localmente (por contexto)

- **Docker Core (PostgREST):** tabelas e RPCs expostos em `/rest/v1`. Usado quando `backendType === 'docker'`. Cliente: `dockerCoreFetchClient.ts`.
- **Supabase (local ou remoto):** mesmo esquema PostgREST quando `backendType === 'supabase'`. Auth, Realtime e tabelas de aplicação.
- **Estado em memória (React):** contexto de restaurante, systemState, sessão, seleção de módulo no dashboard. Efémero; não persistido localmente além de sessão.
- **LocalStorage / SessionStorage:** pode ser usado para preferências (ex.: tenant selecionado, tema). Não é fonte de verdade para dados operacionais; Core é.
- **IndexedDB / SQLite (futuro):** não implementado como camada de dados local no merchant-portal; contrato para rotas "Parcial" (compras, financeiro, reservas, etc.) pode definir mocks ou cache local conforme [secção 4](#4-rotas-parcial-contrato-mínimo).

---

## 2. Quais rotas leem/escrevem o quê (resumo)

| Rota / Área | Lê | Escreve | Notas |
|-------------|-----|---------|--------|
| Dashboard | Restaurant, systemState, métricas (RPC), alertas | — | OperacionalMetricsCards, Alertas; 404 em RPC → estado vazio |
| Config (identity, location, schedule, people, payments, modules, perception) | restaurants, gm_restaurant_people, horários, etc. | restaurants, gm_restaurant_people, installed_modules, etc. | Persistido no Core/Supabase |
| Billing | billing_configs ou equivalente, Stripe | Via webhook Stripe; UI não escreve directo | Leitura pode 404 em local |
| Compras (/purchases) | purchase_orders, purchase_order_lines, suppliers (lógico) | Pedidos de compra, fornecedores | Backend pode não existir ainda → estado vazio |
| Financeiro (/financial) | Orders, Payments, Shifts (agregados) | — | Leitura do Core; 404 → estado vazio |
| Reservas (/reservations) | reservations | reservations (criar, atualizar estado) | Backend pode ser parcial |
| Multi-Unidade (/groups) | restaurants (multi-tenant), agregações | — | Estado vazio se um único restaurante |
| QR Mesa | restaurants (slug), menu_items, orders | orders (origin QR_MESA) | Config em /config; público em /public/:slug/mesa/:number |
| Painel Pedidos Prontos (/op/kds) | Orders, order_items | order_items (estado pronto) | Operacional; web apenas observa (ver doc rota) |
| Pessoas (/config/people) | gm_restaurant_people | gm_restaurant_people | Código e QR para App Staff |
| Mentor IA (/mentor) | Pedidos, tarefas, métricas (para sugestões) | — | Observador; 404 → estado vazio |
| Presença Online | restaurants, menu_items | orders (WEB_PUBLIC) na página pública | Config em /config; público /public/:slug |
| Percepção Operacional (/config/perception) | Config percepção, eventos IA | Config percepção | Parcial |

---

## 3. Efémero vs persistente

- **Efémero (não persistido no backend):** estado de UI (modais, filtros, seleção de módulo), sessão em memória até refresh, preferências em localStorage se existirem.
- **Persistente:** tudo o que é escrito no Core ou Supabase (restaurants, people, orders, shifts, billing state, config). Docker Core e Supabase são a fonte de verdade; não há "fonte de verdade" em IndexedDB no merchant-portal hoje.
- **Cache (futuro):** se se introduzir cache local (ex.: IndexedDB) para listas, deve ter TTL e invalidação; a fonte de verdade continua a ser o Core.

---

## 4. O que será sincronizado no futuro

- **Multi-unidade:** agregação por tenant e eventual sincronização entre instâncias (fora do scope actual).
- **Offline / PWA:** não definido; quando for, o contrato deve declarar o que é replicado localmente e como se reconcilia com o Core.
- **Backend remoto (Supabase produção):** mesmo esquema que local; migrações aplicadas; UI já preparada para 404/estado vazio.

---

## 5. O que nunca sai do restaurante

- **Dados financeiros e pedidos:** processados pelo Core (Docker ou Supabase do restaurante); não enviar para terceiros não autorizados. Stripe: apenas IDs e webhook conforme configuração.
- **Dados de pessoas (staff):** gm_restaurant_people no Core do restaurante; não exportar para fora do contrato de produto.
- **Credenciais e tokens:** nunca em logs nem em resposta JSON exposta ao utilizador.

---

## 6. Rotas "Parcial" — contrato mínimo de dados

Para compras, financeiro, reservas, percepção-operacional, mentor-ia:

- **Shape final:** definir interfaces TypeScript (types/*.ts) para os payloads esperados do backend, mesmo que o backend ainda não exista.
- **Mock / estado vazio:** UI deve poder funcionar sem backend real: lista vazia ou dados mock em memória; mensagem honesta "Ainda não há dados" / "Configure X para começar". Nunca ecrã em branco.
- **Persistência local (opcional):** se se usar IndexedDB ou SQLite para mocks, declarar aqui as "tabelas" locais e a regra (apenas dev/demo ou também fallback em produção). Hoje o contrato é: **sem backend real, UI mostra estado vazio tipado**.

---

## 7. Referências

- **Rotas web:** [routes/README_WEB_ROUTES.md](../routes/README_WEB_ROUTES.md) e [routes/web/](../routes/web/).
- **Core:** [architecture/CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).
- **API Error:** [API_ERROR_CONTRACT.md](API_ERROR_CONTRACT.md).

Última atualização: 2026-02-01.
