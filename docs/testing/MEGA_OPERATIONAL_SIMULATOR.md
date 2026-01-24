# MEGA OPERATIONAL SIMULATOR v2

> Simulação de 24 horas de operação em minutos usando Time Warp.
> **FASE 2A: SLA + Escalonamento + Hard-Blocking**

---

## Visão Geral

O MEGA OPERATIONAL SIMULATOR permite validar o comportamento do ChefIApp sob condições operacionais realistas, incluindo:

- **Picos de almoço e jantar**
- **Períodos de calmaria**
- **Abertura e fechamento**
- **Trocas de turno**
- **Tarefas operacionais e compliance**
- **Múltiplos perfis de restaurante**
- **SLA por tarefa com deadline**
- **Escalonamento automático (role → manager → owner)**
- **Hard-blocking (turno não fecha sem checklist)**
- **Auditoria completa de falhas**

Tudo isso **sem UI**, **100% headless**, **reprodutível** e **em minutos**.

---

## Comandos Disponíveis

```bash
# Simulação pequena (10 restaurantes, 5 min real = 24h simuladas)
make simulate-24h-small

# Simulação enterprise (100 restaurantes, 10 min)
make simulate-24h-enterprise

# Simulação máxima (stress test, 15 min)
make simulate-24h-max

# Validar asserts
make assertions

# Ver último relatório
make report-24h
```

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEGA OPERATIONAL SIMULATOR                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │   TIME WARP      │  ← 24h simuladas em 5-15 min              │
│  │   ENGINE         │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              RESTAURANT PROFILES                        │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │     │
│  │  │Ambulante │  │ Pequeno  │  │  Médio   │  ...        │     │
│  │  │ 1-2 pax  │  │ 2-5 pax  │  │ 10-30pax │             │     │
│  │  └──────────┘  └──────────┘  └──────────┘             │     │
│  └────────────────────────────────────────────────────────┘     │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              POLICY PACKS (Compliance)                  │     │
│  │  • OPENING_STANDARD   • CLOSING_STANDARD               │     │
│  │  • CLEANING_STANDARD  • FOOD_SAFETY                    │     │
│  └────────────────────────────────────────────────────────┘     │
│           │                                                      │
│           ▼                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Print         │  │ KDS Kitchen   │  │ KDS Bar       │       │
│  │ Emulator      │  │ Consumer      │  │ Consumer      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│           │                  │                  │               │
│           └──────────────────┴──────────────────┘               │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │   SUPABASE      │                          │
│                    │   LOCAL         │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Perfis de Restaurante

### Ambulante (Food Truck)
- **Staff:** 1-2 pessoas
- **Mesas:** 0
- **Menu:** 10 itens
- **Picos:** Almoço 80%, Jantar 90%
- **Policy Packs:** OPENING_BASIC, CLOSING_BASIC

### Pequeno (Familiar)
- **Staff:** 2-5 pessoas
- **Mesas:** 10
- **Menu:** 30 itens
- **Stations:** Kitchen, Bar, Cleaning
- **Policy Packs:** OPENING_STANDARD, CLOSING_STANDARD, CLEANING_STANDARD

### Médio (Estruturado)
- **Staff:** 10-30 pessoas
- **Mesas:** 30
- **Menu:** 60 itens
- **Stations:** Kitchen, Bar, Cleaning, Manager
- **Policy Packs:** Completo + MISE_EN_PLACE + SHIFT_HANDOVER

---

## Policy Packs

### OPENING_STANDARD
Tarefas de abertura:
- Verificar temperatura câmaras (hard blocking)
- Verificar estoque crítico
- Mise en place
- Verificar caixa (hard blocking)
- Limpar salão
- Verificar equipamentos (hard blocking)

### CLOSING_STANDARD
Tarefas de fechamento:
- Fechar caixa (hard blocking)
- Temperatura final (hard blocking)
- Limpar cozinha
- Limpar bar
- Limpar salão
- Desligar equipamentos
- Verificar segurança (hard blocking)

### CLEANING_STANDARD
Tarefas contínuas:
- Limpar mesa (trigger: table.closed)
- Limpar banheiros (cron: 2h)
- Verificar lixeiras (cron: 2h)
- Limpar derramamento (trigger: incident.spill)

