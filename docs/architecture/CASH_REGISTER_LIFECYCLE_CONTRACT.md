# CASH_REGISTER_LIFECYCLE_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato do ciclo de vida do caixa (operational === true)  
**Local:** docs/architecture/CASH_REGISTER_LIFECYCLE_CONTRACT.md  
**Hierarquia:** Subordinado a [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) e [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md)

---

## Princípio

A rota de **caixa** (ex.: `/op/cash`) só é acessível quando existe **turno aberto** (caixa aberta). Ou seja, exige `operational === true`. TPV e KDS exigem `published === true`; o caixa exige ainda que o turno esteja ativo.

---

## Gate obrigatório

| Rota        | Exige                    | Fallback (bloqueado)   |
|-------------|--------------------------|-------------------------|
| `/op/cash`  | `operational === true`   | Redirect para `/app/dashboard` |

Sem exceção. Nenhuma rota de caixa monta sem passar pelo gate.

---

## Definição de operational

- **operational** = existe turno ativo (caixa aberta). Fonte = Core / ShiftContext.
- Derivação: ver [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) — `operational` é verdadeiro quando há shift aberto.

---

## Relação com outros gates

- **TPV / KDS:** exigem `published === true` (RequireOperational no código atual).
- **Caixa:** exige `operational === true` (turno aberto). Pode ser implementado como extensão do RequireOperational ou gate dedicado (ex.: RequireShiftOpen) na rota `/op/cash`.

---

## Referências

- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — gates por rota.
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — rotas `/op/cash`.
- [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) — bandeira operational.
- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — Core soberano para caixa e finanças.

**Violação = regressão arquitetural.**
