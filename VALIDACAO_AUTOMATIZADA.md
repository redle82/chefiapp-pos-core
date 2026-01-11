# 🤖 VALIDAÇÃO AUTOMATIZADA - GUIA COMPLETO

**Data:** 16 Janeiro 2026  
**Status:** 🟡 **PRÓXIMO PASSO: VALIDAÇÃO**

---

## 🎯 OBJETIVO

**Automatizar ao máximo a validação de todas as funcionalidades implementadas.**

---

## 📋 CHECKLIST DE VALIDAÇÃO

### ✅ FASE 1 - "NÃO QUEBRA"

#### 1. Offline Mode
- [ ] **Teste 1:** Criar pedido offline
  - DevTools → Network → Offline
  - Criar pedido no TPV
  - Verificar IndexedDB (DevTools → Application → IndexedDB)
  - **Esperado:** Pedido salvo em `offline_orders`

- [ ] **Teste 2:** Sincronização automática
  - Com pedido offline criado
  - Religar internet (Network → Online)
  - Aguardar 5-10 segundos
  - **Esperado:** Pedido sincroniza automaticamente

- [ ] **Teste 3:** Retry com backoff
  - Criar pedido offline
  - Simular falha de rede (Network → Throttling → Offline)
  - Religar após alguns segundos
  - **Esperado:** Sistema tenta sincronizar novamente

**Documentação:** `TESTE_OFFLINE_MODE.md`

#### 2. Glovo Integration
- [ ] **Teste 1:** Configuração OAuth
  - Ir em Settings → Integrações de Delivery → Glovo
  - Inserir Client ID e Secret
  - Clicar em "Testar Conexão"
  - **Esperado:** Conexão bem-sucedida

