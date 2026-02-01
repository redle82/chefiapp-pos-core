# PUBLIC_SITE_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato da camada pública (site do sistema / marketing)  
**Local:** docs/architecture/PUBLIC_SITE_CONTRACT.md  
**Hierarquia:** Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) e [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md)

---

## Objetivo

- Apresentar o produto
- Converter
- Levar ao cadastro/login
- **Nunca** tocar no Core do restaurante

---

## Rotas públicas (boot PUBLIC)

| Rota        | Uso                    |
|------------|-------------------------|
| `/`        | Landing principal       |
| `/pricing` | Preços                  |
| `/features`| Funcionalidades         |
| `/demo`    | Demonstração isolada    |
| `/login`   | Login                   |
| `/signup`  | Cadastro                |

---

## Regras (obrigatórias)

- ❌ **NÃO** carrega Runtime
- ❌ **NÃO** carrega RestaurantContext
- ❌ **NÃO** chama Core
- ❌ **NÃO** sabe se restaurante existe
- ✅ Apenas Auth endpoints permitidos (login/signup para identidade; não para dados do restaurante)

---

## Regra final

- **Landing funciona offline.**
- **Backend do restaurante é irrelevante** nesta camada.
- Se o Core cair, o site público continua intacto.

---

## Referências

- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modo PUBLIC.
- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) — destino pós-login.

**Violação = regressão arquitetural.**
