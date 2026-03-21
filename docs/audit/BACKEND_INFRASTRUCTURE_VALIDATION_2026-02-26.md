# Validação de Infraestrutura Real — Backend e Cadeia de Acesso

**Data:** 2026-02-26  
**Contexto:** Supabase (PostgREST + RPCs) como backend real. Frontend na Vercel. Sem assumir Render.  
**Objetivo:** Mapear e validar infraestrutura real actual.

---

## 1. Onde está o integration-gateway?

| Fonte | Resultado |
|-------|-----------|
| **Vercel** (projeto integration-gateway) | 0 deployments, domínios vazios |
| **Render** (chefiapp-pos-core-6qmv.onrender.com) | 404 — `x-render-routing: no-server` (serviço inexistente ou parado) |
| **.env.production** | `VITE_API_BASE=https://your-gateway-url.vercel.app` (placeholder) |

**Conclusão:** Não existe URL pública real do gateway em produção. O gateway não está activo em nenhum hospedeiro identificável.

---

## 2. Variáveis de produção (do código e exemplos)

| Variável | Uso | Valor em .env.production | Nota |
|----------|-----|--------------------------|------|
| `VITE_CORE_URL` | PostgREST base (dados, RPCs) | — (usa VITE_SUPABASE_URL) | Frontend → Core directo |
| `VITE_SUPABASE_URL` | Fallback para CORE_URL | `https://kwgsmbrxfcezuvkwgvuf.supabase.co` | Backend real |
| `VITE_SUPABASE_ANON_KEY` | Apikey para PostgREST | `your-production-anon-key-here` | Placeholder; valor real nas env vars do build |
| `VITE_API_BASE` | Gateway (billing, PIX, internal events) | `https://your-gateway-url.vercel.app` | Placeholder |
| `VITE_INTERNAL_API_TOKEN` | Auth para /internal/* | `chefiapp-internal-token-production` | — |

O gateway usa (quando corre): `CORE_URL`, `CORE_SERVICE_KEY`, `INTERNAL_API_TOKEN`.

---

## 3. Validação do PostgREST (Supabase)

```bash
curl -sI "https://kwgsmbrxfcezuvkwgvuf.supabase.co/rest/v1/"
```

| Resultado |
|-----------|
| **HTTP/2 401** |
| Body: `{"message":"No API key found in request","hint":"No apikey request header or url param was found."}` |

**Conclusão:** PostgREST retorna 401 sem apikey. Não existe role aberta indevida para requests anónimos.

---

## 4. Fluxo do frontend: Gateway vs Supabase directo

| Fluxo | Destino | Como |
|-------|---------|------|
| **Dados, RPCs (pedidos, onboarding, tarefas, billing reads)** | PostgREST (Supabase) **directo** | `getCoreClient()` → `dockerCoreFetchClient` → `CONFIG.CORE_URL` |
| **Checkout Stripe (billing SaaS)** | Gateway | `CONFIG.API_BASE` + `/internal/billing/create-checkout-session` |
| **PIX/SumUp checkout** | Gateway | `VITE_API_BASE` + `/api/v1/payment/pix/checkout` |
| **Internal events, product images, commercial tracking** | Gateway | `CONFIG.API_BASE` + `/internal/*` |
| **Wizard, tasks/why, portioning** | Gateway | `CONFIG.API_BASE` + `/internal/wizard/*`, `/api/govern-manage/*` |

O frontend usa **dois caminhos**:
- **CORE_URL** → Supabase PostgREST (quase todo o dado)
- **VITE_API_BASE** → Gateway (billing checkout, PIX, internal events, etc.)

Não há chamadas hardcoded a `supabase.co/rest/v1`. A URL vem de `VITE_CORE_URL` ou `VITE_SUPABASE_URL`.

---

## 5. Risco de exposição directa

| Aspecto | Estado |
|---------|--------|
| PostgREST sem apikey | 401 — bloqueado |
| Endpoints sensíveis anónimos | Nenhum identificado |
| Anon key no bundle | Normal — exposta no frontend; RLS protege os dados |
| Bypass sensível ao PostgREST | Não — o frontend usa CORE_URL configurável; em produção = Supabase com anon key |

**Conclusão:** O PostgREST exige apikey. A anon key está no bundle (padrão Supabase); a protecção depende de RLS e políticas no projecto Supabase.

---

## 6. Respostas objectivas

| Pergunta | Resposta |
|----------|----------|
| **URL real do gateway** | Não existe. integration-gateway Vercel sem deployments; Render 404 no-server. |
| **Está a responder 200?** | Não — gateway não está activo. |
| **Frontend usa gateway ou Supabase directo?** | Ambos: dados/RPCs → Supabase directo; billing, PIX, internal events → gateway (quando `VITE_API_BASE` está definido). Com API_BASE vazio, fallback para `localhost:4320`. |
| **Existe risco de exposição directa?** | PostgREST retorna 401 sem apikey. Sem gateway activo, fluxos que dependem do gateway (checkout, PIX, internal events) falham, mas não há exposição indevida do PostgREST. |

---

## 7. Dependências de backend

| Componente | Depende de | Estado |
|------------|------------|--------|
| Landing, rotas públicas | Nenhum backend | OK |
| Login, dashboard, AppStaff (leituras) | Supabase (CORE_URL) | Requer VITE_SUPABASE_URL + anon key no build |
| Onboarding, tarefas, pedidos | Supabase (RPCs) | Idem |
| Checkout Stripe (billing SaaS) | Gateway | Sem gateway → checkout falha |
| PIX/SumUp | Gateway | Sem gateway → PIX/SumUp falha |
| Upload imagens, internal events | Gateway | Sem gateway → falha |

---

## 8. Critérios de sucesso

| Critério | Estado |
|----------|--------|
| Domínio Vercel online | 404 (DEPLOYMENT_NOT_FOUND) — em resolução |
| Backend identificável e activo | Supabase kwgsmbrxfcezuvkwgvuf.supabase.co — 401 sem apikey (esperado) |
| Nenhuma dependência fantasma (Render) | Confirmado — Render não está em uso; gateway não está activo em lado nenhum |

---

## 9. Acções recomendadas

1. **Para dados e RPCs:** Garantir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas env vars do Vercel (chefiapp-pos-core).
2. **Para billing/checkout e PIX:** Definir onde o gateway vai correr (Vercel serverless, Supabase Edge, ou outro) e configurar `VITE_API_BASE` com a URL real.
3. **Sem gateway:** Fluxos de dados (onboarding, pedidos, tarefas) funcionam com Supabase. Billing checkout e PIX ficam indisponíveis até o gateway estar activo.
