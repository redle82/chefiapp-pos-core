# 🧪 GUIA DE TESTES MANUAIS - OPÇÃO A

**Data:** 17 Janeiro 2026  
**Objetivo:** Validar todas as funcionalidades implementadas antes do soft launch

---

## ⚠️ PRÉ-REQUISITOS

- [ ] Ambiente de desenvolvimento rodando
- [ ] Banco de dados configurado (Supabase)
- [ ] Credenciais de teste disponíveis
- [ ] Acesso ao TPV (Terminal de Vendas)
- [ ] Acesso ao KDS (Kitchen Display System)

---

## 📋 CHECKLIST DE TESTES

### 1. OFFLINE MODE (Diferencial #1)

#### Teste 1.1: Criar Pedidos Offline
- [ ] Desligar WiFi/Internet
- [ ] Abrir TPV
- [ ] Verificar badge "Offline - sincronizando..."
- [ ] Criar 5 pedidos diferentes
- [ ] Verificar que pedidos aparecem na UI (otimista)
- [ ] Verificar que badge mostra "5 pendentes"

**Resultado Esperado:**
- ✅ Pedidos aparecem imediatamente na UI
- ✅ Badge mostra contador correto
- ✅ Nenhum erro de "network error"

#### Teste 1.2: Sincronização Automática
- [ ] Com 5 pedidos offline criados
- [ ] Ligar WiFi/Internet
- [ ] Aguardar 10-30 segundos
- [ ] Verificar que badge muda para "Online"
- [ ] Verificar que pedidos foram sincronizados
- [ ] Verificar no banco que pedidos existem

**Resultado Esperado:**
- ✅ Sincronização automática funciona
- ✅ Todos os 5 pedidos aparecem no banco
- ✅ Badge atualiza corretamente

#### Teste 1.3: Múltiplos Pedidos (Stress Test)
- [ ] Desligar WiFi
- [ ] Criar 20 pedidos rapidamente
- [ ] Verificar que todos aparecem na UI
- [ ] Ligar WiFi
- [ ] Aguardar sincronização completa
- [ ] Verificar que todos os 20 pedidos foram sincronizados

**Resultado Esperado:**
- ✅ Sistema aguenta 20 pedidos offline
- ✅ Sincronização completa sem perda de dados
- ✅ Performance aceitável

---

### 2. ERROR BOUNDARIES

#### Teste 2.1: TPV Error Boundary
- [ ] Abrir TPV
- [ ] Simular erro (ex: quebrar código temporariamente)
- [ ] Verificar que aparece tela de erro amigável
- [ ] Verificar botão "Recarregar Página"
- [ ] Recarregar e verificar que volta ao normal

**Resultado Esperado:**
- ✅ Não aparece "White Screen of Death"
- ✅ Mensagem de erro clara
- ✅ Botão de recuperação funciona

#### Teste 2.2: KDS Error Boundary
- [ ] Abrir KDS
- [ ] Simular erro
- [ ] Verificar tela de erro específica para KDS
- [ ] Verificar que não quebra o resto do sistema

**Resultado Esperado:**
- ✅ Erro isolado no KDS
- ✅ TPV continua funcionando
- ✅ Recuperação funciona

---

### 3. AUDIT LOGS

#### Teste 3.1: Logs de Pedidos
- [ ] Criar um pedido
- [ ] Verificar `gm_audit_logs` no banco
- [ ] Verificar que existe log com `action: 'order_created'`
- [ ] Verificar que `resource_id` é o ID do pedido
- [ ] Verificar que `metadata` contém informações corretas

**Resultado Esperado:**
- ✅ Log criado corretamente
- ✅ Dados completos e corretos
- ✅ Timestamp correto

#### Teste 3.2: Logs de Pagamentos
- [ ] Processar um pagamento
- [ ] Verificar log com `action: 'payment_processed'`
- [ ] Verificar que `metadata` contém `amount_cents`, `method`, etc.

**Resultado Esperado:**
- ✅ Log de pagamento criado
- ✅ Dados de pagamento corretos
- ✅ Rastreabilidade completa

#### Teste 3.3: Logs de Caixa
- [ ] Abrir caixa
- [ ] Verificar log com `action: 'cash_register_opened'`
- [ ] Fechar caixa
- [ ] Verificar log com `action: 'cash_register_closed'`

**Resultado Esperado:**
- ✅ Logs de abertura e fechamento
- ✅ Dados de saldo corretos
- ✅ Rastreabilidade completa

---

### 4. FISCAL PRINTING

#### Teste 4.1: Geração de Documento Fiscal
- [ ] Criar pedido
- [ ] Processar pagamento
- [ ] Verificar que documento fiscal foi gerado
- [ ] Verificar `fiscal_event_store` no banco
- [ ] Verificar que `fiscal_status` é 'REPORTED' ou 'PENDING'

**Resultado Esperado:**
- ✅ Documento fiscal gerado
- ✅ Armazenado em `fiscal_event_store`
- ✅ Status correto

#### Teste 4.2: SAF-T XML (Portugal)
- [ ] Configurar restaurante com país = 'PT'
- [ ] Criar pedido e pagar
- [ ] Verificar que SAF-T XML foi gerado
- [ ] Verificar que XML contém elementos básicos:
  - `<?xml`
  - `<Header>`
  - `<SourceDocuments>`
  - `<Line>` (para cada item)

