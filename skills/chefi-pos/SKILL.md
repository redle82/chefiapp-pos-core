---
name: chefi-pos
description: ChefIApp POS CORE operational assistant. Use when the user asks about restaurant operations, orders, shifts (turnos), menu, stock, KDS, TPV, tables, staff, payments, or any restaurant management task. Handles order lifecycle (OPEN→LOCKED→CLOSED), shift management (open/close cash register), menu queries, stock alerts, daily reports, and staff coordination. Speaks Portuguese (PT-BR) by default. Trigger on any mention of: pedido, turno, caixa, cardápio, estoque, mesa, KDS, TPV, funcionário, relatório, venda.
metadata:
  {
    "openclaw":
      {
        "emoji": "🍳",
        "homepage": "https://chefiapp.com",
        "requires": { "bins": ["curl"] },
      },
  }
---

# ChefIApp POS — Skill Operacional

Assistente operacional para restaurantes usando o ChefIApp POS CORE.
Comunica em **Português (PT-BR)** por padrão. Muda para o idioma do utilizador se solicitado.

## Arquitetura

O ChefIApp POS CORE é um sistema event-sourced com imutabilidade financeira:

```
Cliente (WhatsApp/Telegram) → OpenClaw Gateway → ChefIApp API (port 4320)
                                                    ↓
                                           PostgreSQL (event_store)
                                                    ↓
                                           PostgREST (port 3001)
```

### Componentes

| Componente | Porta | Propósito                                        |
| ---------- | ----- | ------------------------------------------------ |
| API Server | 4320  | Servidor HTTP principal (orders, auth, health)   |
| PostgREST  | 3001  | API REST automática sobre PostgreSQL (via nginx) |
| PostgreSQL | 5432  | Event store + projeções                          |
| Nginx      | 3001  | Reverse proxy (PostgREST + API)                  |

### Autenticação

Header: `x-chefiapp-token: <session_token>`

Obter token:

```bash
# 1. Solicitar magic link
curl -X POST http://localhost:4320/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. Verificar token (retorna session_token)
curl "http://localhost:4320/api/auth/verify-magic-link?token=<dev_token>"
```

## Domínio Operacional

### 1. Ciclo de Vida do Pedido (Order Lifecycle)

Estado: **OPEN → LOCKED → CLOSED**

| Estado | Pode modificar? | Total calculado?    | Ação seguinte                     |
| ------ | --------------- | ------------------- | --------------------------------- |
| OPEN   | Sim             | Não (0)             | Adicionar items, depois LOCK      |
| LOCKED | Não (imutável)  | Sim (sum qty×price) | Processar pagamento, depois CLOSE |
| CLOSED | Não (terminal)  | Sim (final)         | Nenhuma — arquivo                 |

**Criar pedido:**

```bash
curl -X POST http://localhost:4320/api/orders \
  -H "x-chefiapp-token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "mesa-1",
    "items": [
      {"item_id": "burger-01", "name": "X-Burger", "quantity": 2, "price_snapshot_cents": 1500}
    ]
  }'
```

**Atualizar items (só OPEN):**

```bash
curl -X PATCH http://localhost:4320/api/orders/$ORDER_ID \
  -H "x-chefiapp-token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": [...]}'
```

**Travar pedido (OPEN → LOCKED):**

```bash
curl -X POST http://localhost:4320/api/orders/$ORDER_ID/lock \
  -H "x-chefiapp-token: $TOKEN"
```

**Fechar pedido (LOCKED → CLOSED):**

```bash
curl -X POST http://localhost:4320/api/orders/$ORDER_ID/close \
  -H "x-chefiapp-token: $TOKEN"
```

### 2. Turno (Shift / Cash Register)

O turno controla o ciclo operacional do restaurante. Sem turno aberto, não se pode operar o TPV.

**Abrir turno (via PostgREST RPC):**

```bash
curl -X POST http://localhost:3001/rpc/open_cash_register_atomic \
  -H "Content-Type: application/json" \
  -d '{
    "p_restaurant_id": "<uuid>",
    "p_name": "Caixa Principal",
    "p_opened_by": "Operador TPV",
    "p_opening_balance_cents": 5000
  }'
```

**Verificar turno ativo:**

```bash
curl "http://localhost:3001/gm_cash_registers?restaurant_id=eq.<uuid>&status=eq.open"
```

**Fechar turno:**

```bash
curl -X PATCH "http://localhost:3001/gm_cash_registers?id=eq.<shift_id>" \
  -H "Content-Type: application/json" \
  -d '{"status": "closed", "closed_at": "<iso_timestamp>"}'
```

