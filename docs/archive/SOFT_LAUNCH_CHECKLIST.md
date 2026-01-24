# 🚀 SOFT LAUNCH CHECKLIST - OPÇÃO A

**Data:** 17 Janeiro 2026  
**Objetivo:** Checklist completo para soft launch com 1 restaurante piloto

---

## 📋 PRÉ-LAUNCH (1 semana antes)

### 1. VALIDAÇÃO TÉCNICA

- [ ] **Testes Manuais Completos**
  - [ ] Todos os testes do `GUIA_TESTES_MANUAIS_OPCAO_A.md` executados
  - [ ] 95%+ de taxa de sucesso
  - [ ] Nenhum bloqueador identificado

- [ ] **Testes E2E Automatizados**
  - [ ] `npm test -- tests/e2e` passa 100%
  - [ ] Todos os fluxos críticos cobertos
  - [ ] Sem regressões

- [ ] **Deploy de Migrações**
  - [ ] RLS aplicado e validado
  - [ ] Race conditions prevenidas
  - [ ] Fiscal event store criado
  - [ ] Todas as migrações aplicadas

- [ ] **Build e Deploy**
  - [ ] Build de produção sem erros
  - [ ] Deploy no ambiente de staging
  - [ ] Validação em staging completa
  - [ ] Deploy em produção agendado

---

### 2. INFRAESTRUTURA

- [ ] **Supabase**
  - [ ] Projeto configurado
  - [ ] RLS habilitado
  - [ ] Edge Functions deployadas
  - [ ] Webhooks configurados (Glovo)
  - [ ] Backups configurados

- [ ] **Vercel/Deploy**
  - [ ] Ambiente de produção configurado
  - [ ] Variáveis de ambiente configuradas
  - [ ] Domínio configurado
  - [ ] SSL/HTTPS funcionando
  - [ ] CDN configurado

- [ ] **Monitoramento**
  - [ ] Logs configurados (Sentry, LogRocket, etc.)
  - [ ] Alertas configurados
  - [ ] Dashboard de métricas
  - [ ] Uptime monitoring

---

### 3. SEGURANÇA

- [ ] **Autenticação**
  - [ ] Supabase Auth configurado
  - [ ] Políticas de senha adequadas
  - [ ] 2FA disponível (se necessário)

- [ ] **RLS (Row Level Security)**
  - [ ] Todas as tabelas críticas protegidas
  - [ ] Policies testadas
  - [ ] Isolamento multi-tenant validado

- [ ] **Audit Logs**
  - [ ] Tabela `gm_audit_logs` funcionando
  - [ ] Logs sendo gerados corretamente
  - [ ] Acesso a logs restrito

- [ ] **Secrets**
  - [ ] Nenhum secret no código
  - [ ] Variáveis de ambiente seguras
  - [ ] Rotação de chaves configurada

---

### 4. FISCAL E COMPLIANCE

- [ ] **Fiscal Printing**
  - [ ] InvoiceXpress configurado (se necessário)
  - [ ] SAF-T XML funcionando (Portugal)
  - [ ] Fiscal event store validado
  - [ ] Testes de impressão realizados

- [ ] **Compliance**
  - [ ] GDPR básico (se aplicável)
  - [ ] Termos de uso atualizados
  - [ ] Política de privacidade atualizada

---

## 🎯 LAUNCH DAY (Dia do lançamento)

### 1. PREPARAÇÃO FINAL

- [ ] **Backup Completo**
  - [ ] Backup do banco de dados
  - [ ] Backup de configurações
  - [ ] Plano de rollback preparado

- [ ] **Comunicação**
  - [ ] Cliente piloto notificado
  - [ ] Equipe de suporte alertada
  - [ ] Horário de lançamento definido

- [ ] **Checklist Final**
  - [ ] Todas as migrações aplicadas
  - [ ] Build de produção testado
  - [ ] Ambiente de produção validado
  - [ ] Monitoramento ativo

---

### 2. DEPLOY

- [ ] **Deploy em Produção**
  - [ ] Build final executado
  - [ ] Deploy realizado
  - [ ] Validação pós-deploy
  - [ ] Smoke tests executados

- [ ] **Validação Imediata**
  - [ ] Login funciona
  - [ ] TPV carrega
  - [ ] KDS carrega
  - [ ] Criar pedido funciona
  - [ ] Processar pagamento funciona

