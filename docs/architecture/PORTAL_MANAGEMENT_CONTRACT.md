# PORTAL_MANAGEMENT_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato do portal de gestão (GloriaFood mode)  
**Local:** docs/architecture/PORTAL_MANAGEMENT_CONTRACT.md  
**Hierarquia:** Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md)

---

## Princípio

**Este é o sistema.** Sempre acessível após login. Nunca bloqueia acesso; usa banners e checklists.

---

## Rotas principais (prefixo `/app`)

| Rota                  | Uso                              |
|-----------------------|-----------------------------------|
| `/app/dashboard`      | Cockpit geral                    |
| `/app/restaurant`     | Identidade do restaurante        |
| `/app/location`       | Endereço, mesas, zonas            |
| `/app/hours`          | Horários e turnos                |
| `/app/menu`           | Cardápio                         |
| `/app/stock`          | Estoque                          |
| `/app/people`         | Funcionários                     |
| `/app/payments`       | Métodos de pagamento             |
| `/app/integrations`   | Delivery, POS, etc.              |
| `/app/publish`        | Publicação do restaurante        |
| `/app/settings`       | Configurações gerais             |

*(Mapeamento para rotas atuais do merchant-portal: `/config/identity` ↔ restaurant, `/config/location` ↔ location, `/config/schedule` ↔ hours, `/menu-builder` ↔ menu, `/inventory-stock` ↔ stock, `/config/people` ↔ people, `/config/payments` ↔ payments, etc.)*

---

## Comportamento (obrigatório)

- ✅ **Nunca** bloqueia acesso ao portal
- ✅ Usa **banners** e **checklists** para progresso
- ✅ Mostra progresso de configuração
- ❌ **Nunca** redirect forçado para onboarding ou operação

---

## Referências

- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modo MANAGEMENT.
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — gates para TPV/KDS.
- RESTAURANT_LIFECYCLE e MANAGEMENT_ADVISOR: ver [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md).

**Violação = regressão arquitetural.**
