# 🛡️ SPRINT 1: Segurança e Fiscal

**Data de Início:** 2026-01-20  
**Duração:** 10-14 dias  
**Objetivo:** Corrigir problemas críticos de segurança e fiscal antes de produção

---

## 🎯 OBJETIVO DO SPRINT

Corrigir problemas que podem gerar:
- ❌ Prejuízo financeiro (fiscal incorreto, duplicação)
- ❌ Problemas legais (fiscal inválido, auditoria)
- ❌ Vulnerabilidades de segurança (OAuth exposto)

---

## 📋 TAREFAS DO SPRINT

### **Tarefa 1.1: Mover Emissão Fiscal para Backend** 🔥
**Prioridade:** P0 - CRÍTICA  
**Estimativa:** 5-7 dias  
**Dependências:** Nenhuma

**Descrição:**
Mover toda a lógica de emissão fiscal do frontend para o backend, com fila durável e worker de retry robusto.

**Subtarefas:**
- [ ] Criar endpoint `/api/fiscal/emit` no backend
- [ ] Criar tabela `gm_fiscal_queue` no Supabase
- [ ] Criar worker de processamento de fila fiscal
- [ ] Mover `FiscalService` para backend
- [ ] Implementar retry com backoff exponencial
- [ ] Adicionar auditoria imutável de tentativas
- [ ] Remover código fiscal do frontend
- [ ] Atualizar `TPV.tsx` para chamar endpoint

**Critérios de Aceitação:**
- ✅ Emissão fiscal 100% no backend
- ✅ Fila durável (sobrevive a restart)
- ✅ Retry automático com backoff
- ✅ Auditoria completa de tentativas
- ✅ Frontend não tem código fiscal

---

### **Tarefa 1.2: Remover OAuth client_secret do Frontend** 🔥
**Prioridade:** P0 - CRÍTICA  
**Estimativa:** 3-4 dias  
**Dependências:** Nenhuma

**Descrição:**
Mover token exchange OAuth para o backend e criptografar tokens antes de armazenar.

**Subtarefas:**
- [ ] Criar endpoint `/api/integrations/oauth/exchange` no backend
- [ ] Mover token exchange para backend (UberEats, Deliveroo, Glovo)
- [ ] Implementar criptografia de tokens (usar `crypto` do Node.js)
- [ ] Atualizar armazenamento no Supabase (tokens criptografados)
- [ ] Implementar refresh token automático no backend
- [ ] Remover `clientSecret` do frontend
- [ ] Adicionar auditoria de acessos OAuth
- [ ] Atualizar adapters para usar endpoint

**Critérios de Aceitação:**
- ✅ Nenhum `clientSecret` no frontend
- ✅ Tokens criptografados no banco
- ✅ Token exchange 100% no backend
- ✅ Refresh automático funcionando
- ✅ Auditoria de acessos

---

### **Tarefa 1.3: Corrigir Cálculo Fiscal** 🔥
**Prioridade:** P0 - CRÍTICA  
**Estimativa:** 1-2 dias  
**Dependências:** Tarefa 1.1 (após mover para backend)

**Descrição:**
Corrigir representação de IVA no `TaxDocument` e cálculo do subtotal.

**Subtarefas:**
- [ ] Separar `vatRate` (taxa) de `vatAmount` (valor) no `TaxDocument`
- [ ] Corrigir `InvoiceXpressAdapter` para usar `vatRate` no cálculo
- [ ] Validar cálculos com exemplos reais (23% IVA)
- [ ] Adicionar testes unitários para cálculos fiscais
- [ ] Documentar formato esperado de `TaxDocument`
- [ ] Validar com casos reais de restaurantes

**Critérios de Aceitação:**
- ✅ `vatRate` e `vatAmount` separados corretamente
- ✅ Cálculos fiscais corretos (testados)
- ✅ Testes unitários passando
- ✅ Documentação atualizada

---

### **Tarefa 1.4: Emitir Fiscal Apenas Quando Totalmente Pago** 🔥
**Prioridade:** P0 - CRÍTICA  
**Estimativa:** 1 dia  
**Dependências:** Tarefa 1.1 (após mover para backend)

**Descrição:**
Modificar lógica para emitir fiscal apenas quando pedido está totalmente pago.

