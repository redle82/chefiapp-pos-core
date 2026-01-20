# 🎯 PLANO DE VALIDAÇÃO - FISCAL + GLOVO

**Data:** 12 Janeiro 2026  
**Status:** 🟢 **PRONTO PARA VALIDAÇÃO**

---

## 📊 STATUS ATUAL

### ✅ **FISCAL PRINTING**
- **Status:** 100% implementado
- **Componentes:**
  - ✅ InvoiceXpressAdapter (100%)
  - ✅ SAFTAdapter (100%)
  - ✅ FiscalService (100%)
  - ✅ FiscalPrinter (100%)
  - ✅ UI Integration (100%)
- **Falta:** Testes e validação com credenciais reais

### ✅ **GLOVO INTEGRATION**
- **Status:** 100% implementado
- **Componentes:**
  - ✅ GlovoAdapter (100%)
  - ✅ GlovoOAuth (100%)
  - ✅ Webhook Receiver (100%)
  - ✅ UI Configuration (100%)
- **Falta:** Testes end-to-end e validação

---

## 🧪 PLANO DE VALIDAÇÃO

### **FASE 1: Fiscal Printing (4-6 horas)**

#### **1.1 Validar InvoiceXpressAdapter (2h)**
**Objetivo:** Garantir que adapter funciona com API real

**Tarefas:**
- [ ] Obter credenciais sandbox InvoiceXpress
- [ ] Configurar credenciais no sistema
- [ ] Criar pedido de teste
- [ ] Processar pagamento
- [ ] Verificar que invoice é criado na InvoiceXpress
- [ ] Validar PDF gerado
- [ ] Verificar armazenamento em `fiscal_event_store`

**Arquivos a verificar:**
- `fiscal-modules/adapters/InvoiceXpressAdapter.ts`
- `merchant-portal/src/core/fiscal/FiscalService.ts`
- `merchant-portal/src/pages/TPV/components/FiscalPrintButton.tsx`

**Teste manual:**
1. Abrir TPV
2. Criar pedido
3. Processar pagamento
4. Clicar em "Imprimir Fiscal"
5. Verificar que invoice aparece na InvoiceXpress
6. Verificar que PDF é gerado

---

#### **1.2 Validar SAF-T XML (1h)**
**Objetivo:** Garantir que XML gerado está correto

**Tarefas:**
- [ ] Criar pedido de teste
- [ ] Processar pagamento
- [ ] Verificar que XML SAF-T é gerado
- [ ] Validar estrutura XML (XSD se disponível)
- [ ] Verificar campos obrigatórios
- [ ] Validar cálculo de IVA

**Arquivos a verificar:**
- `fiscal-modules/adapters/SAFTAdapter.ts`

**Teste manual:**
1. Criar pedido com múltiplos itens
2. Processar pagamento
3. Verificar XML gerado em `fiscal_event_store`
4. Validar estrutura

---

#### **1.3 Validar Impressão Browser (1h)**
**Objetivo:** Garantir que impressão funciona

**Tarefas:**
- [ ] Testar impressão via browser
- [ ] Verificar template de recibo
- [ ] Validar formatação (80mm)
- [ ] Testar em diferentes navegadores

**Arquivos a verificar:**
- `merchant-portal/src/core/fiscal/FiscalPrinter.ts`

**Teste manual:**
1. Processar pagamento
2. Clicar em "Imprimir Fiscal"
3. Verificar preview de impressão
4. Testar impressão real

---

#### **1.4 Documentação (1h)**
**Objetivo:** Documentar como configurar

**Tarefas:**
- [ ] Criar guia de configuração InvoiceXpress
- [ ] Documentar como obter credenciais
- [ ] Criar troubleshooting guide
- [ ] Documentar limitações conhecidas

**Arquivo a criar:**
- `FISCAL_CONFIGURACAO_GUIA.md`

---

### **FASE 2: Glovo Integration (4-6 horas)**

#### **2.1 Validar OAuth Flow (1h)**
**Objetivo:** Garantir que autenticação funciona

**Tarefas:**
- [ ] Obter credenciais Glovo (dev account)
- [ ] Configurar no Settings
- [ ] Testar "Testar Conexão"
- [ ] Verificar que token é obtido
- [ ] Validar refresh token automático

**Arquivos a verificar:**
- `merchant-portal/src/integrations/adapters/glovo/GlovoOAuth.ts`
- `merchant-portal/src/pages/Settings/components/GlovoIntegrationWidget.tsx`

**Teste manual:**
1. Ir para Settings → Integrações
2. Preencher Client ID e Secret
3. Clicar em "Testar Conexão"
4. Verificar que status muda para "Conectado"

