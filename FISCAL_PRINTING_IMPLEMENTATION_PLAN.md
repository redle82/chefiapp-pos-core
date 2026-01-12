# 🧾 PLANO DE IMPLEMENTAÇÃO - FISCAL PRINTING REAL

**Data:** 17 Janeiro 2026  
**Status:** 🟢 **INICIANDO**

---

## 📊 ANÁLISE DO ESTADO ATUAL

### ✅ O que já existe:

1. **Estrutura Base:**
   - ✅ `FiscalService.ts` - Serviço principal
   - ✅ `FiscalPrinter.ts` - Impressão via browser
   - ✅ `SupabaseFiscalEventStore.ts` - Armazenamento de eventos
   - ✅ Tabela `fiscal_event_store` no banco

2. **Adapters:**
   - ✅ `SAFTAdapter.ts` - Portugal (funcional, gera XML)
   - ✅ `TicketBAIAdapter.ts` - Espanha (funcional)
   - ⚠️ `InvoiceXpressAdapter.ts` - **INCOMPLETO** (mock apenas)
   - ❌ `MoloniAdapter.ts` - **NÃO EXISTE**

3. **Integração:**
   - ✅ `FiscalService.selectAdapter()` - Seleciona adapter baseado em país/provider
   - ✅ `FiscalService.processPaymentConfirmed()` - Processa pagamentos
   - ✅ `FiscalPrintButton.tsx` - UI para imprimir

---

## 🎯 OBJETIVO

Completar integração fiscal real com:
1. **InvoiceXpress** (Portugal) - API real
2. **Moloni** (Portugal) - API real (opcional, se necessário)

---

## 📋 TAREFAS

### Tarefa 1: Completar InvoiceXpressAdapter (12h)

**Problemas identificados:**
- ❌ `mapToInvoiceXpress()` não recebe `TaxDocument` completo
- ❌ `sendToInvoiceXpress()` usa URL incorreta
- ❌ Não mapeia items do pedido corretamente
- ❌ Não trata erros da API

**Solução:**
1. Atualizar `FiscalObserver` interface para receber `TaxDocument`
2. Implementar mapeamento completo de `TaxDocument` → InvoiceXpress Invoice
3. Implementar chamada real à API InvoiceXpress
4. Tratar erros e retry logic

**Arquivos:**
- `fiscal-modules/adapters/InvoiceXpressAdapter.ts` (MODIFICAR)
- `fiscal-modules/FiscalObserver.ts` (VERIFICAR interface)

---

### Tarefa 2: Criar MoloniAdapter (12h)

**Se necessário:**
- Criar `fiscal-modules/adapters/MoloniAdapter.ts`
- Implementar chamadas à API Moloni
- Mapear `TaxDocument` → Moloni Invoice

**Arquivos:**
- `fiscal-modules/adapters/MoloniAdapter.ts` (NOVO)

---

### Tarefa 3: Atualizar FiscalService (2h)

**Ajustes:**
- Garantir que `TaxDocument` é passado para adapters
- Melhorar seleção de adapter baseado em configuração
- Adicionar logs mais detalhados

**Arquivos:**
- `merchant-portal/src/core/fiscal/FiscalService.ts` (MODIFICAR)

---

### Tarefa 4: Testes e Validação (4h)

**Testes:**
- Testar InvoiceXpress com credenciais reais (sandbox)
- Validar geração de PDF
- Validar armazenamento em `fiscal_event_store`
- Testar impressão via browser

---

## 📚 REFERÊNCIAS

### InvoiceXpress API:
- Base URL: `https://{account}.app.invoicexpress.com`
- Endpoint: `/invoices.json`
- Auth: `?api_key={api_key}`
- Docs: https://www.invoicexpress.com/api

### Moloni API:
- Base URL: `https://api.moloni.com`
- Auth: OAuth 2.0
- Docs: https://www.moloni.pt/api/

---

## ⏱️ TIMELINE

- **Dia 1 (8h):** Completar InvoiceXpressAdapter
- **Dia 2 (8h):** Criar MoloniAdapter (se necessário)
- **Dia 3 (8h):** Testes e validação

**Total:** 24h (3 dias)

---

**Próxima ação:** Completar InvoiceXpressAdapter
