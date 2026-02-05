# Rota — Reservas (Web de Configuração)

**Path exato:** `/reservations`  
**Tipo:** WEB CONFIG  
**Estado atual:** UI PARCIAL (página existe; backend/RPCs podem estar pendentes).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** Ver e gerir reservas do dia/semana: confirmar, cancelar, no-shows, capacidade e horários. O dono usa para alinhar sala e equipa com a procura.
- **Para quem é:** Dono apenas — web de configuração.
- **Em que momento do ciclo de vida:** TRIAL e ACTIVE; em SETUP pode mostrar estado vazio (“Ainda não há reservas” ou “Configure horários e mesas para aceitar reservas”).

---

## 2. Rota & Acesso

- **Path:** `/reservations`
- **Tipo:** WEB CONFIG.
- **Guard aplicado:** CoreFlow — ALLOW para hasOrg; sem guard operacional.
- **Comportamento por SystemState:**
  - **SETUP:** ALLOW; estado vazio com CTA para Config (horários/localização).
  - **TRIAL:** ALLOW; dados reais.
  - **ACTIVE:** ALLOW; dados reais.
  - **SUSPENDED:** ALLOW leitura; criação/edição de reservas conforme política.

---

## 3. Conexão com o Core

- **Entidades lidas:** Restaurant (horários, mesas), Reservations (lista por data), eventualmente Tables.
- **Entidades escritas:** Reservations (criar, atualizar estado: confirmada, cancelada, no-show).
- **Eventos gerados:** `RESERVATION_CREATED`, `RESERVATION_CONFIRMED`, `RESERVATION_CANCELLED`, `RESERVATION_NO_SHOW`. Não usar conceito “demo” para reservas.

---

## 4. Backend & Dados

- **Tabelas envolvidas (nome lógico):** `reservations` (restaurant_id, date, time, guest_name, guests_count, status, table_id, etc.). Referência possível: [RESERVATION_ENGINE.md](../RESERVATION_ENGINE.md).
- **RPCs esperadas:** `list_reservations_by_date`, `create_reservation`, `update_reservation_status`. Backend local: Docker/Supabase; se não existir, lista vazia e estado vazio.
- **Estado vazio honesto:** “Ainda não há reservas para esta data.” / “Configure horários e mesas em Config para aceitar reservas.”

---

## 5. UI / UX Esperada

- **Estados:** (1) **Vazio** — sem reservas ou sem configuração; CTAs: “Configurar horários”, “Ver Config”. (2) **Em uso** — calendário ou lista por dia, filtros, ações: confirmar, cancelar, marcar no-show. (3) **Erro** — “Não foi possível carregar as reservas. Tente novamente.”
- **Mensagens:** Sem “demo”; dados reais do restaurante.
- **CTAs:** “Nova reserva”, “Ver por dia”, “Configurar horários”.

---

## 6. Integração com Outras Rotas

- **De onde vem:** Dashboard (módulo Reservas), Config (horários, mesas).
- **Para onde vai:** Dashboard, Config, eventualmente Presença Online (se reservas forem aceites na página pública).
- **Dependências:** Horários e mesas em Config melhoram a experiência; não bloquear a rota — mostrar estado vazio se faltar configuração.

---

## 7. Regras de Negócio

- **Permitido:** Listar, criar, confirmar, cancelar reservas; marcar no-show; ver estado vazio.
- **Bloqueado:** Não bloquear por billing; não mostrar “reservas de demonstração”.
- **Regra de ouro:** Reservas são sempre do restaurante (trial ou ativo); nenhuma reserva fictícia para “demo”.

---

## 8. Estado Atual

- **Estado:** UI PARCIAL — `ReservationsDashboardPage` existe; motor de reservas e RPCs podem estar parciais.
- **Próximo passo técnico:** (1) Incluir `/reservations` em `isWebConfigPath` se o fluxo usar prefixos diferentes; (2) Implementar ou ligar RPCs/tabelas de reservas no backend local; (3) Estado vazio e CTAs alinhados com Config.
