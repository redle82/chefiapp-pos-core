# ✅ Checklist Pré-Produção - ChefIApp

**Data:** 2026-01-24  
**Versão:** 2.0.0  
**Ambiente:** Sofia Gastrobar (Restaurante Único)

---

## 🗄️ Setup do Banco de Dados

### 1. Executar Migrations

- [ ] **Backup do banco de dados criado**
- [ ] **Migration de audit logs executada:**
  ```sql
  -- Executar: mobile-app/migration_audit_logs.sql
  ```
- [ ] **Validar tabela criada:**
  ```sql
  SELECT * FROM public.gm_audit_logs LIMIT 1;
  ```
- [ ] **Validar RLS policies ativas:**
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'gm_audit_logs';
  ```
- [ ] **Validar índices criados:**
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'gm_audit_logs';
  ```

---

## 🧪 Testes Funcionais

### Bug #1: Filtro de Pedidos por Role

- [ ] **Teste como Garçom:**
  - [ ] Criar pedido como garçom A
  - [ ] Verificar que garçom B não vê o pedido
  - [ ] Verificar que garçom A vê apenas seus pedidos do turno atual

- [ ] **Teste como Manager:**
  - [ ] Verificar que manager vê todos os pedidos
  - [ ] Verificar que pode acessar pedidos de qualquer garçom

- [ ] **Teste como Cozinheiro:**
  - [ ] Verificar que cozinheiro vê apenas pedidos do turno atual
  - [ ] Verificar que não vê pedidos de outros turnos

---

### Bug #4: Validação de Pagamento

- [ ] **Teste de Pedido Não Entregue:**
  - [ ] Criar pedido
  - [ ] Tentar pagar antes de entregar
  - [ ] Verificar que pagamento é bloqueado
  - [ ] Verificar mensagem de erro clara

- [ ] **Teste de Pedido Entregue:**
  - [ ] Criar pedido
  - [ ] Marcar como entregue
  - [ ] Verificar que pagamento é permitido
  - [ ] Processar pagamento com sucesso

---

### Bug #9: Estado ao Recarregar

- [ ] **Teste de Recarregamento:**
  - [ ] Abrir app
  - [ ] Fechar app completamente
  - [ ] Reabrir app
  - [ ] Verificar que estado é carregado corretamente
  - [ ] Verificar que não há erros no console

- [ ] **Teste de Erro de Conexão:**
  - [ ] Desabilitar internet
  - [ ] Abrir app
  - [ ] Verificar que fallback UI é exibida
  - [ ] Verificar botão de retry
  - [ ] Reabilitar internet e testar retry

---

### Bug #12: Validação de Permissões

- [ ] **Teste de Ações Críticas:**
  - [ ] **Como Garçom:**
    - [ ] Tentar fechar caixa → Deve ser bloqueado
    - [ ] Tentar encerrar turno → Deve ser bloqueado
    - [ ] Tentar void item → Verificar permissão
  
  - [ ] **Como Manager:**
    - [ ] Verificar que pode fechar caixa
    - [ ] Verificar que pode encerrar turno
    - [ ] Verificar que pode void item

  - [ ] **Como Cozinheiro:**
    - [ ] Tentar acessar tela de caixa → Deve ser bloqueado
    - [ ] Tentar acessar tela de gestão → Deve ser bloqueado

---

### Bug #13: Logs de Auditoria

- [ ] **Teste de Logs:**
  - [ ] **Pagamento:**
    - [ ] Processar pagamento
    - [ ] Verificar log em `gm_audit_logs`:
      ```sql
      SELECT * FROM gm_audit_logs 
      WHERE action = 'pay_order' 
      ORDER BY created_at DESC LIMIT 1;
      ```
    - [ ] Verificar que `user_id`, `order_id`, `amount_cents` estão corretos

  - [ ] **Void Item:**
    - [ ] Cancelar item de pedido
    - [ ] Verificar log com `action = 'void_item'`
    - [ ] Verificar que `reason` está registrado

  - [ ] **Abertura de Caixa:**
    - [ ] Abrir caixa
    - [ ] Verificar log com `action = 'open_cash_drawer'`
    - [ ] Verificar que `amount_cents` está correto

  - [ ] **Fechamento de Caixa:**
    - [ ] Fechar caixa
    - [ ] Verificar log com `action = 'close_cash_drawer'`
    - [ ] Verificar que `amount_cents` e `metadata` estão corretos

  - [ ] **Movimento de Caixa:**
    - [ ] Fazer suprimento ou sangria
    - [ ] Verificar log com `action = 'cash_movement'`
    - [ ] Verificar que `reason` e `metadata.movementType` estão corretos

---

## 🔒 Testes de Segurança

### Guards de Rota (Bug #3)

