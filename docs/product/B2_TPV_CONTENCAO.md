# B2 — Contenção: TPV Operação (12–24h)

**Objetivo B2:** Dono entra em `/op/tpv`, cria 1 pedido, finaliza, sem crash, sem reset, sem erro técnico visível.  
**Regra:** Sovereignty v1 intacta; contenção temporária documentada (48h fluxo feliz). Não refatorar arquitetura; só contenção de runtime + UX mínima.

---

## 1. Onde ocorrem crashes / erros

| Etapa | Ficheiro | Risco |
|-------|----------|--------|
| **Entrada** | `App.tsx` → `RequireOperational` → `OperationalFullscreenWrapper` → `TPVMinimal` | Nenhum ErrorBoundary em volta do TPV; qualquer throw em filho = ecrã branco / reset. |
| **Gate** | `RequireOperational.tsx` | Mostra "Verificando..." ou "Sistema não operacional"; não lança. |
| **Carregar produtos** | `TPVMinimal.tsx` → `loadProducts()` (fetch ao Core) | Falha de rede → `setError(err.message)` → "Failed to fetch" ou texto técnico visível. |
| **Criar pedido** | `TPVMinimal.tsx` → `handleCreateOrder()` → `OrderWriter.createOrder()` (fetch RPC) | Falha de rede/RPC → `setError(err.message)` → mensagem técnica. |
| **Runtime / Shift** | `useRestaurantRuntime()`, `useShift()` | Se contexto null/undefined e código não defensivo → possível throw em render. |
| **ModeGate** | `TPVMinimal` → `ModeGate` (allow pilot/live) | Fallback = `DemoExplicativoCard`; fora de pilot/live não mostra TPV real. |

**URL do Core:** `VITE_SUPABASE_URL` ou `http://localhost:3001` (idem B1). RPC: `/rest/v1/rpc/create_order_atomic` (PostgREST).

---

## 2. Causas raiz

- **Crash React:** Erro não capturado em TPVMinimal ou filhos → nenhum ErrorBoundary na rota `/op/tpv` → ecrã branco ou mensagem de erro do React.
- **Reset de estado:** Refresh ou re-mount limpa carrinho/estado; dono perde contexto.
- **Core inacessível:** Fetch a produtos ou a `create_order_atomic` falha → "Failed to fetch" ou resposta de erro exposta na UI.
- **Dependências não carregadas:** Runtime/Shift em loading ou indisponível; código que assume sempre definido pode lançar.

---

## 3. Contenção a aplicar (B2 — temporária)

**Decisão:** (1) ErrorBoundary operacional em volta do TPV com fallback neutro; (2) guards defensivos (runtime/shift); (3) mensagens neutras (zero stack/tek); (4) fallback de dados quando Core falha (produtos do piloto B1 ou lista mínima fake para 1 pedido).

| Medida | Comportamento |
|--------|----------------|
| **ErrorBoundary em /op/tpv** | Envolver `TPVMinimal` (ou `OperationalFullscreenWrapper` > TPVMinimal) num ErrorBoundary com fallback: "TPV temporariamente indisponível. Tente novamente ou volte ao portal." Sem mostrar `error.message` nem stack. |
| **Guards defensivos** | Em TPVMinimal: não assumir `runtime` ou `isShiftOpen` como sempre definidos; evitar acesso a propriedades que possam ser null em render. |
| **Carregar produtos** | Se fetch falhar (rede): usar fallback — produtos do B1 (localStorage `chefiapp_menu_pilot_{restaurantId}`) ou lista mínima (1 produto fake "Item piloto") para permitir 1 pedido; nunca mostrar "Failed to fetch". |
| **Criar pedido** | Se `createOrder` falhar: mensagem neutra "Não foi possível registar o pedido. Tente novamente." (via `toUserMessage` ou equivalente). Opcional: em modo piloto, guardar pedido em localStorage e mostrar "Pedido guardado (modo piloto)" para não bloquear. |
| **UX mínima** | Zero stack traces; zero "Failed to fetch"; zero nomes de RPC/URL. Mensagens: indisponível / tente novamente / pedido guardado. |

**Remoção futura:** Quando TPV estiver estável com Core sempre disponível e sem crashes reportados, remover fallbacks e documentar B2 como concluído.

---

## 4. UX mínima (B2)

- **Ao abrir TPV:** Se tudo ok → TPV normal. Se crash → fallback ErrorBoundary: "TPV temporariamente indisponível. Tente novamente ou volte ao portal." + link para dashboard.
- **Ao carregar produtos:** Se Core falhar → usar lista fallback (B1 ou 1 item fake); não mostrar erro de rede.
- **Ao criar pedido:** Sucesso → "Pedido #xxx criado com sucesso! Total: € X,XX". Falha → "Não foi possível registar o pedido. Tente novamente."
- **Nunca:** Stack trace, "Failed to fetch", nome de RPC, URL ou código.

---

## 5. Critérios de sucesso B2

- [ ] Dono abre `/op/tpv` (restaurante publicado) e vê o TPV, não ecrã branco nem reset.
- [ ] Consegue carregar produtos (Core ou fallback) e adicionar ao carrinho.
- [ ] Consegue criar 1 pedido (Core ou fallback piloto) e ver mensagem de sucesso.
- [ ] Nenhum crash visível; nenhuma mensagem técnica exposta.
- [ ] Refresh não causa comportamento inesperado (estado pode resetar, mas não crash).

---

## 6. Plano técnico de contenção — decisões

### Decisão tomada

