# C4.2 — Estado do customer-portal (evidência objetiva)

**Objetivo:** Registar o estado real do workspace `customer-portal` no repo, com evidência em ficheiros e classificação para alinhamento Fase 4.  
**Referência:** [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md), [FASE_4_EXPANSAO_CONTROLADA.md](./FASE_4_EXPANSAO_CONTROLADA.md).

---

## 1. Onde vive e estado real

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| **Workspace declarado** | **Não (removido F5.1)** | Era `package.json` workspaces; removido em F5.1 — Opção A. |
| **Diretório existe** | **Não** | `ls -d customer-portal` → diretório ausente na raiz do monorepo. |
| **Código fonte** | **Ausente** | Não existe `customer-portal/`; não há `src/`, `package.json` local nem ficheiros de app. |
| **Outro local no repo** | Não | Não existe `_legacy_isolation/customer-portal` no checkout atual (diretório `_legacy_isolation` inexistente). |
| **tsconfig raiz** | — | `customer-portal` removido de `exclude` (F5.1); já não referenciado. |

**Conclusão:** O customer-portal **não é workspace** neste monorepo desde F5.1. Diretório e código continuam ausentes; se for reintroduzido no futuro, seguir §2–§3 e voltar a registar em WORKSPACES_ALIGNMENT.

---

## 2. Stack e scripts (quando existir código)

Documentação e histórico referem o customer-portal como:

- **Propósito:** Menu digital (QR), superfície pública para clientes do restaurante.
- **Stack esperada (histórico):** React, Vite (ex.: CHANGELOG, OBSERVABILITY_SETUP referem `customer-portal/src/`, `logger.ts`, `CartContext.tsx`, Sentry).
- **Scripts:** Nenhum script no repo raiz depende do customer-portal; não há `test`, `build` ou `lint` executáveis na sua ausência.

Quando o código existir, o contrato mínimo com o Core aplica-se (WORKSPACES_ALIGNMENT §3): ler/escrever apenas via APIs/RPCs do Core; sem lógica financeira duplicada no cliente; billing e identidade conforme contratos.

---

## 3. Contrato mínimo com o Core (aplicável quando houver implementação)

Quando o customer-portal tiver código no repo:

- **Ler:** apenas via PostgREST/RPCs do Core (ex.: menu, restaurante, disponibilidade); não assumir tabelas/colunas não expostas.
- **Escrever:** apenas via RPCs ou escritas autorizadas (ex.: criação de pedido via RPC/API definida pelo Core); não fazer INSERT/UPDATE direto em tabelas `gm_*` a partir do cliente.
- **Billing:** não decidir estado de billing no cliente; qualquer gate de acesso deve refletir o estado do Core.
- **Identidade:** cliente (consumidor) distinto de dispositivo (TPV/KDS) e operador (AppStaff); não reutilizar mecanismos de provisioning de dispositivo para cliente.

Não foi possível auditar código existente — não há ficheiros para inspecionar. Quando o código for reintroduzido, validar contra [CORE_IDENTITY_AND_TRUST_CONTRACT.md](../architecture/CORE_IDENTITY_AND_TRUST_CONTRACT.md) e fronteiras de leitura/escrita do Core.

---

## 4. Como testar

| Comando / ação | Estado atual |
|----------------|--------------|
| `pnpm --filter customer-portal run test` | **Inviável** — package não existe (diretório ausente); `pnpm install` ignora workspace inexistente. |
| `pnpm --filter customer-portal run build` | **Inviável** — idem. |
| `pnpm --filter customer-portal run lint` | **Inviável** — idem. |
| Testes E2E / smoke dedicado | **Não existe** — nenhum script ou doc no repo descreve testes executáveis para customer-portal. |

**Limitação documentada:** Enquanto o diretório `customer-portal/` (com pelo menos `package.json` e código) não existir no repo, não há forma de executar testes ou build do customer-portal a partir deste repositório. Qualquer validação futura dependerá de o código ser adicionado ou de um repo separado ser referenciado.

---

