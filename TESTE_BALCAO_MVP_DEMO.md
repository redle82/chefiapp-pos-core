# 🧪 TESTE DE BALCÃO - MVP Demo

**Data:** 2026-01-20  
**Objetivo:** Validar fluxo completo "como no bar" - 3x seguidas sem confusão mental

---

## 📋 PRÉ-REQUISITOS

Antes de começar, garantir:
- [ ] Caixa aberto no sistema
- [ ] Pelo menos 3 mesas cadastradas
- [ ] Pelo menos 5 produtos no menu (bebidas e comidas)
- [ ] Migration de pagamentos parciais aplicada no Supabase
- [ ] Servidor rodando (`npm run dev` ou `npm run server:web-module`)

---

## 🔄 CICLO DE TESTE COMPLETO (Repetir 3x)

### **CICLO 1: Fluxo Básico (Sem Split)**

#### 1. Abrir Mesa e Criar Pedido
- [ ] Abrir TPV
- [ ] Verificar mapa de mesas (deve mostrar mesas livres)
- [ ] Clicar em mesa livre (ou usar botão "+ Abrir Conta")
- [ ] Verificar: Header da conta aparece (mesa, hora, total)
- [ ] Verificar: OrderSummaryPanel aparece vazio
- [ ] Mudar para view de menu (se não mudou automaticamente)

#### 2. Adicionar Itens
- [ ] Adicionar 1 bebida (ex: Coca-Cola)
- [ ] Verificar: Item aparece no OrderSummaryPanel
- [ ] Verificar: Total parcial atualiza no header
- [ ] Adicionar 1 comida (ex: Hambúrguer)
- [ ] Verificar: 2 itens no resumo
- [ ] Adicionar mais 1 bebida (ex: Água)
- [ ] Verificar: Total = soma de todos os itens

#### 3. Ajustar Quantidades
- [ ] Aumentar quantidade de 1 item (usar OrderItemEditor)
- [ ] Verificar: Total atualiza corretamente
- [ ] Diminuir quantidade de outro item
- [ ] Verificar: Total atualiza corretamente

#### 4. Pagamento Total
- [ ] Clicar em "Fechar e Pagar" no OrderSummaryPanel
- [ ] Verificar: PaymentModal abre
- [ ] Selecionar método de pagamento (Dinheiro)
- [ ] Processar pagamento
- [ ] Verificar: Mensagem de sucesso
- [ ] Verificar: Modal fecha automaticamente
- [ ] Verificar: Pedido desaparece do mapa de mesas (ou status muda para "PAGO")

#### 5. Verificar Histórico
- [ ] Verificar: Mesa volta para status "LIVRE"
- [ ] Verificar: Total do dia atualiza (se houver dashboard)

---

### **CICLO 2: Fluxo com Split Bill (Partes Iguais)**

#### 1. Abrir Nova Mesa
- [ ] Selecionar mesa diferente
- [ ] Adicionar 4 itens (total: €20,00)
- [ ] Verificar: Total correto no header e resumo

#### 2. Dividir Conta
- [ ] Clicar em "Dividir Conta" no OrderSummaryPanel
- [ ] Verificar: SplitBillModal abre
- [ ] Verificar: Mostra total da conta
- [ ] Definir número de pessoas: 3
- [ ] Verificar: Valor por pessoa calculado corretamente
- [ ] Verificar: Última pessoa recebe resto dos cêntimos (se houver)

#### 3. Registrar Primeiro Pagamento Parcial
- [ ] Selecionar método: Dinheiro
- [ ] Clicar em "Pessoa 1" (botão com valor)
- [ ] Verificar: Mensagem de sucesso
- [ ] Verificar: Modal mostra "Já Pago" atualizado
- [ ] Verificar: Saldo restante atualiza
- [ ] Verificar: Botão "Pessoa 1" fica desabilitado (ou mostra "✓ Pago")

#### 4. Verificar Estado no Mapa de Mesas
- [ ] Fechar SplitBillModal (sem completar pagamento)
- [ ] Verificar: Mapa de mesas mostra mesa como "PAGO PARCIAL"
- [ ] Verificar: Mapa mostra total parcial pago
- [ ] Verificar: Indicador visual (cor) diferente

#### 5. Continuar Pagamento
- [ ] Abrir SplitBillModal novamente (clicar na mesa ou "Dividir Conta")
- [ ] Verificar: Mostra valor já pago
- [ ] Verificar: Mostra saldo restante
- [ ] Registrar pagamento da "Pessoa 2"
- [ ] Verificar: Saldo restante atualiza

