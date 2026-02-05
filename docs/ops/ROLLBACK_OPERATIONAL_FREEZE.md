# Plano de rollback: Operational Freeze

**Propósito:** Documentar como voltar um passo atrás em caso de regressão ou necessidade de reverter o estado "operational-freeze-v1". Libera coragem para cortar mais fundo, sabendo que o rollback está explícito.

**Contexto:** [FREEZE_ACTIVO_E_REDESIGN.md](../plans/FREEZE_ACTIVO_E_REDESIGN.md); [OPERATIONAL_NAVIGATION_SOVEREIGNTY.md](../contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md).

---

## 1. Como voltar um passo atrás

- **Opção A (tag):** Se a tag `operational-freeze-v1` foi aplicada, fazer checkout dessa tag ou criar um branch a partir dela para restaurar o estado no momento do freeze.
  - `git checkout operational-freeze-v1`
  - Ou: `git checkout -b restore-freeze operational-freeze-v1`
- **Opção B (commit):** Se não houver tag, usar o commit correspondente ao estado "operational-freeze-v1" (preencher abaixo).
  - `git checkout <COMMIT_FREEZE>`
  - Ou: `git revert` dos commits posteriores ao freeze (consoante conveniência).

---

## 2. Commit / tag do freeze (preencher quando aplicar)

| Campo | Valor |
|-------|--------|
| **Tag** | `operational-freeze-v1` |
| **Commit (hash)** | *(preencher no momento da tag: `git rev-parse HEAD`)* |
| **Data** | *(preencher)* |

---

## 3. Contratos e efeitos colaterais conhecidos

Se reverter **FlowGate** ou alterações de soberania de navegação:

- **Contrato revertido:** OPERATIONAL_NAVIGATION_SOVEREIGNTY (parcial ou total).
- **Efeito colateral conhecido:** Redirect para landing ("/") pode voltar a ocorrer em cenários em que, com o freeze, o destino era `/app/dashboard` (ex.: utilizador em OPERATIONAL_OS sem sessão ou com org local inválida). O loop "Instalar TPV → volta para landing" pode reaparecer.

Se reverter **Kernel / terminals (gate + canQuery)**:

- **Contrato revertido:** OPERATIONAL_KERNEL_CONTRACT; TERMINAL_INSTALLATION_RITUAL (gate).
- **Efeito colateral conhecido:** Chamadas API a gm_terminals/gm_equipment podem voltar mesmo com TERMINAL_INSTALLATION_TRACK=false; erros 404 ou "relation does not exist" na consola.

Se reverter **CoreFlow (isWebConfigPath com /app/install)**:

- **Contrato revertido:** OPERATIONAL_NAVIGATION_SOVEREIGNTY (rota operacional).
- **Efeito colateral conhecido:** /app/install pode voltar a ser tratada como não-operacional em alguns fluxos; risco de redirect indesejado.

---

## 4. Passos recomendados após rollback

1. Verificar testes soberanos e de compatibilidade ([TESTES_GUARDIOES_RITUAL_CORTE.md](../plans/TESTES_GUARDIOES_RITUAL_CORTE.md)).
2. Confirmar que o comportamento revertido é o desejado (ex.: aceitar temporariamente redirect para "/").
3. Documentar o motivo do rollback e o commit/tag para onde se voltou.
4. Reavaliar alterações antes de reintroduzir (evitar entradas de [LEGACY_CODE_BLACKLIST.md](LEGACY_CODE_BLACKLIST.md)).

---

## 5. Fase 1 — Order flow freeze (order-flow-freeze-v1)

| Campo | Valor |
|-------|--------|
| **Tag** | `order-flow-freeze-v1` |
| **Commit (hash)** | `d83834f` (ou o commit após fazer commit das alterações da Fase 1) |
| **Data** | 2026-02-03 |

**Incluído na Fase 1:** Fluxo TPV → Core → KDS com rascunho em memória, confirmação única, imutabilidade mínima pós-confirmação; estados documentados em `core_schema.sql`; logs estruturados em `CoreOrdersApi` (createOrderAtomic, updateOrderStatus); única via de mudança de estado via RPC (TPV e KDS usam CoreOrdersApi); testes mínimos de transições e contrato de params; secção de resultado do teste canónico em `FLUXO_DE_PEDIDO_OPERACIONAL.md`; entradas em `LEGACY_CODE_BLACKLIST.md` para fluxo de pedido.

**Rollback:** `git checkout order-flow-freeze-v1` ou criar branch a partir da tag.

**Veredito final e estado do roadmap:** [FASE_1_VEREDITO_FINAL.md](../FASE_1_VEREDITO_FINAL.md).

---

## 6. Fase 2 — Operational phase 2 freeze (operational-phase-2-freeze-v1)

Aplicar **após** o piloto de uso real prolongado ter cumprido os critérios de sucesso. Ver [FASE_2.5_USO_REAL_FREEZE.md](../plans/FASE_2.5_USO_REAL_FREEZE.md) e [USO_REAL_PROLONGADO_PILOTO.md](USO_REAL_PROLONGADO_PILOTO.md).

| Campo | Valor |
|-------|--------|
| **Tag** | `operational-phase-2-freeze-v1` |
| **Commit (hash)** | *(preencher no momento da tag: `git rev-parse HEAD`)* |
| **Data** | *(preencher)* |

**Incluído na Fase 2:** 2.1 Superfícies e instalação (TPV/KDS PWA, OPERATIONAL_SURFACES_CONTRACT); 2.2 Pessoas e turnos (gm_cash_registers, opened_by, turno/caixa); 2.3 Caixa, pagamentos e fecho (CloseCashRegisterModal, ShiftHistorySection, get_shift_history com sales_by_method e esperado/declarado); 2.4 Observabilidade (OPERATIONAL_ALERTS_CONTRACT, Dashboard honesto). Remoção Supabase e uso exclusivo Docker Core; legacy_supabase.

**Rollback:** `git checkout operational-phase-2-freeze-v1` ou criar branch a partir da tag.

**Plano da Fase 2:** [FASE_2_PLANO_COMPLETO.md](../plans/FASE_2_PLANO_COMPLETO.md).

---

Última actualização: Plano de rollback operational freeze; Fase 1 order-flow-freeze-v1 adicionado 2026-02-03; Fase 2 operational-phase-2-freeze-v1 (secção 6) adicionado 2026-02-03.
