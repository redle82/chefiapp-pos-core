# 🎯 PLANO DE AÇÃO PRIORITÁRIO - ChefIApp POS Core
**Data:** 12 Janeiro 2026  
**Objetivo:** MVP Vendável em 3-6 semanas  
**Status:** Fase de Hardening P0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚨 FASE 1: HARDENING CRÍTICO (Semana 1)
**Prazo:** 7 dias  
**Objetivo:** Eliminar bugs críticos que impedem produção

### ✅ Tarefa 1.1: Aplicar Migrations P0
**Prioridade:** 🔴 P0  
**Esforço:** 2 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Revisar `GUIA_APLICACAO_MIGRATIONS_P0.md`
2. Fazer backup do banco de dados
3. Aplicar migrations via Dashboard ou CLI:
   - `20260118000001_add_sync_metadata_to_orders.sql`
   - `20260118000002_update_create_order_atomic_with_sync_metadata.sql`
   - `20260118000003_add_version_to_orders.sql`
   - `20260118000004_add_check_open_orders_rpc.sql`
   - `20260118000005_add_fiscal_retry_count.sql`
4. Validar aplicação com scripts do guia

**Resultado Esperado:**
- ✅ Idempotência offline funcional
- ✅ Lock otimista robusto
- ✅ Fechamento de caixa seguro

---

### ✅ Tarefa 1.2: Validar Fiscal com Credenciais Reais
**Prioridade:** 🔴 P0  
**Esforço:** 4 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Obter credenciais InvoiceXpress de teste
2. Configurar no sistema
3. Criar pedido de teste
4. Processar pagamento
5. Verificar se fatura foi emitida corretamente
6. Validar protocolo governamental retornado
7. Testar cenário de erro (credenciais inválidas)

**Resultado Esperado:**
- ✅ Fiscal funciona com credenciais reais
- ✅ Erros são tratados corretamente (não retorna sucesso fake)
- ✅ Faturas são emitidas e armazenadas

---

### ✅ Tarefa 1.3: Testar Race Conditions com Múltiplos Tablets
**Prioridade:** 🔴 P0  
**Esforço:** 6 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Configurar 3-5 tablets/dispositivos
2. Simular horário de pico:
   - Múltiplos garçons criando pedidos simultaneamente
   - Múltiplos garçons modificando o mesmo pedido
   - Múltiplos garçons processando pagamentos
3. Verificar:
   - Versioning funciona corretamente
   - Erros de concorrência são tratados
   - Dados não são corrompidos
4. Documentar resultados

**Resultado Esperado:**
- ✅ Race conditions eliminadas
- ✅ Versioning funciona corretamente
- ✅ Sistema estável sob carga concorrente

---

### ✅ Tarefa 1.4: Testar Idempotência Offline Real
**Prioridade:** 🔴 P0  
**Esforço:** 4 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Desconectar dispositivo da internet
2. Criar pedido offline (deve gerar localId)
3. Reconectar
4. Sincronizar
5. Verificar se pedido foi criado no banco
6. Desconectar novamente
7. Tentar criar mesmo pedido (mesmos itens, mesma mesa)
8. Reconectar e sincronizar
9. Verificar que pedido NÃO foi duplicado

**Resultado Esperado:**
- ✅ Idempotência offline funciona
- ✅ Pedidos não são duplicados
- ✅ sync_metadata é usado corretamente

---

### ✅ Tarefa 1.5: Corrigir Testes WebOrderingService
**Prioridade:** 🟡 P1  
**Esforço:** 2 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Analisar erros dos 3 testes falhando
2. Ajustar mocks do Supabase
3. Simplificar testes se necessário
4. Validar que todos passam

**Resultado Esperado:**
- ✅ Todos os testes passando
- ✅ Cobertura mantida

---

## 🎯 FASE 2: FEATURES ESSENCIAIS (Semana 2-3)
**Prazo:** 14 dias  
**Objetivo:** Adicionar features mínimas para MVP vendável

### ✅ Tarefa 2.1: Split Bill UI
**Prioridade:** 🟠 P1  
**Esforço:** 16 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Criar componente `SplitBillModal`
2. Permitir dividir conta por:
   - Número de pessoas
   - Itens específicos
   - Grupos de consumo
3. Processar múltiplos pagamentos
4. Testar cenários edge cases

**Resultado Esperado:**
- ✅ UI para dividir conta
- ✅ Funcionalidade completa
- ✅ Testes básicos

---

### ✅ Tarefa 2.2: Reports Básicos
**Prioridade:** 🟠 P1  
**Esforço:** 12 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Criar página de Reports
2. Implementar:
   - Vendas do dia (total, por período)
   - Pedidos do dia (quantidade, status)
   - Métodos de pagamento
3. Adicionar filtros básicos (data, período)
4. Exportar para CSV

**Resultado Esperado:**
- ✅ Dashboard de vendas funcional
- ✅ Relatórios básicos disponíveis
- ✅ Exportação CSV

---