---

#### **2.2 Validar Webhook Receiver (2h)**
**Objetivo:** Garantir que webhooks são recebidos

**Tarefas:**
- [ ] Deploy webhook function (se necessário)
- [ ] Configurar webhook URL no Glovo
- [ ] Enviar webhook de teste
- [ ] Verificar que pedido aparece em `integration_orders`
- [ ] Validar transformação de dados
- [ ] Verificar que pedido aparece no TPV

**Arquivos a verificar:**
- `supabase/functions/webhook-glovo/index.ts`
- `merchant-portal/src/integrations/adapters/glovo/GlovoAdapter.ts`

**Teste manual:**
1. Configurar webhook no Glovo Developer Portal
2. Criar pedido de teste no Glovo
3. Verificar que webhook é recebido
4. Verificar que pedido aparece no TPV

---

#### **2.3 Validar Polling (1h)**
**Objetivo:** Garantir que polling funciona como fallback

**Tarefas:**
- [ ] Desabilitar webhook (simular falha)
- [ ] Verificar que polling inicia automaticamente
- [ ] Validar que pedidos são detectados via polling
- [ ] Verificar intervalo de polling (10s)

**Arquivos a verificar:**
- `merchant-portal/src/integrations/adapters/glovo/GlovoAdapter.ts`

**Teste manual:**
1. Desabilitar webhook no Glovo
2. Criar pedido de teste
3. Aguardar polling (10s)
4. Verificar que pedido aparece no TPV

---

#### **2.4 Validar Transformação de Dados (1h)**
**Objetivo:** Garantir que dados são transformados corretamente

**Tarefas:**
- [ ] Criar pedido Glovo com múltiplos itens
- [ ] Verificar que itens são mapeados corretamente
- [ ] Validar preços (conversão para centavos)
- [ ] Verificar metadata preservada
- [ ] Testar pedidos com observações especiais

**Arquivos a verificar:**
- `merchant-portal/src/integrations/adapters/glovo/GlovoAdapter.ts`

**Teste manual:**
1. Criar pedido Glovo complexo
2. Verificar que todos os itens aparecem
3. Validar preços e totais
4. Verificar observações

---

#### **2.5 Documentação (1h)**
**Objetivo:** Documentar como configurar

**Tarefas:**
- [ ] Criar guia de configuração Glovo
- [ ] Documentar como obter credenciais
- [ ] Documentar webhook setup
- [ ] Criar troubleshooting guide

**Arquivo a criar:**
- `GLOVO_CONFIGURACAO_GUIA.md`

---

## 📋 CHECKLIST COMPLETO

### **Fiscal Printing:**
- [ ] InvoiceXpressAdapter testado com credenciais reais
- [ ] PDF gerado corretamente
- [ ] SAF-T XML validado
- [ ] Impressão browser funcionando
- [ ] Documentação criada

### **Glovo Integration:**
- [ ] OAuth flow testado
- [ ] Webhook receiver funcionando
- [ ] Polling funcionando como fallback
- [ ] Transformação de dados validada
- [ ] Documentação criada

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **Hoje (2-3 horas):**
1. ✅ Criar este plano de validação
2. ⏳ Validar estrutura de código (sem credenciais)
3. ⏳ Criar testes unitários básicos

### **Esta Semana (4-6 horas):**
1. Obter credenciais de teste (InvoiceXpress sandbox, Glovo dev)
2. Executar testes manuais completos
3. Corrigir bugs encontrados
4. Criar documentação

### **Próxima Semana (Opcional):**
1. Criar testes E2E automatizados
2. Melhorar error handling
3. Adicionar métricas/monitoring

---

## 🐛 BUGS CONHECIDOS

### **Fiscal:**
- Nenhum bug conhecido (precisa validação)

### **Glovo:**
- Nenhum bug conhecido (precisa validação)

---

## 📊 MÉTRICAS DE SUCESSO

### **Fiscal:**
- ✅ Invoice criado na InvoiceXpress
- ✅ PDF gerado e acessível
- ✅ Evento salvo em `fiscal_event_store`
- ✅ Impressão funciona no browser

### **Glovo:**
- ✅ OAuth funciona
- ✅ Webhook recebe pedidos
- ✅ Polling funciona como fallback
- ✅ Pedidos aparecem no TPV
- ✅ Dados transformados corretamente

---

## 🎉 CONCLUSÃO

**Ambos Fiscal e Glovo estão 100% implementados!**

**Falta apenas:**
- ⏳ Validação com credenciais reais
- ⏳ Testes manuais completos
- ⏳ Documentação de configuração

**Recomendação:** Executar validação esta semana para garantir que tudo funciona em produção.
