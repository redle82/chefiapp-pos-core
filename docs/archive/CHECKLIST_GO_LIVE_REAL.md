# 📜 CHECKLIST DE GO-LIVE REAL

**Data:** 12 Janeiro 2026  
**Versão:** v0.9.2  
**Objetivo:** Validação completa para produção real

---

## 🔴 FASE 1: VALIDAÇÃO TÉCNICA (Crítica)

### **1.1 Banco de Dados**
- [ ] Migrations aplicadas em produção
- [ ] RLS ativo e testado
- [ ] Race conditions prevenidas
- [ ] Indexes criados e validados
- [ ] Backup configurado
- [ ] Restore testado

### **1.2 Segurança**
- [ ] Credenciais em variáveis de ambiente
- [ ] API keys rotacionadas
- [ ] HTTPS configurado
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Audit logs funcionando

### **1.3 Infraestrutura**
- [ ] Supabase em produção
- [ ] Vercel deploy configurado
- [ ] Domínio configurado
- [ ] SSL/TLS ativo
- [ ] CDN configurado
- [ ] Monitoramento ativo

---

## 🟡 FASE 2: VALIDAÇÃO FUNCIONAL (Importante)

### **2.1 Offline Mode**
- [ ] Teste: Desligar WiFi
- [ ] Teste: Criar 20 pedidos offline
- [ ] Teste: Ligar WiFi
- [ ] Teste: Validar sincronização
- [ ] Teste: Validar idempotência

### **2.2 Fiscal Printing**
- [ ] Credenciais InvoiceXpress configuradas
- [ ] Teste: Processar pagamento
- [ ] Teste: Validar invoice criado
- [ ] Teste: Validar PDF gerado
- [ ] Teste: Validar XML SAF-T

### **2.3 Glovo Integration**
- [ ] Credenciais Glovo configuradas
- [ ] Teste: Receber pedido via webhook
- [ ] Teste: Receber pedido via polling
- [ ] Teste: Validar transformação de dados
- [ ] Teste: Validar prevenção de duplicatas

### **2.4 Error Boundaries**
- [ ] Teste: Simular erro no TPV
- [ ] Teste: Validar fallback UI
- [ ] Teste: Validar logging de erros
- [ ] Teste: Validar recovery

### **2.5 Audit Logs**
- [ ] Teste: Criar pedido
- [ ] Teste: Processar pagamento
- [ ] Teste: Abrir/fechar caixa
- [ ] Teste: Validar logs no banco

---

## 🟢 FASE 3: VALIDAÇÃO OPERACIONAL (Essencial)

### **3.1 Fluxo Completo**
- [ ] Teste: Abertura de caixa
- [ ] Teste: Criação de pedido
- [ ] Teste: Adição de itens
- [ ] Teste: Processamento de pagamento
- [ ] Teste: Impressão fiscal
- [ ] Teste: Fechamento de caixa

### **3.2 Cenários Reais**
- [ ] Teste: Múltiplos garçons simultâneos
- [ ] Teste: Múltiplas abas abertas
- [ ] Teste: Perda de conexão durante pagamento
- [ ] Teste: Pedido Glovo + TPV simultâneo
- [ ] Teste: Fechamento de caixa com pedidos abertos

### **3.3 Performance**
- [ ] Teste: Tempo de resposta < 200ms
- [ ] Teste: Sincronização offline < 5s
- [ ] Teste: Carga de 100 pedidos/hora
- [ ] Teste: Múltiplos restaurantes simultâneos

---

## 🔵 FASE 4: COMPLIANCE E LEGAL (Obrigatório)

### **4.1 Fiscal**
- [ ] SAF-T XML válido
- [ ] InvoiceXpress integrado
- [ ] Documentos fiscais armazenados
- [ ] Retenção de documentos (7 anos)

### **4.2 Segurança de Dados**
- [ ] GDPR compliance (se aplicável)
- [ ] Dados pessoais protegidos
- [ ] Logs de acesso
- [ ] Política de privacidade

### **4.3 Auditoria**
- [ ] Audit logs imutáveis
- [ ] Rastreabilidade completa
- [ ] Backup de logs
- [ ] Retenção de logs

---

## 🟣 FASE 5: MONITORAMENTO E ALERTAS (Crítico)

### **5.1 Monitoramento**
- [ ] Uptime monitoring
- [ ] Error tracking (Sentry/Similar)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] API monitoring

### **5.2 Alertas**
- [ ] Alertas de erro crítico
- [ ] Alertas de performance
- [ ] Alertas de segurança
- [ ] Alertas de backup
- [ ] Alertas de quota

### **5.3 Dashboards**
- [ ] Dashboard de saúde do sistema
- [ ] Dashboard de métricas de negócio
- [ ] Dashboard de erros
- [ ] Dashboard de performance

---

## 📊 CRITÉRIOS DE APROVAÇÃO

### **Mínimo para Go-Live:**
- ✅ 95% dos testes técnicos passando
- ✅ 90% dos testes funcionais passando
- ✅ 100% dos testes de compliance passando
- ✅ Monitoramento ativo
- ✅ Backup funcionando

### **Ideal para Go-Live:**
- ✅ 100% dos testes técnicos passando
- ✅ 100% dos testes funcionais passando
- ✅ 100% dos testes de compliance passando
- ✅ Monitoramento completo
- ✅ Alertas configurados
- ✅ Documentação completa

---

## 🚀 PRÓXIMOS PASSOS APÓS GO-LIVE

1. **Primeira Semana:**
   - Monitorar 24/7
   - Coletar feedback
   - Corrigir bugs críticos

2. **Primeiro Mês:**
   - Analisar métricas
   - Otimizar performance
   - Implementar melhorias

3. **Primeiro Trimestre:**
   - Escalar gradualmente
   - Adicionar features baseadas em feedback
   - Expandir para novos mercados

---

**Última atualização:** 12 Janeiro 2026
