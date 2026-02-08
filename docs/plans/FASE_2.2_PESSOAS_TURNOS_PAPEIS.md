# FASE 2.2 — Pessoas, turnos e papéis (20%)

**Objetivo:** O sistema passa a entender quem está a operar. Todo pedido tem quem, quando, em que turno; não existem ações "anónimas".

**Referências:** [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md), [CONTRATO_DO_TURNO.md](../contracts/CONTRATO_DO_TURNO.md), [OPERATIONAL_HEADER_CONTRACT.md](../contracts/OPERATIONAL_HEADER_CONTRACT.md), [PLANO_TECNICO_LEI_DO_TURNO.md](../implementation/PLANO_TECNICO_LEI_DO_TURNO.md).

---

## Escopo (do FASE_2_PLANO_COMPLETO)

| Item | Descrição |
|------|------------|
| **2.2.1** | Turnos reais — Abrir turno, operador responsável, encerrar turno, associar pedidos a turnos. Sem fiscal; só verdade interna. |
| **2.2.2** | Papéis humanos — Dono, Gerente, Operador TPV, Cozinha, Staff; ligados a dispositivo, turno e ações permitidas. |
| **2.2.3** | Header operacional completo — Ex.: "Restaurante X — Turno aberto — Caixa João". Responsabilidade, não estética. |

**Critério de sucesso:** Todo pedido tem quem, quando, em que turno; não existem ações "anónimas".

---

## Estado atual (base)

- **Turno:** Fonte única no Core (`gm_cash_registers` + `open_cash_register_atomic`). TPV e App Staff escrevem abertura/fecho; Dashboard e KDS só leem. Ver [PLANO_TECNICO_LEI_DO_TURNO.md](../implementation/PLANO_TECNICO_LEI_DO_TURNO.md) — Commits 1–3 já implementados.
- **Header:** Contrato em [OPERATIONAL_HEADER_CONTRACT.md](../contracts/OPERATIONAL_HEADER_CONTRACT.md): Restaurante + Estado (Operação Pronta | Core ON | Turno Aberto) + Operador actual (quando turno aberto).

---

## Checklist executável (2.2)

### 2.2.1 Turnos reais

- [x] **Abrir turno:** TPV (ou App Staff) abre turno; `opened_by` e nome da caixa registados no Core.
- [x] **Associar pedidos a turnos:** Todo pedido criado no TPV está ligado ao `cash_register_id` (turno) aberto.
- [x] **Encerrar turno:** Ação explícita "Encerrar turno" (TPV closeCashRegister; Dashboard ShiftCard/AdminSidebar); sem fecho automático invisível.
- [x] **Leitura uniforme:** Dashboard e KDS ao montar chamam `refreshShiftStatus()`; não inferem "turno fechado" por cache.

### 2.2.2 Papéis humanos

- [x] **Papéis definidos:** Dono, Gerente, Operador TPV, Cozinha, Staff — ligados a dispositivo e/ou turno (conforme contrato de pessoas do projeto).
- [x] **Ações permitidas por papel:** TPV só cria pedido com turno aberto; quem abre turno fica registado como responsável.
- [x] **Sem ações anónimas:** `opened_by` nunca null — ShiftGate e TPVMinimal usam "Operador TPV"; TPV completo usa currentOperatorId.

### 2.2.3 Header operacional

- [x] **Restaurante:** Nome do restaurante como primeiro elemento (fonte: `gm_restaurants.name` / TenantContext).
- [x] **Estado:** Uma linha: "Operação Pronta | Core ON | Turno Aberto" (ou Bloqueada / Core OFF / Turno Fechado).
- [x] **Operador actual:** Quando turno aberto — nome caixa + openedBy (fonte: turno activo). Quando não há turno: omitir ou "—".

**Ficheiros prováveis:** Dashboard header/sidebar, `ShiftContext`, componentes que exibem estado operacional (ex.: OperacaoCard, AdminSidebar).

---

## Teste canónico (2.2)

- Abrir turno no TPV → criar pedido → Dashboard e KDS mostram "Turno aberto" e métricas/fila sem banner contraditório.
- Header do Dashboard mostra: nome do restaurante + estado (Turno Aberto) + operador actual (ex.: Caixa Principal).
- Encerrar turno (explícito) → Dashboard/KDS refletem "Turno Fechado"; novo pedido exige abrir turno de novo.

---

## Registo do resultado (a preencher)

- **Data da conclusão:** 2026-02-03
- **2.2.1 Turnos:** [x] / **2.2.2 Papéis:** [x] / **2.2.3 Header:** [x]
- **Teste canónico:** PASSOU
- **Notas:** Ajuste aplicado: `opened_by` nunca anónimo — ShiftGate e TPVMinimal passam "Operador TPV". Header já conforme OPERATIONAL_HEADER_CONTRACT no Dashboard.

Registo em [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md) secção **2.2 — Resultado**.
