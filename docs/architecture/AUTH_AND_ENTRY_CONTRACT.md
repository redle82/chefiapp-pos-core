# AUTH_AND_ENTRY_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato da camada de autenticação e ponto de entrada pós-login  
**Local:** docs/architecture/AUTH_AND_ENTRY_CONTRACT.md  
**Hierarquia:** Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md)

---

## Objetivo

- Criar conta
- Criar vínculo com restaurante
- Entrar no sistema

---

## Rotas Auth

| Rota               | Uso        |
|--------------------|------------|
| `/login`           | Login      |
| `/signup`          | Cadastro   |
| `/forgot-password` | Recuperar senha |

---

## Comportamento pós-login/signup

**Destino único, sem exceção:**

→ **`/app/dashboard`**

- Sem onboarding gate
- Sem redirect para TPV
- Sem redirect para operação
- Login **nunca** decide estado operacional

---

## Regras (obrigatórias)

- Login **nunca** redireciona para TPV, KDS ou operação.
- Login **sempre** entra em **gestão** (`/app/dashboard`).
- Nenhuma rota de Auth pode forçar destino operacional.

---

## Referências

- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modo AUTH.
- [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) — destino do portal.

**Violação = regressão arquitetural.**
