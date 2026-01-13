# ✅ VALIDAÇÃO - Fluxo Completo de Split Bill

**Data:** 2026-01-20  
**Versão:** v0.9.2  
**Objetivo:** Validar que o fluxo de split bill está funcionando corretamente end-to-end

---

## 🔍 PRÉ-REQUISITOS

Antes de começar, garantir:
- [ ] Migration `20260120000001_add_partial_payment_support.sql` aplicada
- [ ] ENUM `payment_status` inclui `'partially_paid'` (validado)
- [ ] Função RPC `process_order_payment` suporta pagamentos parciais (validado)
- [ ] Servidor rodando (v0.9.2)
- [ ] Caixa aberto no sistema
- [ ] Pelo menos 3 mesas cadastradas
- [ ] Pelo menos 5 produtos no menu

---

## 🧪 TESTE 1: Split Bill Básico (Partes Iguais)

### **Cenário:** 3 pessoas dividem conta de €45,00

#### **Passo 1: Criar Pedido**
- [ ] Abrir TPV
- [ ] Selecionar mesa livre (ex: Mesa 5)
- [ ] Adicionar itens totalizando €45,00
  - [ ] Item 1: €15,00
  - [ ] Item 2: €15,00
  - [ ] Item 3: €15,00
- [ ] Verificar: Total = €45,00 no header e resumo

**Resultado esperado:** ✅ Pedido criado, total correto

---

#### **Passo 2: Iniciar Split**
- [ ] Clicar em "Dividir Conta" no OrderSummaryPanel
- [ ] Verificar: SplitBillModal abre
- [ ] Verificar: Mostra total da conta (€45,00)
- [ ] Definir número de pessoas: 3
- [ ] Verificar: Valor por pessoa = €15,00
- [ ] Verificar: Mensagem sobre última pessoa (se houver ajuste de cêntimos)

**Resultado esperado:** ✅ Modal abre, cálculo correto (€15,00 por pessoa)

---

#### **Passo 3: Registrar Primeiro Pagamento**
- [ ] Selecionar método: Dinheiro
- [ ] Clicar em "Pessoa 1" (botão com valor €15,00)
- [ ] Verificar: Mensagem de sucesso aparece
- [ ] Verificar: Modal mostra "Já Pago: €15,00"
- [ ] Verificar: Saldo restante = €30,00
- [ ] Verificar: Botão "Pessoa 1" fica desabilitado (ou mostra "✓ Pago")

**Resultado esperado:** ✅ Pagamento registrado, estado atualizado

---

#### **Passo 4: Verificar Estado no Mapa de Mesas**
- [ ] Fechar SplitBillModal (sem completar pagamento)
- [ ] Verificar: Mapa de mesas mostra Mesa 5 como "PAGO PARCIAL"
- [ ] Verificar: Mapa mostra total parcial pago (€15,00)
- [ ] Verificar: Indicador visual (cor) diferente (warning/amarelo)

**Resultado esperado:** ✅ Estado visível no mapa, informação correta

---

#### **Passo 5: Continuar Pagamento**
- [ ] Abrir SplitBillModal novamente (clicar na mesa ou "Dividir Conta")
- [ ] Verificar: Mostra valor já pago (€15,00)
- [ ] Verificar: Mostra saldo restante (€30,00)
- [ ] Verificar: Botão "Pessoa 1" desabilitado
- [ ] Registrar pagamento da "Pessoa 2" (€15,00, método: Cartão)
- [ ] Verificar: Saldo restante atualiza para €15,00
- [ ] Verificar: Botão "Pessoa 2" fica desabilitado

**Resultado esperado:** ✅ Estado persiste, pagamentos acumulam corretamente

---

#### **Passo 6: Finalizar Pagamento**
- [ ] Registrar pagamento da "Pessoa 3" (€15,00, método: PIX)
- [ ] Verificar: Modal fecha automaticamente quando saldo zera
- [ ] Verificar: Mesa volta para "LIVRE" no mapa
- [ ] Verificar: Pedido desaparece da lista ativa
- [ ] Verificar: OrderSummaryPanel não mostra mais pedido ativo

