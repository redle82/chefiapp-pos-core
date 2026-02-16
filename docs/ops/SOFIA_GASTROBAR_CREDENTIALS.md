# Sofia Gastrobar — Credenciais de teste (simulador / DEV)

**Uso:** Apenas ambiente local e simulador. **Nunca** utilizar estas senhas em produção nem expô-las em repositórios públicos.

---

## 1. Contexto

O restaurante **Sofia Gastrobar** (id `00000000-0000-0000-0000-000000000100`) tem três funcionários registados no Core (gm_restaurant_people, gm_staff): **Sofia** (manager), **Alex** (waiter), **Maria** (kitchen). Para testes e demonstrações em ambiente local, as credenciais de login podem ser as abaixo, **desde que** o auth esteja configurado para isso (Keycloak dev realm ou mock auth com seleção de pessoa).

---

## 2. Credenciais de teste (apenas DEV/simulador)

| Utilizador | E-mail (Keycloak) | Senha de teste (DEV) | Role no restaurante |
|------------|-------------------|----------------------|----------------------|
| Sofia      | sofia@sofiagastrobar.com | SofiaDev2025!        | owner / manager      |
| Alex       | alex@sofiagastrobar.com  | AlexDev2025!         | waiter               |
| Maria      | maria@sofiagastrobar.com | MariaDev2025!        | kitchen              |

- **Alterar em produção:** Em produção ou staging real, estes utilizadores devem ter senhas fortes e únicas; este documento não se aplica.
- **Mock auth (sem Keycloak):** Com `DEBUG_DIRECT_FLOW` e backend Docker, o AuthProvider pode usar um único utilizador "pilot" (pilot@chefiapp.com); a seleção de Sofia/Alex/Maria no AppStaff é por **código de pessoa** (SOFIA, ALEX, MARIA) ou por escolha de perfil no simulador, não por login com senha distinta.

---

## 3. Onde configurar (Keycloak)

Se estiveres a usar Keycloak em ambiente local ou de integração:

1. Criar realm de desenvolvimento (ex.: `chefiapp-dev`).
2. Criar utilizadores com os e-mails acima e atribuir as senhas de teste (temporárias).
3. Mapear `user_id` (sub do JWT) para `restaurant_users` com `restaurant_id = 00000000-0000-0000-0000-000000000100` e roles owner, waiter, kitchen conforme a tabela acima.

---

## 4. Simulador separado

Se existir um **simulador** (página ou fluxo separado) para testar login por funcionário:

- Usar os e-mails e senhas desta tabela apenas no simulador e em DEV.
- Não expor este ficheiro em builds de produção nem em URLs públicas.
- Manter este documento em `docs/ops/` e referenciá-lo a partir de `docs/architecture/SOFIA_GASTROBAR_REAL_PILOT.md`.

---

## 5. Rotação de senhas de teste

Se alterares as senhas de teste (ex.: por política de segurança), atualizar este documento e comunicar à equipa. Em produção, nunca usar as senhas listadas aqui.
