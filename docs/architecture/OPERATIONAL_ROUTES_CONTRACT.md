# OPERATIONAL_ROUTES_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato das rotas operacionais (TPV / KDS / Caixa)  
**Local:** docs/architecture/OPERATIONAL_ROUTES_CONTRACT.md  
**Hierarquia:** Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) e [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md)

---

## Princípio

Só entra quem está pronto para operar. Rotas operacionais têm **gates obrigatórios**.

---

## Rotas operacionais (prefixo `/op` recomendado)

| Rota        | Uso                | Nota                          |
|-------------|--------------------|-------------------------------|
| `/op/tpv`   | TPV                | RequireOperational + published |
| `/op/kds`   | Cozinha            | RequireOperational + published |
| `/op/cash`  | Caixa              | operational === true          |
| `/op/staff` | AppStaff Web (se existir) | Opcional                 |

*(Merchant-portal: rotas canónicas `/op/tpv`, `/op/kds`, `/op/cash`, `/op/staff`; `/tpv` e `/kds-minimal` redirecionam para `/op/*`.)*

---

## Gates obrigatórios

| Rota      | Exige                    |
|-----------|---------------------------|
| `/op/tpv` | `published === true`      |
| `/op/kds` | `published === true`      |
| `/op/cash`| `operational === true`   |

Sem exceção. Nenhuma rota operacional monta sem passar pelo gate correspondente.

---

## Referências

- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — definição dos gates.
- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — caixa e Core.
- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modo OPERATIONAL.

**Violação = regressão arquitetural.**
