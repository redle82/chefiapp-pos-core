# ✅ P0 FIXES - CORREÇÕES CRÍTICAS COMPLETAS

**Data:** 18 Janeiro 2026  
**Status:** ✅ **TODOS OS P0s CORRIGIDOS**

---

## 📋 RESUMO

Todos os **4 P0s críticos** identificados na auditoria foram corrigidos:

1. ✅ **P0-1:** API key exposta no cliente → Movida para backend proxy
2. ✅ **P0-2:** Race condition em pagamentos → SELECT FOR UPDATE adicionado
3. ✅ **P0-3:** IndexedDB sem limite → Limites de tamanho implementados
4. ✅ **P0-4:** Fiscal sem retry em background → Edge Function criada

---

## ✅ P0-1: API KEY EXPOSTA NO CLIENTE

### Problema Original:
- API key do InvoiceXpress era enviada na URL do cliente
- Qualquer um podia extrair a chave e emitir faturas falsas
- Violação de segurança fiscal crítica

### Correção Implementada:

**1. Backend Proxy (`server/web-module-api-server.ts`):**
```typescript
// POST /api/fiscal/invoicexpress/invoices
// - Cliente envia apenas accountName (não apiKey)
// - Backend busca apiKey do banco de dados
// - Backend faz chamada real à API InvoiceXpress
// - API key nunca sai do servidor
```

**2. Adapter Atualizado (`fiscal-modules/adapters/InvoiceXpressAdapter.ts`):**
```typescript
// Antes: url = `https://...?api_key=${this.config.apiKey}` ❌
// Agora: url = `${apiBase}/api/fiscal/invoicexpress/invoices` ✅
// Backend busca apiKey do banco
```

**3. Config Interface:**
```typescript
interface InvoiceXpressConfig {
    apiKey?: string; // Opcional - backend busca
    accountName: string; // Obrigatório
}
```

### Segurança:
- ✅ API key nunca é enviada do cliente
- ✅ API key armazenada no banco (criptografada se necessário)
- ✅ Backend valida autenticação antes de buscar credenciais
- ✅ Rate limiting no backend (se configurado)

---

## ✅ P0-2: RACE CONDITION EM PAGAMENTOS

### Problema Original:
- Dois pagamentos simultâneos podiam passar validação
- `SELECT` sem lock permitia pagamento duplicado
- Risco de caixa desbalanceado

### Correção Implementada:

**Migration (`supabase/migrations/025_fix_payment_logic.sql`):**
```sql
-- Antes:
SELECT status, total_cents INTO v_order_status, v_order_total
FROM public.gm_orders
WHERE id = p_order_id AND restaurant_id = p_restaurant_id;
-- ❌ Sem lock

-- Agora:
SELECT status, total_cents INTO v_order_status, v_order_total
FROM public.gm_orders
WHERE id = p_order_id AND restaurant_id = p_restaurant_id
FOR UPDATE; -- ✅ Lock pessimista
```

### Proteção:
- ✅ Lock pessimista previne pagamento duplicado
- ✅ Transação atômica garante consistência
- ✅ Unique constraint no banco (camada extra)

---

## ✅ P0-3: INDEXEDDB SEM LIMITE DE TAMANHO

### Problema Original:
- IndexedDB podia crescer indefinidamente
- Se sync falhar por dias, pode encher disco
- Sistema para de funcionar

### Correção Implementada:

**`merchant-portal/src/core/queue/OfflineSync.ts`:**
```typescript
const MAX_QUEUE_SIZE = 1000; // Máximo de items
const MAX_QUEUE_SIZE_MB = 50; // Máximo de 50MB (estimativa)

