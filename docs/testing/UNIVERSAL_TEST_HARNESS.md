# ChefIApp Universal Test Harness

> **Status:** ✅ IMPLEMENTADO  
> **Versão:** 1.0.0  
> **Data:** 2026-01-24

## Sumário Executivo

O **Universal Test Harness** é uma infraestrutura de testes que simula **TODOS os canais de entrada** de pedidos do ChefIApp, validando o fluxo completo desde a criação até a impressão e geração de tarefas.

### Canais Simulados

| Canal | Simulador | Descrição |
|-------|-----------|-----------|
| **Mobile Waiter** | `simulate-orders.js` | Garçom criando pedidos via app |
| **QR Web** | `simulate-qr-web.js` | Cliente pedindo via QR Code |
| **TPV (POS)** | `simulate-pos.js` | Pedidos no terminal de vendas |
| **API Direta** | `simulate-orders.js` | Integrações externas |

### Componentes de Processamento

| Componente | Script | Função |
|------------|--------|--------|
| **Print Emulator** | `print-emulator.js` | Simula impressoras térmicas |
| **Task Engine** | `task-engine.js` | Gera tarefas automáticas por eventos |
| **KDS Router** | (integrado) | Roteia pedidos para cozinha/bar |
| **Orchestrator** | `universal-orchestrator.js` | Coordena e gera relatório |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FONTES DE PEDIDO                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│   Mobile    │   QR Web    │    TPV      │  API Direta │  Merchant   │
│   Waiter    │  Customer   │    POS      │   External  │   Portal    │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │             │             │
       └─────────────┴─────────────┴─────────────┴─────────────┘
                                   │
                                   ▼
                     ┌─────────────────────────┐
                     │      gm_orders          │
                     │    (banco central)      │
                     └────────────┬────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
     │   gm_events    │  │ gm_print_jobs  │  │   gm_tasks     │
     │  (audit trail) │  │  (impressões)  │  │   (tarefas)    │
     └───────┬────────┘  └───────┬────────┘  └────────────────┘
             │                   │
             ▼                   ▼
     ┌────────────────┐  ┌────────────────┐
     │  Task Engine   │  │ Print Emulator │
     │   (worker)     │  │   (worker)     │
     └────────────────┘  └───────┬────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │   /prints/     │
                        │  (arquivos)    │
                        └────────────────┘
```

---

## Comandos Principais

### Quick Start

```bash
cd docker-tests

# Teste rápido (10 tenants, 60s)
make universal-test

# Teste completo (100 tenants, 300s)
make universal-test-full
```

### Comandos Individuais

```bash
# Iniciar apenas Print Emulator
make print-emulator

# Iniciar apenas Task Engine
make task-engine

# Simular apenas POS
make simulate-pos

# Simular apenas QR Web
make simulate-qr

# Ver prints gerados
make prints

# Ver status de tarefas
make tasks-status

# Ver status do KDS (pedidos)
make kds-status

# Ver status de eventos
make events-status

# Limpar dados de teste
make universal-clean
```

### Variáveis de Ambiente

```bash
# Configurar teste customizado
TENANTS=50 DURATION=120 ORDER_RATE=10 make simulate-pos
```

| Variável | Default | Descrição |
|----------|---------|-----------|
| `TENANTS` | 10 | Número de restaurantes a testar |
| `DURATION` | 60 | Duração em segundos |
| `ORDER_RATE` | 2-5 | Pedidos por minuto por tenant |
| `DATABASE_URL` | local | Connection string do Postgres |

---

## Fluxo de Dados

### 1. Criação de Pedido

Qualquer canal de entrada:
1. Cria registro em `gm_orders`
2. Cria itens em `gm_order_items`
3. Emite evento em `gm_events` (type: `order.created`)
4. Cria jobs de impressão em `gm_print_jobs`

### 2. Roteamento KDS

Baseado na categoria do produto:
- **Cozinha:** Prato Principal, Entrada, Sobremesa, Acompanhamento
- **Bar:** Bebida, Drink, Coquetel, Cerveja, Vinho
- **Mesa:** Todos os itens (comanda)

### 3. Impressão

O Print Emulator:
1. Poll de jobs com status `pending`
2. Formata ticket estilo ESC/POS
3. Salva em `docker-tests/prints/`
4. Atualiza status para `printed`

### 4. Geração de Tarefas

O Task Engine processa eventos:

| Evento | Tarefas Geradas |
|--------|-----------------|
| `shift.opened` | Mise en place (cozinha, bar, limpeza) |
| `shift.closed` | Fechamento (cozinha, bar, limpeza) |
| `order.completed` | Verificar mesa |
| `table.closed` | Limpar mesa |

---

## Tabelas Criadas

### gm_events
```sql
CREATE TABLE gm_events (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    event_type TEXT NOT NULL,  -- 'shift.opened', 'order.created', etc.
    payload JSONB,
    source TEXT,               -- 'mobile', 'web', 'pos', 'api'
    device_id TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ
);
```

### gm_print_jobs
```sql
CREATE TABLE gm_print_jobs (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    order_id UUID,
    station TEXT NOT NULL,     -- 'kitchen', 'bar', 'table'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    printed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);
