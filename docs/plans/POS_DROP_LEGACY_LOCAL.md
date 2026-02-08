# Plano pós-DROP LEGACY (LOCAL) — Ritual, Smoke e Próximos Caminhos

Documento único que reúne tudo o que foi dito: ritual executado, veredito técnico, smoke humano pendente, nova fase e opções futuras. Referência: [docs/ops/DB_TABLE_CLASSIFICATION.md](../ops/DB_TABLE_CLASSIFICATION.md) (carimbo).

---

## 1. Ritual executado (Opção 1 — LOCAL)

Sequência realizada com honra:

| Passo | Ação | Estado |
| ----- | ----- | ------ |
| 0 | Pré-check: `docker compose -f docker-compose.core.yml ps` — Postgres UP (healthy) | Feito |
| 1 | `mkdir -p docker-core/backups`; backup total: `docker exec -t chefiapp-core-postgres pg_dump -U postgres -d chefiapp_core > docker-core/backups/core_full_<timestamp>.sql` | Feito — ficheiro: `core_full_20260204_013106.sql` |
| 2 | Aplicar DROP: `docker exec -i chefiapp-core-postgres psql -U postgres -d chefiapp_core < docker-core/schema/migrations/20260203_drop_legacy_untouched.sql` | Feito — 30 tabelas NOT_TOUCHED; CASCADE em `gm_restaurants` (tenant_id) |
| 3 | Reset stack: `docker compose down` + `up -d` (sem `-v` para manter estado pós-DROP) | Feito |
| 4 | Testes: `npm run test` em merchant-portal | Feito — 105 passed, 6 skipped |
| 5 | Smoke operacional (dashboard, install, TPV, KDS, orders, turno) | **Pendente — manual** |
| 6 | Carimbo em `docs/ops/DB_TABLE_CLASSIFICATION.md` | Feito — data 2026-02-04, commit `d83834f...` |

**Regra aplicada:** sem redesign, sem melhorias; só verdade + prova.

---

## 2. Veredito técnico

- **Backup válido:** Antes do DROP; caminho registado no carimbo.
- **DROP baseado em evidência:** TOUCHED/NOT_TOUCHED ([scripts/verify-db-runtime-touch.sh](../../scripts/verify-db-runtime-touch.sh)); CASCADE entendido (saas_tenants → gm_restaurants).
- **Reset correto:** Sem `-v`; estado pós-DROP preservado (volume mantido).
- **Testes verdes:** 105 passed → soberania preservada.
- **Carimbo documental:** Data + commit + resumo no doc.

Conclusão: engenharia adulta; nada imprudente.

---

## 3. Smoke operacional humano (o que falta para fechar o ciclo)

Checklist manual (~5 min). Atenção a **três sinais**:

### 3.1 Silêncio estrutural

- Sem erros "relation does not exist".
- Sem loops de navegação.
- Sem logs em spam.

### 3.2 Autoridade preservada

- `/app/install` não volta para landing.
- Dashboard abre direto, sem "onboarding fantasma".
- Kernel continua a decidir (Core / Turno / Terminais).

### 3.3 Corpo vivo

- TPV e KDS abrem como superfícies reais.
- Pedido entra → lista → estado muda.
- Turno abre e o header reflete isso (se aplicável).

**Critério de sucesso:** Se os três passarem → **DROP VALIDADO**. Ponto final.

**Reportar:** "Passou tudo" **ou** "Quebrou aqui" (com 1 screenshot ou 1 log).

---

## 4. O que muda a partir daqui (nova fase)

- **Qualquer** tabela nova, flag nova ou fluxo novo **só entra com contrato**.
- O "direito de existir" passa a ser **raro**.
- Princípios consolidados: cortar legado com prova; manter rollback; congelar estrutura sem congelar observação.

---

## 5. Próximos caminhos possíveis (radar — sem agir agora)

| Caminho | Descrição |
| ------- | --------- |
| **Uso real prolongado** | 1 restaurante, 1–2 TPVs, 1 KDS, 1 semana → coletar padrões, não opiniões. |
| **FASE 3 opcional** | Reorganização de pastas por contrato (não por gosto). |
| **Planeamento Staging/Prod** | Com base no que foi aprendido no LOCAL. |

Nada disto é urgente. O sistema está limpo o suficiente para ser usado de verdade.

---

## 6. Resumo de referências

- **Classificação e carimbo:** [docs/ops/DB_TABLE_CLASSIFICATION.md](../ops/DB_TABLE_CLASSIFICATION.md)
- **Migration DROP:** [docker-core/schema/migrations/20260203_drop_legacy_untouched.sql](../../docker-core/schema/migrations/20260203_drop_legacy_untouched.sql)
- **Backup e rollback:** docker-core/README.md (secção Backup e rollback)
- **Verificação TOUCHED/NOT_TOUCHED:** [scripts/verify-db-runtime-touch.sh](../../scripts/verify-db-runtime-touch.sh)

Quando o smoke humano for feito, voltar com "Passou tudo" ou "Quebrou aqui" (screenshot ou log) para fechar o ciclo.
