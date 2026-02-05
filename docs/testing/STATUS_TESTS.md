# Estado da Suite de Testes (Hardening)

A suite `npm test -- --ci` (e o script `npm run test:ci`) está alinhada à **arquitetura atual**: Docker Core + ORE + TPV/KDS. Não contém referências a arquitetura antiga (core-engine, event-log, legal-boundary, projections server-side, gateways removidos).

## Comandos de referência

| Comando                                         | Uso                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------- |
| `npm test -- --ci`                              | CI padrão; usa `jest.config.js` (exclui legacy-skip, doc-only, e2e, massive). |
| `npm run test:ci`                               | Mesmo efeito com exclusões explícitas: `e2e                                   | playwright | massive   | offline                                                                                                                  | legacy-skip | doc-only`. |
| `npm test -- --ci --testPathIgnorePatterns="e2e | playwright                                                                    | massive    | offline"` | **Não** inclui legacy-skip; testes em `tests/legacy-skip/` seriam executados e falhariam. Use `npm run test:ci` para CI. |

## Pastas excluídas da execução normal

- **`tests/legacy-skip/`** — Testes que dependem de módulos ou conceitos removidos (event-log, legal-boundary, core-engine, gateways, projections, OrderEngine antigo, PaymentEngine, OfflineDB, etc.). Mantidos apenas como referência; não executados pelo Jest na run padrão. Ver `tests/legacy-skip/README.md`.
- **`tests/doc-only/`** — Testes de conceitos documentais/futuros; excluídos da run.
- **`tests/e2e/`** — E2E/Playwright; excluídos do Jest (execução separada).
- **`tests/massive/`** — Suites massivas que dependem de event-log/legal-boundary; excluídas.
- **`core-engine`** — Excluído na config (state-machines removidas).

## Política de hardening aplicada

- **MISSING_MODULE:** testes que importam camadas removidas → movidos para `tests/legacy-skip/` ou apagados; comentário no topo explica o motivo.
- **ARCH_OBSOLETE:** testes de engines/conceitos legados ou doc-only → movidos para `tests/legacy-skip/` ou `tests/doc-only/`.
- **API_DRIFT:** comportamento ainda relevante (ex.: CoreFlow, OrderProtection, ActivationMetrics) → apenas o teste foi atualizado para a API atual; código de produção não alterado para satisfazer testes.

## Verificação final

- Nenhum teste na run ativa importa módulos inexistentes.
- Nenhum teste na run ativa referencia arquitetura obsoleta.
- Nenhum teste reintroduz Supabase como lógica de domínio (ver `docs/architecture/ANTI_SUPABASE_CHECKLIST.md`).
- E2E smoke e gates de soberania permanecem intocados; a suite reflete apenas o sistema real (Docker Core, ORE, TPV/KDS).

Última atualização: alinhamento pós-hardening (strict hardening mode).