- [ ] **Teste de Navegação Direta:**
  - [ ] Como garçom, tentar acessar `/kitchen` diretamente
  - [ ] Verificar redirecionamento para `/staff`
  - [ ] Como cozinheiro, tentar acessar `/manager` diretamente
  - [ ] Verificar redirecionamento

### Validação Financeira (Bug #14)

- [ ] **Teste de Valores:**
  - [ ] Tentar inserir valor negativo → Deve ser bloqueado
  - [ ] Tentar inserir valor > €100.000 → Deve ser bloqueado
  - [ ] Tentar inserir valor válido → Deve ser aceito
  - [ ] Verificar mensagens de erro claras

---

## 📱 Testes de UX

### Validação de Inputs (Bug #7)

- [ ] **Telefone:**
  - [ ] Inserir telefone inválido → Deve ser bloqueado
  - [ ] Inserir telefone válido → Deve ser aceito

- [ ] **Nome:**
  - [ ] Inserir nome muito curto → Deve ser bloqueado
  - [ ] Inserir nome válido → Deve ser aceito

- [ ] **Gorjeta:**
  - [ ] Inserir gorjeta > 50% do total → Deve ser limitado
  - [ ] Inserir gorjeta válida → Deve ser aceito

---

## 🔄 Testes de Fluxo Operacional

### Fluxo Completo de Pedido

- [ ] **Criar Pedido:**
  - [ ] Selecionar mesa
  - [ ] Adicionar itens
  - [ ] Enviar pedido
  - [ ] Verificar que aparece na cozinha

- [ ] **Preparar Pedido:**
  - [ ] Cozinha marca como "preparando"
  - [ ] Cozinha marca como "pronto"
  - [ ] Verificar que garçom recebe notificação

- [ ] **Entregar Pedido:**
  - [ ] Garçom marca como "entregue"
  - [ ] Verificar que pode pagar

- [ ] **Pagar Pedido:**
  - [ ] Processar pagamento
  - [ ] Verificar que pedido fica como "pago"
  - [ ] Verificar log de auditoria

---

### Fluxo de Caixa

- [ ] **Abrir Caixa:**
  - [ ] Abrir caixa com fundo inicial
  - [ ] Verificar que estado muda para "aberto"
  - [ ] Verificar log de auditoria

- [ ] **Movimentos:**
  - [ ] Fazer suprimento
  - [ ] Fazer sangria
  - [ ] Verificar logs de ambos

- [ ] **Fechar Caixa:**
  - [ ] Tentar fechar com pedidos pendentes → Deve alertar
  - [ ] Fechar caixa normalmente
  - [ ] Verificar log de auditoria

---

## 📊 Validação de Dados

### Filtros por Role (Bug #11)

- [ ] **Tabelas:**
  - [ ] Garçom vê apenas mesas do turno atual
  - [ ] Manager vê todas as mesas

- [ ] **Pedidos:**
  - [ ] Garçom vê apenas seus pedidos
  - [ ] Manager vê todos os pedidos

---

## 🚨 Testes de Erro

### Tratamento de Erros

- [ ] **Erro de Conexão:**
  - [ ] Desabilitar internet
  - [ ] Tentar ações críticas
  - [ ] Verificar que erros são tratados graciosamente
  - [ ] Verificar que dados são enfileirados offline

- [ ] **Erro de Permissão:**
  - [ ] Tentar ação sem permissão
  - [ ] Verificar mensagem clara
  - [ ] Verificar que ação não é executada

---

## ✅ Checklist Final

### Antes de Ir para Produção

- [ ] ✅ Todos os testes acima passaram
- [ ] ✅ Migration de audit logs executada
- [ ] ✅ Logs de auditoria funcionando
- [ ] ✅ Nenhum erro crítico no console
- [ ] ✅ Performance aceitável (sem travamentos)
- [ ] ✅ Backup do banco de dados criado
- [ ] ✅ Documentação revisada

---

## 📝 Notas de Deploy

### Variáveis de Ambiente

- [ ] `EXPO_PUBLIC_SUPABASE_URL` configurada
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` configurada

### Configurações

- [ ] RLS policies ativas no Supabase
- [ ] Realtime subscriptions funcionando
- [ ] Storage configurado (se necessário)

---

## 🎯 Critérios de Aprovação

**✅ APROVADO PARA PRODUÇÃO se:**
- ✅ Todos os bugs críticos validados
- ✅ Logs de auditoria funcionando
- ✅ Nenhum erro crítico encontrado
- ✅ Performance aceitável
- ✅ Backup criado

**❌ NÃO APROVAR se:**
- ❌ Qualquer bug crítico não validado
- ❌ Logs de auditoria não funcionando
- ❌ Erros críticos no console
- ❌ Performance inaceitável

---

**Versão:** 2.0.0  
**Data:** 2026-01-24  
**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**
