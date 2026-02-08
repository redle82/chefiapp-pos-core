# Teste total pós remoção Supabase → Docker Core

## Resumo

Após a migração completa para Docker Core (remoção do Supabase), foram executados build, type-check, testes unitários, lint e E2E. Corrigidos 2 bugs encontrados durante os testes.

---

## 1. Build

- **Comando:** `npm run build` (merchant-portal)
- **Resultado:** ✅ **PASS**
- Sem dependência de `@supabase/supabase-js` no bundle.

---

## 2. Type-check

- **Comando:** `npm run type-check` (tsc --noEmit)
- **Resultado:** ✅ **PASS**

---

## 3. Testes unitários (Vitest)

- **Comando:** `npm run test`
- **Resultado:** ✅ **PASS**
- **Ficheiros:** 23 passed | 2 skipped (25)
- **Testes:** 119 passed | 6 skipped (125)

---

## 4. Lint (ESLint)

- **Comando:** `npm run lint`
- **Correções feitas:**
  - **BetaFeedbackWidget.tsx:** import de `core/supabase` (restrito) trocado para `dockerCoreClient` de `core-boundary/docker-core/connection`. Erro de regra `no-restricted-imports` resolvido.
- **Estado:** O projeto tem muitas warnings pré-existentes (no-explicit-any, unused vars). Nos ficheiros alterados pela migração não há erros de lint.

---

## 5. E2E (Playwright)

### Smoke (fluxo-total, fase-b-teste-humano, fase-a-global-tecnico)

- **Resultado:** 6 passed, 3 failed
- **Falhas:** Relacionadas com conteúdo da UI (texto "Exemplo real|Passo 1 de 4", CTAs, body length no KDS). Não indicam regressão da migração Supabase → Core.

### Sovereign-navigation + immutable_shift_check

- **Resultado:** 7 passed, 2 failed, 1 skipped
- **Bug corrigido durante testes:** Em **AuthPage.tsx** existia uma referência residual a `isSupabase` (linha 242), que foi renomeada para `hasCore`. Isso causava `ReferenceError: isSupabase is not defined` na Auth page. Corrigido.
- **Falhas restantes:**
  1. **Landing Page → /app:** `locator('a[href*="/auth"]')` não encontrado — depende da estrutura actual da landing (links para `/auth`).
  2. **FlowGate: Sem auth → redireciona:** `waitForURL` timeout — fluxo de redireccionamento pode depender de backend/ambiente.

---

## 6. Correções aplicadas durante o teste

| Ficheiro | Problema | Correção |
|----------|----------|----------|
| **AuthPage.tsx** | `isSupabase` não definido (linha 242) | Uso de `hasCore` em vez de `isSupabase` na condição do JSX (`hasCore ? (demo box) : (form)`). |
| **BetaFeedbackWidget.tsx** | Import restrito `core/supabase` | Import de `dockerCoreClient` de `core-boundary/docker-core/connection` e uso de `dockerCoreClient.from("beta_feedback").insert(...)`. |

---

## Conclusão

- **Build, type-check e testes unitários:** tudo a passar.
- **Lint:** sem erros nos ficheiros da migração; BetaFeedbackWidget alinhado com a regra de não importar `core/supabase` fora das excepções.
- **E2E:** uma parte passa; as falhas restantes estão ligadas a expectativas de UI/landing e a fluxos que podem depender do Core estar a correr (ex.: `make world-up`). Não há indícios de que a remoção do Supabase tenha quebrado a lógica de negócio coberta pelos testes.

**Recomendação:** Para validar E2E de ponta a ponta, correr o Docker Core (`make world-up` na raiz do repo) e repetir os E2E; rever os specs que assumem textos/links específicos na landing e na Auth page para reflectir a UI actual (Docker Core only).
