# OPERATIONAL_GATES_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato dos gates que protegem rotas operacionais  
**Local:** docs/architecture/OPERATIONAL_GATES_CONTRACT.md  
**Hierarquia:** Subordinado a [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md)

---

## Princípio

Nenhuma rota operacional (TPV, KDS, Caixa) é acessível sem que o sistema esteja **publicado** e, quando aplicável, **operacional**.

---

## Gates por rota

| Rota        | Gate principal           | Fallback (quando bloqueado)     |
|-------------|--------------------------|----------------------------------|
| TPV         | `published === true`     | Redirect para `/app/dashboard`   |
| KDS         | `published === true`     | Redirect para `/app/dashboard`   |
| Caixa       | `operational === true`   | Redirect para `/app/dashboard`   |

---

## Implementação

- **published**: restaurante publicado (lifecycle ativo); fonte = Core / RestaurantRuntime.
- **operational**: caixa/turno operacional quando aplicável; fonte = Core / ShiftContext.
- Componente de enforcement: `RequireOperational` (ou equivalente) nas rotas `/op/tpv`, `/op/kds`, `/op/cash`.
- Reality check (DRAFT vs LIVE) aplica-se antes de permitir operação física.

---

## Regra suprema

**Nenhuma rota decide sozinha.** Toda rota obedece a um contrato. Os gates são parte do contrato operacional.

---

## Referências

- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — rotas e gates.
- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modo OPERATIONAL.

**Violação = regressão arquitetural.**