### ✅ Tarefa 2.3: Onboarding Simplificado
**Prioridade:** 🟠 P1  
**Esforço:** 20 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Analisar fluxo atual (7 telas)
2. Identificar telas essenciais vs opcionais
3. Reduzir para 3-4 telas essenciais:
   - Configuração básica (nome, endereço)
   - Menu (pode ser depois)
   - Fiscal (pode ser depois)
   - Finalização
4. Mover telas opcionais para "Configurações"
5. Testar conversão

**Resultado Esperado:**
- ✅ Onboarding reduzido para 3-4 telas
- ✅ Conversão melhorada
- ✅ Configurações avançadas disponíveis depois

---

## 🚀 FASE 3: MVP VENDÁVEL (Semana 4-6)
**Prazo:** 21 dias  
**Objetivo:** Sistema pronto para beta controlado

### ✅ Tarefa 3.1: Delivery Webhooks (não Polling)
**Prioridade:** 🟡 P2  
**Esforço:** 24 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Implementar webhook endpoint para Glovo
2. Substituir polling por webhooks
3. Testar recebimento de pedidos
4. Validar idempotência

**Resultado Esperado:**
- ✅ Delivery via webhooks
- ✅ Resposta em tempo real
- ✅ Polling removido

---

### ✅ Tarefa 3.2: Loyalty Funcional
**Prioridade:** 🟡 P2  
**Esforço:** 16 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Implementar sistema de pontos básico
2. Acumular pontos por compra
3. Resgatar pontos por desconto
4. UI para visualizar pontos

**Resultado Esperado:**
- ✅ Sistema de pontos funcional
- ✅ Acumulação e resgate
- ✅ UI básica

---

### ✅ Tarefa 3.3: Testes E2E Básicos
**Prioridade:** 🟡 P2  
**Esforço:** 20 horas  
**Status:** ⚠️ Pendente

**Ações:**
1. Configurar Playwright ou Cypress
2. Criar testes E2E para:
   - Fluxo completo de pedido
   - Processamento de pagamento
   - Sincronização offline
3. Integrar no CI/CD

**Resultado Esperado:**
- ✅ Testes E2E básicos
- ✅ CI/CD configurado
- ✅ Validação automática

---

## 📊 MÉTRICAS DE SUCESSO

### Fase 1 (Hardening):
- ✅ 0 bugs críticos conhecidos
- ✅ Migrations aplicadas
- ✅ Fiscal validado
- ✅ Race conditions testadas

### Fase 2 (Features):
- ✅ Split bill funcional
- ✅ Reports básicos disponíveis
- ✅ Onboarding < 5 minutos

### Fase 3 (MVP):
- ✅ Beta testers podem usar
- ✅ Delivery funcional
- ✅ Loyalty básico
- ✅ Testes E2E passando

---

## 🎯 PRIORIZAÇÃO

### Esta Semana (Crítico):
1. 🔴 Aplicar migrations P0
2. 🔴 Validar fiscal real
3. 🔴 Testar race conditions
4. 🔴 Testar idempotência offline

### Próxima Semana (Importante):
1. 🟠 Split bill UI
2. 🟠 Reports básicos
3. 🟠 Onboarding simplificado

### Próximas 2-4 Semanas (MVP):
1. 🟡 Delivery webhooks
2. 🟡 Loyalty funcional
3. 🟡 Testes E2E

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Migrations quebram produção
**Mitigação:** 
- Testar em staging primeiro
- Fazer backup antes
- Ter rollback pronto

### Risco 2: Fiscal não funciona em produção
**Mitigação:**
- Testar com credenciais reais
- Validar todos os cenários
- Ter fallback manual

### Risco 3: Race conditions não detectadas
**Mitigação:**
- Testar com múltiplos tablets
- Simular carga real
- Monitorar logs

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes de Considerar MVP Vendável:

**Hardening:**
- [ ] Migrations P0 aplicadas
- [ ] Fiscal validado com credenciais reais
- [ ] Race conditions testadas
- [ ] Idempotência offline testada
- [ ] 0 bugs críticos conhecidos

**Features:**
- [ ] Split bill funcional
- [ ] Reports básicos disponíveis
- [ ] Onboarding simplificado
- [ ] Delivery funcional (webhooks)
- [ ] Loyalty básico

**Qualidade:**
- [ ] Testes E2E básicos passando
- [ ] Cobertura de testes > 60%
- [ ] Documentação atualizada
- [ ] Performance aceitável

---

## 📅 CRONOGRAMA SUGERIDO

| Semana | Foco | Entregas |
|--------|------|----------|
| **1** | Hardening P0 | Migrations, Fiscal, Race Conditions |
| **2** | Features Essenciais | Split Bill, Reports |
| **3** | Features Essenciais | Onboarding Simplificado |
| **4** | MVP | Delivery Webhooks |
| **5** | MVP | Loyalty, Testes E2E |
| **6** | Validação | Beta Testing, Ajustes |

---

**Status:** Plano criado, aguardando execução  
**Próximo Passo:** Iniciar Fase 1 - Hardening Crítico
