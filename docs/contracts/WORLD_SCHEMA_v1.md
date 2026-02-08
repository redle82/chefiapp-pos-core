# 🌍 CHEFIAPP OS — WORLD SCHEMA v1

**Modelo de dados canónico do mundo.**
Base imutável. Tudo o resto (KDS, TPV, Menu, Financeiro, Simuladores) se apoia aqui.

Compatível com Postgres + PostgREST + Docker. Sem overengineering, sem Node no Core.

---

## Princípios do Schema

- Multi-tenant real (marca → restaurantes → espaços)
- Localidade e tempo como dados, não configs soltas
- Menu e dinheiro como centros
- Pedido como entidade viva
- Eventos como memória
- Humanos como actores
- Nada acoplado à UI

---

## 0️⃣ WORLD / TENANCY

### tenants

| Campo      | Tipo | Descrição |
| ---------- | ---- | --------- |
| tenant_id  | PK   |           |
| name       |      |           |
| brand_name |      |           |
| created_at |      |           |

Ex.: McLike, Sofia Group

### stores

| Campo          | Tipo | Descrição |
| -------------- | ---- | --------- |
| store_id       | PK   |           |
| tenant_id      | FK   |           |
| name           |      |           |
| country        |      |           |
| city           |      |           |
| timezone       |      |           |
| currency       |      |           |
| tax_profile_id |      |           |
| created_at     |      |           |

Cada restaurante físico ou virtual.

### store_spaces

| Campo    | Tipo | Descrição                           |
| -------- | ---- | ----------------------------------- |
| space_id | PK   |                                     |
| store_id | FK   |                                     |
| type     |      | SALON \| KITCHEN \| BAR \| DELIVERY |
| name     |      |                                     |

Permite KDS por estação.

---

## 1️⃣ PEOPLE & ROLES (atores do mundo)

### users

| Campo      | Tipo | Descrição                                                |
| ---------- | ---- | -------------------------------------------------------- |
| user_id    | PK   |                                                          |
| tenant_id  | FK   |                                                          |
| name       |      |                                                          |
| email      |      |                                                          |
| role       |      | CLIENT \| WAITER \| KITCHEN \| MANAGER \| OWNER \| ADMIN |
| created_at |      |                                                          |

### user_store_roles

| Campo    | Tipo | Descrição                             |
| -------- | ---- | ------------------------------------- |
| user_id  | FK   |                                       |
| store_id | FK   |                                       |
| role     |      | WAITER \| MANAGER \| OWNER \| KITCHEN |

Um dono pode operar como garçom, gerente, etc.

---

## 2️⃣ MENU BUILDING 👑 (a rainha)

### menus

| Campo     | Tipo | Descrição |
| --------- | ---- | --------- |
| menu_id   | PK   |           |
| store_id  | FK   |           |
| name      |      |           |
| is_active |      |           |

### menu_categories

| Campo       | Tipo | Descrição |
| ----------- | ---- | --------- |
| category_id | PK   |           |
| menu_id     | FK   |           |
| name        |      |           |
| order_index |      |           |

### products

| Campo       | Tipo | Descrição |
| ----------- | ---- | --------- |
| product_id  | PK   |           |
| store_id    | FK   |           |
| name        |      |           |
| description |      |           |
| base_price  |      |           |
| tax_rate    |      |           |
| is_active   |      |           |

### product_variants

| Campo       | Tipo | Descrição |
| ----------- | ---- | --------- |
| variant_id  | PK   |           |
| product_id  | FK   |           |
| name        |      |           |
| price_delta |      |           |

### product_availability

| Campo       | Tipo | Descrição |
| ----------- | ---- | --------- |
| product_id  | FK   |           |
| day_of_week |      |           |
| start_time  |      |           |
| end_time    |      |           |

**Contrato chave:** Nenhum pedido pode existir sem `product_id` válido.

---

## 3️⃣ CORE FINANCE ❤️ (o coração)

### payments

| Campo      | Tipo | Descrição                      |
| ---------- | ---- | ------------------------------ |
| payment_id | PK   |                                |
| order_id   | FK   |                                |
| amount     |      |                                |
| method     |      | CASH \| CARD \| ONLINE \| UBER |
| status     |      | PENDING \| PAID \| FAILED      |
| created_at |      |                                |

### invoices

| Campo        | Tipo | Descrição |
| ------------ | ---- | --------- |
| invoice_id   | PK   |           |
| order_id     | FK   |           |
| total_amount |      |           |
| tax_amount   |      |           |
| issued_at    |      |           |