---

## Time Warp

O sistema usa um multiplicador de tempo para simular 24h em minutos:

| Modo | Duração Real | Horas Simuladas | Multiplicador |
|------|--------------|-----------------|---------------|
| small | 5 min | 24h | 288x |
| enterprise | 10 min | 24h | 144x |
| max | 15 min | 24h | 96x |

---

## Métricas Coletadas

- Pedidos por hora (virtual)
- Pedidos por fonte (mobile, pos, qr_web)
- Print jobs gerados
- Eventos disparados
- Tarefas criadas/completadas/escaladas
- KDS events (tempo de preparo)
- Backlog de cozinha

---

## Asserts (Critérios de Sucesso)

| Assert | Condição |
|--------|----------|
| Orphan Items | = 0 |
| Orphan Print Jobs | = 0 |
| Eventos Perdidos | = 0 |
| Pedidos Duplicados | = 0 |

---

## Relatórios

Após cada simulação, um relatório é gerado em:
- `reports/simulation-{id}.md` (Markdown)
- `reports/simulation-{id}.json` (JSON completo)

O relatório inclui:
- Configuração da simulação
- Métricas gerais
- Distribuição por hora
- Status dos asserts
- Heatmap de picos

---

## Estrutura de Arquivos

```
docker-tests/
├── simulators/
│   ├── simulate-24h.js       # Engine principal
│   ├── offline-controller.js # Controlador de offline
│   ├── kds-kitchen.js        # Consumer cozinha
│   ├── kds-bar.js            # Consumer bar
│   └── ...
├── task-engine/
│   └── policies/
│       ├── opening.json
│       ├── closing.json
│       └── cleaning.json
├── seeds/
│   └── profiles/
│       ├── ambulante.json
│       ├── pequeno.json
│       └── medio.json
├── reports/
│   └── simulation-*.md
└── Makefile
```

---

## Sistema de Governança (FASE 2A)

### SLA por Tarefa

Cada tarefa tem um deadline calculado automaticamente:

```
sla_deadline = created_at + sla_minutes
```

Tarefas que excedem o SLA são escalonadas automaticamente.

### Escalonamento Automático

| Nível | Role | Escala Para |
|-------|------|-------------|
| 0 | kitchen, bar, cleaning | manager |
| 1 | manager | owner |
| 2 | owner | (não escala) |

O escalonamento ocorre **10 minutos** após o SLA ser excedido.

### Hard-Blocking

Tarefas marcadas como `hard_blocking = true`:
- Impedem o fechamento do turno
- Exigem conclusão ou override manual
- São auditadas em `gm_shift_blocks`

**Comportamento no fechamento:**
1. Sistema detecta tarefas pendentes obrigatórias
2. Tenta completar "sob pressão" (70% chance)
3. Se ainda houver pendentes, aplica **override**
4. Tarefas não completadas são marcadas como **FAILED**

### Tabelas de Auditoria

```sql
-- Log de escalações
gm_task_escalations (
  task_id, from_level, to_level,
  from_role, to_role, reason,
  sla_exceeded_by_minutes
)

-- Bloqueios de turno
gm_shift_blocks (
  shift_id, task_id, block_reason,
  was_overridden, override_reason
)
```

---

## Métricas de Governança

O relatório agora inclui:

| Métrica | Descrição |
|---------|-----------|
| Escalações → Manager | Tarefas escaladas para gerente |
| Escalações → Owner | Tarefas escaladas para dono |
| Bloqueios de Turno | Tentativas de fechar com tarefas pendentes |
| Overrides | Fechamentos forçados |
| Tasks Failed | Tarefas não completadas |

---

## Próximas Evoluções

- [x] ~~FASE 2A: SLA + Escalonamento + Hard-Blocking~~
- [ ] FASE 2B: Offline agressivo durante picos
- [ ] FASE 2C: Perfis grandes (50-300 pax)
- [ ] Enterprise: gm_enterprises + dashboards agregados
- [ ] Chaos network (latência, packet loss)

---

*Documentação gerada para MEGA OPERATIONAL SIMULATOR v2.0*
*FASE 2A: SLA + Escalonamento + Hard-Blocking*