| Opção | Escolha | Motivo |
|-------|---------|--------|
| **A. ErrorBoundary operacional** | ✅ **Aplicar** | Evita ecrã branco; fallback neutro mantém confiança. |
| **B. Fallback de produtos** | ✅ **Aplicar** | Reutilizar B1 (localStorage) ou 1 item fake; dono nunca fica sem lista. |
| **C. Fallback de pedido (localStorage)** | 🟡 **Opcional** | Se criar pedido falhar, guardar em localStorage e mostrar "Pedido guardado (modo piloto)" desbloqueia; pode ser fase 2. |
| **D. Feature flag TPV_PILOT** | ❌ Não | Fallback por erro de rede/contexto é suficiente; menos ramos. |

**Regra de ativação:** ErrorBoundary sempre ativo (captura qualquer throw). Fallback de produtos quando fetch em TPVMinimal falhar (isNetworkError). Mensagens de erro sempre via `toUserMessage` (ou equivalente).

---

### Onde implementar

| Local | Alteração proposta |
|-------|---------------------|
| **App.tsx** (rota `/op/tpv`) | Envolver `OperationalFullscreenWrapper` (ou só `TPVMinimal`) em `<ErrorBoundary context="TPV" fallback={…} />` com fallback neutro (sem `error.message`). |
| **ui/design-system/ErrorBoundary.tsx** | Opcional: prop `hideTechnicalDetails` para fallback genérico "Módulo temporariamente indisponível" sem mostrar mensagem do erro. |
| **TPVMinimal.tsx** | (1) `loadProducts`: try/catch; em rede falhada, ler produtos de B1 (`getPilotProducts(restaurantId)`) ou lista mínima fake; (2) `setError(toUserMessage(err, "…"))` em todos os catch; (3) guards: não aceder a `runtime?.x` sem fallback. |
| **OrderWriter.createOrder** | Opcional B2: em erro de rede, não lançar; retornar resultado sintético e deixar UI mostrar "Pedido guardado (modo piloto)". Ou só mensagem neutra na UI e não persistir. |

**Fallback ErrorBoundary (texto sugerido):** "TPV temporariamente indisponível. Tente novamente ou volte ao portal." + botão/link para `/dashboard`.

---

### Alternativas descartadas (e porquê)

- **Refatorar TPV para módulos menores:** Fora do escopo 48h; contenção não exige reestruturação.
- **Mostrar "Modo Piloto" sempre que fallback ativo:** Aumenta ruído; basta mensagem neutra em caso de erro.
- **Desativar TPV quando Core está down:** Bloqueia o dono; fallback permite 1 pedido e confiança.

---

### Critérios para remover a contenção

1. TPV estável em ambiente piloto: zero crashes e zero reclamações de "não consigo fazer pedido" ou ecrã branco.
2. Core sempre disponível ou política clara de "TPV só com Core".
3. Decisão explícita: "B2 contenção concluída" → remover fallback de produtos em TPVMinimal, opcionalmente manter ErrorBoundary com fallback neutro como boa prática.

---

## 7. Implementação B2 (estado)

| Item | Estado | Onde |
|------|--------|------|
| ErrorBoundary em /op/tpv | ✅ Feito | App.tsx: rota `/op/tpv` envolvida em ErrorBoundary com fallback neutro ("TPV temporariamente indisponível…" + link Portal). Zero stack, zero error.message. |
| loadProducts() fallback B1 | ✅ Feito | TPVMinimal.tsx: em rede falhada usa getPilotProducts(restaurantId); mensagem de erro via toUserMessage. |
| handleCreateOrder() mensagem neutra | ✅ Feito | TPVMinimal.tsx: catch → toUserMessage(err, "Não foi possível registar o pedido. Tente novamente."). |
| Guards defensivos (runtime, shift) | ✅ Feito | TPVMinimal.tsx: runtimeContext?.runtime, runtime?.restaurant_id, shiftContext?.isShiftOpen; restaurantId dinâmico. |

---

## 8. Teste manual rápido

Executar antes do piloto. Servidor merchant-portal a correr (ex.: porta 5175); publicar restaurante para aceder a /op/tpv.

| Cenário | Passos | Resultado esperado |
|---------|--------|--------------------|
| **Core up** | Abrir /op/tpv → adicionar produto → criar pedido | Produtos do Core; pedido criado; mensagem "Pedido #xxx criado com sucesso!". |
| **Core down** | Parar Core → abrir /op/tpv | Produtos do fallback B1 (localStorage) ou lista vazia; sem "Failed to fetch". |
| **Refresh em /op/tpv** | Estar em /op/tpv → F5 | Página recarrega; sem ecrã branco; produtos voltam (Core ou fallback). |
| **Forçar erro (offline)** | DevTools → Network → Offline → criar pedido ou recarregar produtos | Mensagem neutra ou fallback; nunca stack nem "Failed to fetch". |
| **Crash simulado** | (Opcional) Lançar erro num filho do TPV (ex.: throw em render) | Fallback ErrorBoundary: "TPV temporariamente indisponível" + link Portal. |

Se todos passarem → piloto curto (Antigravity): signup → 1 produto → publicar → /op/tpv → 1 pedido.

---

## Referências

- Plano 48h: B1 (cardápio), B2 (TPV), B3/B4 (KDS + polish).
- `docs/product/B1_MENU_CONTENCAO.md` — fallback produtos (localStorage) reutilizável no TPV.
- `merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx` — ponto de entrada do TPV em `/op/tpv`.
- `merchant-portal/src/core-boundary/writers/OrderWriter.ts` — `createOrder` (RPC).
- `docs/product/VALIDACAO_OPERACAO_PILOTO_01.md` — registo do piloto.
