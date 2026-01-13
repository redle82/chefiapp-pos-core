# ✅ CHECKLIST PRÉ-TESTES - MVP Demo

**Data:** 2026-01-20  
**Objetivo:** Garantir que tudo está pronto antes de executar os testes de balcão

---

## 🔧 PREPARAÇÃO TÉCNICA

### **1. Migration SQL**
- [ ] Migration `20260120000001_add_partial_payment_support.sql` aplicada no Supabase
- [ ] ENUM `payment_status` inclui `'partially_paid'` (validado com query SQL)
- [ ] Função RPC `process_order_payment` atualizada (validado com query SQL)
- [ ] Teste manual de pagamento parcial funcionando

**Como validar:**
```sql
-- Verificar ENUM
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status');

-- Verificar função
SELECT proname FROM pg_proc WHERE proname = 'process_order_payment';
```

---

### **2. Ambiente de Desenvolvimento**
- [ ] Servidor rodando (`npm run dev` ou `npm run server:web-module`)
- [ ] Sem erros no console do navegador
- [ ] Sem erros no terminal do servidor
- [ ] Conexão com Supabase funcionando

**Como validar:**
- Abrir TPV no navegador
- Verificar console do navegador (F12)
- Verificar terminal do servidor

---

### **3. Dados de Teste**
- [ ] Pelo menos 3 mesas cadastradas
- [ ] Pelo menos 5 produtos no menu (bebidas e comidas)
- [ ] Caixa aberto no sistema
- [ ] Usuário autenticado

**Como validar:**
- Abrir TPV
- Verificar mapa de mesas (deve mostrar mesas)
- Verificar menu (deve mostrar produtos)
- Verificar se caixa está aberto (banner de alerta se não estiver)

---

## 🧪 VALIDAÇÃO RÁPIDA (5 minutos)

### **Teste 1: Criar Pedido Básico**
- [ ] Selecionar mesa livre
- [ ] Adicionar 1 item do menu
- [ ] Verificar: Item aparece no OrderSummaryPanel
- [ ] Verificar: Total atualiza no header

**Resultado esperado:** ✅ Pedido criado, item visível, total correto

---

### **Teste 2: Dividir Conta**
- [ ] Com pedido ativo, clicar em "Dividir Conta"
- [ ] Verificar: SplitBillModal abre
- [ ] Definir 2 pessoas
- [ ] Verificar: Valor por pessoa calculado corretamente

**Resultado esperado:** ✅ Modal abre, cálculo correto

---

### **Teste 3: Pagamento Parcial**
- [ ] Registrar pagamento da "Pessoa 1"
- [ ] Verificar: Mensagem de sucesso
- [ ] Verificar: Saldo restante atualiza
- [ ] Verificar: Mapa de mesas mostra "PAGO PARCIAL"

**Resultado esperado:** ✅ Pagamento registrado, estado atualizado

---

## 🐛 VERIFICAÇÃO DE PROBLEMAS COMUNS

### **Problemas de Estado**
- [ ] Mesa não atualiza status após pagamento
- [ ] Pedido aparece duplicado
- [ ] Total calculado incorretamente
- [ ] Status "PAGO PARCIAL" não aparece

**Se encontrar:** Documentar e corrigir antes de testes completos

---

### **Problemas de Performance**
- [ ] Lento para atualizar após pagamento
- [ ] Mapa de mesas não atualiza em tempo real
- [ ] OrderSummaryPanel não atualiza após adicionar item

**Se encontrar:** Documentar e avaliar impacto

---

### **Problemas de Dados**
- [ ] Pagamento parcial não persiste (refresh perde dados)
- [ ] Valor já pago não aparece corretamente
- [ ] Histórico não mostra pedidos fechados

**Se encontrar:** Corrigir antes de testes completos (crítico)

---

## 📋 CHECKLIST DE COMPONENTES

### **Componentes Criados**
- [ ] `OrderSummaryPanel.tsx` existe e funciona
- [ ] `OrderHeader.tsx` existe e funciona
- [ ] `SplitBillModal.tsx` existe e funciona
- [ ] `SplitBillModalWrapper.tsx` existe e funciona
- [ ] `TableMapPanel.tsx` atualizado e funciona

**Como validar:**
- Abrir TPV
- Criar pedido
- Verificar que todos os componentes aparecem corretamente

---

### **Integrações**
- [ ] `TPV.tsx` integrado com todos os componentes
- [ ] `OrderContextReal.tsx` suporta pagamentos parciais
- [ ] `PaymentEngine.ts` chama RPC corretamente
- [ ] `OrderEngine.ts` tem tipo `PARTIALLY_PAID`

**Como validar:**
- Verificar que não há erros de TypeScript
- Verificar que não há erros no console

---

## 🎯 CRITÉRIOS DE PRONTO

O ambiente está pronto para testes quando:

1. **Técnico:**
   - ✅ Migration aplicada e validada
   - ✅ Servidor rodando sem erros
   - ✅ Dados de teste disponíveis

2. **Funcional:**
   - ✅ Teste 1 (criar pedido) passa
   - ✅ Teste 2 (dividir conta) passa
   - ✅ Teste 3 (pagamento parcial) passa

3. **Visual:**
   - ✅ Componentes aparecem corretamente
   - ✅ Estados visuais funcionam (cores, badges)
   - ✅ Feedback visual claro (mensagens, confirmações)

---

## 🚨 BLOQUEADORES

**NÃO iniciar testes completos se:**

- ❌ Migration SQL não foi aplicada
- ❌ Pagamento parcial não persiste após refresh
- ❌ Erros críticos no console do navegador
- ❌ Servidor não está rodando

**Corrigir bloqueadores antes de continuar.**

---

## 📝 NOTAS PRÉ-TESTES

**Data:** _______________  
**Ambiente:** [ ] Local [ ] Staging [ ] Produção  
**Migration aplicada:** [ ] Sim [ ] Não  
**Validação rápida:** [ ] Passou [ ] Falhou

### Observações:
- 
- 
- 

### Problemas encontrados:
1. 
2. 
3. 

---

## 🎯 PRÓXIMO PASSO

Após completar este checklist:

1. **Se tudo passou:**
   → Executar `TESTE_BALCAO_MVP_DEMO.md` (3 ciclos completos)

2. **Se algo falhou:**
   → Corrigir problemas identificados
   → Re-executar validação rápida
   → Só então executar testes completos

---

**Status:** ⏳ Aguardando validação  
**Última atualização:** 2026-01-20