#### 6. Finalizar Pagamento
- [ ] Registrar pagamento da "Pessoa 3" (última)
- [ ] Verificar: Modal fecha automaticamente quando saldo zera
- [ ] Verificar: Mesa volta para "LIVRE" no mapa
- [ ] Verificar: Pedido desaparece da lista ativa

---

### **CICLO 3: Fluxo com Múltiplas Mesas Simultâneas**

#### 1. Abrir 3 Mesas Diferentes
- [ ] Mesa 1: Adicionar 2 itens, total €10,00
- [ ] Mesa 2: Adicionar 3 itens, total €15,00
- [ ] Mesa 3: Adicionar 1 item, total €5,00
- [ ] Verificar: Todas aparecem como "OCUPADA" no mapa
- [ ] Verificar: Totais corretos em cada mesa

#### 2. Processar Pagamentos em Sequência
- [ ] Mesa 1: Pagar total (€10,00)
- [ ] Verificar: Mesa 1 volta para "LIVRE"
- [ ] Mesa 2: Dividir em 2 pessoas, pagar 1 pessoa (€7,50)
- [ ] Verificar: Mesa 2 mostra "PAGO PARCIAL"
- [ ] Mesa 3: Pagar total (€5,00)
- [ ] Verificar: Mesa 3 volta para "LIVRE"

#### 3. Finalizar Mesa 2
- [ ] Abrir Mesa 2 novamente
- [ ] Verificar: OrderSummaryPanel mostra valor já pago
- [ ] Verificar: Saldo restante correto
- [ ] Completar pagamento da segunda pessoa
- [ ] Verificar: Mesa 2 volta para "LIVRE"

#### 4. Verificar Consistência
- [ ] Verificar: Total do dia = €30,00 (10 + 15 + 5)
- [ ] Verificar: Nenhuma mesa "fantasma" (ocupada sem pedido)
- [ ] Verificar: Histórico do dia mostra 3 pedidos fechados

---

## 🐛 CHECKLIST DE PROBLEMAS COMUNS

Durante os testes, verificar:

### **Problemas de Estado**
- [ ] Mesa não atualiza status após pagamento
- [ ] Pedido aparece duplicado
- [ ] Total calculado incorretamente
- [ ] Status "PAGO PARCIAL" não aparece no mapa

### **Problemas de UX**
- [ ] Botão desabilitado quando deveria estar habilitado
- [ ] Mensagem de erro confusa
- [ ] Modal não fecha após ação
- [ ] Indicador visual não reflete estado real

### **Problemas de Performance**
- [ ] Lento para atualizar após pagamento
- [ ] Mapa de mesas não atualiza em tempo real
- [ ] OrderSummaryPanel não atualiza após adicionar item

### **Problemas de Dados**
- [ ] Pagamento parcial não persiste
- [ ] Valor já pago não aparece corretamente
- [ ] Histórico não mostra pedidos fechados

---

## ✅ CRITÉRIOS DE SUCESSO

O MVP está pronto se:

1. **Funcionalidade:**
   - ✅ Todos os 3 ciclos completam sem erro técnico
   - ✅ Dados persistem corretamente (refresh da página mantém estado)
   - ✅ Cálculos estão corretos (totais, divisões, saldos)

2. **Usabilidade:**
   - ✅ Fluxo é intuitivo (sem precisar ler manual)
   - ✅ Feedback visual claro (cores, badges, mensagens)
   - ✅ Ações rápidas funcionam (botões, double-click)

3. **Robustez:**
   - ✅ Erros são tratados graciosamente (não quebra o fluxo)
   - ✅ Estados impossíveis não acontecem (ex: pagar mais que o total)
   - ✅ Recuperação de erros funciona (ex: tentar pagar sem caixa aberto)

---

## 📝 NOTAS DE TESTE

**Data do Teste:** _______________  
**Testador:** _______________  
**Ambiente:** [ ] Local [ ] Staging [ ] Produção

### Observações:
- 
- 
- 

### Bugs Encontrados:
1. 
2. 
3. 

### Melhorias de UX Identificadas:
1. 
2. 
3. 

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTE

Se todos os critérios de sucesso forem atingidos:

1. **Congelar MVP Demo**
   - Documentar versão testada
   - Criar tag/release no Git
   - Preparar pitch de 60 segundos

2. **Decidir Próxima Fase:**
   - [ ] Mostrar para 1-2 pessoas reais (feedback)
   - [ ] Implementar Split por Itens (Tarefa 3.4)
   - [ ] Melhorar Offline Visível
   - [ ] Outro: _______________

---

**Status:** ⏳ Aguardando teste  
**Última atualização:** 2026-01-20
