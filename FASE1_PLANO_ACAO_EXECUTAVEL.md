# 🎯 FASE 1 - PLANO DE AÇÃO EXECUTÁVEL

**Objetivo:** Completar "NÃO QUEBRA" - Ser o POS que não falha quando tudo falha  
**Prazo:** 6 semanas  
**Status Atual:** 47% completo (Offline 90%, Glovo 30%, Fiscal 20%)

---

## 📊 STATUS DETALHADO

### ✅ 1. Offline Mode (90% completo)
**O que está feito:**
- ✅ IndexedDB implementado
- ✅ `OfflineOrderContext` funcional
- ✅ Sincronização automática com retry
- ✅ UI mostra status offline/pending/online
- ✅ Criação de pedidos offline

**O que falta:**
- ⚠️ Validação do cenário completo "desligar roteador"
- ⚠️ Testes end-to-end
- ⚠️ Documentação de uso

**Estimativa:** 2-3 dias

---

### ⚠️ 2. Integração Glovo (30% completo)
**O que está feito:**
- ✅ Estrutura de adapters (`IntegrationAdapter`)
- ✅ `OrderIngestionPipeline` implementado
- ✅ Webhook handler base (GloriaFood como exemplo)
- ✅ `delivery-integration-service.ts` (stub)

**O que falta:**
- ❌ API real do Glovo (substituir stub)
- ❌ Autenticação OAuth do Glovo
- ❌ Webhook receiver específico para Glovo
- ❌ Mapeamento de produtos Glovo → sistema
- ❌ Impressão automática na cozinha

**Estimativa:** 1-2 semanas

---

### ⚠️ 3. Fiscal Mínimo (20% completo)
**O que está feito:**
- ✅ Migration `fiscal_event_store` criada
- ✅ Estrutura de tabelas

**O que falta:**
- ❌ Geração SAF-T XML
- ❌ Emissão de fatura básica
- ❌ Impressão de comprovante fiscal
- ❌ Validação de conformidade legal

**Estimativa:** 1-2 semanas

---

## 🚀 PLANO DE EXECUÇÃO (Priorizado)

### SEMANA 1-2: Validar e Completar Offline Mode

#### Dia 1-2: Validação Offline Mode
- [ ] **Teste 1:** Desligar roteador → Criar pedidos → Verificar IndexedDB
- [ ] **Teste 2:** Fechar contas offline → Verificar persistência
- [ ] **Teste 3:** Religar roteador → Verificar sincronização automática
- [ ] **Teste 4:** Múltiplos pedidos offline → Verificar ordem de sincronização
- [ ] **Teste 5:** Falha na sincronização → Verificar retry e backoff

**Arquivos para testar:**
- `merchant-portal/src/pages/TPV/context/OfflineOrderContext.tsx`
- `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`
- `merchant-portal/src/core/queue/db.ts`

**Critério de sucesso:**
- ✅ Todos os 5 testes passam
- ✅ Sincronização automática funciona sem intervenção
- ✅ UI mostra status correto em todos os cenários

#### Dia 3: Documentação e Ajustes
- [ ] Documentar fluxo offline completo
- [ ] Criar guia de troubleshooting
- [ ] Ajustar UI se necessário
- [ ] Marcar Offline Mode como ✅ COMPLETO

---

### SEMANA 3-4: Implementar Glovo (Parte 1)

#### Dia 1-2: Pesquisa e Setup
- [ ] Obter credenciais API Glovo (dev account)
- [ ] Ler documentação oficial Glovo API
- [ ] Identificar endpoints necessários:
  - [ ] Webhook receiver
  - [ ] Autenticação OAuth
  - [ ] Listar pedidos
  - [ ] Atualizar status

#### Dia 3-5: Implementar Adapter Glovo
- [ ] Criar `GlovoAdapter.ts` (similar a `GloriaFoodAdapter.ts`)
- [ ] Implementar autenticação OAuth
- [ ] Implementar webhook receiver
- [ ] Mapear produtos Glovo → sistema interno
- [ ] Testar recebimento de pedidos

