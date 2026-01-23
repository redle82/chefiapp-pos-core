# ✅ Validação Rápida - Sistema Nervoso Operacional

**Use este checklist para validar todas as funcionalidades implementadas.**

---

## 🔴 SEMANA 1: FAST PAY

### Teste 1: Pagamento Rápido no Mapa
- [ ] Abrir tela de Mesas
- [ ] Selecionar mesa ocupada
- [ ] Ver botão "Cobrar Tudo" no bottom sheet
- [ ] Clicar em "Cobrar Tudo"
- [ ] Ver confirmação com método (cash/card/pix)
- [ ] Confirmar pagamento
- [ ] **Resultado esperado:** Mesa fecha automaticamente, tempo < 5s

### Teste 2: Pagamento na Tela de Pedidos
- [ ] Abrir tela de Pedidos
- [ ] Selecionar pedido com status "delivered"
- [ ] Ver botão "Cobrar Tudo" no bottom sheet
- [ ] Clicar e confirmar
- [ ] **Resultado esperado:** Pedido marcado como pago, mesa liberada

### Teste 3: Validação de Caixa Fechado
- [ ] Fechar caixa (drawer_closed)
- [ ] Tentar pagar em dinheiro
- [ ] **Resultado esperado:** Alerta "Caixa Fechado" aparece

---

## 🟡 SEMANA 2: MAPA VIVO

### Teste 4: Timer Atualiza em Tempo Real
- [ ] Abrir tela de Mesas
- [ ] Observar timer de uma mesa ocupada
- [ ] Aguardar 1 minuto
- [ ] **Resultado esperado:** Timer atualiza automaticamente

### Teste 5: Cores de Urgência
- [ ] Mesa ocupada há < 15min → **Verde** ✅
- [ ] Mesa ocupada há 15-30min → **Amarelo** ⚠️
- [ ] Mesa ocupada há > 30min → **Vermelho** 🔴
- [ ] **Resultado esperado:** Cores mudam conforme tempo

### Teste 6: Ícone "Quer Pagar"
- [ ] Criar pedido e marcar como "delivered"
- [ ] Abrir mapa de mesas
- [ ] **Resultado esperado:** Ícone 💰 aparece na mesa

### Teste 7: Ícone "Esperando Bebida"
- [ ] Criar pedido com item de categoria "drink"
- [ ] Marcar como "preparing"
- [ ] Abrir mapa de mesas
- [ ] **Resultado esperado:** Ícone 🍷 aparece na mesa

---

## 🟠 SEMANA 3: KDS COMO REI

### Teste 8: Detecção de Pressão
- [ ] Criar 3 pedidos → **Low** ✅
- [ ] Criar mais 3 pedidos (total 6) → **Medium** ⚠️
- [ ] Criar mais 5 pedidos (total 11) → **High** 🔴
- [ ] **Resultado esperado:** Hook detecta corretamente

### Teste 9: Ocultação de Pratos Lentos
- [ ] Criar 11 pedidos (cozinha saturada)
- [ ] Abrir menu (tela principal)
- [ ] **Resultado esperado:** Apenas bebidas e itens rápidos aparecem

### Teste 10: Banner de Pressão
- [ ] Com cozinha saturada (high)
- [ ] Abrir menu
- [ ] **Resultado esperado:** Banner vermelho aparece no topo

### Teste 11: Priorização de Bebidas
- [ ] Com cozinha em medium + pratos lentos ativos
- [ ] Abrir menu
- [ ] **Resultado esperado:** Pratos lentos escondidos, bebidas visíveis

---

## 🟢 SEMANA 4: RESERVAS LITE

### Teste 12: Adicionar à Lista
- [ ] Abrir tela de Mesas
- [ ] Clicar em "Lista" (topo direito)
- [ ] Clicar em "+ Adicionar"
- [ ] Preencher nome e hora
- [ ] Confirmar
- [ ] **Resultado esperado:** Entrada aparece na lista

### Teste 13: Persistência
- [ ] Adicionar entrada na lista
- [ ] Fechar e reabrir o app
- [ ] Abrir lista de espera
- [ ] **Resultado esperado:** Entrada ainda está lá

### Teste 14: Atribuir Mesa
- [ ] Ter entrada na lista
- [ ] Clicar em "Atribuir"
- [ ] Selecionar mesa (ex: Mesa 5)
- [ ] **Resultado esperado:** Mesa 5 fica ativa, entrada some da lista

### Teste 15: Cancelar Entrada
- [ ] Ter entrada na lista
- [ ] Clicar em X (cancelar)
- [ ] **Resultado esperado:** Entrada some da lista

---

## 🎯 Testes de Integração

### Teste 16: Fluxo Completo
1. [ ] Adicionar cliente à lista de espera
2. [ ] Atribuir mesa
3. [ ] Fazer pedido
4. [ ] Cozinha fica saturada → menu esconde pratos lentos
5. [ ] Pedido fica pronto → ícone aparece no mapa
6. [ ] Entregar pedido → ícone "quer pagar" aparece
7. [ ] Clicar "Cobrar Tudo" → mesa fecha
8. [ ] **Resultado esperado:** Tudo funciona em sequência

### Teste 17: Offline
- [ ] Desligar internet
- [ ] Tentar todas as funcionalidades
- [ ] **Resultado esperado:** Funciona offline (com queue)

---

## 📊 Métricas a Coletar

### Fast Pay
- [ ] Tempo médio de pagamento: _____ segundos
- [ ] Taxa de sucesso: _____%

### Mapa Vivo
- [ ] Tempo médio de resposta a mesas urgentes: _____ minutos
- [ ] Redução de mesas > 30min: _____%

### KDS
- [ ] Redução de pratos lentos vendidos durante pico: _____%
- [ ] Aumento de vendas de bebidas durante pico: _____%

### Reservas
- [ ] Taxa de conversão reserva → mesa: _____%
- [ ] Tempo médio na lista: _____ minutos

---

## 🐛 Problemas Conhecidos

### Performance
- [ ] Timer atualizando muito rápido (bateria)
- [ ] Lista de espera não sincroniza entre dispositivos

### UX
- [ ] Auto-seleção de método ainda usa cash fixo
- [ ] Banner de pressão pode ser muito intrusivo

---

## ✅ Critérios de Aprovação

- [ ] Todos os testes 1-15 passam
- [ ] Tempo de pagamento < 5s
- [ ] Timer atualiza corretamente
- [ ] Cores de urgência funcionam
- [ ] KDS influencia menu corretamente
- [ ] Lista de espera persiste

**Status Final:** [ ] Aprovado [ ] Pendente [ ] Rejeitado

---

**Data da Validação:** _____  
**Validador:** _____  
**Observações:** _____
