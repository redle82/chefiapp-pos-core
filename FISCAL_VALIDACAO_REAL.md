# 🧾 FISCAL - VALIDAÇÃO COM CREDENCIAIS REAIS

**Data:** 18 Janeiro 2026  
**Status:** 🟡 **AGUARDANDO CREDENCIAIS SANDBOX**  
**Tempo Estimado:** 1-2 horas

---

## 📋 OBJETIVO

Validar integração completa com InvoiceXpress usando credenciais reais (sandbox).

---

## 🔑 PASSO 1: OBTER CREDENCIAIS SANDBOX

### InvoiceXpress Sandbox

1. **Acessar:** https://www.invoicexpress.com
2. **Criar conta sandbox** (ou usar conta de teste existente)
3. **Ir para:** Settings → API
4. **Obter:**
   - **API Key** (ex: `abc123def456...`)
   - **Account Name** (ex: `minha-empresa`)

### Alternativa: Conta de Teste

Se já tiver conta InvoiceXpress:
- Usar credenciais de ambiente de teste
- Ou criar subconta para testes

---

## 🔧 PASSO 2: CONFIGURAR NO SISTEMA

### Via UI (Recomendado)

1. Acessar: **Settings** → **Fiscal & Legal**
2. Preencher:
   - **InvoiceXpress Account Name:** `minha-empresa`
   - **InvoiceXpress API Key:** `abc123def456...`
3. Clicar em **"Testar Conexão"**
4. Verificar que aparece: **"Conexão bem-sucedida!"**
5. Clicar em **"Salvar Configuração Fiscal"**

### Via Código (Desenvolvimento)

```typescript
// Configurar diretamente no banco (apenas para testes)
const { data, error } = await supabase
  .from('gm_restaurants')
  .update({
    fiscal_provider: 'invoice_xpress',
    fiscal_config: {
      invoicexpress: {
        accountName: 'minha-empresa',
        apiKey: 'abc123def456...', // Será criptografado automaticamente
      },
    },
  })
  .eq('id', restaurantId);
```

---

## 🧪 PASSO 3: TESTAR INTEGRAÇÃO

### Teste 1: Teste de Conexão

1. Ir para **Settings** → **Fiscal & Legal**
2. Clicar em **"Testar Conexão"**
3. **Esperado:** "Conexão bem-sucedida! Status: OK"

### Teste 2: Criar Invoice Real

1. Criar pedido de teste no TPV
2. Adicionar itens (ex: 2x Bacalhau à Brás, 12.75€ cada)
3. Processar pagamento (cash)
4. **Verificar:**
   - Documento fiscal gerado
   - Status: REPORTED
   - Protocolo fiscal presente
   - PDF URL disponível

### Teste 3: Verificar InvoiceXpress

1. Acessar: https://minha-empresa.app.invoicexpress.com
2. Ir para **Invoices**
3. **Verificar:**
   - Invoice criado com dados corretos
   - PDF disponível para download
   - QR Code presente

### Teste 4: Impressão Fiscal

1. Após pagamento, clicar em **"🖨️ Imprimir Recibo Fiscal"**
2. **Verificar:**
   - Preview aparece
   - QR Code visível no recibo
   - PDF disponível para download
   - Impressão funciona

### Teste 5: Retry em Background

1. Simular falha de rede (desconectar internet)
2. Processar pagamento
3. **Verificar:**
   - Status: PENDING
   - Reconectar internet
   - Edge Function retenta automaticamente
   - Status muda para: REPORTED

---

## 📊 PASSO 4: VALIDAR DADOS

### Verificar fiscal_event_store

```sql
SELECT 
    fiscal_event_id,
    order_id,
    doc_type,
    fiscal_status,
    gov_protocol,
    payload_sent->'invoice'->>'id' as invoice_id,
    response_received->'invoice'->'pdf'->>'url' as pdf_url,
    created_at
FROM fiscal_event_store
WHERE restaurant_id = 'SEU_RESTAURANT_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar InvoiceXpress

1. Acessar dashboard InvoiceXpress
2. Verificar que invoices aparecem
3. Validar:
   - Dados do restaurante corretos
   - Itens corretos
   - IVA calculado corretamente (23%)
   - PDF gerado

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Configuração
- [ ] Credenciais sandbox obtidas
- [ ] Configuradas no sistema (UI ou código)
- [ ] Teste de conexão passa

### Integração
- [ ] Invoice criado no InvoiceXpress
- [ ] PDF gerado e acessível
- [ ] QR Code presente
- [ ] Dados corretos (itens, valores, IVA)

### Impressão
- [ ] Preview funciona
- [ ] QR Code aparece no recibo
- [ ] PDF pode ser baixado
- [ ] Impressão funciona

### Retry
- [ ] Faturas PENDING são retentadas
- [ ] Edge Function funciona
- [ ] Status atualiza corretamente

### Backup
- [ ] Export CSV funciona
- [ ] Export JSON funciona
- [ ] Backup automático funciona
- [ ] Estatísticas corretas

---

## 🐛 PROBLEMAS COMUNS

### Erro: "Connection failed"

**Causas:**
- API Key incorreta
- Account Name incorreto
- Internet desconectada

**Solução:**
1. Verificar credenciais
2. Testar conexão novamente
3. Verificar logs do backend

### Erro: "Invoice creation failed"

**Causas:**
- Dados inválidos (NIF, endereço)
- Formato incorreto

**Solução:**
1. Verificar validação de conformidade legal
2. Corrigir dados do restaurante
3. Tentar novamente

### Erro: "PDF not available"

**Causas:**
- Invoice criado mas PDF ainda processando
- Erro na geração do PDF

**Solução:**
1. Aguardar alguns segundos
2. Verificar no dashboard InvoiceXpress
3. Tentar novamente

---

## 📝 NOTAS

### Sandbox vs Produção

- **Sandbox:** Para testes, não gera documentos fiscais reais
- **Produção:** Gera documentos fiscais válidos (cuidado!)

### Limites

- Sandbox pode ter limites de rate
- Verificar limites na documentação InvoiceXpress

### Segurança

- API Key é criptografada no banco
- Nunca exposta no cliente (P0-1 fix)
- Backend proxy protege credenciais

---

## 🚀 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

1. **Documentar resultados**
   - Criar relatório de validação
   - Documentar problemas encontrados
   - Documentar soluções

2. **Ajustes finais**
   - Corrigir problemas encontrados
   - Melhorar mensagens de erro
   - Otimizar performance

3. **Preparar para produção**
   - Obter credenciais produção
   - Configurar em ambiente produção
   - Validar novamente

---

**Última atualização:** 18 Janeiro 2026
