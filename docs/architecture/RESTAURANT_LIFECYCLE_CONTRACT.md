# RESTAURANT_LIFECYCLE_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato do ciclo de vida do restaurante (configured / published / operational)  
**Local:** docs/architecture/RESTAURANT_LIFECYCLE_CONTRACT.md  
**Hierarquia:** Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) e [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)

---

## Princípio

O restaurante tem três estados canónicos que governam o que está acessível: **configured**, **published**, **operational**. Nenhuma rota ou gate decide sozinha; obedecem a este contrato.

---

## Três bandeiras (obrigatórias)

| Bandeira       | Significado                                                                 | Controla |
|----------------|-----------------------------------------------------------------------------|----------|
| **configured** | Restaurante existe e o utilizador está vinculado; identidade mínima existe. | Se false: estado fatal ou pré-identidade. |
| **published**  | Restaurante foi explicitamente publicado.                                  | Acesso a TPV/KDS; presença pública. |
| **operational** | Existe turno aberto (caixa aberta).                                       | Pedidos e pagamentos; uso do caixa. |

---

## Modelo GloriaFood (três fases)

1. **Configuring:** Gestão aberta, operação bloqueada. Portal acessível; TPV/KDS inacessíveis até published.
2. **Published:** Gestão aberta, apps operacionais (TPV/KDS) acessíveis; pedidos exigem turno aberto.
3. **Operational:** Gestão aberta, apps operacionais acessíveis, turno ativo (caixa aberta).

---

## Derivação (implementação de referência)

- **configured** = `!!restaurantId` (restaurante existe e utilizador vinculado).
- **published** = valor explícito do Core/backend (restaurante publicado).
- **operational** = turno aberto (caixa aberta); fonte = Core / ShiftContext.

Implementação em código: [merchant-portal/src/core/lifecycle/Lifecycle.ts](../../merchant-portal/src/core/lifecycle/Lifecycle.ts) — `deriveLifecycle(id, isPublished, isShiftOpen)`.

---

## Regras

- Nenhuma rota operacional monta sem o gate correspondente (published para TPV/KDS; operational para caixa). Ver [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md).
- O portal de gestão **nunca** bloqueia acesso; usa banners/checklists quando não publicado. Ver [MANAGEMENT_ADVISOR_CONTRACT.md](./MANAGEMENT_ADVISOR_CONTRACT.md).

---

## Referências

- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modos de boot.
- [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) — portal sempre acessível.
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — gates por rota.
- [CASH_REGISTER_LIFECYCLE_CONTRACT.md](./CASH_REGISTER_LIFECYCLE_CONTRACT.md) — regras do caixa (operational).

**Violação = regressão arquitetural.**