**Resultado Esperado:**
- ✅ SAF-T XML gerado para Portugal
- ✅ Estrutura XML válida
- ✅ Todos os items incluídos

#### Teste 4.3: InvoiceXpress (se credenciais disponíveis)
- [ ] Configurar credenciais InvoiceXpress
- [ ] Criar pedido e pagar
- [ ] Verificar que API foi chamada
- [ ] Verificar que `gov_protocol` foi retornado
- [ ] Verificar que `pdf_url` está disponível (se API retornar)

**Resultado Esperado:**
- ✅ Integração com InvoiceXpress funciona
- ✅ Protocolo governamental retornado
- ✅ PDF disponível (se suportado)

---

### 5. GLOVO INTEGRATION

#### Teste 5.1: Configuração
- [ ] Ir para Settings → Integrações de Delivery
- [ ] Marcar "Ativar integração Glovo"
- [ ] Preencher Client ID e Client Secret
- [ ] Clicar em "Testar Conexão"
- [ ] Verificar que conexão é bem-sucedida
- [ ] Salvar configuração

**Resultado Esperado:**
- ✅ Configuração salva corretamente
- ✅ Teste de conexão funciona
- ✅ Status mostra "Glovo conectado"

#### Teste 5.2: Recebimento de Pedido (Webhook)
- [ ] Configurar webhook no Glovo (se possível)
- [ ] Criar pedido de teste no Glovo
- [ ] Verificar que pedido aparece no TPV
- [ ] Verificar que pedido está em `integration_orders`
- [ ] Verificar que status é correto

**Resultado Esperado:**
- ✅ Webhook recebido corretamente
- ✅ Pedido transformado corretamente
- ✅ Aparece no TPV

#### Teste 5.3: Polling (Alternativa)
- [ ] Se webhook não disponível
- [ ] Verificar que polling está ativo (logs)
- [ ] Criar pedido no Glovo
- [ ] Aguardar até 10 segundos
- [ ] Verificar que pedido aparece no TPV

**Resultado Esperado:**
- ✅ Polling funciona como fallback
- ✅ Pedidos detectados automaticamente
- ✅ Intervalo de 10s respeitado

---

### 6. CAIXA (CASH REGISTER)

#### Teste 6.1: Fluxo Completo
- [ ] Abrir caixa com saldo inicial €100
- [ ] Criar 3 pedidos e processar pagamentos
- [ ] Verificar total de vendas do dia
- [ ] Fechar caixa com saldo final correto
- [ ] Verificar que não é possível criar pedidos após fechar

**Resultado Esperado:**
- ✅ Fluxo completo funciona
- ✅ Totais corretos
- ✅ Proteção contra pedidos após fechar

#### Teste 6.2: Proteção de Regras
- [ ] Tentar fechar caixa com pedidos abertos
- [ ] Verificar que erro é lançado
- [ ] Pagar todos os pedidos
- [ ] Verificar que agora pode fechar

**Resultado Esperado:**
- ✅ Regras de negócio aplicadas
- ✅ Erros claros e úteis
- ✅ Proteção funciona

#### Teste 6.3: Múltiplos Caixas
- [ ] Abrir primeiro caixa
- [ ] Tentar abrir segundo caixa
- [ ] Verificar que erro é lançado
- [ ] Fechar primeiro caixa
- [ ] Verificar que agora pode abrir segundo

**Resultado Esperado:**
- ✅ Apenas um caixa aberto por vez
- ✅ Erro claro quando tenta abrir segundo
- ✅ Funciona após fechar primeiro

---

## 📊 RESULTADOS ESPERADOS

### Taxa de Sucesso Mínima: 95%

- ✅ **Offline Mode:** 3/3 testes passando
- ✅ **Error Boundaries:** 2/2 testes passando
- ✅ **Audit Logs:** 3/3 testes passando
- ✅ **Fiscal Printing:** 3/3 testes passando
- ✅ **Glovo Integration:** 3/3 testes passando
- ✅ **Caixa:** 3/3 testes passando

**Total:** 17 testes

---

## 🐛 REPORTAR PROBLEMAS

Se algum teste falhar:

1. **Documentar:**
   - Qual teste falhou
   - Passos exatos para reproduzir
   - Mensagens de erro (screenshots)
   - Logs do console

2. **Priorizar:**
   - 🔴 **BLOQUEADOR:** Impede uso em produção
   - 🟡 **IMPORTANTE:** Afeta experiência mas não bloqueia
   - 🟢 **MENOR:** Melhoria, não crítico

3. **Criar Issue:**
   - Título claro
   - Descrição completa
   - Evidências (screenshots, logs)

---

## ⏱️ TEMPO ESTIMADO

- **Offline Mode:** 30 minutos
- **Error Boundaries:** 15 minutos
- **Audit Logs:** 20 minutos
- **Fiscal Printing:** 30 minutos
- **Glovo Integration:** 20 minutos
- **Caixa:** 20 minutos

**Total:** ~2.5 horas

---

## ✅ CRITÉRIO DE APROVAÇÃO

**Sistema está pronto para soft launch se:**
- ✅ 95% dos testes passam (16/17)
- ✅ Nenhum teste BLOQUEADOR falha
- ✅ Performance aceitável (< 2s para operações críticas)
- ✅ Sem erros críticos no console

---

**Última Atualização:** 2026-01-17  
**Status:** ✅ Pronto para execução
