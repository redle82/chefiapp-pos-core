# ✅ Validação Pré-Produção - ChefIApp

**Data:** 2026-01-24  
**Versão:** 2.0.0  
**Status:** 🔍 **VALIDAÇÃO EM ANDAMENTO**

---

## 🎯 Objetivo

Validar que o sistema está **APTO PARA PRODUÇÃO** através de testes sistemáticos dos fluxos críticos, segurança RBAC, resiliência offline/online, consistência de estado e logs de auditoria.

---

## 1️⃣ FLUXO COMPLETO DE UM TURNO REAL

### Teste: Ciclo Completo de Operação

**Cenário:** Simular um turno completo do início ao fim

#### Setup
- [ ] **Abrir App**
  - [ ] App inicia sem erros
  - [ ] Login funciona
  - [ ] Estado carrega corretamente
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Iniciar Turno**
  - [ ] Botão "Iniciar Turno" visível
  - [ ] Turno inicia com sucesso
  - [ ] `shiftId` é criado no banco
  - [ ] Estado local persiste corretamente
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Operação
- [ ] **Abrir Caixa**
  - [ ] Apenas roles com `cash:handle` podem abrir
  - [ ] Fundo inicial é registrado
  - [ ] Log de auditoria criado (`open_cash_drawer`)
  - [ ] Estado financeiro muda para `drawer_open`
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Criar Pedido**
  - [ ] Selecionar mesa
  - [ ] Adicionar itens ao pedido
  - [ ] Enviar pedido
  - [ ] Pedido aparece na cozinha/bar
  - [ ] Pedido tem `waiterId` e `businessId` corretos
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Preparar Pedido (Cozinha)**
  - [ ] Cozinheiro marca como "preparando"
  - [ ] Status atualiza em tempo real
  - [ ] Cozinheiro marca como "pronto"
  - [ ] Garçom recebe notificação
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Entregar Pedido**
  - [ ] Garçom marca como "entregue"
  - [ ] Status muda para `delivered`
  - [ ] Pedido pode ser pago
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Pagar Pedido**
  - [ ] Botão de pagamento aparece apenas se `status === 'delivered'`
  - [ ] Validação `canPayOrder` funciona
  - [ ] Pagamento processado com sucesso
  - [ ] Log de auditoria criado (`pay_order`)
  - [ ] Status muda para `paid`
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Movimento de Caixa**
  - [ ] Suprimento registrado
  - [ ] Sangria registrada
  - [ ] Logs de auditoria criados (`cash_movement`)
  - [ ] Valores validados (não negativos, não muito altos)
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Fechamento
- [ ] **Fechar Caixa**
  - [ ] Validação de pedidos pendentes funciona
  - [ ] Alerta aparece se há pendências
  - [ ] Fechamento registrado
  - [ ] Log de auditoria criado (`close_cash_drawer`)
  - [ ] Estado muda para `drawer_closed`
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Encerrar Turno**
  - [ ] Validação de ações pendentes funciona
  - [ ] Turno encerrado com sucesso
  - [ ] Estado local limpo
  - [ ] Dados persistidos no banco
  - **Resultado:** ✅ PASS / ❌ FAIL

**Resultado Geral:** ✅ PASS / ❌ FAIL

---

## 2️⃣ TESTES OFFLINE/ONLINE

### Teste: Resiliência Offline

**Cenário:** Operar sem conexão e validar sincronização

#### Offline → Online
- [ ] **Modo Avião Ativado**
  - [ ] App detecta perda de conexão
  - [ ] Indicador offline aparece
  - [ ] Ações são enfileiradas localmente
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Ações Offline**
  - [ ] Criar pedido offline → Enfileirado
  - [ ] Pagar pedido offline → Enfileirado
  - [ ] Atualizar status offline → Enfileirado
  - [ ] Queue mostra itens pendentes
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Reconexão**
  - [ ] Modo avião desativado
  - [ ] App detecta conexão restaurada
  - [ ] Queue processa automaticamente
  - [ ] Itens sincronizados com sucesso
  - [ ] Estado sincronizado com servidor
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Validação Pós-Sync**
  - [ ] Pedidos criados offline aparecem no servidor
  - [ ] Pagamentos processados offline são registrados
  - [ ] Status atualizados corretamente
  - [ ] Sem duplicações
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Online → Offline → Online (Ciclo)
- [ ] **Ciclo Completo**
  - [ ] Múltiplas ações offline
  - [ ] Reconexão
  - [ ] Todas sincronizadas
  - [ ] Sem perda de dados
  - **Resultado:** ✅ PASS / ❌ FAIL

