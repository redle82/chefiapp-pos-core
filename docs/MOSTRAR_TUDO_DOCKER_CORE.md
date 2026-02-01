# Mostrar Tudo - Docker Core

**Objetivo:** Validar visualmente que o sistema completo está funcionando com Docker Core.

---

## 🚀 Comando Único

```bash
cd docker-core
./show-everything.sh
```

Isso vai:
1. ✅ Subir Docker Core
2. ✅ Validar serviços (Postgres, PostgREST, Realtime)
3. ✅ Validar RPC `create_order_atomic`
4. ✅ Validar constraint `idx_one_open_order_per_table`
5. ✅ Mostrar status e próximos passos

---

## 📋 Passo a Passo Manual

### 1. Subir Docker Core

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

**Aguarde até ver:**
```
chefiapp-core-postgres    | database system is ready to accept connections
```

### 2. Validar Serviços

```bash
# Postgres
docker compose -f docker-compose.core.yml exec postgres \
  pg_isready -U postgres

# PostgREST
curl http://localhost:3001

# Realtime
curl http://localhost:4000/health
```

### 3. Validar RPC e Constraints

```bash
# Ver RPC
docker compose -f docker-compose.core.yml exec postgres \
  psql -U postgres -d chefiapp_core -c "\df create_order_atomic"

# Ver constraint
docker compose -f docker-compose.core.yml exec postgres \
  psql -U postgres -d chefiapp_core -c "\d+ idx_one_open_order_per_table"
```

---

## 🔧 Configurar UI

### Atualizar `.env`

**Arquivo:** `merchant-portal/.env`

```env
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

### Subir Merchant Portal

```bash
cd merchant-portal
npm run dev
```

---

## 👀 Validar Visualmente

### 1. Abrir TPV

**URL:** http://localhost:5173/app/tpv

**O que verificar:**
- ✅ Tela carrega
- ✅ Mesas aparecem
- ✅ Produtos aparecem

### 2. Criar Pedido

**Ação:**
1. Clicar em uma mesa
2. Adicionar produto
3. Criar pedido

**O que verificar:**
- ✅ Pedido criado sem erro
- ✅ Pedido aparece na lista

### 3. Abrir KDS

**URL:** http://localhost:5173/app/kds

**O que verificar:**
- ✅ Pedido aparece no KDS (via Realtime)
- ✅ Status atualiza em tempo real

### 4. Abrir Dashboard

**URL:** http://localhost:5173/app/dashboard

**O que verificar:**
- ✅ ActiveIssuesWidget mostra estado
- ✅ ControlTowerWidget mostra periféricos
- ✅ Métricas aparecem

### 5. Validar Constraint

**Ação:**
1. Tentar criar segundo pedido na mesma mesa (com pedido aberto)

**O que verificar:**
- ✅ Erro claro: "Esta mesa já possui um pedido aberto"
- ✅ Sugestão: "Feche ou pague o pedido existente"

---

## 🧪 Teste Rápido via SQL

```bash
# Conectar ao banco
docker compose -f docker-core/docker-compose.core.yml exec postgres \
  psql -U postgres -d chefiapp_core

# Ver pedidos
SELECT id, status, total_cents, created_at FROM gm_orders ORDER BY created_at DESC LIMIT 5;

# Ver constraint funcionando (deve falhar se mesa já tem pedido aberto)
SELECT create_order_atomic(
  '00000000-0000-0000-0000-000000000100'::UUID,
  '[{"product_id":"00000000-0000-0000-0000-000000000001","name":"Teste","quantity":1,"unit_price":1000}]'::jsonb,
  'cash',
  '{"table_id":"00000000-0000-0000-0000-000000000001","table_number":1}'::jsonb
);
```

---

## ✅ Checklist de Validação

- [ ] Docker Core rodando (`docker compose ps`)
- [ ] Postgres respondendo
- [ ] PostgREST respondendo
- [ ] Realtime respondendo
- [ ] RPC `create_order_atomic` existe
- [ ] Constraint `idx_one_open_order_per_table` existe
- [ ] `.env` atualizado
- [ ] Merchant Portal rodando
- [ ] TPV carrega
- [ ] KDS carrega
- [ ] Dashboard carrega
- [ ] Pedido criado via TPV
- [ ] Pedido aparece no KDS (Realtime)
- [ ] Constraint funciona (erro ao criar segundo pedido)

---

## 🚨 Troubleshooting

### Postgres não sobe

```bash
docker compose -f docker-core/docker-compose.core.yml logs postgres
```

**Solução comum:** Porta 54320 já em uso. Mude no `docker-compose.core.yml`.

### PostgREST não conecta

```bash
docker compose -f docker-core/docker-compose.core.yml logs postgrest
```

**Solução comum:** Postgres ainda não está pronto. Aguarde mais alguns segundos.

### UI não conecta

**Verificar:**
1. `.env` está correto?
2. Merchant Portal reiniciou após mudar `.env`?
3. PostgREST está rodando? (`curl http://localhost:3000`)

### Realtime não funciona

```bash
docker compose -f docker-core/docker-compose.core.yml logs realtime
```

**Solução comum:** Realtime precisa de tempo para conectar ao Postgres.

---

## 🎯 Resultado Esperado

Quando tudo estiver funcionando, você deve ver:

1. **TPV:** Criar pedido → sucesso
2. **KDS:** Pedido aparece automaticamente (Realtime)
3. **Dashboard:** Estado atualizado
4. **Constraint:** Erro claro ao tentar criar segundo pedido na mesma mesa

**Isso valida:**
- ✅ Core funcionando
- ✅ UI conectada
- ✅ Realtime funcionando
- ✅ Constraints ativas
- ✅ Feedback humano claro

---

*"Ver é acreditar. Mas validar é saber."*