### 3. Ciclo de Vida do Restaurante (Lifecycle)

3 estados progressivos:

1. **Configuring** — Gestão aberta, operações bloqueadas
2. **Published** — Gestão aberta, apps operacionais acessíveis, pedidos requerem turno
3. **Operational** — Gestão aberta, turno ativo, pode receber pedidos

### 4. Consultas ao Docker Core (PostgREST)

**Tabelas principais acessíveis via REST:**

| Tabela              | Propósito                              |
| ------------------- | -------------------------------------- |
| `gm_orders`         | Pedidos                                |
| `gm_cash_registers` | Turnos / Caixa registadora             |
| `gm_staff`          | Funcionários                           |
| `gm_menu_items`     | Items do cardápio                      |
| `gm_stock`          | Inventário / Estoque                   |
| `shift_logs`        | Registo de turnos                      |
| `event_store`       | Event sourcing (imutável, append-only) |
| `legal_seals`       | Selos legais (imutáveis)               |

**Exemplos de queries:**

```bash
# Todos os pedidos abertos
curl "http://localhost:3001/gm_orders?state=eq.OPEN&order=created_at.desc"

# Cardápio completo
curl "http://localhost:3001/gm_menu_items?restaurant_id=eq.<uuid>&select=*"

# Funcionários ativos
curl "http://localhost:3001/gm_staff?restaurant_id=eq.<uuid>&status=eq.active"

# Estoque baixo
curl "http://localhost:3001/gm_stock?restaurant_id=eq.<uuid>&current_stock=lt.min_stock"
```

### 5. Health Check

```bash
curl http://localhost:4320/health
# → {"status":"ok","timestamp":"...","version":"1.0.0","services":{"database":"up","api":"up"}}
```

## Erros Conhecidos

| Código                     | Significado                     | Ação                            |
| -------------------------- | ------------------------------- | ------------------------------- |
| `SESSION_REQUIRED`         | Falta header `x-chefiapp-token` | Autenticar primeiro             |
| `ORDER_NOT_FOUND`          | Pedido não existe               | Verificar UUID                  |
| `ORDER_IMMUTABLE`          | Pedido LOCKED/CLOSED            | Não pode modificar — criar novo |
| `INVALID_STATE_TRANSITION` | Transição inválida              | Verificar estado atual          |
| `ORDER_ALREADY_CLOSED`     | Pedido já fechado               | Estado terminal                 |
| `TOKEN_INVALID_OR_EXPIRED` | Token expirou                   | Re-autenticar                   |

## Permissões por Cargo (Roles)

| Cargo     | Turno     | Pedidos  | KDS      | Caixa    | Gestão            |
| --------- | --------- | -------- | -------- | -------- | ----------------- |
| waiter    | start/end | criar    | —        | manuseio | —                 |
| cook      | start/end | —        | ver/bump | —        | —                 |
| bartender | start/end | —        | ver/bump | —        | —                 |
| chef      | start/end | anular   | ver/bump | —        | staff             |
| manager   | start/end | tudo     | —        | manuseio | staff, descontos  |
| owner     | —         | ver tudo | —        | —        | relatórios, staff |
| cashier   | start/end | ver tudo | —        | manuseio | descontos         |

## Fluxo Conversacional Padrão

Quando o utilizador envia mensagem via WhatsApp/Telegram:

1. **Identificar intenção**: pedido, turno, consulta, alerta
2. **Verificar contexto**: usar restaurant_id do utilizador
3. **Executar ação**: chamar API correspondente via curl/fetch
4. **Responder**: formatação concisa com emoji operacional

### Exemplos de resposta:

**"Quanto vendemos hoje?"**

```
📊 Vendas de hoje (07/02/2026):
• 47 pedidos fechados
• Total: €1.234,50
• Ticket médio: €26,27
• Item mais vendido: X-Burger (23 unidades)
```

**"Abrir turno"**

```
✅ Turno aberto!
• Caixa: Caixa Principal
• Abertura: €50,00
• Hora: 09:00

Pronto para receber pedidos. 🍳
```

**"Estoque baixo?"**

```
⚠️ Alerta de estoque:
• 🔴 Pão brioche: 5 un (mín: 20)
• 🟡 Queijo cheddar: 12 un (mín: 15)
• 🟡 Bacon: 8 un (mín: 10)

Ação sugerida: contactar fornecedor.
```

## Referências

Para detalhes completos, ler os ficheiros de referência na pasta `references/`:

- `references/api-endpoints.md` — Todos os endpoints com exemplos
- `references/database-schema.md` — Esquema do event store e projeções
- `references/roles-permissions.md` — Permissões detalhadas por cargo
