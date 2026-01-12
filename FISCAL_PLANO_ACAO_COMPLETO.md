# 🧾 FISCAL - PLANO DE AÇÃO COMPLETO

**Data:** 18 Janeiro 2026  
**Status Atual:** 40% → **Meta: 80%**  
**Prioridade:** 🔴 **CRÍTICA** (conformidade legal)

---

## 📊 ESTADO ATUAL

### ✅ O que já funciona:
1. **Estrutura Base:**
   - ✅ `FiscalService.ts` - Serviço principal
   - ✅ `fiscal_event_store` - Tabela no banco
   - ✅ `SupabaseFiscalEventStore.ts` - Persistência
   - ✅ `FiscalPrintButton.tsx` - UI básica

2. **Adapters:**
   - ✅ `InvoiceXpressAdapter.ts` - **CORRIGIDO HOJE** (P0-1, P0-4)
   - ✅ `SAFTAdapter.ts` - Gera XML (Portugal)
   - ✅ `TicketBAIAdapter.ts` - Gera XML (Espanha)
   - ✅ `ConsoleFiscalAdapter.ts` - Mock/Fallback

3. **Segurança:**
   - ✅ **P0-1 corrigido:** API key nunca exposta (backend proxy)
   - ✅ **P0-4 corrigido:** Retry em background (Edge Function)

4. **Backend:**
   - ✅ Proxy `/api/fiscal/invoicexpress/invoices`
   - ✅ Busca credenciais do banco
   - ✅ Edge Function `retry-pending-fiscal`

---

## ❌ O QUE FALTA (40% → 80%)

### 1. UI de Configuração Fiscal (CRÍTICO) 🔴
**Status:** 0%  
**Tempo:** 4h

**O que fazer:**
- [ ] Criar `FiscalSettings.tsx` component
- [ ] Integrar em `Settings.tsx`
- [ ] Formulário para InvoiceXpress (API Key + Account Name)
- [ ] Validação de credenciais (teste de conexão)
- [ ] Salvar em `gm_restaurants.fiscal_config`
- [ ] Criptografar API key no backend

**Arquivos:**
- `merchant-portal/src/pages/Settings/components/FiscalSettings.tsx` (NOVO)
- `merchant-portal/src/pages/Settings/Settings.tsx` (MODIFICAR)

---

### 2. Integração FiscalService com InvoiceXpress (CRÍTICO) 🔴
**Status:** 50%  
**Tempo:** 3h

**O que fazer:**
- [ ] FiscalService buscar credenciais do banco
- [ ] Usar InvoiceXpressAdapter quando configurado
- [ ] Fallback para SAF-T/TicketBAI quando não configurado
- [ ] Logs detalhados

**Arquivos:**
- `merchant-portal/src/core/fiscal/FiscalService.ts` (MODIFICAR)

---

### 3. Testes Reais com InvoiceXpress (CRÍTICO) 🔴
**Status:** 0%  
**Tempo:** 4h

**O que fazer:**
- [ ] Obter credenciais sandbox InvoiceXpress
- [ ] Testar criação de invoice
- [ ] Validar PDF gerado
- [ ] Testar retry em background
- [ ] Validar armazenamento em `fiscal_event_store`

**Arquivos:**
- `tests/integration/fiscal-invoicexpress.test.ts` (NOVO)

---

### 4. Impressão Fiscal Melhorada (IMPORTANTE) 🟡
**Status:** 30%  
**Tempo:** 6h

**O que fazer:**
- [ ] Melhorar template de recibo (80mm)
- [ ] Suporte para impressora térmica
- [ ] Preview antes de imprimir
- [ ] Download PDF
- [ ] QR Code no recibo

**Arquivos:**
- `merchant-portal/src/core/fiscal/FiscalPrinter.ts` (MELHORAR)
- `merchant-portal/src/pages/TPV/components/FiscalPrintButton.tsx` (MELHORAR)

---

### 5. Validação de Conformidade Legal (IMPORTANTE) 🟡
**Status:** 0%  
**Tempo:** 8h

**O que fazer:**
- [ ] Validar XML SAF-T (Portugal)
- [ ] Validar XML TicketBAI (Espanha)
- [ ] Verificar campos obrigatórios
- [ ] Validar cálculos de IVA
- [ ] Documentação de conformidade

**Arquivos:**
- `tests/validation/fiscal-saft-validation.test.ts` (NOVO)
- `tests/validation/fiscal-ticketbai-validation.test.ts` (NOVO)

---

### 6. Backup e Recuperação (IMPORTANTE) 🟡
**Status:** 0%  
**Tempo:** 4h

**O que fazer:**
- [ ] Exportar faturas (CSV/JSON)
- [ ] Backup automático de `fiscal_event_store`
- [ ] Recuperação de faturas perdidas
- [ ] UI para visualizar histórico fiscal

**Arquivos:**
- `merchant-portal/src/pages/Finance/FiscalExport.tsx` (MELHORAR)
- `server/fiscal-backup-service.ts` (NOVO)

---

## 🎯 PRIORIZAÇÃO

### Fase 1: Configuração e Integração (1 semana)
**Objetivo:** Sistema funcional com InvoiceXpress

1. ✅ UI de Configuração Fiscal (4h)
2. ✅ Integração FiscalService (3h)
3. ✅ Testes Reais (4h)

**Resultado:** 60% completo

---

### Fase 2: Polimento e Validação (1 semana)
**Objetivo:** Sistema confiável e validado

4. ✅ Impressão Fiscal Melhorada (6h)
5. ✅ Validação de Conformidade (8h)

**Resultado:** 75% completo

---

### Fase 3: Backup e Recuperação (3 dias)
**Objetivo:** Sistema robusto

6. ✅ Backup e Recuperação (4h)

**Resultado:** 80% completo

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Semana 1: Configuração e Integração
- [ ] Criar `FiscalSettings.tsx`
- [ ] Integrar em Settings
- [ ] Backend endpoint para salvar credenciais
- [ ] Criptografar API key
- [ ] FiscalService usar InvoiceXpress quando configurado
- [ ] Testar com credenciais sandbox
- [ ] Validar criação de invoice
- [ ] Validar PDF gerado

### Semana 2: Polimento e Validação
- [ ] Melhorar template de recibo
- [ ] Suporte impressora térmica
- [ ] Preview de impressão
- [ ] Validar XML SAF-T
- [ ] Validar XML TicketBAI
- [ ] Documentação de conformidade

### Semana 3: Backup
- [ ] Exportar faturas
- [ ] Backup automático
- [ ] UI histórico fiscal
- [ ] Recuperação de faturas

---

## 🚀 COMEÇAR AGORA

**Próxima ação:** Criar UI de Configuração Fiscal

**Arquivos a criar/modificar:**
1. `merchant-portal/src/pages/Settings/components/FiscalSettings.tsx`
2. `merchant-portal/src/pages/Settings/Settings.tsx`
3. `server/web-module-api-server.ts` (endpoint para salvar)

---

**Status:** 🟢 **PRONTO PARA IMPLEMENTAR**