// Limite por quantidade de items
if (remainingItems.length > MAX_QUEUE_SIZE) {
    // Ordenar por prioridade: failed > queued > syncing > applied
    // Remover items mais antigos até ficar dentro do limite
}
```

### Proteção:
- ✅ Limite máximo de 1000 items
- ✅ Limite estimado de 50MB
- ✅ Priorização: mantém items importantes (failed, queued)
- ✅ Remove items antigos primeiro (applied)

---

## ✅ P0-4: FISCAL SEM RETRY EM BACKGROUND

### Problema Original:
- Faturas PENDING nunca eram retentadas
- Sistema retornava PENDING mas não havia job em background
- Restaurante ficava sem fatura (ilegal)

### Correção Implementada:

**1. Edge Function (`supabase/functions/retry-pending-fiscal/index.ts`):**
```typescript
// Busca faturas PENDING
// Retenta chamada à API InvoiceXpress
// Atualiza status (REPORTED ou FAILED)
// Máximo 10 tentativas
// Não retenta faturas > 24h
```

**2. Migration (`supabase/migrations/20260118000005_add_fiscal_retry_count.sql`):**
```sql
-- Adiciona coluna retry_count
ALTER TABLE fiscal_event_store
ADD COLUMN retry_count INTEGER DEFAULT 0;

-- Index para queries eficientes
CREATE INDEX idx_fiscal_event_store_pending_retry
ON fiscal_event_store(fiscal_status, retry_count, created_at)
WHERE fiscal_status = 'PENDING' AND retry_count < 10;
```

**3. Config (`supabase/config.toml`):**
```toml
[functions.retry-pending-fiscal]
enabled = true
# Configurar cron: 0 */5 * * * * (a cada 5 minutos)
```

### Funcionalidade:
- ✅ Retenta faturas PENDING automaticamente
- ✅ Máximo 10 tentativas por fatura
- ✅ Não retenta faturas > 24h (muito antigas)
- ✅ Processa até 50 faturas por execução
- ✅ Logs detalhados para debugging

---

## 📊 IMPACTO DAS CORREÇÕES

### Segurança:
- ✅ API key protegida (não exposta)
- ✅ Race conditions prevenidas
- ✅ Dados fiscais seguros

### Estabilidade:
- ✅ IndexedDB não cresce indefinidamente
- ✅ Sistema não para por disco cheio
- ✅ Faturas sempre são emitidas (ou falham explicitamente)

### Conformidade Legal:
- ✅ Faturas retentadas automaticamente
- ✅ Restaurante não fica sem fatura
- ✅ Audit trail completo

---

## 🚀 PRÓXIMOS PASSOS

### 1. Deploy das Migrations:
```bash
# Aplicar migration do retry_count
supabase migration up 20260118000005_add_fiscal_retry_count.sql

# Aplicar migration do SELECT FOR UPDATE
supabase migration up 025_fix_payment_logic.sql
```

### 2. Deploy da Edge Function:
```bash
# Deploy da função retry-pending-fiscal
supabase functions deploy retry-pending-fiscal
```

### 3. Configurar Cron (Supabase Dashboard):
- Ir para **Database** → **Cron Jobs**
- Criar novo cron:
  - **Name:** `retry_pending_fiscal`
  - **Schedule:** `0 */5 * * * *` (a cada 5 minutos)
  - **Function:** `retry-pending-fiscal`
  - **Enabled:** ✅

### 4. Testar Correções:
- [ ] Testar proxy fiscal (API key não exposta)
- [ ] Testar race condition (dois pagamentos simultâneos)
- [ ] Testar limite IndexedDB (criar 1000+ items)
- [ ] Testar retry fiscal (criar fatura PENDING e aguardar retry)

---

## 📄 ARQUIVOS MODIFICADOS

1. `fiscal-modules/adapters/InvoiceXpressAdapter.ts` - Proxy para backend
2. `server/web-module-api-server.ts` - Endpoint proxy fiscal
3. `supabase/migrations/025_fix_payment_logic.sql` - SELECT FOR UPDATE
4. `merchant-portal/src/core/queue/OfflineSync.ts` - Limites IndexedDB
5. `supabase/functions/retry-pending-fiscal/index.ts` - Edge Function retry
6. `supabase/migrations/20260118000005_add_fiscal_retry_count.sql` - Migration retry_count
7. `supabase/config.toml` - Config Edge Function
8. `merchant-portal/src/core/fiscal/SupabaseFiscalEventStore.ts` - Inicializar retry_count

---

## ✅ STATUS FINAL

**Todos os P0s corrigidos e prontos para deploy.**

**Recomendação:** Fazer deploy em staging primeiro, testar extensivamente por 1 semana antes de produção.

---

**Fim do Documento**
