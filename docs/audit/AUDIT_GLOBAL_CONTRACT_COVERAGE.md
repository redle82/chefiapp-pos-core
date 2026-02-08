# AUDIT_GLOBAL_CONTRACT_COVERAGE (Operation Scan)

## 0. Resumo Executivo

Esta auditoria mapeia o estado real da soberania do sistema. O ChefIApp é regido por leis (contratos) que devem ser garantidas pelo Core.

**Estado Geral:**

- **Soberania do Banco (N0)**: EXTREMA. Gatilhos de imutabilidade ativos em `event_store` e `legal_seals`.
- **Soberania da App (N1)**: ALTA. `FlowGate` e `TenantResolver` agem como guardiões soberanos.
- **Soberania Infra (N2)**: PADRÃO MVP. Portas expostas no Docker permitem bypass de leitura, mas não de alteração institucional.

---

## 1. Tabela Mestra de Soberania (Realidade Auditada)

| Contrato                 | Tipo | Nível | Estado | Implementação                                      | Evidência Técnica                                                            |
| ------------------------ | ---- | ----- | ------ | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Soberania do Evento**  | A    | 0     | 🟢     | SQL Triggers                                       | `forbid_mutation()` em `schema.sql:206-213` bloqueia UPDATE/DELETE.          |
| **Soberania Financeira** | A    | 0     | 🟢     | legal_seals                                        | Selagem institucional em `schema.sql:60`. Pedidos finalizados são imutáveis. |
| **Restaurant Lifecycle** | A    | 1     | 🟢     | FlowGate.tsx                                       | `FlowGate` bloqueia qualquer rota `/app` se o tenant não estiver selado.     |
| **Operational Pulse**    | A    | 1     | 🟢     | Heartbeat                                          | `TerminalEngine` + `gm_terminals` provê liveness real.                       |
| **Terminal Identity**    | B    | 1     | 🟢     | [TERMINAL_IDENTITY](TERMINAL_IDENTITY_CONTRACT.md) | **Canonizado**: Modelo de identidade descartável/volátil por design.         |
| **Data Visibility**      | B    | 1     | 🟢     | [DATA_VISIBILITY](DATA_VISIBILITY_CONTRACT.md)     | **Canonizado**: Planos de leitura (Read Plane) delimitados por papel.        |
| **Tenant Isolation**     | A    | 2     | 🟢     | TabIsolatedStorage                                 | `TenantResolver.ts` garante que não há "Tenant Drift" entre abas.            |
| **Billing Enforcement**  | D    | 1     | 🔴     | Nenhuma                                            | Ainda não existe gate que bloqueie operação por inadimplência.               |

---

## 2. Mapa de Riscos Reais (Passo 4 - Auditoria Docker)

> [!CAUTION] > **Risco 01: Exposição de Porta 5432**
> O `docker-compose.yml` expõe a porta 5432 do Postgres ao host.
> _Impacto_: Permite leitura direta de dados financeiros fora do `web-module-api`.
> _Mitigação_: Triggers de banco protegem a integridade da escrita, mas a privacidade de leitura depende de RLS.

> [!WARNING] > **Risco 02: Bypass de Onboarding no Mobile**
> O `FlowGate.tsx` possui bypasses para rotas `/waiter` e `/kds` em modo DEV. Se mal configurado em PROD, permite acesso sem sessão.

> [!IMPORTANT] > **Risco 03: Dependência de LocalStorage para Identidade**
> O `terminalId` reside no cliente. Se o limpar, o terminal vira "novo" no sistema.
> _Arquitetural_: É um comportamento aceito no contrato atual, mas um risco operacional.

---

## 3. Top 5 Fortalezas do Sistema

1. **Imutabilidade Nativa**: O sistema não "perdoa" erros; ele gera novos eventos. Isso é conformidade bancária.
2. **Isolamento de Tenant**: O `TenantResolver` é determinístico e centralizado.
3. **Fail-Closed Design**: Se o boot falha, o sistema trava. Não há modo "zumbi" desgovernado.
4. **Resiliência de Rede**: O contrato `CORE_OFFLINE` é respeitado via `SyncEngine` (embora com UI em evolução).
5. **Legibilidade das Leis**: Os arquivos `.md` na raíz e em `docs/architecture` servem como "Constitution Files" vivos.

---

## 4. Conclusão da Varredura

O sistema é **Soberano por Design**. A distância entre a Lei (Constituição) e a Realidade (Código) é mínima no Nível 0 e 1. Os desvios encontrados são majoritariamente para facilitar o desenvolvimento (Bypasses controláveis) ou lacunas de UX periférica.

O ChefIApp não é apenas software; é um sistema regido por leis verificáveis.

---

## 5. Observability Statement (Limitação de Escopo)

> [!NOTE] > **O ChefIApp, em seu estado atual, NÃO promete auditoria externa de observabilidade.**
> A governação e o logging atuais são voltados para a integridade do Core e depuração interna. Auditoria fiscal externa ou integração com SIEM não estão no escopo deste audit.

---

_Auditado e Canonizado por Antigravity em: 2026-01-31_
