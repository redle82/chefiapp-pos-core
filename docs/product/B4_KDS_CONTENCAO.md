# B4 — Contenção: KDS + polish mínimo (36–48h)

**Objetivo B4:** Fechar o ciclo mental: "isto funciona". Pedido criado no TPV aparece no KDS; sem crash, sem ruído técnico.  
**Regra:** Sovereignty v1 intacta; contenção temporária documentada (48h fluxo feliz). Não refatorar arquitetura; só contenção de runtime + UX mínima.

---

## 1. Onde ocorrem crashes / erros

| Etapa | Ficheiro | Risco |
|-------|----------|--------|
| **Entrada** | `App.tsx` → `RequireOperational` → `OperationalFullscreenWrapper` → `KDSMinimal` | Nenhum ErrorBoundary em volta do KDS; throw em filho = ecrã branco. |
| **Carregar pedidos** | `KDSMinimal.tsx` → `loadOrders()` → `OrderReader.readActiveOrders`, `readOrderItems` | Falha de rede → `setError(err.message)` → "Failed to fetch" ou texto técnico. |
| **Carregar tarefas** | `KDSMinimal.tsx` → `loadTasks()`; `TaskPanel` → `readOpenTasks` | Erro só em console; pode deixar lista vazia ou estado inconsistente. |
| **Runtime** | `KDSMinimal` usa `RESTAURANT_ID` hardcoded | Deveria usar `runtime?.restaurant_id` (guards defensivos). |

**Backend:** OrderReader (dockerCoreClient) — `gm_orders`, `gm_order_items`; TaskReader — tarefas. Polling 30s já existe (realtime desativado).

---

## 2. Causas raiz

- **Crash React:** Erro não capturado em KDSMinimal ou filhos → sem ErrorBoundary em `/op/kds` → ecrã branco.
- **Core inacessível:** `readActiveOrders` / `readOrderItems` falham → "Failed to fetch" ou mensagem de erro exposta.
- **Ciclo TPV → KDS:** Pedido criado no TPV pode não aparecer no KDS se Core estiver down no momento do create, ou se KDS falhar ao carregar; sem fallback o dono não vê confirmação.

---

## 3. Contenção a aplicar (B4 — temporária)

**Decisão:** (1) ErrorBoundary em `/op/kds` com fallback neutro; (2) fallback de pedidos quando Core falha (lista vazia ou mock mínimo: "1 pedido piloto" para demonstrar); (3) mensagens neutras; (4) guards defensivos (restaurantId do runtime); (5) silenciar ruído técnico (nunca mostrar Docker, Supabase, stack).

| Medida | Comportamento |
|--------|----------------|
| **ErrorBoundary em /op/kds** | Envolver KDSMinimal num ErrorBoundary com fallback: "KDS temporariamente indisponível. Tente novamente ou volte ao portal." + link dashboard. Zero stack, zero error.message. |
| **loadOrders() fallback** | Se rede falhar: mostrar lista vazia e mensagem neutra "Sem pedidos por agora" ou, em modo piloto, 1 pedido mock ("Pedido piloto") para fechar ciclo visual. Opcional: ler pedidos de localStorage se TPV tiver guardado em fallback (B2 opcional). |
| **Guards defensivos** | `restaurantId = runtime?.restaurant_id ?? DEFAULT_RESTAURANT_ID`; não assumir contextos sempre definidos. |
| **Mensagens** | Erro de carregamento → toUserMessage; nunca "Failed to fetch" nem stack. |
| **Polish mínimo** | Esconder referências a Docker/Supabase/realtime na UI; substituir por "Modo Piloto Ativo" ou nada (evitar ruído). |

**Remoção futura:** Quando fluxo TPV → KDS estiver estável com Core sempre disponível, remover fallbacks e documentar B4 como concluído.

---

## 4. UX mínima (B4)

- **Ao abrir KDS:** Se tudo ok → lista de pedidos (Core). Se crash → fallback ErrorBoundary neutro.
- **Ao carregar pedidos:** Se Core falhar → lista vazia + "Sem pedidos por agora" ou 1 pedido mock; nunca erro de rede visível.
- **Ciclo fechado:** Dono cria pedido no TPV → abre KDS → vê pedido (ou mensagem neutra); sensação de produto real.
- **Nunca:** Stack trace, "Failed to fetch", Docker, Supabase, nomes técnicos.

---

## 5. Critérios de sucesso B4

- [ ] Dono abre `/op/kds` (restaurante publicado) e vê o KDS, não ecrã branco.
- [ ] Após criar 1 pedido no TPV, o pedido aparece no KDS (Core up) ou mensagem neutra / mock (Core down).
- [ ] Nenhum crash visível; nenhuma mensagem técnica exposta.
- [ ] Fluxo fechado: TPV → 1 pedido → KDS mostra pedido (ou estado coerente).

---

## 6. Implementação (B4) — concluída

