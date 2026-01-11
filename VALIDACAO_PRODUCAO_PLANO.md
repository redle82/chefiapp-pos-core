# ✅ VALIDAÇÃO PARA PRODUÇÃO - PLANO COMPLETO

**Data:** 16 Janeiro 2026  
**Status:** 🟡 **PRÓXIMO PASSO CRÍTICO**

---

## 🎯 OBJETIVO

**Garantir que todas as funcionalidades implementadas funcionam em produção antes do soft launch.**

---

## 📋 CHECKLIST DE VALIDAÇÃO

### FASE 1 - "NÃO QUEBRA"

#### 1. Offline Mode ✅
- [ ] Testar criação de pedido offline
- [ ] Verificar IndexedDB
- [ ] Testar sincronização quando voltar online
- [ ] Validar retry com backoff

**Como testar:**
1. Desligar internet (DevTools → Network → Offline)
2. Criar pedido no TPV
3. Verificar se aparece no IndexedDB
4. Religar internet
5. Verificar se sincroniza automaticamente

#### 2. Glovo Integration ✅
- [ ] Testar OAuth 2.0
- [ ] Configurar webhook no Glovo
- [ ] Receber pedido de teste
- [ ] Verificar se aparece no TPV

**Como testar:**
1. Ir em Settings → Integrações de Delivery → Glovo
2. Inserir Client ID e Secret
3. Testar conexão
4. Configurar webhook no painel Glovo
5. Criar pedido de teste no Glovo
6. Verificar se chega no POS

#### 3. Fiscal Mínimo ✅
- [ ] Testar geração SAF-T XML
- [ ] Verificar impressão de recibo
- [ ] Validar salvamento em banco

**Como testar:**
1. Fazer um pagamento no TPV
2. Clicar em "Imprimir Recibo Fiscal"
3. Verificar se XML é gerado
4. Verificar se recibo imprime
5. Verificar se salva em `fiscal_event_store`

#### 4. RLS / Segurança ✅
- [ ] Validar RLS ativo
- [ ] Testar policies
- [ ] Verificar race conditions

**Como testar:**
1. Executar `VALIDAR_DEPLOY.sql` no Supabase Dashboard
2. Verificar se todas as tabelas têm RLS ativo
3. Testar acesso com diferentes usuários

---

### FASE 2 - "PENSA COMIGO"

#### 5. Alertas Automáticos ✅
- [ ] Testar alerta de mesa sem pedido
- [ ] Verificar criação de tarefa automática
- [ ] Validar thresholds (20min, 45min)

**Como testar:**
1. Abrir AppStaff
2. Criar mesa ocupada sem pedido
3. Aguardar 20 minutos (ou ajustar threshold para teste)
4. Verificar se alerta aparece
5. Verificar se tarefa é criada

#### 6. Analytics Real ✅
- [ ] Verificar queries no Supabase
- [ ] Testar com dados reais
- [ ] Validar performance

**Como testar:**
1. Abrir Analytics
2. Verificar se dados aparecem (não mock)
3. Testar diferentes períodos
4. Verificar performance das queries

#### 7. Sugestões Contextuais ✅
- [ ] Verificar se sugestões aparecem
- [ ] Testar diferentes contextos
- [ ] Validar priorização

**Como testar:**
1. Abrir AppStaff
2. Criar cenários (muitas tarefas, alta pressão, etc.)
3. Verificar se sugestões aparecem
4. Validar se são relevantes

#### 8. Atalhos de Teclado ✅
- [ ] Testar Ctrl+N (novo pedido)
- [ ] Testar Ctrl+Enter (fechar pedido)
- [ ] Testar Ctrl+F (buscar mesa)

**Como testar:**
1. Abrir TPV
2. Testar cada atalho
3. Verificar se funciona corretamente

---

### FASE 3 - "ESCALA OU VENDA"

#### 9. Multi-location ✅
- [ ] Criar grupo de restaurantes
- [ ] Adicionar restaurantes ao grupo
- [ ] Verificar dashboard consolidado

**Como testar:**
1. Ir em Multi-location
2. Criar novo grupo
3. Adicionar restaurantes
4. Verificar dashboard consolidado

#### 10. CRM / Loyalty ✅
- [ ] Testar criação automática de cliente
- [ ] Verificar atualização após pedido
- [ ] Testar adição de pontos
- [ ] Verificar UI de clientes e fidelidade

**Como testar:**
1. Fazer pedido com email/telefone
2. Verificar se cliente é criado automaticamente
3. Verificar se pontos são adicionados
4. Abrir página de Clientes (CRM)
5. Abrir página de Fidelidade
6. Verificar se dados aparecem

#### 11. Uber Eats ✅
- [ ] Testar OAuth 2.0
- [ ] Configurar webhook
- [ ] Receber pedido de teste

**Como testar:**
1. Ir em Settings → Integrações de Delivery → Uber Eats
2. Inserir credenciais
3. Testar conexão
4. Configurar webhook
5. Criar pedido de teste

#### 12. Deliveroo ✅
- [ ] Testar OAuth 2.0
- [ ] Configurar webhook
- [ ] Receber pedido de teste

**Como testar:**
1. Ir em Settings → Integrações de Delivery → Deliveroo
2. Inserir credenciais
3. Testar conexão
4. Configurar webhook
5. Criar pedido de teste

---

## 🚨 BLOQUEADORES POTENCIAIS

### Migrations não aplicadas
- ⚠️ Verificar se `20260116000003_customer_loyalty.sql` foi aplicada
- ⚠️ Verificar se RLS migrations foram aplicadas

**Solução:** Aplicar migrations via Supabase Dashboard ou CLI

### Credenciais de integração
- ⚠️ Glovo: Precisa Client ID e Secret reais
- ⚠️ Uber Eats: Precisa Client ID e Secret reais
- ⚠️ Deliveroo: Precisa Client ID e Secret reais

**Solução:** Obter credenciais dos respectivos painéis de desenvolvedor

### Webhooks não configurados
- ⚠️ Glovo: Configurar webhook URL no painel
- ⚠️ Uber Eats: Configurar webhook URL no painel
- ⚠️ Deliveroo: Configurar webhook URL no painel

**Solução:** Configurar URLs dos webhooks no painel de cada plataforma

---

## 📊 PRIORIZAÇÃO DE TESTES

### Crítico (Fazer primeiro)
1. ✅ RLS / Segurança
2. ✅ Offline Mode
3. ✅ CRM / Loyalty (integração automática)

### Importante (Fazer depois)
4. ✅ Analytics Real
5. ✅ Alertas Automáticos
6. ✅ Integrações Delivery (Glovo, Uber Eats, Deliveroo)

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

## 📚 DOCUMENTAÇÃO

- `VALIDACAO_PRODUCAO_PLANO.md` - Este documento
- `VALIDAR_DEPLOY.sql` - Validação RLS
- `TESTE_OFFLINE_MODE.md` - Teste Offline Mode
- `FASE1_COMPLETA_100.md` - Status FASE 1
- `FASE2_COMPLETA.md` - Status FASE 2
- `FASE3_COMPLETA.md` - Status FASE 3

---

**Última atualização:** 2026-01-16  
**Próximo passo:** Validar funcionalidades em produção
