# Relatório de Fecho — 2026-02-03

**Propósito:** Consolidar estado final (P0/P1/P2), evidências e checks automáticos; garantir que o Teste Humano "Sábado à Noite" está executável sem gaps.

---

## 1. O que foi fechado (P0, P1)

| Nível  | Item                                                        | Estado                                                                                                                                     |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | -------------------- | ------------------------------------------------------------------------------ |
| **P0** | Soberania financeira (Orders, Order Items, Fiscal, Billing) | **RESOLVIDO.** Nenhuma escrita/leitura financeira passa por Supabase em modo Docker. Domínio crítico = exclusivamente Docker Core.         |
| **P0** | Check anti-regressão `scripts/check-financial-supabase.sh`  | **Enforced.** CI executa o script; falha se `supabase.from("gm_orders"                                                                     | "gm_order_items" | "fiscal_event_store" | "inventory\_\*")`em código de produção (exclui testes, mocks,`\*\*/scripts/`). |
| **P1** | OrderProjection, CoreOrdersApi, coreOrSupabaseRpc           | Core-only; ramo Supabase removido em OrderProjection; RPC de domínio só via Core.                                                          |
| **P1** | FiscalService, Billing, Bootstrap, Menu, Relatórios         | Core-only ou throw se não Docker (documentado em CONTRACT_IMPLEMENTATION_STATUS, ANTI_SUPABASE_CHECKLIST, FINANCIAL_CORE_VIOLATION_AUDIT). |

---

## 2. O que é P2 (Core Auth) e por que ficou em quarentena

- **Core Auth:** Autenticação ainda via Supabase (useSupabaseAuth, supabaseClient). Documentado como **temporário** e **não autoritativo para estado financeiro**.
- **Quarentena:** Banner TEMPORARY em useSupabaseAuth e shim em `merchant-portal/src/core/supabase/index.ts`; domínio (orders, fiscal, inventory, billing) não usa Supabase em modo Docker.
- **P2** = migrar auth para Core quando existir API de autenticação do Core; até lá, Supabase Auth é integração subordinada.

---

## 3. Evidência: comandos que passaram

| Comando                                                                     | Resultado                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bash ./scripts/check-financial-supabase.sh`                                | **PASSED** (no Supabase usage on financial domain tables in production paths).                                                                                                                               |
| `bash ./scripts/sovereignty-gate.sh`                                        | **PASSED** (order creation via CoreOrdersApi).                                                                                                                                                               |
| `rg "supabase\.from\(['\"]gm_orders                                         | gm_order_items                                                                                                                                                                                               | fiscal\_ | inventory\_" merchant-portal/src -n` | **Apenas** `merchant-portal/src/core/scripts/verify_recipe_deduction.ts` (Deno script) e `core-boundary/README.md` (exemplo em doc). O script de check exclui `**/scripts/`; README é .md. Código de produção sem violação. |
| `npm test -- --ci --testPathIgnorePatterns=...`                             | **27 passed, 49 failed.** Falhas pré-existentes (módulos em falta: event-log, legal-boundary, server/middleware; tipos em hooks/UI). Não são conflito Cursor vs Antigravity; são dívida de testes/estrutura. |
| E2E smoke (`E2E_NO_WEB_SERVER=1 npm run test:e2e:smoke` em merchant-portal) | Não executado neste fecho (requer app a correr). Recomendado executar antes do teste humano.                                                                                                                 |

---

## 4. Riscos remanescentes

- **Modo degradado real:** Comportamento quando Core está em baixo (latência, timeout) pode não estar totalmente coberto por mensagens humanas.
- **Web ordering avançado:** Fluxos QR/Web (pedido por cliente) dependem de menu público e de pedidos a aparecerem no TPV/KDS; validar no teste humano.
- **Testes unitários:** 49 suites falham por módulos/ficheiros em falta ou tipos desatualizados; não bloqueiam CI de gates de soberania (check-financial-supabase, sovereignty-gate), mas devem ser tratados em ciclo próprio.

---

## 5. Próximo passo

**Executar o teste humano "Sábado à Noite"** com 2 restaurantes simulados (ou 1 restaurante fictício "La Última Ola" completo), seguindo [TESTE_HUMANO_SABADO_NOITE.md](./TESTE_HUMANO_SABADO_NOITE.md): Docker Core up, merchant-portal em http://localhost:5175, localStorage sem pilot/trial, dispositivos TPV + KDS + opcional QR; tarefas 1–10 com "onde clicar", "o que esperar", "se falhar anotar"; relatório final (Tarefa 10) com os 8 pontos do template.

---

## 6. Micro-plano: Simulação sábado à noite com 2 restaurantes (não implementar agora)

1. **Setup:** 2 restaurantes criados via bootstrap (ex.: La Última Ola + segundo fictício); menu publicado em ambos; Docker Core + merchant-portal a correr; localStorage limpo.
2. **Dispositivos:** TPV (portátil), KDS (ecrã ou segunda janela), opcional TPV Mini + QR em telemóvel.
3. **Fluxo:** Alternar entre Restaurante A e B (selector de tenant); criar pedidos em paralelo (mesa 1–2 em A, mesa 1 em B); enviar para cozinha; marcar pronto no KDS; pagar.
4. **Métricas a observar:** Silêncio (ação sem feedback); confusão (mensagem pouco clara); latência (demora sem indicador); divergência de estado (pedido no TPV mas não no KDS, ou vice-versa).
5. **Tasks/Turnos:** Abrir turno; checklist abertura/fecho; task esquecida — anotar se o sistema avisa ou não.
6. **Fiscal/Impressão:** Após pagamentos, verificar eventos fiscais e impressão (se configurada); falha silenciosa?
7. **Falhas controladas:** Simular Core em baixo ou rede lenta; anotar ORE, mensagem ao utilizador, modo degradado.
8. **Relatório:** Preencher template Tarefa 10 (claro, confuso, silêncio, conhecimento técnico indevido, nervosismo restaurante real, P0 humano, pode esperar, surpreendentemente bom).
9. **Sem refatorar:** Apenas observar e documentar; correções depois.
10. **Verificável:** Comandos `check-financial-supabase.sh`, `sovereignty-gate.sh` devem continuar a passar após o teste.

---

## Referências

- [TESTE_HUMANO_SABADO_NOITE.md](./TESTE_HUMANO_SABADO_NOITE.md)
- [CONTRACT_IMPLEMENTATION_STATUS.md](../architecture/CONTRACT_IMPLEMENTATION_STATUS.md)
- [FINANCIAL_CORE_VIOLATION_AUDIT.md](../architecture/FINANCIAL_CORE_VIOLATION_AUDIT.md)
- [ANTI_SUPABASE_CHECKLIST.md](../architecture/ANTI_SUPABASE_CHECKLIST.md)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — Fail-fast, Lint, Tests, sovereignty-gate, check-financial-supabase