**Resultado Geral:** ✅ PASS / ❌ FAIL

---

## 3️⃣ VALIDAÇÃO RBAC EM TODAS AS AÇÕES CRÍTICAS

### Teste: Permissões em Ações Críticas

**Cenário:** Validar que todas as ações críticas verificam permissões

#### Ações Financeiras

- [ ] **Abrir Caixa**
  - [ ] Garçom com `cash:handle` → ✅ Pode abrir
  - [ ] Cozinheiro sem `cash:handle` → ❌ Bloqueado
  - [ ] Manager com `cash:handle` → ✅ Pode abrir
  - [ ] Log de auditoria criado apenas se permitido
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Fechar Caixa**
  - [ ] Garçom com `cash:handle` → ✅ Pode fechar
  - [ ] Cozinheiro sem `cash:handle` → ❌ Bloqueado
  - [ ] Manager com `cash:handle` → ✅ Pode fechar
  - [ ] Validação de permissão SEMPRE antes de executar
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Movimentos de Caixa**
  - [ ] Apenas roles com `cash:handle` podem fazer movimentos
  - [ ] Validação antes de registrar
  - [ ] Logs criados apenas se permitido
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Ações de Pedidos

- [ ] **Void Item**
  - [ ] Garçom sem `order:void` → ❌ Bloqueado
  - [ ] Manager com `order:void` → ✅ Pode void
  - [ ] Chef com `order:void` → ✅ Pode void
  - [ ] Log de auditoria criado (`void_item`)
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Aplicar Desconto**
  - [ ] Garçom sem `order:discount` → ❌ Bloqueado
  - [ ] Manager com `order:discount` → ✅ Pode aplicar
  - [ ] Cashier com `order:discount` → ✅ Pode aplicar
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Pagar Pedido**
  - [ ] Validação `canPayOrder` funciona
  - [ ] Apenas pedidos entregues podem ser pagos
  - [ ] Log de auditoria criado (`pay_order`)
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Ações de Turno

- [ ] **Encerrar Turno**
  - [ ] Garçom com `shift:end` → ✅ Pode encerrar
  - [ ] Cozinheiro com `shift:end` → ✅ Pode encerrar
  - [ ] Validação de ações pendentes funciona
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Ações de Gestão

- [ ] **Acessar Tela de Gestão**
  - [ ] Garçom sem `business:view_reports` → ❌ Bloqueado
  - [ ] Manager com `business:view_reports` → ✅ Pode acessar
  - [ ] Owner com `business:view_reports` → ✅ Pode acessar
  - [ ] Route guard funciona corretamente
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Guards de Rota

- [ ] **Acesso Direto a Rotas**
  - [ ] Cozinheiro tentando acessar `/kitchen` → ✅ Permitido
  - [ ] Cozinheiro tentando acessar `/manager` → ❌ Redirecionado
  - [ ] Garçom tentando acessar `/bar` → ❌ Redirecionado
  - [ ] Manager tentando acessar qualquer rota → ✅ Permitido
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Filtros de Dados

- [ ] **Filtro de Pedidos por Role**
  - [ ] Garçom vê apenas seus pedidos do turno atual
  - [ ] Manager vê todos os pedidos
  - [ ] Cozinheiro vê apenas pedidos do turno atual
  - [ ] Filtro funciona corretamente
  - **Resultado:** ✅ PASS / ❌ FAIL

**Resultado Geral:** ✅ PASS / ❌ FAIL

---

## 4️⃣ CONSISTÊNCIA DE ESTADO APÓS RELOAD

### Teste: Persistência e Recuperação de Estado