## 5. Classificação objetiva

**Classificação:** **MISSING**

- **ALIGNED:** Não aplicável — não há código para alinhar.
- **PARTIAL:** Não aplicável — não há código parcial.
- **DOC_ONLY:** Não — há referências em docs (WORKSPACES_ALIGNMENT, CHANGELOG, OBSERVABILITY_SETUP, etc.) mas o workspace está declarado em `package.json` como workspace ativo; a intenção é de app, não só documentação.
- **MISSING:** **Sim** — workspace declarado; diretório e código fonte ausentes; nenhum teste ou build executável.

---

## 6. Riscos residuais

- **Workspace fantasma:** O `package.json` raiz lista `customer-portal` em workspaces. Em clones frescos, `pnpm install` / `npm ci` podem ignorar o workspace inexistente sem falhar, mas a lista de workspaces fica enganadora (parece que há três apps quando só dois têm diretório).
- **Docs desatualizados:** CHANGELOG, OBSERVABILITY_SETUP e outros referem ficheiros em `customer-portal/` que não existem; ao reintroduzir o código, convém alinhar esses docs com a estrutura real.
- **Contrato Core:** Quando o customer-portal for implementado (neste repo ou noutro), deve seguir o contrato mínimo em WORKSPACES_ALIGNMENT §3 para evitar duplicação de lógica financeira e escritas diretas no Core.

---

## 7. Recomendações

1. **Manter estado documentado:** Este documento e WORKSPACES_ALIGNMENT passam a ser a referência do estado atual (MISSING) até haver código.
2. **Se o código for reintroduzido:** Criar `customer-portal/` na raiz com `package.json` e código; adicionar scripts `test`/`build`/`lint`; validar contra contrato Core §3; atualizar WORKSPACES_ALIGNMENT com comandos reais de teste.
3. **Se o customer-portal for mantido noutro repositório:** Remover `customer-portal` de `workspaces` no `package.json` raiz e atualizar WORKSPACES_ALIGNMENT a indicar "customer-portal noutro repo: [URL]".
4. **Se for placeholder futuro:** Opcionalmente criar `customer-portal/package.json` mínimo (name, version, private) para o diretório existir e o workspace deixar de ser "fantasma", sem código ainda.

---

## 8. F5.1 Executado — Opção A (remoção formal)

**Data:** 2026-03  
**Veredito:** **Opção A** — remover customer-portal do workspace e referências operacionais que o tratem como ativo.

**Relatório breve:**

- **Presença real:** Diretório `customer-portal/` ausente; nenhum código, submódulo ou worktree; `pnpm-workspace.yaml` já não listava customer-portal (apenas merchant-portal, core-design-system, mobile-app).
- **Referências encontradas:** `package.json` (workspaces), `tsconfig.json` (exclude), WORKSPACES_ALIGNMENT, C42, AGENTS, FASE_5, C44, INDEX, README, docs de auditoria/observabilidade/CHANGELOG (histórico).
- **Impacto de manter como estava:** Workspace fantasma; lista de workspaces enganadora; risco de alguém assumir "três apps" no monorepo; referências em tsconfig a pasta inexistente.
- **Recomendação:** Remoção formal — sem evidência de retorno iminente nem código a preservar no repo; preferir repo coerente com a realidade.

**Alterações executadas:**

- `package.json`: removido `"customer-portal"` do array `workspaces`.
- `tsconfig.json`: removido `"customer-portal"` do array `exclude`.
- Docs operacionais atualizados: C42, WORKSPACES_ALIGNMENT, AGENTS, FASE_5, README (customer-portal não listado como workspace ativo). Documentos históricos (CHANGELOG, audit-reports, archive) mantidos como estão.

**Definition of Done F5.1:** Customer-portal deixa de ser workspace fantasma; repo coerente; docs e configuração alinhados; F5.1 fechado com evidência.

---

*Documento C4.2 — Estado do customer-portal. F5.1 Opção A executada: removido do workspace. Classificação: não aplicável (já não é workspace).*
