# 📊 SPRINT 1 - Progresso

**Data de Início:** 2026-01-20  
**Status:** 🟡 Em Progresso

---

## ✅ TAREFA 1.1: Mover Emissão Fiscal para Backend

**Status:** 🟡 60% Completo  
**Estimativa Restante:** 2-3 dias

### **Concluído:**
- ✅ Migration `20260120000002_create_fiscal_queue.sql` criada
  - Tabela `gm_fiscal_queue` com retry e auditoria
  - RPCs: `add_to_fiscal_queue`, `get_next_fiscal_queue_item`, `mark_fiscal_queue_completed`, `mark_fiscal_queue_failed`
- ✅ Endpoint `/api/fiscal/emit` criado no backend
  - Valida autenticação
  - Valida que pedido está totalmente pago (Tarefa 1.4 integrada)
  - Adiciona à fila fiscal
  - Retorna ID da fila
- ✅ Worker `fiscal-queue-worker.ts` criado
  - Estrutura básica implementada
  - Loop de processamento
  - Retry com backoff exponencial
- ✅ Frontend `TPV.tsx` atualizado
  - Chama endpoint `/api/fiscal/emit` em vez de `FiscalService` direto
  - Valida que pedido está totalmente pago antes de chamar
  - Não bloqueia pagamento se fiscal falhar

### **Pendente:**
- ⏳ Implementar lógica de processamento no worker
  - Buscar configuração fiscal do restaurante
  - Selecionar adapter baseado no país
  - Criar TaxDocument
  - Validar conformidade legal
  - Processar via adapter
  - Armazenar resultado
- ⏳ Mover lógica do `FiscalService` para o worker
- ⏳ Testes end-to-end
- ⏳ Documentação

---

## ⏳ TAREFA 1.2: Remover OAuth client_secret do Frontend

**Status:** ⏳ Pendente  
**Estimativa:** 3-4 dias

### **Próximos Passos:**
1. Criar endpoint `/api/integrations/oauth/exchange`
2. Mover token exchange para backend
3. Implementar criptografia de tokens
4. Atualizar adapters

---

## ⏳ TAREFA 1.3: Corrigir Cálculo Fiscal

**Status:** ⏳ Pendente  
**Estimativa:** 1-2 dias  
**Dependência:** Tarefa 1.1 (após mover para backend)

---

## ⏳ TAREFA 1.4: Emitir Fiscal Apenas Quando Totalmente Pago

**Status:** ✅ Integrado na Tarefa 1.1  
**Nota:** Validação já implementada no endpoint `/api/fiscal/emit`

---

## 📋 PRÓXIMOS PASSOS

### **Imediato (Hoje):**
1. Completar lógica de processamento no worker
2. Mover código do `FiscalService` para o worker
3. Testar fluxo completo

### **Amanhã:**
1. Iniciar Tarefa 1.2 (OAuth)
2. Validar Tarefa 1.1 em ambiente de teste

---

**Última atualização:** 2026-01-20
