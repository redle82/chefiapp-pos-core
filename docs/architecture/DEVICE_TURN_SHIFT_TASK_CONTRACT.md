# Contrato Canónico — Dispositivo como Ator Operacional

**Status:** CANONICAL  
**Tipo:** Contrato de Arquitetura Operacional  
**Camada:** Operação / Runtime  
**Subordinado a:** [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md), [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md), [TASK_SYSTEM_MATRIX_AND_RITUAL.md](./TASK_SYSTEM_MATRIX_AND_RITUAL.md), [STAFF_SESSION_LOCATION_CONTRACT.md](./STAFF_SESSION_LOCATION_CONTRACT.md).

---

## 1. Princípio Fundamental

No ChefIApp, um dispositivo não é um recurso passivo. É um ator operacional vivo, ligado a um turno, a pessoas e a tarefas.

Este contrato define como Dispositivos, Turnos e Tarefas se ligam de forma determinística, evitando:

- dashboards cegos
- erros silenciosos
- dependência humana não explícita
- suporte reativo

---

## 2. Entidade: Dispositivo

### 2.1 Identidade

Todo dispositivo possui identidade estável:

```
Device {
  device_id: UUID
  type: 'TPV' | 'KDS' | 'PRINTER' | 'PAYMENT_TERMINAL' | 'OTHER'
  role_hint: 'caixa' | 'cozinha' | 'delivery' | 'apoio'
  location_id: UUID
}
```

### 2.2 Estados Canónicos

| Estado | Significado |
|--------|-------------|
| registered | Existe no sistema, mas não participa da operação |
| operational | Pode operar se houver turno válido |
| active | Ligado a um turno activo |
| degraded | Funciona parcialmente |
| offline | Inoperante |
| blocked | Bloqueia vendas ou fluxo |

**Regra:** Um dispositivo nunca é "ativo" fora de um turno.

---

## 3. Ligação Dispositivo ↔ Turno

### 3.1 Regra Mestra

Dispositivo só entra em estado ACTIVE se houver um turno activo válido.

```
DeviceShiftBinding {
  device_id
  shift_id
  activated_at
  deactivated_at?
}
```

### 3.2 Consequências

- Sem turno → dispositivo não pode vender
- Fecho de turno → todos os dispositivos associados saem de ACTIVE
- Turno inválido → estado blocked

---

## 4. Ligação Dispositivo ↔ Operador

### 4.1 Responsabilidade Humana

Todo dispositivo activo tem responsável humano explícito:

```
DeviceOperatorBinding {
  device_id
  staff_id
  role: 'owner' | 'manager' | 'staff'
  shift_id
}
```

### 4.2 Regra

Se ninguém é responsável, o sistema assume risco.

Estados derivados:

- unassigned → alerta
- assigned → operação normal
- abandoned (operador saiu sem transferência) → tarefa crítica

---

## 5. Escalas (Schedule) ↔ Turnos ↔ AppStaff

Escalas são planeamento; **não** abrem turno sozinhas. Elas definem “quem deveria trabalhar, quando e em que papel”.

Modelo lógico:

```sql
staff_schedule {
  id            uuid primary key,
  restaurant_id uuid not null,
  person_id     uuid not null,   -- restaurant_people.id
  role          text not null,   -- StaffRole previsto para esse turno
  day           date not null,
  time_range    tstzrange not null,
  location_id   uuid null
}
```

Relações:

- `staff_schedule.person_id` → `restaurant_people.id` (ver `RESTAURANT_PEOPLE_AND_INVITES_CONTRACT.md`).
- `staff_schedule` alimenta as decisões de abertura/fecho de turnos (ShiftEngine) e métricas de disciplina/presença.

Regras de alto nível:

- Uma sessão AppStaff válida pode, no futuro, ser restringida por:

```ts
canExecuteOperation =
  hasOperationalContract &&        // contrato operacional activo (connectByCode / AUTO-JOIN)
  isInShift(person_id, now) &&     // pessoa escalada para este horário
  roleAllowsAction(activeRole);    // permissões por papel
```

- No MVP, `staff_schedule` é usada principalmente para:
  - Alertas: “entrou fora de escala”, “turno aberto sem staff escalado”.
  - Telemetria: presença, pontualidade, carga de trabalho por pessoa/papel.
  - Dashboards: visão Owner/Manager em `/manager/schedule` e relatórios.

Superfícies:

- Configuração / visualização: rotas sob `/manager/schedule` (portal).
- Execução: AppStaff e TPV/KDS apenas **lêem** o resultado (`isInShift`, `shiftState`), não editam escalas.

---

## 5. Dispositivo → Evento → Tarefa

### 5.1 Eventos Operacionais

Exemplos:

- DEVICE_OFFLINE
- NO_ORDERS_FOR_X_MIN
- PRINTER_QUEUE_STUCK
- PAYMENT_TERMINAL_ERROR
- KDS_LAGGING

### 5.2 Geração de Tarefas

| Evento | Tipo de tarefa |
|--------|----------------|
| Offline | Crítica |
| Erro repetido | Ritual |
| Inatividade suspeita | Operacional |
| Falha recorrente | Estrutural |

**Regra:** Eventos não resolvidos nunca ficam só em log. Eles viram trabalho humano explícito.

---

## 6. Tarefa ↔ Ritual ↔ Saúde do Sistema

### 6.1 Repetição

- 1x → tarefa
- 3x no mesmo turno → alerta
- N turnos → problema estrutural

### 6.2 Saúde

```
DeviceHealth {
  device_id
  score: 0–100
  last_incident_at
  recurring_failures
}
```

O Painel de Saúde não é manual — é consequência direta do histórico de tarefas.

---

## 7. Bloqueios Operacionais (Hard Stops)

Um dispositivo pode bloquear vendas quando:

- TPV activo sem operador
- Impressora crítica offline
- Terminal de pagamento com erro persistente
- Turno activo sem caixa válido

**Regra:** Bloqueio nunca é silencioso. O sistema aponta o responsável e a ação.

---

## 8. Offline & Runtime Local

- Dispositivo mantém: estado, eventos, tarefas locais
- Sincroniza com Core quando disponível
- O Core valida. O App executa.

Unidade conceptual única. Runtime distribuído.

---

## 9. O que este contrato PROÍBE

- Dispositivos "ativos" sem turno
- Erros apenas em logs
- Falhas sem responsável
- Venda sem ritual mínimo de abertura
- Dashboards que não levem a ação

---

## 10. Dependências Diretas

Este contrato governa:

- AppStaff (sessions por operador, via `OperatorSession`)
- TPV
- KDS
- Painel "Dispositivos & Operação"
- Health
- Alerts
- Task System
- ControlRoomApp (visão de sessões activas por operador/dispositivo)

Qualquer UI ou feature futura deve referenciar este contrato.

---

## Encerramento

Last.app lista dispositivos. ChefIApp responsabiliza sistemas.

Este contrato é a ponte real entre:

- hardware
- pessoas
- tempo
- trabalho
