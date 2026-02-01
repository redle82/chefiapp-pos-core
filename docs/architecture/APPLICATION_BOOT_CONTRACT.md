# APPLICATION_BOOT_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato de boot e separação de mundos (modelo GloriaFood / LastApp)  
**Local:** docs/architecture/APPLICATION_BOOT_CONTRACT.md  
**Hierarquia:** Subordinado a [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md)

---

## Lei do sistema

O sistema distingue **cinco** mundos no boot. Cada modo define o que pode inicializar e o que **não** pode.

**Erro raiz:** Se a camada pública (site/marketing) inicializar Runtime ou Core, o sistema está arquiteturalmente errado.

---

## AppBootMode (obrigatório)

```
AppBootMode =
  | 'PUBLIC'
  | 'AUTH'
  | 'MANAGEMENT'
  | 'OPERATIONAL'
  | 'STAFF_MOBILE'
```

---

## Resumo executivo (modelo LastApp / GloriaFood)

| Camada        | Bloqueia acesso? | Inicializa Core? | Contrato principal              |
|---------------|------------------|------------------|----------------------------------|
| **Público**   | ❌               | ❌               | PUBLIC_SITE_CONTRACT             |
| **Auth**      | ❌               | ❌               | AUTH_AND_ENTRY_CONTRACT          |
| **Gestão**    | ❌               | ✅               | PORTAL_MANAGEMENT_CONTRACT       |
| **Operação**  | ✅ (gates)       | ✅               | OPERATIONAL_ROUTES_CONTRACT     |
| **Staff Mobile** | ✅            | ✅               | CORE_APPSTAFF_CONTRACT / mobile  |

---

## Definição por modo

| Modo             | Rotas / contexto                    | RuntimeContext | RestaurantContext | Core /rest/v1 |
|------------------|-------------------------------------|----------------|-------------------|---------------|
| **PUBLIC**       | `/`, `/pricing`, `/features`, `/demo`, `/login`, `/signup` | ❌ NÃO | ❌ NÃO | ❌ NÃO |
| **AUTH**         | `/login`, `/signup`, `/forgot-password` (transição para gestão) | ❌ NÃO | ❌ NÃO | ❌ NÃO* |
| **MANAGEMENT**   | `/app/*`, dashboard, config, etc.   | ✅ Sim         | ✅ Sim            | ✅ Sim        |
| **OPERATIONAL**  | `/op/tpv`, `/op/kds`, `/op/cash`    | ✅ Sim         | ✅ Sim            | ✅ Sim        |
| **STAFF_MOBILE** | App nativo (Expo); não web          | ✅ Sim         | ✅ Sim            | ✅ Sim        |

\* Auth pode chamar apenas endpoints de identidade (login/signup); não dados do restaurante.

---

## Regras por modo

### PUBLIC (Site do sistema / Marketing)

- **NÃO** carrega RuntimeContext nem RestaurantContext.
- **NÃO** chama Core; **nenhum** fetch a `/rest/v1`.
- Apenas UI estática + CTA. Landing funciona **offline**; backend do restaurante é irrelevante.
- Contrato: [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md).

### AUTH

- Login/signup levam **sempre** a `/app/dashboard`. Sem onboarding gate; sem redirect para TPV.
- Contrato: [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md).

### MANAGEMENT (Portal de gestão)

- Carrega RestaurantContext e Lifecycle. Nunca bloqueia acesso; usa banners/checklists.
- Contrato: [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md).

### OPERATIONAL (TPV / KDS / Caixa)

- Só inicializa com `published === true` (e `operational === true` quando aplicável). Gates obrigatórios.
- Contratos: [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md), [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md).

### STAFF_MOBILE

- Totalmente separado do web. Nunca acessível no web; nunca rota default; nunca destino pós-login web.
- Contrato: [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) / AppStaff mobile.

---

## Router soberano

- Rotas **PUBLIC** e **AUTH** são renderizadas **fora** da árvore de providers que montam RestaurantRuntimeProvider e ShiftProvider.
- Rotas **MANAGEMENT** e **OPERATIONAL** são filhas dessa árvore; **OPERATIONAL** adiciona RequireOperational (e gates publicado/operacional).

---

## Regra suprema

**Nenhuma rota decide sozinha.** Toda rota obedece a um contrato.

---

## Referências

- [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) — rotas oficiais.
- [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md) — camada pública.
- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) — auth e entrada.
- [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) — portal de gestão.
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — rotas operacionais.
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — gates operacionais.

**Violação = regressão arquitetural.**
