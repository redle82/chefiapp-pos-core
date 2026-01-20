# 🧾 GUIA DE CONFIGURAÇÃO - FISCAL PRINTING

**Data:** 12 Janeiro 2026  
**Versão:** 1.0

---

## 📋 VISÃO GERAL

O sistema de Fiscal Printing suporta:
- ✅ **InvoiceXpress** (Portugal) - Integração real com API
- ✅ **SAF-T XML** (Portugal) - Geração de XML conforme especificação
- ✅ **TicketBAI** (Espanha) - Geração de XML básico
- ✅ **Impressão Browser** - Fallback universal

---

## 🔧 CONFIGURAÇÃO INVOICEXPRESS

### **1. Obter Credenciais**

1. Acessar: https://www.invoicexpress.com
2. Criar conta (ou usar conta existente)
3. Ir para **Settings** → **API**
4. Obter:
   - **API Key**
   - **Account Name** (nome da conta)

### **2. Configurar no Sistema**

**Opção A: Via Código (Desenvolvimento)**
```typescript
import { InvoiceXpressAdapter } from '@/fiscal-modules/adapters/InvoiceXpressAdapter';

const adapter = new InvoiceXpressAdapter({
  apiKey: 'sua-api-key',
  accountName: 'nome-da-conta'
});
```

**Opção B: Via Settings UI (Produção)**
- Ir para **Settings** → **Fiscal**
- Preencher:
  - **API Key**
  - **Account Name**
- Clicar em **"Salvar"**

### **3. Testar Configuração**

1. Criar pedido de teste no TPV
2. Processar pagamento
3. Clicar em **"Imprimir Fiscal"**
4. Verificar que invoice aparece na InvoiceXpress
5. Verificar que PDF é gerado

---

## 🔧 CONFIGURAÇÃO SAF-T (PORTUGAL)

### **1. Configuração Automática**

O sistema detecta automaticamente o país do restaurante e usa SAF-T para Portugal.

**Não requer configuração manual!**

### **2. Validar XML Gerado**

1. Processar pagamento
2. Verificar em `fiscal_event_store`:
   ```sql
   SELECT payload_sent 
   FROM fiscal_event_store 
   WHERE doc_type = 'SAF-T'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
3. Validar estrutura XML

---

## 🔧 CONFIGURAÇÃO TICKETBAI (ESPANHA)

### **1. Configuração Automática**

O sistema detecta automaticamente o país do restaurante e usa TicketBAI para Espanha.

**Não requer configuração manual!**

### **2. Validar XML Gerado**

1. Processar pagamento
2. Verificar em `fiscal_event_store`:
   ```sql
   SELECT payload_sent 
   FROM fiscal_event_store 
   WHERE doc_type = 'TICKETBAI'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
3. Validar estrutura XML

---

## 🖨️ CONFIGURAÇÃO DE IMPRESSÃO

### **1. Impressão Browser (Padrão)**

**Funciona automaticamente!**

- Clicar em **"Imprimir Fiscal"** após pagamento
- Preview de impressão aparece
- Clicar em **"Imprimir"** no navegador
- Selecionar impressora

### **2. Template de Recibo**

O recibo fiscal é formatado para **80mm** (impressoras térmicas comuns).

**Campos incluídos:**
- Nome do restaurante
- Endereço
- NIF
- Data e hora
- Itens do pedido
- Subtotal, IVA, Total
- Protocolo fiscal
- QR Code (se disponível)

---

## 🧪 TESTES

### **Teste 1: InvoiceXpress (Sandbox)**

1. Obter credenciais sandbox
2. Configurar no sistema
3. Criar pedido de teste
4. Processar pagamento
5. Verificar que invoice é criado
6. Verificar que PDF é gerado

**Resultado esperado:** ✅ Invoice criado e PDF disponível

---

### **Teste 2: SAF-T XML**

1. Criar pedido com múltiplos itens
2. Processar pagamento
3. Verificar XML gerado
4. Validar estrutura (XSD se disponível)

**Resultado esperado:** ✅ XML válido conforme especificação

---

### **Teste 3: Impressão Browser**

1. Processar pagamento
2. Clicar em "Imprimir Fiscal"
3. Verificar preview
4. Testar impressão real

**Resultado esperado:** ✅ Recibo impresso corretamente

---

## 🐛 TROUBLESHOOTING

### **Problema: InvoiceXpress não cria invoice**

**Possíveis causas:**
- Credenciais incorretas
- API Key expirada
- Conta InvoiceXpress inativa

**Solução:**
1. Verificar credenciais em Settings
2. Testar credenciais no InvoiceXpress Dashboard
3. Verificar logs do sistema

---

### **Problema: PDF não é gerado**

**Possíveis causas:**
- InvoiceXpress não retornou PDF URL
- Erro na geração do PDF

**Solução:**
1. Verificar invoice na InvoiceXpress
2. Verificar logs do sistema
3. Tentar gerar PDF manualmente na InvoiceXpress

---

### **Problema: XML SAF-T inválido**

**Possíveis causas:**
- Estrutura XML incorreta
- Campos obrigatórios faltando

**Solução:**
1. Verificar XML gerado em `fiscal_event_store`
2. Comparar com especificação SAF-T
3. Verificar logs do sistema

---

## 📚 REFERÊNCIAS

- **InvoiceXpress API:** https://www.invoicexpress.com/api
- **SAF-T Portugal:** https://www.portaldasfinancas.gov.pt/
- **TicketBAI Espanha:** https://www.ticketbai.es/

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] Credenciais InvoiceXpress obtidas
- [ ] Credenciais configuradas no sistema
- [ ] Teste de criação de invoice realizado
- [ ] PDF gerado e validado
- [ ] XML SAF-T validado (se Portugal)
- [ ] Impressão browser testada
- [ ] Documentação lida

---

**Última atualização:** 12 Janeiro 2026
