# Auditoria: Chaves e segredos no client (DoD 2026)

**Data:** 2026-02-22  
**Ref:** Plano Migração + DoD 2026, Parte B1.

---

## 1. Nenhuma service_role no bundle

- **Regra:** O bundle do merchant-portal (Vite build) não deve incluir nem ler `SUPABASE_SERVICE_ROLE_KEY` nem `VITE_SUPABASE_SERVICE_ROLE`.
- **Auditoria:** Pesquisa em `merchant-portal/src` por `SERVICE_ROLE`, `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_SERVICE_ROLE`.
- **Resultado:** Nenhuma referência no código do portal. A única ocorrência está em `merchant-portal/src/core/scripts/verify_recipe_deduction.ts`, que é um **script Deno** executado fora do Vite (ferramenta de dev/admin).
- **Conclusão:** O PWA nunca usa service_role. Scripts em `merchant-portal/scripts/` e `merchant-portal/src/core/scripts/` são apenas para ferramentas/dev; não fazem parte do bundle e não devem ser usados no browser.

---

## 2. Nenhuma API key secreta Stripe/SumUp no frontend

- **Regra:** Chaves **secretas** (Stripe secret key, SumUp API key) nunca no client. Apenas chaves públicas (ex.: `VITE_STRIPE_PUBLIC_KEY`) são aceitáveis.
- **Auditoria:** Pesquisa por `VITE_STRIPE_SECRET`, `VITE_SUMUP_API_KEY`, `VITE_STRIPE_SECRET_KEY`, variáveis que contenham "SECRET" ou "API_KEY" para Stripe/SumUp no frontend.
- **Resultado:** O frontend usa apenas `VITE_STRIPE_PUBLIC_KEY` / `VITE_STRIPE_PUBLISHABLE_KEY` (config.ts). Não existe `VITE_STRIPE_SECRET_KEY`, `VITE_SUMUP_API_KEY` nem equivalentes no código do portal.
- **Conclusão:** Conforme DoD. Pagamentos e checkouts passam pelo integration-gateway ou Edge Functions, que usam segredos apenas no servidor.

---

## 3. Configuração recomendada

- **CORE / PostgREST:** Usar apenas `VITE_CORE_ANON_KEY` ou `VITE_SUPABASE_ANON_KEY` no client.
- **Gateway / Edge:** Usar `VITE_API_BASE` e `VITE_INTERNAL_API_TOKEN` para chamadas autenticadas ao gateway; o token é interno e não é uma chave de API de terceiros.
- **Stripe (client):** Apenas `VITE_STRIPE_PUBLIC_KEY` para elementos de pagamento no browser.

---

## 4. Logs e audit com restaurant_id

- **Regra:** Revisar pontos de log (Logger, Sentry) para incluir `restaurant_id` onde aplicável (sync, pagamento, fila).
- **Estado:** O `Logger` já suporta contexto com `restaurant_id` (`LogContext.restaurant_id`). Os transports recebem `meta` com esse valor quando a aplicação chama `Logger.setContext({ restaurant_id })`.
- **Recomendação:** Garantir que, em rotas/contextos onde o restaurante está definido (TPV, Admin, Sync), se faça `Logger.setContext({ restaurant_id })` (ou equivalente) para que erros e logs estruturados incluam o tenant. Sentry tags (`restaurant_id`, `app`, `route`, `connectivity`) são configuradas no DoD B4.