**Cenário:** Validar que estado persiste e recupera corretamente após reload

#### Estado de Turno
- [ ] **Iniciar Turno → Fechar App → Reabrir**
  - [ ] Turno ainda está ativo
  - [ ] `shiftId` recuperado corretamente
  - [ ] Estado de turno preservado
  - [ ] Dados sincronizados com servidor
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Estado Financeiro
- [ ] **Abrir Caixa → Fechar App → Reabrir**
  - [ ] Caixa ainda está aberto
  - [ ] `financialSessionId` recuperado
  - [ ] Estado financeiro preservado
  - [ ] Dados sincronizados
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Estado de Pedidos
- [ ] **Criar Pedidos → Fechar App → Reabrir**
  - [ ] Pedidos ainda estão visíveis
  - [ ] Status dos pedidos correto
  - [ ] Filtros por role funcionam
  - [ ] Dados sincronizados
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Estado de Contexto
- [ ] **AppStaffContext após Reload**
  - [ ] `businessId` carrega corretamente
  - [ ] `businessName` carrega corretamente
  - [ ] `activeRole` preservado
  - [ ] Estados explícitos funcionam (`loading`, `ready`, `error`)
  - [ ] Retry funciona se houver erro
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Tratamento de Erros
- [ ] **Erro ao Carregar Restaurante**
  - [ ] Estado muda para `error`
  - [ ] Mensagem de erro exibida
  - [ ] Botão de retry funciona
  - [ ] Fallback UI exibida
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Erro de Conexão ao Recarregar**
  - [ ] Estado não quebra
  - [ ] Fallback funciona
  - [ ] Retry funciona quando conexão volta
  - **Resultado:** ✅ PASS / ❌ FAIL

**Resultado Geral:** ✅ PASS / ❌ FAIL

---

## 5️⃣ LOGS DE AUDITORIA GERADOS CORRETAMENTE

### Teste: Sistema de Logs de Auditoria

**Cenário:** Validar que todos os logs são criados corretamente

#### Setup
- [ ] **Migration Executada**
  - [ ] Tabela `gm_audit_logs` existe
  - [ ] RLS policies ativas
  - [ ] Índices criados
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Logs de Pagamento
- [ ] **Pagar Pedido**
  - [ ] Log criado com `action = 'pay_order'`
  - [ ] `user_id` preenchido corretamente
  - [ ] `order_id` preenchido corretamente
  - [ ] `amount_cents` preenchido corretamente
  - [ ] `metadata.paymentMethod` preenchido
  - [ ] `shift_id` preenchido (se disponível)
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Logs de Void
- [ ] **Cancelar Item**
  - [ ] Log criado com `action = 'void_item'`
  - [ ] `user_id` preenchido
  - [ ] `order_id` preenchido
  - [ ] `reason` preenchido
  - [ ] `metadata.itemId` preenchido
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Logs de Caixa
- [ ] **Abrir Caixa**
  - [ ] Log criado com `action = 'open_cash_drawer'`
  - [ ] `user_id` preenchido
  - [ ] `amount_cents` preenchido (fundo inicial)
  - [ ] `shift_id` preenchido (se disponível)
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Fechar Caixa**
  - [ ] Log criado com `action = 'close_cash_drawer'`
  - [ ] `user_id` preenchido
  - [ ] `amount_cents` preenchido (caixa final)
  - [ ] `metadata.expectedCash` preenchido
  - [ ] `metadata.difference` preenchido
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Logs de Movimentos
- [ ] **Suprimento/Sangria**
  - [ ] Log criado com `action = 'cash_movement'`
  - [ ] `user_id` preenchido
  - [ ] `amount_cents` preenchido
  - [ ] `reason` preenchido
  - [ ] `metadata.movementType` preenchido ('supply' ou 'bleed')
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Validação de Dados
- [ ] **Consultar Logs**
  ```sql
  SELECT 
      action,
      COUNT(*) as count,
      MAX(created_at) as last_log
  FROM gm_audit_logs
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY action
  ORDER BY last_log DESC;
  ```
  - [ ] Logs aparecem corretamente
  - [ ] Dados estão completos
  - [ ] Timestamps corretos
  - [ ] Sem logs duplicados
  - **Resultado:** ✅ PASS / ❌ FAIL

