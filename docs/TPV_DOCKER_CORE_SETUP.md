# 🧾 TPV — Integração com Docker Core

**Data:** 2026-01-25  
**Status:** ✅ Configurado para usar Docker Core

---

## ✅ Alterações Realizadas

### 1. Cliente Supabase Atualizado
- **Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`
- **Mudança:** Substituído `import { supabase } from '../../../core/supabase'` por `import { dockerCoreClient } from '../../../core-boundary/docker-core/connection'`
- **Impacto:** Todas as operações agora usam o Docker Core diretamente

### 2. Rota do TPV Adicionada
- **Arquivo:** `merchant-portal/src/App.tsx`
- **Mudança:** Adicionada rota `/tpv` para o componente `TPV`
- **URL:** `http://localhost:5175/tpv`

### 3. Origem CAIXA Configurada
- **Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` (linha ~490)
- **Mudança:** Pedidos criados no TPV usam `origin: 'CAIXA'` no `syncMetadata`
- **Impacto:** Pedidos do TPV aparecem com badge "💰 CAIXA" no KDS

### 4. Status do Core Ajustados
- **Mudança:** Status atualizados para usar valores do Core:
  - `'preparing'` → `'IN_PREP'`
  - `'ready'` → `'READY'`
  - `'delivered'` → `'CLOSED'`
  - `'canceled'` → `'CANCELLED'`

### 5. Auth Removido
- **Mudança:** Removidas dependências de `supabase.auth.getUser()`
- **Impacto:** Docker Core não requer autenticação, então `operatorId` pode ser `null`

---

## 🧪 Como Testar

### 1. Subir o Docker Core
```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

### 2. Subir o Frontend
```bash
cd merchant-portal
npm run dev
```

### 3. Abrir o TPV
```
http://localhost:5175/tpv
```

### 4. Criar um Pedido no TPV
1. Abrir o TPV
2. Selecionar uma mesa (se necessário)
3. Adicionar produtos ao pedido
4. Finalizar o pedido
5. Verificar que o pedido foi criado com origem `CAIXA`

### 5. Verificar no KDS
1. Abrir o KDS: `http://localhost:5175/kds-minimal`
2. Verificar que o pedido aparece com badge "💰 CAIXA"
3. Verificar que o pedido aparece automaticamente (Realtime)

---

## 🔍 Verificações no Banco

### Ver pedidos criados pelo TPV
```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT id, status, sync_metadata->>'origin' as origin, total_cents, created_at 
   FROM gm_orders 
   WHERE sync_metadata->>'origin' = 'CAIXA' 
   ORDER BY created_at DESC 
   LIMIT 10;"
```

### Verificar que origem está correta
```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT 
     sync_metadata->>'origin' as origin,
     COUNT(*) as total
   FROM gm_orders 
   GROUP BY sync_metadata->>'origin';"
```

---

## 📊 Fluxo Completo

```
TPV (Terminal Ponto de Venda)
    │
    ▼
Usuário adiciona produtos
    │
    ▼
Clica em "Finalizar Pedido"
    │
    ▼
createOrder() → dockerCoreClient.rpc('create_order_atomic')
    │
    ▼
RPC cria pedido no PostgreSQL
    │ (origin: 'CAIXA')
    ▼
gm_orders (INSERT)
    │
    ▼
Realtime Event
    │
    ▼
KDS Atualiza Automaticamente
    │
    ▼
Pedido aparece com badge "💰 CAIXA"
```

---

## ⚠️ Pontos de Atenção

### 1. Operator ID
- **Status:** Pode ser `null` no Docker Core
- **Impacto:** Funcionalidades que dependem de `operatorId` podem não funcionar
- **Solução:** Em produção, implementar sistema de autenticação externo

### 2. Cash Register
- **Status:** RPC `open_cash_register_atomic` pode requerer `operatorId`
- **Impacto:** Abrir caixa pode falhar se `operatorId` for obrigatório
- **Solução:** Verificar se o RPC aceita `null` para `p_opened_by`

### 3. Realtime
- **Status:** Usa `dockerCoreClient` para Realtime
- **Impacto:** Deve funcionar se Realtime estiver configurado corretamente
- **Fallback:** Polling de 30s está ativo

---

## ✅ Checklist de Validação

- [ ] TPV abre sem erros
- [ ] Pedido pode ser criado no TPV
- [ ] Pedido aparece no KDS automaticamente
- [ ] Badge "💰 CAIXA" aparece no KDS
- [ ] Realtime funciona (ou polling funciona)
- [ ] Status do pedido pode ser atualizado
- [ ] Pedido aparece no banco com `origin: 'CAIXA'`

---

**Última atualização:** 2026-01-25
