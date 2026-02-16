# Sofia Gastrobar — Piloto Real (não mock/demo)

**Status:** Contrato de identidade e anti-regressão
**Objetivo:** Tratar o restaurante `00000000-0000-0000-0000-000000000100` como **restaurante real** "Sofia Gastrobar" (Ibiza): dados de dono, contacto, localização, empregados e credenciais documentadas. Evitar regressão para "mock" ou "demo" genérico.

---

## 1. Declaração

- **Sofia Gastrobar** é o **piloto real** do ChefIApp: um restaurante de verdade, com identidade, dono, empregados e dados configuráveis na web de configuração.
- Não é um "Restaurante Piloto" genérico nem um mock: o nome, e-mail do dono, telefone, morada, cidade (Ibiza), tipo (Gastrobar) e equipa (Sofia, Alex, Maria) estão definidos no Core e na web de configuração.
- Em DEV, o auth pode ser mock (um único utilizador pilot) ou Keycloak com utilizadores reais; as **credenciais de teste** dos funcionários estão documentadas em `docs/ops/SOFIA_GASTROBAR_CREDENTIALS.md` (simulador / ambiente local).

**Dois restaurantes:**

| Modo      | ID                                     | Nome            | Uso                                                       |
| --------- | -------------------------------------- | --------------- | --------------------------------------------------------- |
| **Real**  | `00000000-0000-0000-0000-000000000100` | Sofia Gastrobar | Piloto real (Ibiza).                                      |
| **Trial** | `00000000-0000-0000-0000-000000000099` | Seu restaurante | Modo trial (`?mode=trial` ou `chefiapp_trial_mode=true`). |

---

## 2. Identidade no Core (fonte de verdade)

| Campo        | Valor                                        | Onde se altera                      |
| ------------ | -------------------------------------------- | ----------------------------------- |
| **id**       | `00000000-0000-0000-0000-000000000100`       | Fixo (seed)                         |
| **name**     | Sofia Gastrobar                              | Config → Identidade ou migração     |
| **slug**     | sofia-gastrobar                              | Config ou migração                  |
| **email**    | dono@sofiagastrobar.com                      | Config → Geral (e-mail de contacto) |
| **phone**    | +34 692 054 892                              | Config → Geral                      |
| **city**     | Ibiza                                        | Config → Localização                |
| **address**  | Calle de la Marina 15, 07800 Ibiza, Baleares | Config → Localização                |
| **country**  | Spain                                        | Config / migração                   |
| **timezone** | Europe/Madrid                                | Config                              |
| **currency** | EUR                                          | Config                              |
| **locale**   | es-ES                                        | Config                              |
| **type**     | Gastrobar                                    | Config → Identidade                 |
| **logo_url** | (opcional)                                   | Config → Identidade (URL do logo)   |

**Migrações que definem identidade real:**

- `docker-core/schema/migrations/20260207_seed_sofia_gastrobar.sql` — nome, slug, pessoas (gm_restaurant_people), staff (gm_staff).
- `docker-core/schema/migrations/20260208_gm_restaurants_config_columns.sql` — email, phone (demo).
- `docker-core/schema/migrations/20260226_sofia_gastrobar_real_identity.sql` — identidade completa (email dono, city, address, country, timezone, currency, locale, type).

---

## 3. Empregados (pessoas e roles)

| Nome      | Role operacional       | gm_staff.id                          | Uso                 |
| --------- | ---------------------- | ------------------------------------ | ------------------- |
| **Sofia** | manager (dona/gestora) | a0000000-0000-0000-0000-000000000001 | Config, TPV, turnos |
| **Alex**  | waiter                 | a0000000-0000-0000-0000-000000000002 | Sala, TPV           |
| **Maria** | kitchen                | a0000000-0000-0000-0000-000000000003 | KDS, cozinha        |

- **gm_restaurant_people:** check-in AppStaff (código SOFIA, ALEX, MARIA).
- **gm_staff:** turnos, shift_logs, operações.
- **Credenciais de teste (login):** ver `docs/ops/SOFIA_GASTROBAR_CREDENTIALS.md` — apenas ambiente local/simulador; nunca em produção.

---

## 4. Web de configuração

- **Configuração → Identidade:** nome do restaurante, tipo, URL do logo (persistido em `gm_restaurants`).
- **Configuração → Geral:** e-mail de contacto, telefone, texto do recibo (persistido em `gm_restaurants`).
- **Configuração → Localização:** morada, cidade, código postal (persistido em `gm_restaurants`).
- **Configuração → Pessoas / Empregados:** lista e roles (gm_restaurant_people, gm_staff); as senhas de acesso (auth) ficam no auth provider (Keycloak) ou no simulador documentado.

Tudo o que o dono altera na web de configuração deve ser a **fonte de verdade** após guardar; os seeds/migrações definem o estado inicial "real" do Sofia Gastrobar.

---

## 5. Anti-regressão (checklist)

| Verificação            | Descrição                                                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome**               | O restaurante 00000000-0000-0000-0000-000000000100 deve aparecer como "Sofia Gastrobar" (não "Restaurante Piloto" nem "Restaurante Exemplo") quando não estiver em modo trial genérico.                                          |
| **Identidade no Core** | fetchRestaurant / fetchRestaurantForIdentity devem devolver name, city, address, email, type alinhados com a config (e com a migração 20260226 quando aplicada).                                                                 |
| **06-seed-enterprise** | O seed `06-seed-enterprise.sql` **não** deve sobrescrever country, timezone, currency, locale, type quando `slug = 'sofia-gastrobar'` (mantém identidade Sofia).                                                                 |
| **Trial vs real**      | Em modo trial (URL ou localStorage), a UI pode mostrar "Restaurante Exemplo (Trial)"; em modo piloto real (restaurant_id = 00000000-0000-0000-0000-000000000100 e dados do Core), deve mostrar "Sofia Gastrobar" e cidade Ibiza. |
| **Credenciais**        | Senhas e usuários de teste apenas em `docs/ops/SOFIA_GASTROBAR_CREDENTIALS.md` e nunca hardcoded em código de produção.                                                                                                          |

---

## 6. Eliminação gradual da estrutura DEV

- **Objetivo:** Pouco a pouco, eliminar a estrutura "DEV/mock" e tratar o projeto como projeto de verdade.
- **Passos já dados:** (1) Identidade real no Core (migração 20260226). (2) 06-seed-enterprise não sobrescreve Sofia. (3) Documentação do piloto e credenciais.
- **Próximos passos sugeridos:** (1) Em staging, usar Keycloak com utilizadores Sofia, Alex, Maria e mapear para restaurant_users. (2) Remover ou restringir mock auth apenas a local sem Keycloak. (3) Garantir que a web de configuração é sempre a fonte de verdade após edição do dono.

---

## 7. Referências

- **Credenciais (simulador):** [SOFIA_GASTROBAR_CREDENTIALS.md](../ops/SOFIA_GASTROBAR_CREDENTIALS.md)
- **Logo e identidade visual:** [RESTAURANT_LOGO_IDENTITY_CONTRACT.md](./RESTAURANT_LOGO_IDENTITY_CONTRACT.md)
- **Migração identidade real:** `docker-core/schema/migrations/20260226_sofia_gastrobar_real_identity.sql`
- **Seed Sofia (pessoas, menu):** `docker-core/schema/migrations/20260207_seed_sofia_gastrobar.sql`
