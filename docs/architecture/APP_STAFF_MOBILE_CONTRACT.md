# APP_STAFF_MOBILE_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato das rotas e regras do AppStaff (mobile only, nunca web)  
**Local:** docs/architecture/APP_STAFF_MOBILE_CONTRACT.md  
**Hierarquia:** Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) e [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md)

---

## Princípio

O AppStaff é **totalmente separado** do web. Roda apenas como app nativo (Expo, iOS/Android). Nunca acessível no web; nunca rota default; nunca destino pós-login web.

---

## Rotas (internas do app mobile)

| Rota             | Uso                    |
|------------------|------------------------|
| `/staff/home`    | Home do staff          |
| `/staff/tasks`   | Tarefas                |
| `/staff/checkin`| Check-in de turno      |
| `/staff/mini-kds`| Mini KDS (leitura)     |
| `/staff/mini-tpv`| Mini TPV (leitura)     |

*(Mapeamento no projecto `mobile-app`: tabs/screens equivalentes; prefixo pode ser interno ao Expo Router.)*

---

## Regras obrigatórias

- ❌ **Nunca** acessível no web. No merchant-portal, rotas como `/garcom` mostram «Disponível apenas no app mobile»; o terminal real está em `mobile-app` (Expo).
- ❌ **Nunca** rota default do sistema web. Login/signup levam sempre a `/app/dashboard`, nunca a Staff.
- ❌ **Nunca** destino pós-login web. O utilizador entra no portal de gestão; Staff é um app separado em dispositivo móvel.
- ✅ Boot mode **STAFF_MOBILE** inicializa Core e contexts no app nativo; não se aplica ao merchant-portal.

---

## Boot mode

AppBootMode inclui `STAFF_MOBILE`. No app mobile (Expo), o boot carrega RestaurantContext e Core; no web, as rotas Staff não existem como operacionais (apenas mensagem de "app mobile only").

---

## Referências

- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modo STAFF_MOBILE.
- [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) — lei macro do AppStaff.
- [CORE_APPSTAFF_IOS_UIUX_CONTRACT.md](./CORE_APPSTAFF_IOS_UIUX_CONTRACT.md) — UI/UX canónica iOS.
- [CORE_MOBILE_TERMINALS_CONTRACT.md](./CORE_MOBILE_TERMINALS_CONTRACT.md) — AppStaff não é Web; só app nativo.

**Violação = regressão arquitetural.**
