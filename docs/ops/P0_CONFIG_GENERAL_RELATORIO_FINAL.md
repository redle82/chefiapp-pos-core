# Relatório final — Validação funcional `/admin/config/general`

## Frentes: encerrada vs aberta

| Frente | Estado | Nota |
|-------|--------|------|
| **5 testes unitários** (SyncEngine.test.ts + AdminRoutes.test.tsx) | **Encerrada** | Suite merchant-portal: 816 passed, 4 skipped, 0 failed. Não reabrir; não misturar com o bloqueio E2E. |
| **E2E config-general.spec.ts** (erro `disabled_at` / Supabase/PostgREST) | **Aberta** | Bloqueio restante. Foco exclusivo até fechar. |

**Próximo passo único:** Obter resultado real do E2E **localmente** (portal em 5175, NOTIFY já executado no Dashboard). No ambiente do agente, `localhost:5175` não é acessível, pelo que o E2E não completou. **Passo 3 aberto:** auditoria no repo feita (RLS em `gm_restaurants` não referencia `disabled_at`); script `merchant-portal/scripts/supabase-audit-disabled-at.sql` criado para executar no SQL Editor do Dashboard se o E2E continuar a falhar. Ver **docs/ops/P0_CONFIG_GENERAL_VALIDACAO.md** §1.1.

---

## 1. Estado verificado

- **Schema:** Migration opcional `20260310000000_gm_restaurants_supabase_optional_columns.sql` aplicada no Supabase. Colunas confirmadas: type, city, address, logo_url, country, timezone, currency, locale, phone, email, postal_code, state, etc. Tabela `restaurant_setup_status` criada.
- **Validação em Node:** `validate-config-general-schema.ts` executado com sucesso (SELECT e UPDATE em `gm_restaurants` sem erro).
- **Código da página:** `GeneralConfigPage` usa `GeneralCardIdentity` (leitura `select("*")` em `gm_restaurants`, save com `update(payload)`) e `GeneralCardLocale` (leitura `select("locale,timezone,currency")`, save com `update({ locale, timezone, currency })`). Todas as colunas usadas existem no schema aplicado. Save só corre se `getBackendType() === BackendType.docker` e `restaurant_id` definido (TenantContext com sessão autenticada e membership).
- **Portal:** Comando para subir: `pnpm --filter merchant-portal run dev` → `http://localhost:5175`. Rota: `/admin/config/general` (Admin → Configuração → General).

---

## 2. Resultado da leitura no browser

**Validação no browser:** manual (runbook) ou automática (E2E).

- **Automática:** Com o portal a correr em `http://localhost:5175`, executar:
  ```bash
  cd merchant-portal && E2E_NO_WEB_SERVER=1 E2E_BASE_URL=http://localhost:5175 npx playwright test tests/e2e/contracts/config-general.spec.ts --project=contracts
  ```
  O spec abre `/admin/config/general`, verifica que não há 400 por "column does not exist", que os cards Identidade e Idioma/localização aparecem e que o botão Guardar está visível; no segundo teste clica Guardar e confirma que não há 400/403 e que a página recarrega sem erro.

- **Manual:** Seguir o runbook em **docs/ops/P0_CONFIG_GENERAL_VALIDACAO.md** (secções 2 e 3):

1. Limpar consola (Clear console) e, se quiser, Network → Disable cache.
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R).
3. Abrir **http://localhost:5175/admin/config/general** (com sessão iniciada).

**Critério de sucesso:** A página abre; não surgem **novos** 400 por `"column does not exist"`; os cards Identidade e Idioma/localização passam de "A carregar..." aos campos (preenchidos ou vazios). Campos esperados: nome, tipo, país, telefone, e-mail, morada, cidade, código postal, região, URL do logo; idioma, fuso horário, moeda.

Se algo falhar, anotar: **request** (GET + URL), **status** (400/403/…), **mensagem** (ex.: coluna X does not exist), e se é **read/select** ou outro.

---

## 3. Resultado do save

**Validação manual obrigatória.** No mesmo runbook (secção 4):

1. **Card Identidade:** Alterar 1–2 campos (ex.: Cidade, Telefone) → Guardar. Não deve aparecer alerta de erro. F5 → valores mantidos.
2. **Card Idioma e localização:** Alterar 1 campo (ex.: Moeda) → Guardar. Sem erro. F5 → valor mantido.

**Critério de sucesso:** Save sem alerta; após refresh os valores persistem.

Se falhar: anotar **request** (PATCH gm_restaurants), **status** (400/403/401), **mensagem** (body ou erro), e se é **update/save** ou **RLS** (ex.: 403 = política RLS).

---

## 4. Erros novos reais (se houver)

- **No código:** Nenhum identificado. Leitura usa colunas existentes; payload de save usa apenas colunas adicionadas na migration.
- **No browser:** Preencher aqui após a validação manual. Se não houver erros novos, escrever: *Nenhum. Leitura e save OK.*

| Request        | Status | Coluna / mensagem | Read/Update/RLS |
|----------------|--------|-------------------|-----------------|
| *(preencher)*  |        |                   |                 |

---

## 5. Estado final do bloqueio

- **Schema e backend:** Bloqueio fechado. Migration aplicada; leitura e escrita validadas em Node; código da página alinhado com o schema.
- **Browser:** Bloqueio funcional fecha quando a validação manual (runbook) for executada com estado limpo e os critérios das secções 2 e 3 forem cumpridos (sem novos 400, campos carregam, save funciona, valores persistem).
- **Conclusão:** Com o runbook executado e sem erros novos reportados, o bloqueio da tela `/admin/config/general` fica **finalmente fechado** no browser.

---

## 6. E2E e coluna `disabled_at`

**Execução no agente:** O E2E foi lançado mas não completou — neste ambiente `localhost:5175` não é acessível, logo não há resultado real (passou/falhou). O resultado definitivo tem de ser obtido **localmente**.

Se o E2E `config-general.spec.ts` falhar com **400** `column "disabled_at" does not exist` em `gm_restaurants?select=id&limit=1`, a causa é servidor (schema cache do PostgREST ou policy/view/function no projeto). **Plano de debug em ordem:** (1) **Recarga real do schema:** no **Supabase Dashboard → SQL Editor**, executar `NOTIFY pgrst, 'reload schema';` (ficheiro: `merchant-portal/scripts/supabase-reload-schema-notify.sql`). (2) Reexecutar o E2E **localmente**. (3) Se ainda falhar, executar no SQL Editor o script **merchant-portal/scripts/supabase-audit-disabled-at.sql** para listar políticas, colunas, views, funções e triggers; auditoria no repo já confirmou que as RLS de `gm_restaurants` (20260224) não referenciam `disabled_at`. Ver **docs/ops/P0_CONFIG_GENERAL_VALIDACAO.md** §1.1.