#### Falha Silenciosa
- [ ] **Tabela Não Existe**
  - [ ] App não quebra se tabela não existir
  - [ ] Logs são registrados no console
  - [ ] Fluxo operacional continua
  - **Resultado:** ✅ PASS / ❌ FAIL

**Resultado Geral:** ✅ PASS / ❌ FAIL

---

## 6️⃣ TESTE DE PICO (6-10 PEDIDOS SIMULTÂNEOS)

### Teste: Performance sob Carga

**Cenário:** Validar que sistema funciona com múltiplos pedidos simultâneos

- [ ] **Criar 6-10 Pedidos Simultaneamente**
  - [ ] Todos os pedidos são criados
  - [ ] Sem erros de concorrência
  - [ ] Status atualiza corretamente
  - [ ] UI não trava
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Atualizar Status Simultaneamente**
  - [ ] Múltiplos pedidos atualizados
  - [ ] Sem conflitos
  - [ ] Estado sincronizado
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Pagar Múltiplos Pedidos**
  - [ ] Pagamentos processados
  - [ ] Logs criados para todos
  - [ ] Sem duplicações
  - **Resultado:** ✅ PASS / ❌ FAIL

**Resultado Geral:** ✅ PASS / ❌ FAIL

---

## 7️⃣ REINÍCIO DO APP NO MEIO DO TURNO

### Teste: Resiliência a Reinícios

**Cenário:** Validar que app recupera corretamente após reinício

- [ ] **Reiniciar Durante Turno Ativo**
  - [ ] Turno ainda está ativo após reinício
  - [ ] Pedidos ainda estão visíveis
  - [ ] Estado financeiro preservado
  - [ ] Dados sincronizados
  - **Resultado:** ✅ PASS / ❌ FAIL

- [ ] **Reiniciar Durante Operação Crítica**
  - [ ] Pagamento em andamento → Recuperado
  - [ ] Fechamento de caixa → Estado preservado
  - [ ] Sem perda de dados
  - **Resultado:** ✅ PASS / ❌ FAIL

**Resultado Geral:** ✅ PASS / ❌ FAIL

---

## 📊 RESUMO DE VALIDAÇÃO

### Resultados por Categoria

| Categoria | Status | Observações |
|-----------|--------|-------------|
| **1. Fluxo Completo de Turno** | ⬜ PASS / ⬜ FAIL | |
| **2. Testes Offline/Online** | ⬜ PASS / ⬜ FAIL | |
| **3. Validação RBAC** | ⬜ PASS / ⬜ FAIL | |
| **4. Consistência de Estado** | ⬜ PASS / ⬜ FAIL | |
| **5. Logs de Auditoria** | ⬜ PASS / ⬜ FAIL | |
| **6. Teste de Pico** | ⬜ PASS / ⬜ FAIL | |
| **7. Reinício no Meio do Turno** | ⬜ PASS / ⬜ FAIL | |

### Riscos Residuais Identificados

1. **Risco:** ⬜ Nenhum / ⬜ Baixo / ⬜ Médio / ⬜ Alto
   - **Descrição:**
   - **Mitigação:**

2. **Risco:** ⬜ Nenhum / ⬜ Baixo / ⬜ Médio / ⬜ Alto
   - **Descrição:**
   - **Mitigação:**

### Confirmação Final

**Status Geral:** ⬜ **APTO PARA PRODUÇÃO** / ⬜ **NÃO APTO**

**Justificativa:**

---

**Data da Validação:** _______________  
**Validado por:** _______________  
**Assinatura:** _______________

---

## ✅ CHECKLIST FINAL

- [ ] Todos os testes acima executados
- [ ] Todos os resultados documentados
- [ ] Riscos residuais identificados
- [ ] Mitigações definidas
- [ ] Confirmação explícita: **APTO PARA PRODUÇÃO**

---

**Versão:** 2.0.0  
**Data:** 2026-01-24  
**Status:** 🔍 **AGUARDANDO VALIDAÇÃO**