**Arquivos a criar/modificar:**
- `merchant-portal/src/integrations/adapters/glovo/GlovoAdapter.ts`
- `supabase/functions/webhook-glovo/index.ts`
- `server/operational-hub/delivery-integration-service.ts` (remover stub)

#### Dia 6-7: Integração com POS
- [ ] Integrar pedidos Glovo no fluxo normal
- [ ] Implementar impressão automática na cozinha
- [ ] Testar end-to-end: Glovo → POS → Cozinha

**Critério de sucesso:**
- ✅ Pedidos Glovo aparecem no POS automaticamente
- ✅ Impressão na cozinha funciona
- ✅ Status pode ser atualizado

---

### SEMANA 5-6: Fiscal Mínimo

#### Dia 1-3: SAF-T XML
- [ ] Pesquisar estrutura SAF-T válida (Portugal)
- [ ] Implementar geração XML
- [ ] Validar estrutura com validador oficial
- [ ] Testar geração para período de teste

**Arquivos a criar:**
- `merchant-portal/src/core/fiscal/SAFTGenerator.ts`
- `merchant-portal/src/core/fiscal/SAFTValidator.ts`

#### Dia 4-5: Emissão de Fatura
- [ ] Implementar geração de fatura básica
- [ ] Integrar com `fiscal_event_store`
- [ ] Testar emissão para diferentes tipos de venda

**Arquivos a criar:**
- `merchant-portal/src/core/fiscal/InvoiceGenerator.ts`

#### Dia 6-7: Impressão e Validação
- [ ] Implementar impressão de comprovante fiscal
- [ ] Validar conformidade legal
- [ ] Testar cenários reais
- [ ] Documentar processo

**Critério de sucesso:**
- ✅ SAF-T válido gerado
- ✅ Fatura básica emitida
- ✅ Comprovante fiscal impresso
- ✅ Conformidade legal verificada

---

## 📋 CHECKLIST GERAL FASE 1

### Offline Mode
- [ ] Teste 1: Criar pedidos offline ✅
- [ ] Teste 2: Fechar contas offline ✅
- [ ] Teste 3: Sincronização automática ✅
- [ ] Teste 4: Múltiplos pedidos ✅
- [ ] Teste 5: Retry e backoff ✅
- [ ] Documentação completa ✅

### Glovo
- [ ] Credenciais API obtidas
- [ ] Adapter implementado
- [ ] Webhook receiver funcionando
- [ ] Pedidos aparecem no POS
- [ ] Impressão automática funciona
- [ ] Testes end-to-end passando

### Fiscal
- [ ] SAF-T XML gerado e válido
- [ ] Fatura básica emitida
- [ ] Comprovante fiscal impresso
- [ ] Conformidade legal verificada
- [ ] Documentação completa

---

## 🎯 CRITÉRIO DE SUCESSO FINAL

**Cenário de Teste Completo:**
1. ✅ Desligar o roteador do restaurante
2. ✅ Criar pedidos, imprimir na cozinha, fechar contas
3. ✅ Receber pedido Glovo (se configurado)
4. ✅ Religar o roteador
5. ✅ Tudo sincroniza sem intervenção humana
6. ✅ SAF-T gerado para o período
7. ✅ Faturas emitidas corretamente

**Resultado:** "Você pode vender sem medo."

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Glovo API muda ou é complexa
**Mitigação:** Começar com webhook simples, expandir depois

### Risco 2: SAF-T requer validação oficial
**Mitigação:** Usar validador oficial desde o início

### Risco 3: Offline mode tem bugs não detectados
**Mitigação:** Testes extensivos antes de marcar completo

---

## 📊 MÉTRICAS DE PROGRESSO

- **Semana 1-2:** Offline Mode → 100% ✅
- **Semana 3-4:** Glovo → 80% ⚠️
- **Semana 5-6:** Fiscal → 80% ⚠️
- **Semana 6:** Validação final → 100% ✅

---

**Última atualização:** 2026-01-16
