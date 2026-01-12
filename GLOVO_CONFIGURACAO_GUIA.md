# 🚚 GUIA DE CONFIGURAÇÃO - GLOVO INTEGRATION

**Data:** 12 Janeiro 2026  
**Versão:** 1.0

---

## 📋 VISÃO GERAL

A integração Glovo permite:
- ✅ Receber pedidos automaticamente via webhook
- ✅ Receber pedidos via polling (fallback)
- ✅ Transformar pedidos Glovo em pedidos do sistema
- ✅ Exibir pedidos no TPV automaticamente

---

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### **1. Obter Credenciais Glovo**

1. Acessar: https://developers.glovoapp.com
2. Criar conta de desenvolvedor
3. Criar uma aplicação
4. Obter:
   - **Client ID**
   - **Client Secret**

### **2. Configurar no Sistema**

1. Ir para **Settings** → **Integrações de Delivery**
2. Encontrar seção **"Glovo"**
3. Marcar checkbox **"Ativar integração Glovo"**
4. Preencher:
   - **Client ID**
   - **Client Secret**
5. Clicar em **"Testar Conexão"**
6. Se sucesso, clicar em **"Salvar Configuração"**

### **3. Configurar Webhook (Opcional mas Recomendado)**

**Webhook é mais eficiente que polling!**

1. No Glovo Developer Portal, configurar webhook URL:
   ```
   https://[seu-projeto].supabase.co/functions/v1/webhook-glovo
   ```
2. Eventos a configurar:
   - `order.created`
   - `order.updated`
   - `order.cancelled`

**Nota:** Se webhook não estiver configurado, o sistema usa polling automático (10s).

---

## 🔄 COMO FUNCIONA

### **Cenário 1: Webhook (Recomendado)**

```
Glovo → Webhook → webhook-glovo Function → integration_orders (DB)
                                              ↓
                                    Realtime Broadcast
                                              ↓
                                    Frontend escuta evento
                                              ↓
                                    GlovoAdapter.processNewOrder()
                                              ↓
                                    OrderCreatedEvent emitido
                                              ↓
                                    OrderIngestionPipeline.processExternalOrder()
                                              ↓
                                    gm_order_requests (Airlock)
                                              ↓
                                    TPV aprova → gm_orders
```

**Vantagens:**
- ✅ Instantâneo (pedidos chegam imediatamente)
- ✅ Mais eficiente (não precisa fazer polling)
- ✅ Menos carga no servidor

---

### **Cenário 2: Polling (Fallback)**

```
GlovoAdapter.startPolling() → GET /v3/orders?status=PENDING
                                    ↓
                              Novos pedidos detectados
                                    ↓
                              GlovoAdapter.processNewOrder()
                                    ↓
                              (mesmo fluxo do webhook)
```

**Quando é usado:**
- Webhook não configurado
- Webhook falhou
- Sistema detecta que webhook não está funcionando

**Intervalo:** 10 segundos

---

## 🧪 TESTES

### **Teste 1: OAuth Flow**

1. Configurar credenciais no Settings
2. Clicar em **"Testar Conexão"**
3. Verificar que status muda para **"Conectado"**

**Resultado esperado:** ✅ Conexão bem-sucedida

---

### **Teste 2: Webhook Receiver**

1. Configurar webhook no Glovo Developer Portal
2. Criar pedido de teste no Glovo
3. Verificar que webhook é recebido
4. Verificar que pedido aparece em `integration_orders`
5. Verificar que pedido aparece no TPV

**Resultado esperado:** ✅ Pedido recebido e exibido no TPV

---

### **Teste 3: Polling (Fallback)**

1. Desabilitar webhook no Glovo (ou não configurar)
2. Criar pedido de teste no Glovo
3. Aguardar polling (10s)
4. Verificar que pedido aparece no TPV

**Resultado esperado:** ✅ Pedido detectado via polling

---

### **Teste 4: Transformação de Dados**

1. Criar pedido Glovo com:
   - Múltiplos itens
   - Observações especiais
   - Endereço de entrega
2. Verificar que pedido aparece no TPV com:
   - Todos os itens corretos
   - Preços corretos
   - Observações preservadas

**Resultado esperado:** ✅ Dados transformados corretamente

---

## 🐛 TROUBLESHOOTING

### **Problema: "Testar Conexão" falha**

**Possíveis causas:**
- Credenciais incorretas
- Client ID/Secret inválidos
- Glovo API down

**Solução:**
1. Verificar credenciais no Glovo Developer Portal
2. Verificar que aplicação está ativa
3. Verificar logs do sistema
4. Tentar obter novo token manualmente

---

### **Problema: Pedidos não chegam**

**Possíveis causas:**
- Webhook não configurado
- Polling não iniciado
- Credenciais expiradas
- Restaurant ID mismatch

**Solução:**
1. Verificar que integração está ativada
2. Verificar webhook URL no Glovo
3. Verificar logs do sistema
4. Verificar que polling está rodando (console logs)

---

### **Problema: Pedidos duplicados**

**Possíveis causas:**
- Webhook e polling rodando simultaneamente
- Webhook sendo chamado múltiplas vezes

**Solução:**
1. Sistema já previne duplicatas (usa `processedOrderIds`)
2. Se persistir, verificar logs
3. Verificar que webhook não está sendo chamado múltiplas vezes

---

### **Problema: Dados transformados incorretamente**

**Possíveis causas:**
- Estrutura do pedido Glovo mudou
- Mapeamento incorreto

**Solução:**
1. Verificar estrutura do pedido recebido
2. Verificar logs de transformação
3. Comparar com documentação Glovo API

---

## 📊 MONITORAMENTO

### **Verificar Status da Integração**

1. Ir para **Settings** → **Integrações de Delivery**
2. Ver status:
   - 🟢 **Conectado** - Funcionando
   - 🟡 **Degradado** - Funcionando com problemas
   - 🔴 **Desconectado** - Não funcionando

### **Verificar Pedidos Recebidos**

1. Ir para **TPV**
2. Ver seção **"Pedidos de Delivery"**
3. Verificar pedidos Glovo recebidos

### **Verificar Logs**

```typescript
// No console do navegador
// Logs começam com [Glovo]
```

---

## 🔒 SEGURANÇA

### **Credenciais**

- ✅ Credenciais são armazenadas de forma segura
- ✅ Tokens são renovados automaticamente
- ✅ Não expor credenciais em logs

### **Webhook**

- ✅ Webhook URL deve ser HTTPS
- ✅ Validação de payload implementada
- ✅ Prevenção de duplicatas

---

## 📚 REFERÊNCIAS

- **Glovo Developer Portal:** https://developers.glovoapp.com
- **Glovo API Docs:** https://open-api.glovoapp.com/docs
- **Webhook Setup:** https://developers.glovoapp.com/webhooks

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] Credenciais Glovo obtidas
- [ ] Credenciais configuradas no sistema
- [ ] Teste de conexão realizado
- [ ] Webhook configurado (opcional)
- [ ] Pedido de teste recebido
- [ ] Dados transformados corretamente
- [ ] Documentação lida

---

## 🎯 PRÓXIMOS PASSOS

Após configurar:

1. **Testar com pedido real** do Glovo
2. **Monitorar** pedidos recebidos
3. **Validar** transformação de dados
4. **Documentar** qualquer problema encontrado

---

**Última atualização:** 12 Janeiro 2026