---

### 3. ATIVAÇÃO DO CLIENTE PILOTO

- [ ] **Onboarding**
  - [ ] Conta criada
  - [ ] Restaurante configurado
  - [ ] Menu importado/criado
  - [ ] Mesas configuradas
  - [ ] Usuários criados

- [ ] **Treinamento**
  - [ ] Sessão de treinamento realizada
  - [ ] Documentação fornecida
  - [ ] Suporte disponível

- [ ] **Primeiro Uso**
  - [ ] Primeiro pedido criado
  - [ ] Primeiro pagamento processado
  - [ ] Primeiro documento fiscal gerado
  - [ ] Tudo funcionando

---

## 📊 PÓS-LAUNCH (Primeira semana)

### 1. MONITORAMENTO DIÁRIO

- [ ] **Métricas**
  - [ ] Uptime > 99%
  - [ ] Tempo de resposta < 2s
  - [ ] Taxa de erro < 1%
  - [ ] Pedidos processados sem problemas

- [ ] **Logs**
  - [ ] Revisar logs diariamente
  - [ ] Identificar erros
  - [ ] Corrigir problemas urgentes

- [ ] **Feedback do Cliente**
  - [ ] Coletar feedback diário
  - [ ] Priorizar melhorias
  - [ ] Resolver bloqueadores rapidamente

---

### 2. AJUSTES E CORREÇÕES

- [ ] **Bugs Críticos**
  - [ ] Identificar e corrigir imediatamente
  - [ ] Deploy de hotfix se necessário
  - [ ] Comunicação com cliente

- [ ] **Melhorias**
  - [ ] Documentar sugestões
  - [ ] Priorizar para próximas sprints
  - [ ] Planejar implementação

---

### 3. VALIDAÇÃO DE SUCESSO

- [ ] **Critérios de Sucesso (Semana 1)**
  - [ ] Sistema estável (uptime > 99%)
  - [ ] Cliente satisfeito
  - [ ] Nenhum bloqueador crítico
  - [ ] Performance aceitável

- [ ] **Decisão: Continuar ou Pausar**
  - [ ] Se sucesso: Continuar e escalar
  - [ ] Se problemas: Pausar e corrigir
  - [ ] Documentar lições aprendidas

---

## 🎯 CRITÉRIOS DE SUCESSO

### Mínimos para Considerar Sucesso:

1. **Estabilidade**
   - ✅ Uptime > 99%
   - ✅ Sem crashes críticos
   - ✅ Performance aceitável

2. **Funcionalidade**
   - ✅ Todos os fluxos críticos funcionando
   - ✅ Offline mode funcionando
   - ✅ Fiscal printing funcionando

3. **Satisfação do Cliente**
   - ✅ Cliente consegue usar o sistema
   - ✅ Feedback positivo
   - ✅ Nenhum bloqueador reportado

---

## 🚨 PLANO DE CONTINGÊNCIA

### Se Algo Der Errado:

1. **Rollback Imediato**
   - [ ] Reverter deploy
   - [ ] Restaurar backup
   - [ ] Comunicar cliente

2. **Análise**
   - [ ] Identificar causa raiz
   - [ ] Corrigir problema
   - [ ] Testar correção

3. **Relançamento**
   - [ ] Aplicar correção
   - [ ] Testar novamente
   - [ ] Relançar quando seguro

---

## 📝 DOCUMENTAÇÃO

- [ ] **Runbook Operacional**
  - [ ] Como fazer deploy
  - [ ] Como fazer rollback
  - [ ] Como monitorar
  - [ ] Como resolver problemas comuns

- [ ] **Documentação do Cliente**
  - [ ] Guia de uso básico
  - [ ] FAQ
  - [ ] Contato de suporte

---

## ✅ CHECKLIST FINAL

Antes de considerar soft launch completo:

- [ ] ✅ Todos os testes manuais passaram
- [ ] ✅ Deploy em produção realizado
- [ ] ✅ Cliente piloto ativado
- [ ] ✅ Primeiro pedido processado
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Suporte disponível
- [ ] ✅ Documentação completa

---

**Status:** 🟢 Pronto para soft launch após completar checklist

**Próxima Ação:** Executar testes manuais e preparar deploy
