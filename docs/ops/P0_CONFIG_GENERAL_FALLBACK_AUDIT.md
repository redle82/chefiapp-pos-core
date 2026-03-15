# Auditoria: fallback fetchFirstRestaurantIdFromMembers (RuntimeReader.ts)

## Objetivo

Validar que a correção de frontend que adiciona o fallback por `gm_restaurant_members` está correta, só corre em backend Supabase e não introduz regressões.

---

## 1. Onde está o fallback

| Elemento | Localização | Descrição |
|----------|-------------|-----------|
| `fetchFirstRestaurantIdFromMembers()` | `RuntimeReader.ts` ~L165–175 | Função async que consulta `gm_restaurant_members` com `.select("restaurant_id").limit(1)`. Não consulta `gm_restaurants`. |
| Uso em `getOrCreateRestaurantId()` | `RuntimeReader.ts` ~L495–506 | Chamada apenas quando `fetchFirstRestaurantId()` devolve `null` **e** `CONFIG.isSupabaseBackend === true`. |
| Flag de cache | `RuntimeReader.ts` L105, L503 (em `resolveFirstRestaurantIdFromApi`) | `supabaseFirstRestaurantFailedOnce`: após uma ronda em que ambas as fontes falham, as chamadas seguintes não repetem as duas requests. |
| Single-flight | `RuntimeReader.ts` | `resolveFirstRestaurantIdFromApi()`: promessa partilhada (`resolveFirstIdFromApiPromise`); várias chamadas concorrentes a `getOrCreateRestaurantId()` partilham a mesma execução → no máximo 1 request a `gm_restaurants` + 1 a `gm_restaurant_members` por sessão, em vez de N×2. |

---

## 2. Decisão entre gm_restaurants e gm_restaurant_members

Fluxo em `getOrCreateRestaurantId()`:

1. **ID em localStorage**  
   Se existir `chefiapp_restaurant_id` válido (não mock, não inválido), chama `restaurantExistsInCore(stored)`.  
   - Se existir (ou erro de schema "does not exist" em Supabase) → devolve `stored`.  
   - Se não existir → limpa e segue.

2. **Resolução via API (single-flight)**  
   `firstId = await resolveFirstRestaurantIdFromApi()`. Esta função:  
   - Se já `supabaseFirstRestaurantFailedOnce`, devolve `null` sem fazer requests.  
   - Se já existir uma promessa em curso (`resolveFirstIdFromApiPromise`), reutiliza-a.  
   - **Supabase:** primeiro `fetchFirstRestaurantIdFromMembers()` (gm_restaurant_members), para evitar 400 de gm_restaurants (ex.: coluna disabled_at em falta); só se for `null` chama `fetchFirstRestaurantId()` (gm_restaurants).  
   - **Docker:** apenas `fetchFirstRestaurantId()` (gm_restaurants).  
   - Se Supabase e continuar `null`, faz `supabaseFirstRestaurantFailedOnce = true`.

3. **Resultado**  
   Se `firstId` tiver valor → guarda em localStorage e devolve.  
   Senão, em dev devolve `SEED_RESTAURANT_ID`; em produção devolve `null`.

Conclusão: o fallback **só roda em backend Supabase** e **só quando** a query a `gm_restaurants` falha ou devolve vazio.

---

## 3. Restrição explícita a Supabase

- `fetchFirstRestaurantIdFromMembers()`: na primeira linha, `if (!CONFIG.isSupabaseBackend) return null;` — só executa a query em Supabase.
- Em `getOrCreateRestaurantId()`, o fallback e a flag só são usados quando `CONFIG.isSupabaseBackend` é verdadeiro.

Sem regressão para backend Docker: em Docker continua a usar apenas `fetchFirstRestaurantId()` (gm_restaurants).

---

## 4. Validação funcional (manual)

Para validar no browser:

1. Hard refresh em `http://localhost:5175/admin/config/general` (Ctrl+Shift+R / Cmd+Shift+R).
2. Confirmar se os 400 de `fetchFirstRestaurantId` deixam de bloquear a tela (com schema corrigido no Supabase, ou com ID já guardado + `restaurantExistsInCore` a devolver true em erro de schema).
3. Confirmar se a página carrega e se o `restaurant_id` em uso vem de membership quando o fallback é usado (ex.: verificar em Network que há request a `gm_restaurant_members` e que a resposta é 200 com `restaurant_id`).

---

## 5. E2E

Comando:

```bash
cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts
```

Critério de sucesso: os 2 testes do contract passam; não há 400 por "column does not exist" que impeçam o spec.

---

## 6. Conclusão da auditoria

- O fallback está implementado no sítio correto e só corre em Supabase.
- A decisão entre `gm_restaurants` e `gm_restaurant_members` é explícita e condicionada a `CONFIG.isSupabaseBackend` e ao resultado de `fetchFirstRestaurantId()`.
- Não há uso do fallback em backend Docker — sem regressão nesse modo.
- Validação funcional e E2E ficam a cargo da execução manual e do run do comando acima.