- [ ] **Teste 2:** Webhook receiver
  - Configurar webhook no painel Glovo
  - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/webhook-glovo`
  - Criar pedido de teste no Glovo
  - **Esperado:** Pedido aparece no TPV

- [ ] **Teste 3:** Polling (alternativa)
  - Se webhook não funcionar
  - Verificar se polling está ativo
  - **Esperado:** Pedidos são buscados periodicamente

**Documentação:** `GLOVO_INTEGRACAO_COMPLETA.md`

#### 3. Fiscal Mínimo
- [ ] **Teste 1:** Geração SAF-T XML
  - Fazer um pagamento no TPV
  - Clicar em "Imprimir Recibo Fiscal"
  - Verificar console (DevTools → Console)
  - **Esperado:** XML gerado e logado

- [ ] **Teste 2:** Impressão de recibo
  - Após gerar XML
  - Verificar se modal de impressão aparece
  - **Esperado:** Recibo formatado para impressão

- [ ] **Teste 3:** Salvamento em banco
  - Após pagamento
  - Verificar tabela `fiscal_event_store` no Supabase
  - **Esperado:** Registro criado com status 'SUCCESS'

**Documentação:** `FISCAL_COMPLETO_STATUS.md`

#### 4. RLS / Segurança
- [ ] **Teste 1:** RLS ativo
  - Executar `VALIDAR_DEPLOY.sql` no Supabase Dashboard
  - **Esperado:** Todas as tabelas com RLS ativo ✅

- [ ] **Teste 2:** Policies funcionando
  - Tentar acessar dados de outro restaurante
  - **Esperado:** Acesso negado

- [ ] **Teste 3:** Race conditions protegidas
  - Tentar criar 2 pedidos simultâneos na mesma mesa
  - **Esperado:** Apenas 1 pedido criado

**Documentação:** `VALIDAR_DEPLOY.sql`

---

### ✅ FASE 2 - "PENSA COMIGO"

#### 5. Alertas Automáticos
- [ ] **Teste 1:** Mesa sem pedido
  - Abrir mesa no TPV
  - Aguardar 20 minutos (ou ajustar threshold para teste)
  - Abrir AppStaff
  - **Esperado:** Alerta aparece, tarefa criada

- [ ] **Teste 2:** Mesa com atraso
  - Criar pedido
  - Aguardar 45 minutos (ou ajustar threshold)
  - **Esperado:** Alerta de atraso aparece

**Documentação:** `FASE2_COMPLETA.md`

#### 6. Analytics Real
- [ ] **Teste 1:** Dados reais
  - Abrir Analytics
  - Verificar se dados aparecem (não mock)
  - **Esperado:** Dados reais do Supabase

- [ ] **Teste 2:** KPIs corretos
  - Verificar faturação total
  - Verificar ticket médio
  - Verificar total de pedidos
  - **Esperado:** Valores corretos

- [ ] **Teste 3:** Performance
  - Verificar tempo de carregamento
  - **Esperado:** < 2 segundos

**Documentação:** `FASE2_COMPLETA.md`

#### 7. Sugestões Contextuais
- [ ] **Teste 1:** Sugestões aparecem
  - Abrir AppStaff
  - Criar cenários (muitas tarefas, alta pressão)
  - **Esperado:** Sugestões aparecem

- [ ] **Teste 2:** Priorização correta
  - Verificar se sugestões críticas aparecem primeiro
  - **Esperado:** Priorização correta

**Documentação:** `FASE2_COMPLETA.md`

#### 8. Atalhos de Teclado
- [ ] **Teste 1:** Ctrl+N (novo pedido)
  - Pressionar Ctrl+N no TPV
  - **Esperado:** Novo pedido criado

- [ ] **Teste 2:** Ctrl+Enter (fechar pedido)
  - Com pedido ativo
  - Pressionar Ctrl+Enter
  - **Esperado:** Modal de pagamento abre

- [ ] **Teste 3:** Ctrl+F (buscar mesa)
  - Pressionar Ctrl+F
  - **Esperado:** Foco em seleção de mesas

**Documentação:** `FASE2_COMPLETA.md`

---

### ✅ FASE 3 - "ESCALA OU VENDA"

#### 9. Multi-location
- [ ] **Teste 1:** Criar grupo
  - Ir em Multi-location
  - Criar novo grupo
  - **Esperado:** Grupo criado

- [ ] **Teste 2:** Adicionar restaurantes
  - Adicionar restaurantes ao grupo
  - **Esperado:** Restaurantes adicionados

- [ ] **Teste 3:** Dashboard consolidado
  - Verificar dashboard do grupo
  - **Esperado:** Dados consolidados aparecem

**Documentação:** `FASE3_COMPLETA.md`

#### 10. CRM / Loyalty
- [ ] **Teste 1:** Criação automática de cliente
  - Fazer pedido com email/telefone
  - Verificar tabela `customer_profiles`
  - **Esperado:** Cliente criado automaticamente

- [ ] **Teste 2:** Atualização após pedido
  - Após pagamento
  - Verificar perfil do cliente
  - **Esperado:** `total_visits` e `total_spent` atualizados

- [ ] **Teste 3:** Pontos adicionados
  - Após pagamento
  - Verificar `loyalty_cards`
  - **Esperado:** Pontos adicionados

- [ ] **Teste 4:** UI de clientes
  - Abrir página de Clientes (CRM)
  - **Esperado:** Lista de clientes aparece

- [ ] **Teste 5:** UI de fidelidade
  - Abrir página de Fidelidade
  - **Esperado:** Tiers e recompensas aparecem

**Documentação:** `FASE3_COMPLETA.md`

#### 11. Uber Eats
- [ ] **Teste 1:** Configuração OAuth
  - Ir em Settings → Integrações de Delivery → Uber Eats
  - Inserir credenciais
  - Testar conexão
  - **Esperado:** Conexão bem-sucedida

- [ ] **Teste 2:** Webhook receiver
  - Configurar webhook no painel Uber Eats
  - Criar pedido de teste
  - **Esperado:** Pedido aparece no TPV

**Documentação:** `FASE3_COMPLETA.md`

#### 12. Deliveroo
- [ ] **Teste 1:** Configuração OAuth
  - Ir em Settings → Integrações de Delivery → Deliveroo
  - Inserir credenciais
  - Testar conexão
  - **Esperado:** Conexão bem-sucedida

- [ ] **Teste 2:** Webhook receiver
  - Configurar webhook no painel Deliveroo
  - Criar pedido de teste
  - **Esperado:** Pedido aparece no TPV

**Documentação:** `FASE3_COMPLETA.md`

---

## 🚨 BLOQUEADORES

### Migration não aplicada
- ⚠️ **CRM/Loyalty não funcionará sem migration**
- **Solução:** Aplicar `supabase/migrations/20260116000003_customer_loyalty.sql`
- **Ver:** `APLICAR_MIGRATIONS_CRM_LOYALTY.md`

### Credenciais de integração
- ⚠️ **Glovo, Uber Eats, Deliveroo precisam de credenciais**
- **Solução:** Obter credenciais dos painéis de desenvolvedor

### Webhooks não configurados
- ⚠️ **Webhooks precisam ser configurados nos painéis**
- **Solução:** Configurar URLs dos webhooks

---

## 📊 PRIORIZAÇÃO

### Crítico (Fazer primeiro)
1. ✅ RLS / Segurança
2. ✅ Offline Mode
3. ✅ CRM / Loyalty (após aplicar migration)

### Importante (Fazer depois)
4. ✅ Analytics Real
5. ✅ Alertas Automáticos
6. ✅ Integrações Delivery (se tiver credenciais)

### Opcional (Se houver tempo)
7. ✅ Sugestões Contextuais
8. ✅ Atalhos de Teclado
9. ✅ Multi-location

---

## 🎯 CRITÉRIO DE SUCESSO

**Cenário de Teste Final:**
1. Desligar internet → Criar pedido → Religar → Sincroniza ✅
2. Pedido Glovo chega → Aparece no TPV ✅
3. Pagamento → Cliente criado → Pontos adicionados ✅
4. Analytics mostra dados reais ✅
5. Alertas aparecem quando necessário ✅

**Resultado:** ✅ **Sistema pronto para produção**

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `VALIDACAO_PRODUCAO_PLANO.md` - Plano completo
- `TESTE_OFFLINE_MODE.md` - Teste Offline Mode
- `VALIDAR_DEPLOY.sql` - Validação RLS
- `APLICAR_MIGRATIONS_CRM_LOYALTY.md` - Aplicar migration

---

**Última atualização:** 2026-01-16  
**Próximo passo:** Executar validação completa
