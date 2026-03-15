# Auditoria: causa real dos 400 em `/admin/config/general` (tenant resolution)

## 1. Estado verificado

| Item | Estado |
|------|--------|
| Ordem no frontend | Correta: 1º `gm_restaurant_members`, 2º `gm_restaurants` (Supabase). Não alterar. |
| Migrações no repo | Existem e estão corretas: `20260310000000` (gm_restaurants.disabled_at + outras colunas), `20260310100000` (gm_restaurant_members.disabled_at). |
| Baseline (20260222111218) | `gm_restaurants` e `gm_restaurant_members` **não** têm coluna `disabled_at`. |
| RLS no repo (20260224) | Nenhuma policy em `gm_restaurants` nem em `gm_restaurant_members` referencia `disabled_at`. As policies usam apenas `id`, `owner_id`, `user_id`, `restaurant_id`. |

Conclusão: o código do repositório não exige `disabled_at`. Os 400 indicam que **no projeto Supabase em uso** (1) as migrações que adicionam `disabled_at` não foram aplicadas, ou (2) existem objetos criados fora do repo (Dashboard/manual) que referenciam `disabled_at`.

---

## 2. Erro real de `gm_restaurant_members`

- **No frontend:** só se vê `GET .../gm_restaurant_members?select=restaurant_id&limit=1` → **400 (Bad Request)**. O body da resposta não está nos logs.
- **Como obter o erro exato:** no browser, abrir DevTools → Network → recarregar `/admin/config/general` → clicar no request que falha para `gm_restaurant_members` → tab **Response** (ou **Preview**). O body típico do PostgREST é JSON, ex.: `{"code":"...","message":"...","details":"..."}`.
- **Hipótese mais provável:**  
  - **A)** A policy `owner_manage_members` em `gm_restaurant_members` faz `SELECT id FROM gm_restaurants WHERE owner_id = auth.uid()`. Ao avaliar essa subquery, o Postgres aplica as RLS de `gm_restaurants`. Se existir no projeto uma policy em `gm_restaurants` que use `disabled_at` (ex.: `USING (disabled_at IS NULL)`), o erro será "column \"disabled_at\" does not exist" e o **status 400 pode ser devolvido no contexto do request a `gm_restaurant_members`**.  
  - **B)** Ou existe uma policy em `gm_restaurant_members` (criada no Dashboard) com `USING (disabled_at IS NULL)` e a tabela ainda não tem a coluna.

Por isso é essencial **capturar o body do 400** do request a `gm_restaurant_members` para distinguir A de B e confirmar a tabela/coluna referida na mensagem.

---

## 3. Erro real de `gm_restaurants`

- **Mensagem confirmada nos logs:** `[RuntimeReader] fetchFirstRestaurantId {error: 'column "disabled_at" does not exist'}`.
- **Causa:** A tabela `gm_restaurants` no Supabase **não** tem a coluna `disabled_at`, mas algum objeto (policy, trigger ou view) referenciado na execução da query **usa** essa coluna. Como o cliente pede apenas `select=id&limit=1`, o problema não é o select list e sim a avaliação de RLS (ou trigger/view) que referencia `disabled_at`.
- **Objeto(s) prováveis:** (1) Policy em `gm_restaurants` criada manualmente no Dashboard (ex.: "só restaurantes ativos" com `disabled_at IS NULL`), ou (2) view/função/trigger que referencia `gm_restaurants.disabled_at`. No repo não existe nenhuma policy com `disabled_at`.

---

## 4. Objeto(s) do Supabase responsáveis

| Tipo | Tabela | O que verificar |
|------|--------|------------------|
| **Coluna em falta** | `gm_restaurants` | Coluna `disabled_at` não existe no schema atual (baseline não a cria). |
| **Coluna em falta** | `gm_restaurant_members` | Coluna `disabled_at` pode não existir; se alguma policy/view a usar, dá 400. |
| **Policy (possível)** | `gm_restaurants` | Policies criadas no Dashboard que usem `disabled_at` (ex.: `USING (disabled_at IS NULL)`). O ficheiro `20260224_core_rls_policies.sql` **não** referencia `disabled_at`. |
| **Policy (possível)** | `gm_restaurant_members` | Idem; ou o 400 vem em cascata da subquery a `gm_restaurants`. |
| **View / function / trigger** | Qualquer | Objetos que referenciem `gm_restaurants.disabled_at` ou `gm_restaurant_members.disabled_at`. |

Para listar exatamente o que está no projeto: executar no **SQL Editor do Supabase** o script `merchant-portal/scripts/supabase-audit-disabled-at.sql` e guardar o resultado (secções A–C: RLS, colunas, views, funções, triggers de ambas as tabelas; e policies em qualquer tabela que mencionem `disabled_at`).

---

## 5. Próximo passo único

**Aplicar as duas migrações no projeto Supabase e recarregar o schema do PostgREST.**

1. No Supabase Dashboard: **SQL Editor**.
2. Correr, por ordem, o conteúdo destes ficheiros do repo:
   - `supabase/migrations/20260310000000_gm_restaurants_supabase_optional_columns.sql`
   - `supabase/migrations/20260310100000_gm_restaurant_members_disabled_at.sql`
3. Depois executar:  
   `NOTIFY pgrst, 'reload schema';`
4. (Opcional mas recomendado) Capturar o **body da resposta 400** do request a `gm_restaurant_members` (Network → request → Response) antes de aplicar, para confirmar se a mensagem é a mesma de `gm_restaurants` ou outra.
5. Hard refresh em `/admin/config/general` e verificar: os dois 400 devem desaparecer se não existirem policies/views/triggers manuais que exijam outras colunas em falta.

Se após aplicar as migrações e o `NOTIFY` os 400 continuarem, executar o script de auditoria ampliado (abaixo) no SQL Editor e partilhar o resultado (policies, views, funções, triggers e colunas atuais das duas tabelas) para identificar o objeto exato que ainda referencia `disabled_at` ou outra coluna inexistente.
