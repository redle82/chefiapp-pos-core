# FASE 5 — Supabase ON: variáveis e checklist de deploy

Documento opcional do Passo 1 da [FASE_5_CONSOLIDACAO_CHECKLIST.md](FASE_5_CONSOLIDACAO_CHECKLIST.md). Referência: `docs/ROADMAP_POS_FUNDACAO.md`, [FASE_5_ESTADO_REAL.md](FASE_5_ESTADO_REAL.md).

**Objetivo:** Em ambiente configurado para Supabase, login e dados fluem via Supabase; em ambiente Docker, comportamento mantido.

**Pré-requisito recomendado:** [FASE B — Teste Humano](FASE_5_FASE_B_TESTE_HUMANO.md) concluída com PASSOU (registar em [FASE_5_FASE_B_RESULTADO.md](FASE_5_FASE_B_RESULTADO.md)).

**Ciclo técnico do repo para Supabase ON encerrado.** Próxima ação: criar projeto em [supabase.com](https://supabase.com), aplicar migrations e definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no deploy (checklist abaixo).

**Começar aqui (próximo passo executável):** 1) Criar projeto em [supabase.com](https://supabase.com) → Settings → API (copiar URL + anon key). 2) Aplicar migrations: Dashboard → SQL Editor ou `supabase db push` (ficheiros em `supabase/migrations/`). 3) No deploy (Vercel/Netlify ou `.env` local): definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. 4) Auth → URL Configuration: adicionar redirect para o domínio da app. 5) Validar: abrir a app e fazer login.

---

## Fase técnica 1/3 — checklist executável (Supabase ON técnico mínimo)

Preparação silenciosa: código já pronto; falta configurar o projeto e o deploy.

| #   | Item                                                     | Onde                                                                                               |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | **Env** — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Vercel / Netlify (produção); `.env` local para testes.                                             |
| 2   | **Migrations** — schema aplicado                         | Supabase Dashboard → SQL Editor ou `supabase db push`; ficheiros em `supabase/migrations/`.        |
| 3   | **Auth** — redirect URLs                                 | Supabase Dashboard → Authentication → URL Configuration; domínio da app.                           |
| 4   | **Conexão** — já no código                               | `backendAdapter` + `supabaseClient` + `useSupabaseAuth` usam Supabase quando URL ≠ localhost/rest. |
| 5   | **Validação**                                            | Login na app; `npm run verify-deployment` (opcional; verifica env + type-check).                   |

Após 1–5: **Fase 1/3 concluída.** Seguir ordem em [FASE_5_ESTADO_REAL.md](FASE_5_ESTADO_REAL.md): ritual de irreversibilidade (2/3) → dados reais (3/3).

---

## Variáveis de ambiente (merchant-portal)

| Variável                 | Obrigatória (Supabase) | Descrição                                                                                                            |
| ------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Sim                    | URL do projeto Supabase (ex.: `https://xxx.supabase.co`). Em Docker local usa-se `/rest` ou `http://localhost:3001`. |
| `VITE_SUPABASE_ANON_KEY` | Sim                    | Chave pública (anon) do projeto. Nunca usar service_role no frontend.                                                |

**Referência:** `merchant-portal/.env.example` e `merchant-portal/.env.example.production`.

**Comportamento (backendAdapter):**

- Se `VITE_SUPABASE_URL` estiver definida e não for `localhost:3001` / `127.0.0.1:3001`, o backend é tratado como **Supabase** (Auth + PostgREST + Realtime via cliente Supabase).
- Se estiver vazia em produção, `getUrl()` devolve `""` e `getBackendConfigured()` é `false` (landing/demo sem backend).
- Se for localhost:3001 (ou `/rest`), o backend é **Docker** (PostgREST direto).

---

## Checklist de deploy Supabase (mínimo)

1. **Projeto Supabase**

   - Criar projeto em [supabase.com](https://supabase.com) ou self-hosted.
   - Obter Project URL e anon key em Settings → API.

2. **Schema**

   - Aplicar migrations em `supabase/migrations/` (ordem por timestamp).
   - Em cloud: Supabase Dashboard → SQL Editor ou CLI `supabase db push`. Em self-hosted: `psql` ou ferramenta equivalente.

3. **Variáveis no frontend (Vercel / Netlify / etc.)**

   - Definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente de produção.
   - Não expor `VITE_SUPABASE_SERVICE_ROLE_KEY` no frontend (apenas em Edge Functions ou scripts server-side).

4. **Auth**

   - Configurar Auth providers no Supabase (email, OAuth, etc.) conforme necessário.
   - URLs de redirect/confirmação devem apontar para o domínio da app.

5. **Validação**
   - Login na app com Supabase ativo e confirmar que dados (restaurantes, pedidos, etc.) são lidos/escritos via Supabase.
   - Script opcional: `merchant-portal/scripts/verify-deployment.ts` verifica presença de variáveis esperadas.

---

## Ordem recomendada

FASE 5 Passo 1 (Supabase ON) → Passo 2 (Dados reais) → Passo 3 (Alertas avançados) → Passo 4 (Relatórios). A entrada na FASE 5 é condicionada pela decisão de negócio (pós-€79).

**Após concluir este checklist:** ritual de irreversibilidade e primeiro cliente pagante — ver [FASE_5_ESTADO_REAL.md](FASE_5_ESTADO_REAL.md) e [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](../pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md).