**Subtarefas:**
- [ ] Modificar endpoint `/api/fiscal/emit` para verificar `payment_status`
- [ ] Adicionar validação: `totalPaid >= orderTotal`
- [ ] Só emitir quando `payment_status = 'PAID'` (não `PARTIALLY_PAID`)
- [ ] Adicionar flag `fiscalEmitted` para evitar duplicação
- [ ] Testar com split bill (múltiplos pagamentos)
- [ ] Atualizar `TPV.tsx` para não chamar fiscal em pagamento parcial

**Critérios de Aceitação:**
- ✅ Fiscal emitido apenas quando totalmente pago
- ✅ Não emite em pagamento parcial
- ✅ Flag `fiscalEmitted` previne duplicação
- ✅ Testes com split bill passando

---

## 📅 CRONOGRAMA

### **Semana 1 (Dias 1-5)**
- **Dia 1-2:** Tarefa 1.1 (Backend fiscal) - Setup e endpoint
- **Dia 3-4:** Tarefa 1.1 (Backend fiscal) - Fila e worker
- **Dia 5:** Tarefa 1.2 (OAuth) - Setup e endpoint

### **Semana 2 (Dias 6-10)**
- **Dia 6-7:** Tarefa 1.2 (OAuth) - Criptografia e refresh
- **Dia 8:** Tarefa 1.3 (Cálculo fiscal) - Correção
- **Dia 9:** Tarefa 1.4 (Fiscal total) - Validação
- **Dia 10:** Testes integrados e validação final

### **Buffer (Dias 11-14)**
- Correções de bugs encontrados
- Testes adicionais
- Documentação final

---

## 🧪 TESTES OBRIGATÓRIOS

### **Teste 1: Emissão Fiscal Backend**
- [ ] Criar pedido e pagar totalmente
- [ ] Verificar que fiscal é emitido no backend
- [ ] Verificar que fila processa corretamente
- [ ] Verificar retry em caso de falha
- [ ] Verificar auditoria de tentativas

### **Teste 2: OAuth Seguro**
- [ ] Tentar acessar `clientSecret` no frontend (não deve existir)
- [ ] Verificar que tokens estão criptografados no banco
- [ ] Verificar que token exchange funciona no backend
- [ ] Verificar refresh automático

### **Teste 3: Cálculo Fiscal**
- [ ] Testar com IVA 23% (valor real)
- [ ] Verificar que `vatRate` e `vatAmount` estão corretos
- [ ] Validar cálculo: `subtotal + IVA = total`
- [ ] Testar com múltiplos itens

### **Teste 4: Fiscal Apenas Total**
- [ ] Criar pedido e pagar parcialmente
- [ ] Verificar que fiscal NÃO é emitido
- [ ] Completar pagamento
- [ ] Verificar que fiscal é emitido apenas quando totalmente pago

---

## 🚨 RISCOS E MITIGAÇÕES

### **Risco 1: Quebrar Funcionalidade Existente**
**Mitigação:**
- Feature flag para nova implementação
- Manter código antigo até validação completa
- Rollback plan documentado

### **Risco 2: Tempo Subestimado**
**Mitigação:**
- Buffer de 4 dias incluído
- Priorizar tarefas críticas
- Aceitar implementação incremental se necessário

### **Risco 3: Regressões em Produção**
**Mitigação:**
- Testes obrigatórios antes de deploy
- Deploy incremental (não tudo de uma vez)
- Monitoramento intensivo após deploy

---

## ✅ CRITÉRIOS DE SUCESSO DO SPRINT

### **Funcionalidade:**
- ✅ Emissão fiscal 100% no backend
- ✅ OAuth seguro (sem client_secret no frontend)
- ✅ Cálculos fiscais corretos
- ✅ Fiscal emitido apenas quando totalmente pago

### **Segurança:**
- ✅ Nenhum segredo no frontend
- ✅ Tokens criptografados
- ✅ Auditoria completa

### **Robustez:**
- ✅ Fila durável (sobrevive a restart)
- ✅ Retry automático funcionando
- ✅ Sem duplicação de emissões

---

## 📝 NOTAS

### **Decisões Técnicas:**
- Fila fiscal: PostgreSQL (já temos Supabase)
- Criptografia: `crypto` nativo do Node.js
- Worker: Processo separado ou cron job

### **Dependências Externas:**
- Supabase (fila e armazenamento)
- InvoiceXpress API (validação de cálculos)

---

**Status:** 🟡 Em Planejamento  
**Próximo Passo:** Iniciar Tarefa 1.1 (Mover Emissão Fiscal para Backend)  
**Última atualização:** 2026-01-20