**Resultado esperado:** ✅ Conta fecha automaticamente, mesa liberada

---

#### **Passo 7: Verificar Persistência**
- [ ] Refresh da página (F5)
- [ ] Verificar: Mesa continua "LIVRE"
- [ ] Verificar: Pedido não aparece mais na lista ativa
- [ ] Verificar: Histórico do dia mostra pedido fechado (se houver dashboard)

**Resultado esperado:** ✅ Dados persistem corretamente após refresh

---

## 🧪 TESTE 2: Split com Ajuste de Cêntimos

### **Cenário:** 3 pessoas dividem conta de €10,00 (não divisível por 3)

#### **Passo 1: Criar Pedido**
- [ ] Criar pedido totalizando €10,00
- [ ] Iniciar split para 3 pessoas
- [ ] Verificar: Sistema calcula €3,33 por pessoa
- [ ] Verificar: Última pessoa paga €3,34 (ajuste de cêntimos)

**Resultado esperado:** ✅ Cálculo correto (€3,33 + €3,33 + €3,34 = €10,00)

---

#### **Passo 2: Registrar Pagamentos**
- [ ] Pessoa 1: €3,33
- [ ] Pessoa 2: €3,33
- [ ] Pessoa 3: €3,34
- [ ] Verificar: Total pago = €10,00
- [ ] Verificar: Conta fecha automaticamente

**Resultado esperado:** ✅ Ajuste de cêntimos funciona, total correto

---

## 🧪 TESTE 3: Split com Múltiplas Mesas

### **Cenário:** 3 mesas simultâneas, 2 com split

#### **Passo 1: Criar 3 Pedidos**
- [ ] Mesa 1: €20,00 (sem split)
- [ ] Mesa 2: €30,00 (split para 2 pessoas)
- [ ] Mesa 3: €15,00 (split para 3 pessoas)

**Resultado esperado:** ✅ Todos os pedidos criados corretamente

---

#### **Passo 2: Processar Pagamentos**
- [ ] Mesa 1: Pagar total (€20,00)
  - [ ] Verificar: Mesa 1 volta para "LIVRE"
- [ ] Mesa 2: Dividir, pagar 1 pessoa (€15,00)
  - [ ] Verificar: Mesa 2 mostra "PAGO PARCIAL"
- [ ] Mesa 3: Dividir, pagar 1 pessoa (€5,00)
  - [ ] Verificar: Mesa 3 mostra "PAGO PARCIAL"

**Resultado esperado:** ✅ Estados corretos em cada mesa

---

#### **Passo 3: Finalizar Mesas com Split**
- [ ] Mesa 2: Completar pagamento (€15,00)
  - [ ] Verificar: Mesa 2 volta para "LIVRE"
- [ ] Mesa 3: Completar pagamentos restantes (€5,00 + €5,00)
  - [ ] Verificar: Mesa 3 volta para "LIVRE"

**Resultado esperado:** ✅ Todas as mesas fechadas corretamente

---

#### **Passo 4: Verificar Consistência**
- [ ] Verificar: Total do dia = €65,00 (20 + 30 + 15)
- [ ] Verificar: Nenhuma mesa "fantasma" (ocupada sem pedido)
- [ ] Verificar: Histórico mostra 3 pedidos fechados

**Resultado esperado:** ✅ Dados consistentes, totais corretos

---

## 🧪 TESTE 4: Edge Cases

### **Cenário 1: Tentar Pagar Mais que o Total**
- [ ] Criar pedido de €10,00
- [ ] Tentar pagar €15,00
- [ ] Verificar: Sistema rejeita (erro ou validação)

**Resultado esperado:** ✅ Sistema protege contra pagamento excessivo

---

### **Cenário 2: Tentar Pagar Pessoa Duas Vezes**
- [ ] Criar pedido, dividir para 2 pessoas
- [ ] Pagar Pessoa 1
- [ ] Tentar pagar Pessoa 1 novamente
- [ ] Verificar: Sistema rejeita ou botão desabilitado