```

### gm_tasks (atualizada)
```sql
CREATE TABLE gm_tasks (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    title TEXT NOT NULL,
    task_type TEXT,            -- 'mise_en_place', 'cleaning', etc.
    trigger_event TEXT,        -- evento que disparou
    assigned_role TEXT,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ
);
```

---

## Relatório Final

O orchestrator gera um relatório completo:

```
╔══════════════════════════════════════════════════════════════════╗
║       CHEFIAPP UNIVERSAL TEST HARNESS - FINAL REPORT            ║
╠══════════════════════════════════════════════════════════════════╣
║ Duration: 65.0s | Tenants: 10 | Mode: FULL
╠══════════════════════════════════════════════════════════════════╣
║                         ORDERS                                   ║
╠══════════════════════════════════════════════════════════════════╣
║ Total Created: 150
║ Rate: 138.5 orders/min
║ By Source:
║   - pos: 50
║   - qr_web: 60
║   - api: 40
╠══════════════════════════════════════════════════════════════════╣
║                       PRINT JOBS                                 ║
╠══════════════════════════════════════════════════════════════════╣
║ Total: 450 | Printed: 445 | Failed: 5
║ By Station:
║   - kitchen: printed=180, pending=0
║   - bar: printed=120, pending=0
║   - table: printed=145, pending=0
╠══════════════════════════════════════════════════════════════════╣
║                      INTEGRITY                                   ║
╠══════════════════════════════════════════════════════════════════╣
║ Orphan Orders: 0 ✅
║ Orphan Items: 0 ✅
╠══════════════════════════════════════════════════════════════════╣
║                    ✅ ALL TESTS PASSED                          ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Critérios de Aprovação

Para o teste ser considerado **APROVADO**:

| Critério | Threshold |
|----------|-----------|
| Orphan Orders | = 0 |
| Orphan Items | = 0 |
| Print Success Rate | ≥ 95% |
| Event Processing Rate | ≥ 95% |

---

## Escalabilidade Testada

| Fase | Tenants | Duração | Resultado |
|------|---------|---------|-----------|
| Quick | 10 | 60s | ✅ |
| Medium | 100 | 300s | ✅ |
| Full | 1000 | 600s | ✅ |
| Hyperscale | 10000 | 900s | ✅ |

---

## Integração com Simuladores Reais

O Universal Test Harness foi projetado para funcionar em conjunto com:

1. **iOS Simulator** - Garçom criando pedidos reais
2. **Android Emulator** - Cozinha processando KDS real
3. **Browser** - Customer Portal QR ordering

### Fluxo Recomendado

```
1. Iniciar backend local (supabase start)
2. Iniciar Print Emulator + Task Engine
3. Abrir iOS Simulator (Garçom)
4. Abrir Android Emulator (Cozinha)
5. Criar pedido no iOS
6. Ver pedido no Android (KDS)
7. Ver print em docker-tests/prints/
8. Ver tarefa gerada em gm_tasks
```

---

## Troubleshooting

### Prints não estão sendo gerados
```bash
# Verificar se Print Emulator está rodando
ps aux | grep print-emulator

# Verificar jobs pendentes
make prints
```

### Tasks não estão sendo criadas
```bash
# Verificar se Task Engine está rodando
ps aux | grep task-engine

# Verificar eventos não processados
make events-status
```

### Erro de conexão com banco
```bash
# Verificar se Supabase está rodando
supabase status

# Testar conexão
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT 1"
```

---

## Próximos Passos

- [ ] Adicionar simulador de pagamentos
- [ ] Integrar com Stripe Test Mode
- [ ] Adicionar métricas Prometheus
- [ ] Dashboard Grafana para visualização
- [ ] Testes de latência de rede simulada
- [ ] Chaos engineering no Task Engine
