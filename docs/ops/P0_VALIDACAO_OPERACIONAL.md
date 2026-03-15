# Validação operacional P0 — Fluxo soberano

**Data:** 2026-03-10  
**Objetivo:** Validar fim a fim os P0 do fluxo soberano no ambiente local (Supabase/Core).

---

## 1. Passos executados

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Verificar `.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) | OK — variáveis presentes |
| 2 | Aplicar schema soberano: `pnpm tsx scripts/apply-sovereign-schema.ts` | OK — migration aplicada, PostgREST notificado |
| 3 | Seed canónico: `pnpm tsx scripts/seed-e2e-user.ts` | OK — user + company + membership criados. Restaurante já existia (slug único); script ajustado para usar restaurante existente e criar membership (fallback). |
| 4 | Smoke-test TPV: `pnpm run smoke:tpv-rpcs` | OK — `create_order_atomic` executado com sucesso; `create_device_pairing_code` 404 (não presente no schema Supabase atual, esperado). |

---

## 2. Credenciais para login (último seed)

- **Email:** `sovereign.test.1773497380004@chefiapp.com`
- **Password:** `password123`
- **Nome:** Sovereign Tester  
(Valores também em `merchant-portal/tests/e2e/e2e-creds.json`.)

---

## 3. Critérios de validação

### Automatizados (executados)

- Schema soberano aplicado no Supabase.
- Seed canónico executado com sucesso (user + company + membership owner).
- Smoke-test TPV: RPC `create_order_atomic` disponível e utilizável; `create_device_pairing_code` ausente no schema (404), conforme documentado.

### Manuais (a executar no browser)

1. **Sem login**  
   Abrir `http://localhost:5175/admin/modules` sem sessão (ou após logout).  
   **Esperado (P0.3):** `TenantContext` mostra erro explícito: *"Inicie sessão para aceder ao restaurante."*

2. **Com login, sem membership**  
   (Cenário teórico: user sem linha em `gm_restaurant_members`.)  
   **Esperado (P0.3):** Erro explícito: *"Nenhum restaurante associado a esta conta. Execute o seed canónico ou contacte o administrador."*

3. **Com login e membership**  
   - `pnpm --filter merchant-portal run dev`  
   - Abrir `http://localhost:5175/auth` (ou `/auth/login`)  
   - Login com o email/password do seed acima  
   - Ir a `/admin/modules`  
   **Esperado:** Topbar mostra nome do utilizador (Sovereign Tester), restaurante correto (Sovereign Burger Hub) e papel **owner**.

---

## 4. Ajuste realizado durante a validação

- **Seed com slug duplicado:** Quando a inserção em `gm_restaurants` falhava por `gm_restaurants_slug_key` (restaurante já existente), o novo user ficava sem membership. Foi adicionado fallback no seed: em caso de falha, obter restaurante existente por `slug = 'sovereign-burger-hub'` e criar membership owner para o user criado nessa execução. Re-executando o seed, o user passou a ter membership e a validação fica completa do lado servidor.

---

## 5. Estado final

| P0 | Estado |
|----|--------|
| P0.1 Seed canónico | Validado — seed executa e cria user + company + membership (com fallback para restaurante existente). |
| P0.2 Login Supabase | Implementado — validação no browser com as credenciais acima. |
| P0.3 TenantContext | Implementado — erros explícitos sem sessão / sem membership; validação manual no browser. |
| P0.4 Smoke-test TPV | Validado — `create_order_atomic` OK; `create_device_pairing_code` 404 (documentado). |
| P0.5 Docs / bootstrap | Validado — secção 4.1 do roadmap e scripts seguidos com sucesso. |

**Conclusão:** A validação operacional dos P0 foi executada. Schema, seed e smoke-test TPV estão OK. Falta apenas a confirmação no browser (login + topbar com owner e restaurante), conforme passos da secção 3.