**Resultado esperado:** ✅ Sistema protege contra pagamento duplicado

---

### **Cenário 3: Fechar Modal e Reabrir**
- [ ] Criar pedido, dividir, pagar 1 pessoa
- [ ] Fechar modal
- [ ] Reabrir modal
- [ ] Verificar: Estado persiste (mostra valor já pago)

**Resultado esperado:** ✅ Estado persiste corretamente

---

### **Cenário 4: Refresh Durante Split**
- [ ] Criar pedido, dividir, pagar 1 pessoa
- [ ] Refresh da página (F5)
- [ ] Verificar: Estado persiste (pedido ainda parcialmente pago)
- [ ] Verificar: Mapa mostra "PAGO PARCIAL"

**Resultado esperado:** ✅ Estado persiste após refresh

---

## 🐛 CHECKLIST DE PROBLEMAS

### **Problemas de Estado**
- [ ] Mesa não atualiza status após pagamento parcial
- [ ] Pedido aparece duplicado
- [ ] Status "PAGO PARCIAL" não aparece no mapa
- [ ] Estado não persiste após refresh

### **Problemas de Cálculo**
- [ ] Total calculado incorretamente
- [ ] Valor por pessoa incorreto
- [ ] Ajuste de cêntimos incorreto
- [ ] Saldo restante incorreto

### **Problemas de UX**
- [ ] Botão desabilitado quando deveria estar habilitado
- [ ] Modal não fecha após último pagamento
- [ ] Mensagem de erro confusa
- [ ] Feedback visual não reflete estado real

### **Problemas de Dados**
- [ ] Pagamento parcial não persiste
- [ ] Valor já pago não aparece corretamente
- [ ] Histórico não mostra pedidos fechados
- [ ] Múltiplos pagamentos da mesma pessoa aceitos

---

## ✅ CRITÉRIOS DE SUCESSO

O fluxo de split bill está validado quando:

### **Funcionalidade:**
- ✅ Todos os 4 testes completam sem erro técnico
- ✅ Cálculos estão corretos (totais, divisões, saldos)
- ✅ Dados persistem corretamente (refresh mantém estado)
- ✅ Edge cases são tratados corretamente

### **Usabilidade:**
- ✅ Fluxo é intuitivo (sem precisar ler manual)
- ✅ Feedback visual claro (cores, badges, mensagens)
- ✅ Estados são claros (PAGO PARCIAL, LIVRE, OCUPADA)

### **Robustez:**
- ✅ Erros são tratados graciosamente (não quebra o fluxo)
- ✅ Estados impossíveis não acontecem (ex: pagar mais que o total)
- ✅ Recuperação de erros funciona (ex: refresh durante split)

---

## 📝 NOTAS DE VALIDAÇÃO

**Data do Teste:** _______________  
**Testador:** _______________  
**Ambiente:** [ ] Local [ ] Staging [ ] Produção  
**Versão:** v0.9.2

### **Resultados:**
- Teste 1 (Split Básico): [ ] PASS [ ] FAIL
- Teste 2 (Ajuste Cêntimos): [ ] PASS [ ] FAIL
- Teste 3 (Múltiplas Mesas): [ ] PASS [ ] FAIL
- Teste 4 (Edge Cases): [ ] PASS [ ] FAIL

### **Problemas Encontrados:**
1. 
2. 
3. 

### **Melhorias Identificadas:**
1. 
2. 
3. 

---

## 🎯 PRÓXIMOS PASSOS

### **Se Todos os Testes Passarem:**
1. ✅ Split bill validado e funcional
2. ⏳ Prosseguir com testes de balcão completos
3. ⏳ Preparar para feedback de usuários reais

### **Se Algum Teste Falhar:**
1. ⚠️ Documentar problema específico
2. ⚠️ Priorizar correção (crítico vs. não crítico)
3. ⚠️ Corrigir e re-executar teste
4. ⚠️ Validar novamente antes de prosseguir

---

**Status:** ⏳ Aguardando validação  
**Última atualização:** 2026-01-20
