# PRD — Turnos e Caixa (Shifts)

**Propósito:** PRD do **turno** (shift) e **caixa**: check-in/check-out, estado operacional, bloqueio do TPV quando caixa fechado. Formaliza requisitos a partir de [GLOBAL_UI_STATE_MAP.md](./GLOBAL_UI_STATE_MAP.md), [CORE_TIME_AND_TURN_CONTRACT.md](../architecture/CORE_TIME_AND_TURN_CONTRACT.md) e [CASH_REGISTER_LIFECYCLE_CONTRACT.md](../architecture/CASH_REGISTER_LIFECYCLE_CONTRACT.md).  
**Público:** Produto, engenharia.  
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md)

---

## 1. Visão e objetivo

- **Objetivo:** Turno (shift) como unidade operacional: check-in/check-out do staff; caixa aberta/fechada como gate para TPV/caixa; estado global de UI (blocked por turno) consistente em Portal, TPV e KDS.
- **Regra:** Core decide quando alguém pode dar check-in e quando o caixa está aberto; UI mostra e regista ações, não define regras.

---

## 2. Requisitos funcionais

### 2.1 Turno (AppStaff)

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Estado em turno / fora** | AppStaff mostra "Em turno" ou "Fora de turno"; fonte = Core. | P0 |
| **Check-in** | Botão/ação "Check-in" quando o Core permitir; regista no Core (horário, dispositivo). | P0 |
| **Check-out** | Botão/ação "Check-out" quando o Core permitir; regista no Core. | P0 |
| **Último check-in** | Mostrar último check-in (data/hora) e duração do turno atual quando o Core expor. | P1 |
| **Não calcular horas** | AppStaff não calcula horas trabalhadas, banco de horas nem faltas; Core pode expor; AppStaff mostra. | P0 |

### 2.2 Caixa (operational)

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **operational === true** | Turno aberto (caixa aberta) = condição para aceder a `/op/cash` e para TPV permitir vendas reais. | P0 |
| **Gate /op/cash** | Rota `/op/cash` exige `operational === true`; senão redirect ou bloqueio com mensagem clara. | P0 |
| **TPV bloqueado (caixa fechado)** | Quando caixa fechado, TPV mostra estado "blocked": mensagem "Caixa Fechado: Para realizar vendas reais, você precisa abrir o turno no portal." + CTA "Abrir Turno". | P0 |
| **Abrir/fechar turno** | Ação de abrir/fechar turno no portal (dashboard ou painel dedicado); Core persiste; gates refletem. | P0 |

### 2.3 Estado global de UI (blocked por turno)

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **GlobalUIState isBlockedByShift** | Estado "blocked por turno" exposto globalmente (GlobalUIStateContext); TPV e Portal consomem. | P0 |
| **Consistência visual** | Mesmo estado "caixa fechado" usa componente canónico (ex.: GlobalBlockedView) em TPV; copy e CTA claros. | P0 |

---

## 3. Requisitos não funcionais

- **Fonte de verdade:** Core (e ShiftContext que espelha o Core); UI nunca inventa estado de turno nem de caixa.
- **Consistência:** Portal, TPV e KDS refletem o mesmo estado operacional (published + operational) conforme RESTAURANT_LIFECYCLE e CASH_REGISTER_LIFECYCLE.
- **UX:** Estados blocked (não publicado, caixa fechado) seguem GLOBAL_UI_STATE_MAP e DESIGN_SYSTEM_PERCEPTUAL_CONTRACT (mensagem neutra, próximo passo explícito).

---

## 4. Referências de contrato

- [CORE_TIME_AND_TURN_CONTRACT.md](../architecture/CORE_TIME_AND_TURN_CONTRACT.md) — Check-in/out, o que o Core decide, o que o AppStaff faz/não faz.
- [CASH_REGISTER_LIFECYCLE_CONTRACT.md](../architecture/CASH_REGISTER_LIFECYCLE_CONTRACT.md) — operational, gate `/op/cash`.
- [RESTAURANT_LIFECYCLE_CONTRACT.md](../architecture/RESTAURANT_LIFECYCLE_CONTRACT.md) — configured / published / operational.
- [GLOBAL_UI_STATE_MAP.md](./GLOBAL_UI_STATE_MAP.md) — Estados loading, empty, error, blocked, pilot; isBlockedByShift.

---

## 5. Critérios de aceite (resumo)

- [ ] Staff faz check-in/check-out no AppStaff; estado "Em turno" reflete no Core.
- [ ] Caixa fechado bloqueia TPV com mensagem e CTA "Abrir Turno"; caixa aberto permite vendas reais.
- [ ] Rota `/op/cash` (ou equivalente) exige turno aberto; senão bloqueio claro.
- [ ] Portal permite abrir/fechar turno; estado reflete em TPV e gates.
- [ ] Estado "blocked por turno" usa componente e copy canónicos (GlobalUIState + GlobalBlockedView).

---

*Documento vivo. Alterações em requisitos devem ser alinhadas aos contratos Core e ao GLOBAL_UI_STATE_MAP.*
