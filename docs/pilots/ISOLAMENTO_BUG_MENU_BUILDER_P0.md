# Isolamento do bug Menu Builder (P0) — Unexpected token '<'

**Data:** 2026-02-02
**Referência:** [BACKLOG_72H_POS_TESTE_HUMANO.md](./BACKLOG_72H_POS_TESTE_HUMANO.md) P0 · [CONTRATO_PRONTIDAO_DADOS.md](../contracts/CONTRATO_PRONTIDAO_DADOS.md)

---

## O que acontece

O frontend (Menu Builder) chama a API para `gm_products` (criar/ler produtos). A resposta esperada é **JSON**. Quando recebe **HTML** (ex.: página de erro 502 ou index.html), o cliente faz `response.json()` ou parse e dispara **"Unexpected token '<'"** — porque HTML começa com `<`.

---

## Cadeia completa (quem responde)

```text
Frontend (React/Vite :5175)
  → CONFIG.SUPABASE_URL (merchant-portal/src/config.ts)
  → Se VITE_SUPABASE_URL vazio em DEV: window.location.origin = http://localhost:5175
  → Pedido: GET/POST http://localhost:5175/rest/v1/gm_products
  → Vite dev server (Node) recebe o pedido
  → Proxy (vite.config.ts): /rest → target http://localhost:3001
  → Se Core (3001) está UP: pedido vai para nginx:3001 → PostgREST → JSON
  → Se Core (3001) está DOWN: proxy falha → Vite devolve 502 ou página de erro (HTML)
```

**Conclusão:** O "Node" que devolve HTML não é o Core (PostgREST). É o **Vite dev server** (Node) quando o **proxy falha** (Core em 3001 não está a correr). O frontend pede JSON ao origin (5175); o Vite devolve HTML de erro → Unexpected token '<'.

---

## Onde está cada peça

| Camada                    | Onde                                                 | Papel                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Backend (Docker)** | `docker-core/` — PostgREST + nginx na porta **3001** | Responde a `/rest/v1/*` com JSON (gm_products, RPCs, etc.). Se não estiver a correr, não há resposta.                                                 |
| **Frontend (Vite)**       | `merchant-portal/` — dev server na porta **5175**    | Em DEV, se SUPABASE_URL for 5175, o pedido vai para 5175; Vite faz proxy `/rest` → 3001. Se 3001 falhar, Vite devolve HTML de erro.                   |
| **Config**                | `merchant-portal/src/config.ts`                      | SUPABASE_URL: se `VITE_SUPABASE_URL` vazio em DEV, usa `window.location.origin` (5175). Se for `http://localhost:3001`, pedidos vão directos ao Core. |

---

## Causa raiz (resumo)

1. **Core (3001) não está a correr** → proxy Vite falha → Vite devolve HTML (502/erro) → frontend faz parse como JSON → "Unexpected token '<'".
2. **Alternativa:** Se `VITE_SUPABASE_URL=http://localhost:3001`, o pedido vai directo ao Core. Se Core estiver down, o fetch falha com "Failed to fetch" (sem HTML) → o frontend já trata como `isBackendUnavailable` e mostra fallback.

---

## O que já foi feito (frontend — P0)

- **MenuBuilderCore:** Em falha de API (HTML/rede), guardar no pilot local e mostrar "Produto guardado localmente (servidor indisponível)".
- **ProductReader / MenuWriter:** Tratamento de erro não-JSON (`isBackendUnavailable`, `isNonJsonResponse`) e fallback para dados locais.
- Assim, mesmo com Core em baixo ou proxy a devolver HTML, o utilizador **não** vê "Unexpected token" nem ecrã em branco; vê produto guardado localmente.

---

## Checklist Node/Core para P0 (opcional)

Para reduzir a hipótese de o frontend receber HTML em vez de JSON:

1. **Dev com Docker Core:** Definir `VITE_SUPABASE_URL=http://localhost:3001` no `.env` ou `.env.local` do merchant-portal. Assim os pedidos vão **directos** ao Core; se o Core estiver down, o fetch falha com erro de rede (tratado como backend indisponível), não com HTML.
2. **Documentar no .env.example:** Adicionar comentário e exemplo para Docker Core: `# Docker Core (local): VITE_SUPABASE_URL=http://localhost:3001`
3. **Garantir Core a correr em 3001:** `docker compose -f docker-core/docker-compose.core.yml up -d` antes de usar Menu Builder com persistência real.

O frontend já está resiliente (fallback + mensagem clara). Estes passos tornam o caminho "Core up" explícito e evitam depender do proxy quando o Core está disponível.

---

## Frase definitiva

**"Unexpected token '<'"** = o frontend pediu JSON e recebeu HTML. Quem devolve esse HTML em dev é o **Vite (Node)** quando o proxy para o Core (3001) falha — não é o PostgREST. O Core (Node/PostgREST em 3001) só responde quando está up; quando está down, o proxy falha e o Vite devolve página de erro. A correção P0 no frontend (fallback + copy honesta) já mitiga; definir `VITE_SUPABASE_URL=http://localhost:3001` quando se usa Docker Core evita passar pelo proxy e reduz o cenário em que se recebe HTML.

> Se vires "Unexpected token '<'" em DEV, não é bug de dados. É o Vite a devolver HTML porque o Core (3001) não está a responder. A UI já é resiliente; o Core só precisa estar up.