---

## 4️⃣ ORDERS (o mundo em movimento)

### orders

| Campo      | Tipo              | Descrição                                                          |
| ---------- | ----------------- | ------------------------------------------------------------------ |
| order_id   | PK                |                                                                    |
| store_id   | FK                |                                                                    |
| source     |                   | TABLE \| WEB \| TPV \| MINI_TPV \| UBER \| API                     |
| status     |                   | Conforme [ORDER_STATUS_CONTRACT_v1](./ORDER_STATUS_CONTRACT_v1.md) |
| table_id   | FK, nullable      |                                                                    |
| created_by | user_id, nullable |                                                                    |
| created_at |                   |                                                                    |

### order_items

| Campo         | Tipo         | Descrição                   |
| ------------- | ------------ | --------------------------- |
| order_item_id | PK           |                             |
| order_id      | FK           |                             |
| product_id    | FK           |                             |
| variant_id    | FK, nullable |                             |
| quantity      |              |                             |
| status        |              | PENDING \| IN_PREP \| READY |

---

## 5️⃣ TABLES / SESSIONS (salão)

### tables

| Campo    | Tipo | Descrição |
| -------- | ---- | --------- |
| table_id | PK   |           |
| store_id | FK   |           |
| label    |      |           |

### table_sessions

| Campo      | Tipo | Descrição |
| ---------- | ---- | --------- |
| session_id | PK   |           |
| table_id   | FK   |           |
| opened_at  |      |           |
| closed_at  |      |           |

---

## 6️⃣ TASK SYSTEM 📋

### tasks

| Campo            | Tipo              | Descrição                       |
| ---------------- | ----------------- | ------------------------------- |
| task_id          | PK                |                                 |
| store_id         | FK                |                                 |
| type             |                   | ORDER \| REGULATORY \| CLEANING |
| status           |                   | OPEN \| DONE \| FAILED          |
| related_order_id | FK, nullable      |                                 |
| assigned_to      | user_id, nullable |                                 |
| created_at       |                   |                                 |

Quando não há pedidos → tarefas REGULATORY entram.

---

## 7️⃣ KDS (execução)

### kds_views

| Campo    | Tipo | Descrição |
| -------- | ---- | --------- |
| kds_id   | PK   |           |
| store_id | FK   |           |
| space_id | FK   |           |
| name     |      |           |

### kds_queue

| Campo    | Tipo | Descrição |
| -------- | ---- | --------- |
| order_id | FK   |           |
| kds_id   | FK   |           |
| priority |      |           |

KDS só lê, não cria estado.

---

## 8️⃣ EVENT SYSTEM 🧬 (memória do mundo)

### order_events

| Campo       | Tipo | Descrição                     |
| ----------- | ---- | ----------------------------- |
| event_id    | PK   |                               |
| order_id    | FK   |                               |
| from_status |      |                               |
| to_status   |      |                               |
| actor_type  |      | USER \| SYSTEM \| INTEGRATION |
| actor_id    |      |                               |
| created_at  |      |                               |

Base para replay + simuladores.

---

## 9️⃣ INTEGRAÇÕES 🌐

### integrations

| Campo          | Tipo | Descrição            |
| -------------- | ---- | -------------------- |
| integration_id | PK   |                      |
| store_id       | FK   |                      |
| type           |      | UBER \| GLOVO \| API |
| status         |      |                      |

### external_orders

| Campo             | Tipo | Descrição |
| ----------------- | ---- | --------- |
| external_order_id | PK   |           |
| integration_id    | FK   |           |
| external_ref      |      |           |
| mapped_order_id   | FK   |           |

---

## 🔟 WORLD CONFIG (tempo, leis, regras)

### world_config

| Campo               | Tipo | Descrição |
| ------------------- | ---- | --------- |
| store_id            | PK   |           |
| timezone            |      |           |
| currency            |      |           |
| tax_rules           |      |           |
| legal_tasks_enabled |      |           |

---

## O que este schema permite (objetivamente)

- Restaurantes simultâneos no mundo
- Pedidos de qualquer canal
- KDS central e mini
- Tarefas legais automáticas
- Menu como fonte única
- Dinheiro como verdade
- Clientes acompanhando pedidos
- Dono / gerente / garçom todos operando
- Replay completo
- Simulação massiva no Docker

---

## Frase de fecho

Este schema não é banco.
É a **gramática do mundo** ChefIApp OS.