| Local | Alteração feita |
|-------|------------------|
| **App.tsx** | Rota `/op/kds` envolvida em `<ErrorBoundary context="KDS" fallback={…} />`: mensagem "KDS temporariamente indisponível. Tente novamente ou volte ao portal." + link "Ir para o Portal" (`/dashboard`). |
| **KDSMinimal.tsx** | (1) `useRestaurantRuntime()`; `restaurantId = runtime?.restaurant_id ?? DEFAULT_RESTAURANT_ID`. (2) `loadOrders`: em `isNetworkError(err)` → `setOrders([])`, `setError(null)`; senão `setError(toUserMessage(err, "…"))`. (3) `loadTasks`: em catch → `console.error` + `setTasks([])`. (4) `handleMarkItemReady` / `handleStartPreparation`: `setError(toUserMessage(err, "…"))`. (5) UI de erro: título "Problema ao carregar", cor neutra. (6) Indicador realtime: quando não SUBSCRIBED mostra "Modo Piloto" (nunca "🔴 CLOSED"). (7) `useEffect` de polling com dependência `[restaurantId]`. |

**Teste manual sugerido:** (1) Abrir `/op/kds` com restaurante publicado → deve mostrar KDS ou lista vazia / "Nenhum pedido ativo". (2) Com Core em baixo → lista vazia, sem "Failed to fetch". (3) Criar pedido no TPV → abrir KDS → pedido visível (Core up). (4) Forçar crash num filho (ex.: throw em render) → deve aparecer fallback do ErrorBoundary, não ecrã branco.

---

## 7. Plano técnico de contenção — decisões

### Decisão tomada

| Opção | Escolha | Motivo |
|-------|---------|--------|
| **A. ErrorBoundary em /op/kds** | ✅ Aplicar | Consistente com B2; evita ecrã branco. |
| **B. Fallback pedidos (lista vazia ou mock)** | ✅ Aplicar | Core down → "Sem pedidos por agora" ou 1 pedido mock; dono não vê erro de rede. |
| **C. Pedidos em localStorage (TPV fallback)** | 🟡 Opcional | Se B2 tiver guardado pedido em localStorage, KDS pode ler para mostrar 1 pedido; pode ser fase 2. |
| **D. Realtime no KDS** | ❌ Não (B4) | Já desativado (polling 30s); reativar fora do escopo 48h. |

**Regra de ativação:** ErrorBoundary sempre ativo. Fallback de pedidos quando `readActiveOrders` ou `readOrderItems` falham com erro de rede (isNetworkError).

---

### Onde implementar

| Local | Alteração proposta |
|-------|---------------------|
| **App.tsx** (rota `/op/kds`) | Envolver `OperationalFullscreenWrapper` > `KDSMinimal` em `<ErrorBoundary context="KDS" fallback={…} />` com fallback neutro (texto + link dashboard). |
| **KDSMinimal.tsx** | (1) `loadOrders`: try/catch; em rede falhada, setOrders([]) e setError(null) ou mensagem neutra "Sem pedidos por agora"; (2) setError(toUserMessage(err, "…")) em todos os catch; (3) restaurantId = runtime?.restaurant_id ?? DEFAULT; (4) usar useRestaurantRuntime() com guards. |
| **TaskPanel / loadTasks** | Em erro, não bloquear UI; console.error apenas; tasks = [] é aceitável. |

**Fallback ErrorBoundary (texto sugerido):** "KDS temporariamente indisponível. Tente novamente ou volte ao portal." + link `/dashboard`.

---

### Alternativas descartadas (e porquê)

- **Refatorar KDS para realtime:** Fora do escopo 48h; polling 30s é suficiente para piloto.
- **Mostrar "Modo Piloto" sempre no KDS:** Ruído; basta mensagem neutra em caso de erro.
- **Desativar KDS quando Core está down:** Bloqueia demonstração; fallback (lista vazia ou mock) mantém confiança.

---

### Critérios para remover a contenção

1. Fluxo TPV → KDS estável em piloto; zero crashes e zero reclamações.
2. Decisão explícita: "B4 contenção concluída" → remover fallback de pedidos em KDSMinimal; opcionalmente manter ErrorBoundary como boa prática.

---

## Referências

- Plano 48h: B1 (cardápio), B2 (TPV), B3 (TPV estável — feito em B2), B4 (KDS + polish).
- `docs/product/B2_TPV_CONTENCAO.md` — ErrorBoundary e hardening TPV.
- `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx` — ponto de entrada do KDS em `/op/kds`.
- `merchant-portal/src/core-boundary/readers/OrderReader.ts` — readActiveOrders, readOrderItems.
- `docs/product/VALIDACAO_OPERACAO_PILOTO_01.md` — registo do piloto.

---

## Histórico

- **Implementação B4:** ErrorBoundary `/op/kds`, fallback rede em `loadOrders`, guards `restaurantId`, `toUserMessage` em todos os catch, polish "Modo Piloto", `loadTasks` silencioso.
