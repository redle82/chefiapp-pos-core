# B1 — Contenção: Cardápio (0–12h)

**Objetivo B1:** Criar 1 produto, persistir, zero "Failed to fetch" visível ao dono.  
**Regra:** Sovereignty v1 intacta; contenção temporária documentada (48h fluxo feliz).

---

## 1. Onde ocorre o erro

| Etapa | Ficheiro | Chamada | Backend |
|-------|----------|---------|---------|
| **Criar produto** | `core-boundary/writers/MenuWriter.ts` | `createMenuItem()` → `dockerCoreClient.from('gm_products').insert()` | PostgREST (Docker Core) |
| **Listar produtos** | `core-boundary/readers/ProductReader.ts` | `readProductsByRestaurant()` → `dockerCoreClient.from('gm_products').select()` | PostgREST |
| **Listar categorias** | `core-boundary/readers/RestaurantReader.ts` | `readMenuCategories()` → `dockerCoreClient.from('gm_menu_categories').select()` | PostgREST |
| **UI** | `pages/MenuBuilder/MenuBuilderCore.tsx` | `handleCreate()` → `createMenuItem()` + `readProductsByRestaurant()` | — |

**URL do Core:** `VITE_SUPABASE_URL` ou `http://localhost:3001` (ver `core-boundary/docker-core/connection.ts`).

---

## 2. Causa raiz de "Failed to fetch"

- **Docker Core (PostgREST) não está a correr** em `localhost:3001` (ou URL em env).
- **Rede / CORS:** browser bloqueia ou servidor inacessível.
- **Env errado:** `VITE_SUPABASE_URL` aponta para Supabase em vez de PostgREST, ou porta errada.

Quando qualquer chamada `dockerCoreClient.from(...)` falha por rede, o browser devolve "Failed to fetch"; o código propaga o erro e a UI mostra mensagem técnica.

---

## 3. Contenção aplicada (B1 — temporária)

**Decisão:** Fallback em **localStorage** quando o Core não responde (erro de rede). Permite ao dono criar e ver produtos mesmo sem Core; ao voltar o Core, o fluxo normal prevalece.

| Componente | Comportamento |
|------------|----------------|
| **MenuWriter.createMenuItem** | Se a chamada ao Core falhar com erro de rede (ex.: "Failed to fetch"), grava o produto em `chefiapp_menu_pilot_{restaurantId}` (array em localStorage) e devolve sucesso sintético. |
| **ProductReader.readProductsByRestaurant** | Se a chamada ao Core falhar, lê produtos de `chefiapp_menu_pilot_{restaurantId}` e devolve; se não houver nada, array vazio. |
| **Categorias** | Se `readMenuCategories` falhar, a UI usa lista vazia (produto sem categoria, `category_id: null`). |

**Chave localStorage:** `chefiapp_menu_pilot_{restaurantId}` — array de objetos `{ id, name, price_cents, station, prep_time_seconds, available, ... }`.

**Remoção futura:** Quando o fluxo feliz estiver estável com Core sempre disponível, remover o fallback e documentar em B1 como concluído.

---

## 4. UX mínima (B1)

- **Ao salvar produto:** Mensagem explícita "Produto criado" (nunca "Failed to fetch" nem stack).
- **Lista:** Atualiza logo após criar; refresh da página mantém produtos (Core ou localStorage).
- **Erro visível:** Zero mensagens técnicas; se algo falhar, mensagem neutra: "Não foi possível guardar. Tente novamente."

---

## 5. Critério de sucesso B1

- [ ] Dono cria 1 produto a partir do Menu Builder (rota `/menu-builder` ou painel no dashboard).
- [ ] Persistência: após refresh, o produto continua visível (Core ou fallback).
- [ ] Nenhum "Failed to fetch" nem mensagem técnica exposta ao utilizador.
- [ ] Mensagem "Produto criado" (ou equivalente) ao guardar.

---

## 6. Plano técnico de contenção — decisões

### Decisão tomada

| Opção | Escolha | Motivo |
|-------|---------|--------|
| **A. Mock local (localStorage)** | ✅ **Implementado** | Desbloqueia o dono sem Core; persistência após refresh; zero mudança de API. |
| **B. Fallback API** | ❌ Não | Exigiria endpoint alternativo; mais superfície. |
| **C. Feature flag (MENU_PILOT_MODE)** | ❌ Não | Aumenta ramos; fallback automático por erro de rede é suficiente. |

**Regra de ativação:** O fallback só entra quando **isNetworkError(err)** — mensagem contém "failed to fetch" ou "network" ou "load failed". Core em cima tem sempre prioridade.

---

### Onde está implementado

| Ficheiro | Alteração |
|----------|-----------|
| `core-boundary/menuPilotFallback.ts` | Novo: `pilotMenuKey`, `getPilotProducts`, `addPilotProduct`, `isNetworkError`. |
| `core-boundary/writers/MenuWriter.ts` | `createMenuItem`: try/catch; em rede falhada → `addPilotProduct` + return sintético. |
| `core-boundary/readers/ProductReader.ts` | `readProductsByRestaurant`: try/catch; em rede falhada → `getPilotProducts` + return. |
| `pages/MenuBuilder/MenuBuilderCore.tsx` | `loadData`: em rede falhada → categorias `[]` + produtos do fallback; `handleCreate`: `toUserMessage` + "Produto criado"; bloco UI `successMessage`. |

**Chave localStorage:** `chefiapp_menu_pilot_{restaurantId}`. Formato: array JSON de `PilotProductStored`.

---

### Alternativas descartadas (e porquê)

- **Guardar produtos em Supabase em vez de Core:** Quebraria soberania (Core = fonte para gm_products). Não.
- **Mostrar "Modo Piloto" quando fallback ativo:** Aumenta ruído; dono só precisa de "Produto criado" e lista a funcionar. Opcional para B4.
- **Sincronizar localStorage → Core quando Core voltar:** Escopo fora das 48h; pode ser fase 2.

---

### Critérios para remover a contenção

1. Fluxo feliz estável com Core sempre disponível em ambiente piloto.
2. Zero reclamações de "Failed to fetch" ou "não guarda" no cardápio.
3. Decisão explícita: "B1 contenção concluída" → remover `menuPilotFallback.ts`, ramos try/catch em MenuWriter e ProductReader, e lógica de fallback em MenuBuilderCore.loadData.

---

## Implementação B1 (estado)

| Item | Estado | Onde |
|------|--------|------|
| menuPilotFallback.ts | Feito | `pilotMenuKey`, `getPilotProducts`, `addPilotProduct`, `isNetworkError`. |
| MenuWriter.createMenuItem fallback | Feito | try/catch; em rede falhada → `addPilotProduct` + return sintético. |
| ProductReader.readProductsByRestaurant fallback | Feito | try/catch; em rede falhada → `getPilotProducts`. |
| MenuBuilderCore loadData + handleCreate | Feito | loadData: fallback produtos; handleCreate: `toUserMessage`; mensagem "Produto criado". |

B1 contenção implementada; critérios de sucesso validáveis com teste manual (Core up/down, refresh).

---

## Referências

- Plano 48h: fluxo feliz (Landing → Signup → 1 produto → Publicar → TPV → 1 pedido → KDS).
- `core-boundary/docker-core/connection.ts` — URL e cliente do Core.
- `docs/product/VALIDACAO_OPERACAO_PILOTO_01.md` — registo do piloto.
